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

    console.log('Synchronizing system data (Supreme Auths & Demo Records)...');
    
    const supremeHashedPw = await bcrypt.hash('Super@123', 10);
      const adminHashedPw = await bcrypt.hash(adminPass, 10);
      const coordHashedPw = await bcrypt.hash('Coord@2025', 10);
      const hodHashedPw = await bcrypt.hash('Hod@2025', 10);
      const studentHashedPw = await bcrypt.hash('Student@2025', 10);

      // 1. Create Supreme Authority
      console.log('Creating Supreme Authority accounts...');
      const supremeUsers = [
        { name: 'SUPAdmin1', email: 'supauth1@invertis.edu.in', password: supremeHashedPw, role: 'supreme', status: 'active' },
        { name: 'SUPAdmin2', email: 'supauth2@invertis.edu.in', password: supremeHashedPw, role: 'supreme', status: 'active' },
        { name: 'SUPAdmin3', email: 'supauth3@invertis.edu.in', password: supremeHashedPw, role: 'supreme', status: 'active' },
      ];

      for (const s of supremeUsers) {
        await User.upsert({
          where: { email: s.email },
          update: { password: s.password },
          create: s
        });
      }
      
      // 2. Create Departments
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

      // 3. Create Super Admin
      await User.upsert({
        where: { email: adminEmail },
        update: { password: adminHashedPw },
        create: {
          name: 'System Admin',
          email: adminEmail,
          password: adminHashedPw,
          role: 'super_admin',
          status: 'active'
        }
      });

      // 4. Create Coordinator
      const coord = await User.upsert({
        where: { email: 'coordinator@invertis.edu.in' },
        update: {},
        create: {
          name: 'University Coordinator',
          email: 'coordinator@invertis.edu.in',
          password: coordHashedPw,
          role: 'coordinator',
          status: 'active'
        }
      });

      // 5. Create HODs
      for (const code of Object.keys(depts)) {
        await User.upsert({
          where: { email: `hod.${code.toLowerCase()}@invertis.edu.in` },
          update: {},
          create: {
            name: `HOD ${code}`,
            email: `hod.${code.toLowerCase()}@invertis.edu.in`,
            password: hodHashedPw,
            role: 'hod',
            department_id: depts[code].id,
            status: 'active'
          }
        });
      }

      // 6. Create Sample Sections
      const bcs3a = await Section.upsert({
        where: { code: 'BCS3A' },
        update: {},
        create: {
          name: 'BCS-3A',
          code: 'BCS3A',
          semester: 3,
          label: 'A',
          department_id: depts['BCS'].id
        }
      });

      const btai3a = await Section.upsert({
        where: { code: 'BTAI3A' },
        update: {},
        create: {
          name: 'BTAI-3A',
          code: 'BTAI3A',
          semester: 3,
          label: 'A',
          department_id: depts['BTAI'].id
        }
      });

      // 7. Create Courses
      const c1 = await Course.upsert({
        where: { code: 'CS201' },
        update: {},
        create: { name: 'Data Structures', code: 'CS201', department_id: depts['BCS'].id }
      });
      const c2 = await Course.upsert({
        where: { code: 'AI301' },
        update: {},
        create: { name: 'Artificial Intelligence', code: 'AI301', department_id: depts['BTAI'].id }
      });
      const c3 = await Course.upsert({
        where: { code: 'CS202' },
        update: {},
        create: { name: 'Database Management', code: 'CS202', department_id: depts['BCS'].id }
      });

      // 8. Create Faculty
      // Faculty doesn't have a unique constraint besides ID, so we find or create
      let f1 = await Faculty.findFirst({ where: { name: 'Dr. R.K. Singh' } });
      if (!f1) f1 = await Faculty.create({ data: { name: 'Dr. R.K. Singh', department_id: depts['BCS'].id, teacher_type: 'college_faculty' } });
      
      let f2 = await Faculty.findFirst({ where: { name: 'Dr. Vikram Chandra' } });
      if (!f2) f2 = await Faculty.create({ data: { name: 'Dr. Vikram Chandra', department_id: depts['BTAI'].id, teacher_type: 'college_faculty' } });
      
      let f3 = await Faculty.findFirst({ where: { name: 'Prof. Manish Gupta' } });
      if (!f3) f3 = await Faculty.create({ data: { name: 'Prof. Manish Gupta', department_id: depts['BCS'].id, teacher_type: 'trainer' } });

      // 9. Assign Faculty to Sections
      const assignments = [
        { section_id: bcs3a.id, faculty_id: f1.id, course_id: c1.id },
        { section_id: btai3a.id, faculty_id: f2.id, course_id: c2.id },
        { section_id: bcs3a.id, faculty_id: f3.id, course_id: c3.id },
      ];

      for (const a of assignments) {
        const exists = await SectionFaculty.findFirst({ where: a });
        if (!exists) await SectionFaculty.create({ data: a });
      }

      // 10. Create Sample Students
      const studentsData = [
        { name: 'Rahul Kumar', student_id: 'BCS2025_01', email: 'bcs2025.01@iu.edu.in', dept: 'BCS', section: bcs3a },
        { name: 'Anjali Gupta', student_id: 'BTAI2025_01', email: 'btai2025.01@iu.edu.in', dept: 'BTAI', section: btai3a },
        { name: 'Amit Singh', student_id: 'BTAI2025_02', email: null, dept: 'BTAI', section: btai3a, status: 'pending' },
        { name: 'Priya Sharma', student_id: 'BCS2025_02', email: 'bcs2025.02@iu.edu.in', dept: 'BCS', section: bcs3a },
      ];

      const students = [];
      for (const s of studentsData) {
        const student = await User.upsert({
          where: { student_id: s.student_id },
          update: {},
          create: {
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
            unique_feedback_id: generateFeedbackId(),
            points: s.status === 'pending' ? 0 : 50
          }
        });
        students.push(student);

        // Enrollments
        const courseId = s.dept === 'BCS' ? c1.id : c2.id;
        const e1 = await Enrollment.findFirst({ where: { student_id: student.id, course_id: courseId } });
        if (!e1) await Enrollment.create({ data: { student_id: student.id, course_id: courseId, section_id: s.section.id } });
        
        if (s.dept === 'BCS') {
          const e2 = await Enrollment.findFirst({ where: { student_id: student.id, course_id: c3.id } });
          if (!e2) await Enrollment.create({ data: { student_id: student.id, course_id: c3.id, section_id: s.section.id } });
        }
      }

      // 11. Create TLFQ Forms
      console.log('Creating sample TLFQ forms...');
      const t1 = await Tlfq.upsert({
        where: { id: 'sample-tlfq-1' }, // Dummy ID for upsert or find by title
        update: {},
        create: {
          id: 'sample-tlfq-1',
          title: 'Data Structures Mid-Term Feedback',
          section_id: bcs3a.id,
          course_id: c1.id,
          faculty_id: f1.id,
          is_active: true,
          closing_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_by: coord.id
        }
      });

      const t2 = await Tlfq.upsert({
        where: { id: 'sample-tlfq-2' },
        update: {},
        create: {
          id: 'sample-tlfq-2',
          title: 'AI Concept Evaluation',
          section_id: btai3a.id,
          course_id: c2.id,
          faculty_id: f2.id,
          is_active: true,
          closing_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_by: coord.id
        }
      });

      // 12. Add Questions
      const questionsText = [
        'How well does the teacher explain concepts?',
        'Is the teacher punctual and regular?',
        'Does the teacher encourage student participation?',
        'Is the study material provided helpful?',
        'Overall satisfaction with the teaching method?'
      ];

      for (const tlfqId of [t1.id, t2.id]) {
        for (const qText of questionsText) {
          const exists = await Question.findFirst({ where: { tlfq_id: tlfqId, question_text: qText } });
          if (!exists) await Question.create({ data: { tlfq_id: tlfqId, question_text: qText } });
        }
      }

      // 13. Responses
      console.log('Generating sample responses...');
      for (const student of students) {
        if (student.status !== 'active') continue;
        const tlfqId = student.section_id === bcs3a.id ? t1.id : t2.id;
        
        const hasResponded = await Response.findFirst({ where: { student_id: student.id, tlfq_id: tlfqId } });
        if (!hasResponded) {
          const resp = await Response.create({
            data: {
              student_id: student.id,
              tlfq_id: tlfqId,
              submitted_at: new Date().toISOString(),
              comment: 'Great teaching!'
            }
          });
          const qs = await Question.findMany({ where: { tlfq_id: tlfqId } });
          for (const q of qs) {
            await Answer.create({ data: { response_id: resp.id, question_id: q.id, rating: Math.floor(Math.random() * 3) + 5 } });
          }
          await User.update({ where: { id: student.id }, data: { points: { increment: REWARD_POINTS } } });
        }
      }

      console.log('System data seeded successfully with Supreme Authority and demo feedback.');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
};
