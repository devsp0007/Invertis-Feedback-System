import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

function generateFeedbackId() {
  return 'ANO-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

const transform = {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  }
};

// ─── SCHEMAS ──────────────────────────────────────────────────────────────────

const deptSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  code:        { type: String, required: true, unique: true },
  portal_open: { type: Boolean, default: true }
}, { toJSON: transform, toObject: transform });
export const Department = mongoose.model('Department', deptSchema);

// Section — belongs to a dept, has a semester and section label (A/B/C)
const sectionSchema = new mongoose.Schema({
  name:          { type: String, required: true },          // e.g. "BCS-3A"
  code:          { type: String, required: true },          // e.g. "BCS3A"
  semester:      { type: Number, required: true },          // 1-8
  label:         { type: String, required: true },          // A, B, C, D
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true }
}, { toJSON: transform, toObject: transform });
export const Section = mongoose.model('Section', sectionSchema);

// User — roles: super_admin | coordinator | hod | student
// coordinator is university-wide (no dept restriction)
const uSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  email:              { type: String, default: null },
  password:           { type: String, default: null },
  role:               { type: String, required: true, enum: ['supreme', 'super_admin', 'coordinator', 'hod', 'student'] },
  status:             { type: String, enum: ['pending', 'active'], default: 'active' },
  department_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null }, // HOD only
  section_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },    // Student only
  student_id:         { type: String, default: null, sparse: true },   // e.g. BCS2025_01
  unique_feedback_id: { type: String, default: null, sparse: true },   // e.g. ANO-7X92K
  points:             { type: Number, default: 0 },
  batch:              { type: String, default: null },
  semester:           { type: Number, default: null },
}, { toJSON: transform, toObject: transform });
export const User = mongoose.model('User', uSchema);

const cSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  code:          { type: String, required: true, unique: true },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true }
}, { toJSON: transform, toObject: transform });
export const Course = mongoose.model('Course', cSchema);

const fSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  teacher_type:  { type: String, enum: ['college_faculty', 'trainer'], default: 'college_faculty' }
}, { toJSON: transform, toObject: transform });
export const Faculty = mongoose.model('Faculty', fSchema);

// SectionFaculty — which faculty teaches which course in which section
const sfSchema = new mongoose.Schema({
  section_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  course_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
}, { toJSON: transform, toObject: transform });
export const SectionFaculty = mongoose.model('SectionFaculty', sfSchema);

const eSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  section_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true }
}, { toJSON: transform, toObject: transform });
export const Enrollment = mongoose.model('Enrollment', eSchema);

