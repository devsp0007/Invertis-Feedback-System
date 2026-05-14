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
  connectionTimeoutMillis: 30000,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  // Only log errors in production to avoid console overhead
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
});

export const FEEDBACK_ID_PREFIX = 'ANO-';
export const REWARD_POINTS = 10;

function generateFeedbackId() {
  return FEEDBACK_ID_PREFIX + crypto.randomBytes(3).toString('hex').toUpperCase();
}

export const {
  department: Department,
  section: Section,
  sectionFaculty: SectionFaculty,
  course: Course,
  faculty: Faculty,
  tlfq: Tlfq,
  question: Question,
  response: Response,
  answer: Answer,
  user: User,
  enrollment: Enrollment
} = prisma;

export const initDb = async () => {
  if (process.env.SEED_DATA !== 'true') return;

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@invertis.edu.in';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@2025';

    // Check if super_admin exists
    const superAdmin = await User.findFirst({ where: { role: 'super_admin' } });
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
