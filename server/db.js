import { PrismaClient } from '@prisma/client';
import pkg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pkg;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increase max connections for high traffic
  idleTimeoutMillis: 30000,
  // Increase connection timeout to allow slower DB responses (ms)
  connectionTimeoutMillis: 60000,
});
const adapter = new PrismaPg(pool);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function bootstrapPromotionSchema() {
  // Repair databases where the promotion migration was recorded but the tables were later dropped.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "AcademicSession" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "start_year" INTEGER NOT NULL,
      "end_year" INTEGER NOT NULL,
      "is_active" BOOLEAN NOT NULL DEFAULT false,
      CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "AcademicSession_name_key"
    ON "AcademicSession"("name");
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS "AcademicSession_is_active_idx"
    ON "AcademicSession"("is_active");
  `);

  await pool.query(`
    ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "academic_session_id" TEXT,
      ADD COLUMN IF NOT EXISTS "last_promotion_log_id" TEXT;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "PromotionLog" (
      "id" TEXT NOT NULL,
      "admin_id" TEXT NOT NULL,
      "department_id" TEXT,
      "from_session_id" TEXT NOT NULL,
      "to_session_id" TEXT NOT NULL,
      "scope" TEXT NOT NULL,
      "semesters" TEXT,
      "promoted_count" INTEGER NOT NULL DEFAULT 0,
      "graduated_count" INTEGER NOT NULL DEFAULT 0,
      "skipped_count" INTEGER NOT NULL DEFAULT 0,
      "metadata" JSONB,
      "promoted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PromotionLog_pkey" PRIMARY KEY ("id")
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS "PromotionLog_admin_id_idx" ON "PromotionLog"("admin_id");
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "PromotionLog_department_id_idx" ON "PromotionLog"("department_id");
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "PromotionLog_from_session_id_idx" ON "PromotionLog"("from_session_id");
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "PromotionLog_to_session_id_idx" ON "PromotionLog"("to_session_id");
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "PromotionLog_promoted_at_idx" ON "PromotionLog"("promoted_at");
  `);
}

async function withDbRetry(operation, label, attempts = 5) {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const timeoutLike = err?.code === 'ETIMEDOUT' || /timed out/i.test(err?.message || '');
      if (!timeoutLike || i === attempts) break;

      const waitMs = i * 1500;
      console.warn(`[db:init] ${label} timed out (attempt ${i}/${attempts}). Retrying in ${waitMs}ms...`);
      await sleep(waitMs);
    }
  }
  throw lastError;
}

export const prisma = new PrismaClient({
  adapter,
  // Only log errors in production to avoid console overhead
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
});

// Wrap model accessors in a retrying proxy to handle transient ETIMEDOUT errors.
function wrapModel(modelName) {
  const model = prisma[modelName];
  if (!model) return model;

  return new Proxy(model, {
    get(target, prop) {
      const orig = target[prop];
      if (typeof orig !== 'function') return orig;

      return async function retryingMethod(...args) {
        const maxRetries = 3;
        let attempt = 0;
        while (true) {
          try {
            return await orig.apply(target, args);
          } catch (err) {
            const isTimeout = err?.code === 'ETIMEDOUT' || /timed out/i.test(err?.message || '');
            attempt += 1;
            if (!isTimeout || attempt > maxRetries) throw err;
            const waitMs = attempt * 500;
            console.warn(`[prisma:${modelName}] transient timeout on ${String(prop)}, retry ${attempt}/${maxRetries} in ${waitMs}ms`);
            await sleep(waitMs);
          }
        }
      };
    }
  });
}

export const FEEDBACK_ID_PREFIX = 'ANO-';
export const REWARD_POINTS = 10;

function generateFeedbackId() {
  return FEEDBACK_ID_PREFIX + crypto.randomBytes(3).toString('hex').toUpperCase();
}

export const Department = wrapModel('department');
export const Section = wrapModel('section');
export const SectionFaculty = wrapModel('sectionFaculty');
export const Course = wrapModel('course');
export const Faculty = wrapModel('faculty');
export const Tlfq = wrapModel('tlfq');
export const Question = wrapModel('question');
export const Response = wrapModel('response');
export const Answer = wrapModel('answer');
export const User = wrapModel('user');
export const Enrollment = wrapModel('enrollment');
export const AcademicSession = wrapModel('academicSession');
export const PromotionLog = wrapModel('promotionLog');

function getAcademicYearWindow(date = new Date()) {
  // Academic year rollover in July: 2026-07 => session 2026-27
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const startYear = month >= 7 ? year : year - 1;
  const endYear = startYear + 1;
  return {
    startYear,
    endYear,
    name: `${startYear}-${String(endYear).slice(-2)}`,
  };
}

export const initDb = async () => {
  if (process.env.SEED_DATA !== 'true') return;

  try {
    await bootstrapPromotionSchema();

    const { startYear, endYear, name: currentSessionName } = getAcademicYearWindow();
    const currentSession = await withDbRetry(
      () => AcademicSession.upsert({
        where: { name: currentSessionName },
        update: { is_active: true },
        create: { name: currentSessionName, start_year: startYear, end_year: endYear, is_active: true },
      }),
      'academic_session_upsert'
    );

    await withDbRetry(
      () => AcademicSession.updateMany({
        where: { id: { not: currentSession.id }, is_active: true },
        data: { is_active: false },
      }),
      'academic_session_deactivate_others'
    );

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@invertis.edu.in';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@2025';

    // Check if super_admin exists
    const superAdmin = await withDbRetry(
      () => User.findFirst({ where: { role: 'super_admin' } }),
      'super_admin_lookup'
    );
    if (!superAdmin) {
      console.log('Seeding initial system data from User Manual...');
      
      const adminHashedPw = await bcrypt.hash(adminPass, 10);
      const coordHashedPw = await bcrypt.hash('Coord@2025', 10);
      const hodHashedPw = await bcrypt.hash('Hod@2025', 10);
      const studentHashedPw = await bcrypt.hash('Student@2025', 10);
      
      // 1. Create Departments
      const deptsData = [
        { name: 'B.Tech AI', code: 'BTAI' },
        { name: 'B.Tech CS', code: 'BCS' },
        { name: 'Electronics', code: 'BTEC' },
        { name: 'Mechanical', code: 'BTME' },
        { name: 'Civil', code: 'BTCE' },
      ];

      const depts = {};
      for (const d of deptsData) {
        depts[d.code] = await Department.upsert({
          where: { code: d.code },
          update: {},
          create: { ...d, portal_open: true }
        });
      }

      // 2. Create Super Admin
      await User.create({
        data: {
          name: 'System Admin',
          email: adminEmail,
          password: adminHashedPw,
          role: 'super_admin',
          status: 'active'
        }
      });

      // 3. Create Coordinator
      await User.create({
        data: {
          name: 'University Coordinator',
          email: 'coordinator@invertis.edu.in',
          password: coordHashedPw,
          role: 'coordinator',
          status: 'active'
        }
      });

      // 4. Create HODs
      for (const code of Object.keys(depts)) {
        await User.create({
          data: {
            name: `HOD ${code}`,
            email: `hod.${code.toLowerCase()}@invertis.edu.in`,
            password: hodHashedPw,
            role: 'hod',
            department_id: depts[code].id,
            status: 'active'
          }
        });
      }

      // 5. Create Sample Sections (e.g., BCS-3A)
      const bcs3a = await Section.create({
        data: {
          name: 'BCS-3A',
          code: 'BCS3A',
          semester: 3,
          label: 'A',
          department_id: depts['BCS'].id
        }
      });

      const btai3a = await Section.create({
        data: {
          name: 'BTAI-3A',
          code: 'BTAI3A',
          semester: 3,
          label: 'A',
          department_id: depts['BTAI'].id
        }
      });

      // 6. Create Courses
      const c1 = await Course.create({ data: { name: 'Data Structures', code: 'CS201', department_id: depts['BCS'].id } });
      const c2 = await Course.create({ data: { name: 'Artificial Intelligence', code: 'AI301', department_id: depts['BTAI'].id } });

      // 7. Create Faculty
      const f1 = await Faculty.create({ data: { name: 'Dr. R.K. Singh', department_id: depts['BCS'].id, teacher_type: 'college_faculty' } });
      const f2 = await Faculty.create({ data: { name: 'Dr. Vikram Chandra', department_id: depts['BTAI'].id, teacher_type: 'college_faculty' } });

      // 8. Assign Faculty to Sections
      await SectionFaculty.create({ data: { section_id: bcs3a.id, faculty_id: f1.id, course_id: c1.id } });
      await SectionFaculty.create({ data: { section_id: btai3a.id, faculty_id: f2.id, course_id: c2.id } });

      // 9. Create Sample Students (Active & Pending)
      const studentsData = [
        { name: 'Rahul Kumar', student_id: 'BCS2025_01', email: 'bcs2025.01@iu.edu.in', dept: 'BCS', section: bcs3a },
        { name: 'Anjali Gupta', student_id: 'BTAI2025_01', email: 'btai2025.01@iu.edu.in', dept: 'BTAI', section: btai3a },
        { name: 'Amit Singh', student_id: 'BTAI2025_02', email: null, dept: 'BTAI', section: btai3a, status: 'pending' },
      ];

      for (const s of studentsData) {
        const student = await User.create({
          data: {
            name: s.name,
            student_id: s.student_id,
            email: s.email,
            password: studentHashedPw,
            role: 'student',
            status: s.status || 'active',
            department_id: depts[s.dept].id,
            section_id: s.section.id,
            semester: 3,
            academic_session_id: currentSession.id,
            batch: '2022-26',
            unique_feedback_id: generateFeedbackId()
          }
        });

        // Enroll students
        await Enrollment.create({ 
          data: { 
            student_id: student.id, 
            course_id: s.dept === 'BCS' ? c1.id : c2.id, 
            section_id: s.section.id 
          } 
        });
      }

      console.log('System data seeded successfully with User Manual credentials.');
    }
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
};