const tlfqSchema = new mongoose.Schema({
  section_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  course_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  faculty_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  title:        { type: String, required: true },
  is_active:    { type: Boolean, default: false },  // HOD must explicitly open
  closing_time: { type: Date, required: true },
  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { toJSON: transform, toObject: transform });
export const Tlfq = mongoose.model('Tlfq', tlfqSchema);

const qSchema = new mongoose.Schema({
  tlfq_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Tlfq', required: true },
  question_text: { type: String, required: true }
}, { toJSON: transform, toObject: transform });
export const Question = mongoose.model('Question', qSchema);

const respSchema = new mongoose.Schema({
  student_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tlfq_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Tlfq', required: true },
  submitted_at: { type: String, required: true },
  comment:      { type: String, default: '' }
}, { toJSON: transform, toObject: transform });
export const Response = mongoose.model('Response', respSchema);

const aSchema = new mongoose.Schema({
  response_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Response', required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  rating:      { type: Number, required: true, min: 1, max: 7 }
}, { toJSON: transform, toObject: transform });
export const Answer = mongoose.model('Answer', aSchema);

// ─── SEED ──────────────────────────────────────────────────────────────────────

export const initDb = async (force = false) => {
  try {
    console.log('Attempting connection to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB Atlas successfully.');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  const userCount = await User.countDocuments();
  if (userCount > 0 && !force) {
    console.log(`ℹ️  Database already seeded (${userCount} users found). Skipping seed.`);
    return;
  }

  if (force) {
    console.log('⚠️  Force re-seeding enabled. Wiping existing data...');
    await Department.deleteMany({});
    await Section.deleteMany({});
    await Course.deleteMany({});
    await Faculty.deleteMany({});
    await Tlfq.deleteMany({});
    await Question.deleteMany({});
    await User.deleteMany({});
    await Response.deleteMany({});
    await Answer.deleteMany({});
  }

  console.log('🌱 Seeding database...');

  // ── Departments ────────────────────────────────────────────────────────────
  const deptBTAI = await Department.create({ name: 'B.Tech Artificial Intelligence', code: 'BTAI', portal_open: true });
  const deptBCS  = await Department.create({ name: 'B.Tech Computer Science',        code: 'BCS',  portal_open: true });
  const deptBTEC = await Department.create({ name: 'B.Tech Electronics & Communication', code: 'BTEC', portal_open: true });
  const deptBTME = await Department.create({ name: 'B.Tech Mechanical Engineering',  code: 'BTME', portal_open: true });
  const deptBTCE = await Department.create({ name: 'B.Tech Civil Engineering',       code: 'BTCE', portal_open: true });

  // ── Supreme Authority (3 predefined hardcoded accounts) ─────────────────
  const supPassword = await bcrypt.hash('Super@123', 10);
  await User.create({ name: 'SUPAdmin1', email: 'supauth1@invertis.edu.in', password: supPassword, role: 'supreme', status: 'active' });
  await User.create({ name: 'SUPAdmin2', email: 'supauth2@invertis.edu.in', password: supPassword, role: 'supreme', status: 'active' });
  await User.create({ name: 'SUPAdmin3', email: 'supauth3@invertis.edu.in', password: supPassword, role: 'supreme', status: 'active' });

  // ── Super Admin ────────────────────────────────────────────────────────────
  await User.create({
    name: 'Vikram Chandra',
    email: 'admin@invertis.edu.in',
    password: await bcrypt.hash('Admin@2025', 10),
    role: 'super_admin',
    status: 'active'
  });

  // ── Coordinator (university-wide — no dept restriction) ────────────────────
  await User.create({
    name: 'Sunita Tiwari',
    email: 'coordinator@invertis.edu.in',
    password: await bcrypt.hash('Coord@2025', 10),
    role: 'coordinator',
    status: 'active'
  });

  // ── HODs ───────────────────────────────────────────────────────────────────
  const hodPassword = await bcrypt.hash('Hod@2025', 10);
  await User.create({ name: 'Dr. Priya Sharma',      email: 'hod.btai@invertis.edu.in', password: hodPassword, role: 'hod', department_id: deptBTAI._id, status: 'active' });
  await User.create({ name: 'Dr. Rajesh Kumar',      email: 'hod.bcs@invertis.edu.in',  password: hodPassword, role: 'hod', department_id: deptBCS._id,  status: 'active' });
  await User.create({ name: 'Dr. Anita Singh',       email: 'hod.btec@invertis.edu.in', password: hodPassword, role: 'hod', department_id: deptBTEC._id, status: 'active' });
  await User.create({ name: 'Dr. Suresh Mishra',     email: 'hod.btme@invertis.edu.in', password: hodPassword, role: 'hod', department_id: deptBTME._id, status: 'active' });
  await User.create({ name: 'Dr. Kavita Verma',      email: 'hod.btce@invertis.edu.in', password: hodPassword, role: 'hod', department_id: deptBTCE._id, status: 'active' });

  // ── Faculty (mix of college_faculty and trainer as per plan) ────────────
  const fAI1 = await Faculty.create({ name: 'Dr. Alan Turing',     department_id: deptBTAI._id, teacher_type: 'college_faculty' });
  const fAI2 = await Faculty.create({ name: 'Dr. Yoshua Bengio',   department_id: deptBTAI._id, teacher_type: 'trainer'         });
  const fAI3 = await Faculty.create({ name: 'Dr. Fei-Fei Li',      department_id: deptBTAI._id, teacher_type: 'college_faculty' });
  const fCS1 = await Faculty.create({ name: 'Dr. Grace Hopper',    department_id: deptBCS._id,  teacher_type: 'college_faculty' });
  const fCS2 = await Faculty.create({ name: 'Dr. Ada Lovelace',    department_id: deptBCS._id,  teacher_type: 'trainer'         });
  const fCS3 = await Faculty.create({ name: 'Dr. Dennis Ritchie',  department_id: deptBCS._id,  teacher_type: 'college_faculty' });
  const fEC1 = await Faculty.create({ name: 'Dr. Richard Feynman', department_id: deptBTEC._id, teacher_type: 'college_faculty' });
  const fEC2 = await Faculty.create({ name: 'Dr. Nikola Tesla',    department_id: deptBTEC._id, teacher_type: 'trainer'         });
  const fME1 = await Faculty.create({ name: 'Dr. Isaac Newton',    department_id: deptBTME._id, teacher_type: 'college_faculty' });
  const fME2 = await Faculty.create({ name: 'Dr. Marie Curie',     department_id: deptBTME._id, teacher_type: 'trainer'         });
  const fCE1 = await Faculty.create({ name: 'Dr. Ratan Tata',      department_id: deptBTCE._id, teacher_type: 'college_faculty' });
  const fCE2 = await Faculty.create({ name: 'Dr. Sunita Williams',  department_id: deptBTCE._id, teacher_type: 'trainer'         });

  // ── Courses ────────────────────────────────────────────────────────────────
  const cAI1 = await Course.create({ name: 'Machine Learning Fundamentals',   code: 'BTAI301', department_id: deptBTAI._id });
  const cAI2 = await Course.create({ name: 'Deep Learning & Neural Networks', code: 'BTAI302', department_id: deptBTAI._id });
  const cCS1 = await Course.create({ name: 'Data Structures & Algorithms',    code: 'BCS201',  department_id: deptBCS._id  });
  const cCS2 = await Course.create({ name: 'Database Systems & Cloud',        code: 'BCS302',  department_id: deptBCS._id  });
  const cCS3 = await Course.create({ name: 'Operating Systems',               code: 'BCS303',  department_id: deptBCS._id  });
  const cEC1 = await Course.create({ name: 'Signal Processing',               code: 'BTEC301', department_id: deptBTEC._id });
  const cEC2 = await Course.create({ name: 'VLSI Design',                     code: 'BTEC401', department_id: deptBTEC._id });
  const cME1 = await Course.create({ name: 'Thermodynamics',                  code: 'BTME201', department_id: deptBTME._id });
  const cME2 = await Course.create({ name: 'Fluid Mechanics',                 code: 'BTME301', department_id: deptBTME._id });
  const cCE1 = await Course.create({ name: 'Structural Analysis',             code: 'BTCE201', department_id: deptBTCE._id });
  const cCE2 = await Course.create({ name: 'Environmental Engineering',       code: 'BTCE301', department_id: deptBTCE._id });

  // ── Sections (2 semesters × 2 sections per dept) ──────────────────────────
  // BTAI Sections
  const sAI_3A = await Section.create({ name: 'BTAI-3A', code: 'BTAI3A', semester: 3, label: 'A', department_id: deptBTAI._id });
  const sAI_3B = await Section.create({ name: 'BTAI-3B', code: 'BTAI3B', semester: 3, label: 'B', department_id: deptBTAI._id });
  const sAI_5A = await Section.create({ name: 'BTAI-5A', code: 'BTAI5A', semester: 5, label: 'A', department_id: deptBTAI._id });
  const sAI_5B = await Section.create({ name: 'BTAI-5B', code: 'BTAI5B', semester: 5, label: 'B', department_id: deptBTAI._id });
  // BCS Sections
  const sCS_3A = await Section.create({ name: 'BCS-3A', code: 'BCS3A', semester: 3, label: 'A', department_id: deptBCS._id });
  const sCS_3B = await Section.create({ name: 'BCS-3B', code: 'BCS3B', semester: 3, label: 'B', department_id: deptBCS._id });
  const sCS_5A = await Section.create({ name: 'BCS-5A', code: 'BCS5A', semester: 5, label: 'A', department_id: deptBCS._id });
  const sCS_5B = await Section.create({ name: 'BCS-5B', code: 'BCS5B', semester: 5, label: 'B', department_id: deptBCS._id });
  // BTEC Sections
  const sEC_3A = await Section.create({ name: 'BTEC-3A', code: 'BTEC3A', semester: 3, label: 'A', department_id: deptBTEC._id });
  const sEC_3B = await Section.create({ name: 'BTEC-3B', code: 'BTEC3B', semester: 3, label: 'B', department_id: deptBTEC._id });
  // BTME Sections
  const sME_3A = await Section.create({ name: 'BTME-3A', code: 'BTME3A', semester: 3, label: 'A', department_id: deptBTME._id });
  const sME_3B = await Section.create({ name: 'BTME-3B', code: 'BTME3B', semester: 3, label: 'B', department_id: deptBTME._id });
  // BTCE Sections
  const sCE_3A = await Section.create({ name: 'BTCE-3A', code: 'BTCE3A', semester: 3, label: 'A', department_id: deptBTCE._id });
  const sCE_3B = await Section.create({ name: 'BTCE-3B', code: 'BTCE3B', semester: 3, label: 'B', department_id: deptBTCE._id });

  // ── SectionFaculty assignments ─────────────────────────────────────────────
  // BTAI
  await SectionFaculty.create({ section_id: sAI_3A._id, faculty_id: fAI1._id, course_id: cAI1._id });
  await SectionFaculty.create({ section_id: sAI_3A._id, faculty_id: fAI2._id, course_id: cAI2._id });
  await SectionFaculty.create({ section_id: sAI_3B._id, faculty_id: fAI2._id, course_id: cAI1._id });
  await SectionFaculty.create({ section_id: sAI_3B._id, faculty_id: fAI3._id, course_id: cAI2._id });
  await SectionFaculty.create({ section_id: sAI_5A._id, faculty_id: fAI3._id, course_id: cAI1._id });
  await SectionFaculty.create({ section_id: sAI_5B._id, faculty_id: fAI1._id, course_id: cAI2._id });
  // BCS
  await SectionFaculty.create({ section_id: sCS_3A._id, faculty_id: fCS1._id, course_id: cCS1._id });
  await SectionFaculty.create({ section_id: sCS_3A._id, faculty_id: fCS2._id, course_id: cCS2._id });
  await SectionFaculty.create({ section_id: sCS_3B._id, faculty_id: fCS2._id, course_id: cCS1._id });
  await SectionFaculty.create({ section_id: sCS_3B._id, faculty_id: fCS3._id, course_id: cCS2._id });
  await SectionFaculty.create({ section_id: sCS_5A._id, faculty_id: fCS1._id, course_id: cCS3._id });
  await SectionFaculty.create({ section_id: sCS_5B._id, faculty_id: fCS3._id, course_id: cCS3._id });
  // BTEC
  await SectionFaculty.create({ section_id: sEC_3A._id, faculty_id: fEC1._id, course_id: cEC1._id });
  await SectionFaculty.create({ section_id: sEC_3A._id, faculty_id: fEC2._id, course_id: cEC2._id });
  await SectionFaculty.create({ section_id: sEC_3B._id, faculty_id: fEC1._id, course_id: cEC2._id });
  // BTME
  await SectionFaculty.create({ section_id: sME_3A._id, faculty_id: fME1._id, course_id: cME1._id });
  await SectionFaculty.create({ section_id: sME_3A._id, faculty_id: fME2._id, course_id: cME2._id });
  await SectionFaculty.create({ section_id: sME_3B._id, faculty_id: fME2._id, course_id: cME1._id });
  // BTCE
  await SectionFaculty.create({ section_id: sCE_3A._id, faculty_id: fCE1._id, course_id: cCE1._id });
  await SectionFaculty.create({ section_id: sCE_3A._id, faculty_id: fCE2._id, course_id: cCE2._id });
  await SectionFaculty.create({ section_id: sCE_3B._id, faculty_id: fCE1._id, course_id: cCE2._id });

  // ── Students (pre-created as PENDING — no email/password yet) ─────────────
  const firstNames = ['Aarav','Aditya','Akash','Alok','Amit','Ananya','Anjali','Ankur','Anuj','Arjun',
    'Aryan','Ayush','Deepak','Divya','Gaurav','Ishaan','Kavya','Kunal','Manish','Meera',
    'Mohit','Neha','Nikhil','Pallavi','Pooja','Priya','Rahul','Raj','Ravi','Rohit',
    'Sachin','Sanjay','Shreya','Shubham','Simran','Sonal','Sumit','Suresh','Tanmay','Tanvi',
    'Tushar','Uday','Varun','Vidya','Vikram','Virat','Vishal','Yash','Zara','Karan'];
  const lastNames = ['Agarwal','Bhatia','Chaudhary','Dubey','Gupta','Jain','Joshi','Kumar','Mehta','Mishra',
    'Pandey','Patel','Rao','Sharma','Singh','Srivastava','Tiwari','Verma','Yadav','Chauhan'];

  const sectionGroups = [
    // BTAI
    { dept: deptBTAI, section: sAI_3A, code: 'BTAI', count: 6,  semester: 3 },
    { dept: deptBTAI, section: sAI_3B, code: 'BTAI', count: 6,  semester: 3 },
    { dept: deptBTAI, section: sAI_5A, code: 'BTAI', count: 5,  semester: 5 },
    { dept: deptBTAI, section: sAI_5B, code: 'BTAI', count: 5,  semester: 5 },
    // BCS
    { dept: deptBCS, section: sCS_3A, code: 'BCS', count: 7,  semester: 3 },
    { dept: deptBCS, section: sCS_3B, code: 'BCS', count: 7,  semester: 3 },
    { dept: deptBCS, section: sCS_5A, code: 'BCS', count: 5,  semester: 5 },
    { dept: deptBCS, section: sCS_5B, code: 'BCS', count: 5,  semester: 5 },
    // BTEC
    { dept: deptBTEC, section: sEC_3A, code: 'BTEC', count: 8, semester: 3 },
    { dept: deptBTEC, section: sEC_3B, code: 'BTEC', count: 8, semester: 3 },
    // BTME
    { dept: deptBTME, section: sME_3A, code: 'BTME', count: 8, semester: 3 },
    { dept: deptBTME, section: sME_3B, code: 'BTME', count: 8, semester: 3 },
    // BTCE
    { dept: deptBTCE, section: sCE_3A, code: 'BTCE', count: 8, semester: 3 },
    { dept: deptBTCE, section: sCE_3B, code: 'BTCE', count: 8, semester: 3 },
  ];

  // Create 1 ACTIVE student per section for testing, rest are PENDING
  const stdPassword = await bcrypt.hash('Student@2025', 10);
  let globalIdx = 0;
  const deptStudentCounters = {};

  for (const { dept, section, code, count, semester } of sectionGroups) {
    if (!deptStudentCounters[code]) deptStudentCounters[code] = 1;
    for (let i = 0; i < count; i++) {
      const num = String(deptStudentCounters[code]).padStart(2, '0');
      const studentId = `${code}2025_${num}`;
      const fn = firstNames[globalIdx % firstNames.length];
      const ln = lastNames[(globalIdx + 3) % lastNames.length];
      const isActiveDemo = (i === 0); // First student in each section is active for demo
      const fbId = generateFeedbackId();

      const student = await User.create({
        name: `${fn} ${ln}`,
        email: isActiveDemo ? `${studentId.toLowerCase().replace('_', '.')}@iu.edu.in` : null,
        password: isActiveDemo ? stdPassword : null,
        role: 'student',
        status: isActiveDemo ? 'active' : 'pending',
        department_id: dept._id,
        section_id: section._id,
        semester,
        student_id: studentId,
        unique_feedback_id: fbId,
        points: Math.floor(Math.random() * 50),
        batch: '2025'
      });

      // Enroll student in all courses taught in their section
      const sfAssignments = await SectionFaculty.find({ section_id: section._id }).lean();
      const courseIds = [...new Set(sfAssignments.map(sf => sf.course_id.toString()))];
      for (const courseId of courseIds) {
        await Enrollment.create({ student_id: student._id, course_id: courseId, section_id: section._id });
      }

      deptStudentCounters[code]++;
      globalIdx++;
    }
  }

  // ── Seed one TLFQ per section (HOD demo) ──────────────────────────────────
  const stdQuestions = [
    'The instructor explains course material clearly and effectively.',
    'The instructor is responsive to questions during and outside of class.',
    'The assignments and projects contribute significantly to my learning.',
    'The course content is relevant and up-to-date.',
    'The instructor is well-prepared for every lecture.',
    'Overall, I would rate this instructor\'s effectiveness as high.',
  ];
  const closingDate = new Date(); closingDate.setDate(closingDate.getDate() + 7);

  const sfList = await SectionFaculty.find().lean();
  for (const sf of sfList) {
    const section = await Section.findById(sf.section_id).lean();
    if (!section) continue;
    const course  = await Course.findById(sf.course_id).lean();
    const faculty = await Faculty.findById(sf.faculty_id).lean();
    const dept    = await Department.findById(section.department_id).lean();
    const hod     = await User.findOne({ role: 'hod', department_id: dept._id }).lean();
    if (!hod) continue;
    const tlfq = await Tlfq.create({
      section_id:   sf.section_id,
      course_id:    sf.course_id,
      faculty_id:   sf.faculty_id,
      title:        `${section.name} — ${course.code} Feedback`,
      is_active:    true,
      closing_time: closingDate,
      created_by:   hod._id
    });
    await Question.insertMany(stdQuestions.map(q => ({ tlfq_id: tlfq._id, question_text: q })));
  }

  console.log('✅ Seeding completed. Full structured data created across 5 departments.');
};

export default mongoose;
