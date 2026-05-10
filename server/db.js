import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://alokyadav83956_db_user:tlfq@cluster0.1fuevhc.mongodb.net/tlfq';

const inMemoryStore = {
  User: [],
  Department: [],
  Course: [],
  Faculty: [],
  Enrollment: [],
  Tlfq: [],
  Question: [],
  Response: [],
  Answer: []
};

let useFallback = false;

function createDoc(modelName, obj) {
  const _id = obj._id || new mongoose.Types.ObjectId();
  const doc = {
    ...obj,
    _id,
    id: _id.toString(),
    toJSON() {
      const ret = { ...doc };
      ret.id = _id.toString();
      delete ret._id;
      delete ret.toJSON;
      delete ret.toObject;
      return ret;
    },
    toObject() {
      return this.toJSON();
    }
  };
  return doc;
}

function filterMatches(item, query) {
  if (!query || Object.keys(query).length === 0) return true;
  
  // Handle $or operator
  if (query.$or && Array.isArray(query.$or)) {
    return query.$or.some(subQuery => filterMatches(item, subQuery));
  }

  return Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object' && '$in' in value) {
      const inArray = Array.isArray(value.$in) ? value.$in.map(v => v.toString()) : [];
      return inArray.includes(item[key]?.toString());
    }
    return item[key]?.toString() === value?.toString();
  });
}

class MockQuery {
  constructor(data) { this.data = data; }
  select() { return this; }
  sort(criteria) {
    if (this.data && Array.isArray(this.data) && criteria && criteria.submitted_at === -1) {
      this.data.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    }
    return this;
  }
  then(resolve, reject) { return Promise.resolve(this.data).then(resolve, reject); }
  catch(reject) { return Promise.resolve(this.data).catch(reject); }
}

function createModelWrapper(modelName, realModel) {
  return new Proxy(realModel, {
    get(target, prop, receiver) {
      if (useFallback) {
        if (prop === 'find') {
          return (query) => {
            const results = inMemoryStore[modelName].filter(item => filterMatches(item, query));
            return new MockQuery(results);
          };
        }
        if (prop === 'findOne') {
          return (query) => {
            const results = inMemoryStore[modelName].filter(item => filterMatches(item, query));
            return new MockQuery(results[0] || null);
          };
        }
        if (prop === 'findById') {
          return (id) => {
            const results = inMemoryStore[modelName].filter(item => item.id === id?.toString() || item._id?.toString() === id?.toString());
            return new MockQuery(results[0] || null);
          };
        }
        if (prop === 'create') {
          return (obj) => {
            const doc = createDoc(modelName, obj);
            inMemoryStore[modelName].push(doc);
            return Promise.resolve(doc);
          };
        }
        if (prop === 'countDocuments') {
          return (query) => {
            const results = inMemoryStore[modelName].filter(item => filterMatches(item, query));
            return Promise.resolve(results.length);
          };
        }
        if (prop === 'deleteMany') {
          return (query) => {
            if (!query || Object.keys(query).length === 0) {
              inMemoryStore[modelName] = [];
            } else {
              inMemoryStore[modelName] = inMemoryStore[modelName].filter(item => !filterMatches(item, query));
            }
            return Promise.resolve({ deletedCount: inMemoryStore[modelName].length });
          };
        }
        if (prop === 'findByIdAndDelete') {
          return (id) => {
            const index = inMemoryStore[modelName].findIndex(item => item.id === id?.toString() || item._id?.toString() === id?.toString());
            if (index !== -1) {
              const [deleted] = inMemoryStore[modelName].splice(index, 1);
              return Promise.resolve(deleted);
            }
            return Promise.resolve(null);
          };
        }
        if (prop === 'findByIdAndUpdate') {
          return (id, update) => {
            const index = inMemoryStore[modelName].findIndex(item => item.id === id?.toString() || item._id?.toString() === id?.toString());
            if (index !== -1) {
              const updateData = update.$set || update;
              Object.assign(inMemoryStore[modelName][index], updateData);
              return Promise.resolve(inMemoryStore[modelName][index]);
            }
            return Promise.resolve(null);
          };
        }
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

const transform = {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  }
};

// ─── SCHEMAS ───────────────────────────────────────────────────────────────────

const deptSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }
}, { toJSON: transform, toObject: transform });
const rDepartment = mongoose.model('Department', deptSchema);
export const Department = createModelWrapper('Department', rDepartment);

// role: 'admin' | 'hod' | 'student'
const uSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  college_id: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'hod', 'student'] },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null }
}, { toJSON: transform, toObject: transform });
const rUser = mongoose.model('User', uSchema);
export const User = createModelWrapper('User', rUser);

const cSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true }
}, { toJSON: transform, toObject: transform });
const rCourse = mongoose.model('Course', cSchema);
export const Course = createModelWrapper('Course', rCourse);

// Faculty = data entity (not a user)
const fSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true }
}, { toJSON: transform, toObject: transform });
const rFaculty = mongoose.model('Faculty', fSchema);
export const Faculty = createModelWrapper('Faculty', rFaculty);

const eSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
}, { toJSON: transform, toObject: transform });
const rEnrollment = mongoose.model('Enrollment', eSchema);
export const Enrollment = createModelWrapper('Enrollment', rEnrollment);

const tlfqSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  title: { type: String, required: true },
  is_active: { type: Boolean, default: true }
}, { toJSON: transform, toObject: transform });
const rTlfq = mongoose.model('Tlfq', tlfqSchema);
export const Tlfq = createModelWrapper('Tlfq', rTlfq);

const qSchema = new mongoose.Schema({
  tlfq_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tlfq', required: true },
  question_text: { type: String, required: true }
}, { toJSON: transform, toObject: transform });
const rQuestion = mongoose.model('Question', qSchema);
export const Question = createModelWrapper('Question', rQuestion);

// Anonymous — student_id used only for one-submission enforcement, never exposed in reports
const respSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tlfq_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tlfq', required: true },
  submitted_at: { type: String, required: true },
  comment: { type: String, default: '' }
}, { toJSON: transform, toObject: transform });
const rResponse = mongoose.model('Response', respSchema);
export const Response = createModelWrapper('Response', rResponse);

const aSchema = new mongoose.Schema({
  response_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Response', required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  rating: { type: Number, required: true, min: 1, max: 7 }
}, { toJSON: transform, toObject: transform });
const rAnswer = mongoose.model('Answer', aSchema);
export const Answer = createModelWrapper('Answer', rAnswer);

// ─── SEED ──────────────────────────────────────────────────────────────────────

export const initDb = async () => {
  try {
    console.log('Attempting connection to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB via Mongoose successfully.');
    useFallback = false;
  } catch (err) {
    console.warn('MongoDB Atlas connection failed. Using in-memory fallback store instead.');
    useFallback = true;
  }

  // Check if seeding is necessary
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Database already contains records. Skipping initial seeding to preserve data integrity.');
    return;
  }

  console.log('Database is empty. Initializing baseline system data...');

  // No longer deleting data if it's already there
  // await Promise.all([ ... ]);

  // ── 1. Departments
  const departments = await Promise.all([
    Department.create({ name: 'Computer Science & Engineering', code: 'CSE' }),
    Department.create({ name: 'Electronics & Communication', code: 'ECE' }),
    Department.create({ name: 'Mechanical Engineering', code: 'ME' }),
    Department.create({ name: 'Pharmacy & Medical Sciences', code: 'PHAR' }),
    Department.create({ name: 'Applied Sciences & Humanities', code: 'ASH' }),
  ]);
  const [deptCS, deptEC, deptME, deptPH, deptAS] = departments;

  // ── 2. Staff Users
  const hAdmin = await bcrypt.hash('admin123', 10);
  const hStaff = await bcrypt.hash('staff123', 10);

  await User.create({
    name: 'System Administrator',
    email: 'admin@invertis.edu.in',
    password: hAdmin,
    role: 'admin',
    department_id: null
  });

  const hods = [
    { name: 'Dr. Priya Sharma', email: 'hod.cse@invertis.edu.in', dept: deptCS },
    { name: 'Dr. Rajesh Kumar', email: 'hod.ece@invertis.edu.in', dept: deptEC },
    { name: 'Prof. Amit Singhal', email: 'hod.me@invertis.edu.in', dept: deptME },
    { name: 'Dr. S. K. Gupta', email: 'hod.pharmacy@invertis.edu.in', dept: deptPH },
  ];

  for (const h of hods) {
    await User.create({
      name: `${h.name} (HOD ${h.dept.code})`,
      email: h.email,
      password: hStaff,
      role: 'hod',
      department_id: h.dept._id
    });
  }

  // ── 3. Students (50 students)
  console.log('Generating 50 students...');
  const hStudent = await bcrypt.hash('student123', 10);
  const students = [];
  const firstNames = ['Amit', 'Rahul', 'Sneha', 'Priya', 'Vikram', 'Anjali', 'Karan', 'Deepak', 'Megha', 'Sonia'];
  const lastNames = ['Yadav', 'Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Gupta', 'Mishra', 'Khan', 'Das'];

  for (let i = 1; i <= 50; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const college_id = `2024${String(i).padStart(3, '0')}`;
    const dept = departments[i % departments.length];
    
    const s = await User.create({
      name: `${fn} ${ln}`,
      email: `student${i}@invertis.edu.in`,
      college_id: college_id,
      password: hStudent,
      role: 'student',
      department_id: dept._id
    });
    students.push(s);
  }

  // ── 4. Faculty (Entities)
  console.log('Generating faculty and courses...');
  const facultyData = [
    { name: 'Dr. Alan Turing', dept: deptCS },
    { name: 'Dr. Grace Hopper', dept: deptCS },
    { name: 'Dr. Ada Lovelace', dept: deptCS },
    { name: 'Dr. Richard Feynman', dept: deptEC },
    { name: 'Prof. Nikola Tesla', dept: deptEC },
    { name: 'Dr. James Watt', dept: deptME },
    { name: 'Dr. Alexander Fleming', dept: deptPH },
    { name: 'Dr. Marie Curie', dept: deptAS },
  ];
  const facultyList = [];
  for (const f of facultyData) {
    const fac = await Faculty.create({ name: f.name, department_id: f.dept._id });
    facultyList.push(fac);
  }

  // ── 5. Courses
  const coursesData = [
    { name: 'Data Structures', code: 'CS101', dept: deptCS },
    { name: 'Operating Systems', code: 'CS202', dept: deptCS },
    { name: 'Compiler Design', code: 'CS305', dept: deptCS },
    { name: 'Analog Circuits', code: 'EC101', dept: deptEC },
    { name: 'Microprocessors', code: 'EC205', dept: deptEC },
    { name: 'Thermodynamics', code: 'ME101', dept: deptME },
    { name: 'Pharmacology I', code: 'PH101', dept: deptPH },
    { name: 'Quantum Physics', code: 'AS101', dept: deptAS },
  ];
  const courseList = [];
  for (const c of coursesData) {
    const crs = await Course.create({ name: c.name, code: c.code, department_id: c.dept._id });
    courseList.push(crs);
  }

  // ── 6. Enrollments (Randomly assign 3-5 courses per student)
  console.log('Enrolling students...');
  for (const s of students) {
    const deptCourses = courseList.filter(c => c.department_id.toString() === s.department_id.toString());
    const otherCourses = courseList.filter(c => c.department_id.toString() !== s.department_id.toString());
    
    for (const c of deptCourses) {
      await Enrollment.create({ student_id: s._id, course_id: c._id });
    }
    const randomOther = otherCourses.sort(() => 0.5 - Math.random()).slice(0, 2);
    for (const c of randomOther) {
      await Enrollment.create({ student_id: s._id, course_id: c._id });
    }
  }

  // ── 7. TLFQs & Questions
  const qs = [
    'Instructor demonstrates deep knowledge of the subject matter.',
    'Feedback on assignments is timely and constructive.',
    'Course materials (PPTs, Notes) are easily accessible.',
    'The instructor encourages active participation in class.',
    'The course objectives were clearly defined and achieved.'
  ];

  console.log('Creating questionnaires and seeding responses...');
  for (let i = 0; i < courseList.length; i++) {
    const course = courseList[i];
    const faculty = facultyList[i % facultyList.length];
    
    const tlfq = await Tlfq.create({ 
      course_id: course._id, 
      faculty_id: faculty._id, 
      title: `End Semester Feedback - ${course.name} (${course.code})`,
      is_active: true 
    });

    const questions = [];
    for (const qText of qs) {
      const q = await Question.create({ tlfq_id: tlfq._id, question_text: qText });
      questions.push(q);
    }

    const enrolledStudents = await Enrollment.find({ course_id: course._id });
    const responsiveStudents = enrolledStudents.sort(() => 0.5 - Math.random()).slice(0, Math.ceil(enrolledStudents.length * 0.6));
    
    for (const enrollment of responsiveStudents) {
      const r = await Response.create({
        student_id: enrollment.student_id,
        tlfq_id: tlfq._id,
        submitted_at: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
        comment: Math.random() > 0.5 ? 'Very satisfied with the teaching methodology.' : 'Good course, but needs more practical examples.'
      });
      for (const q of questions) {
        await Answer.create({ 
          response_id: r._id, 
          question_id: q._id, 
          rating: Math.floor(Math.random() * 3) + 5
        });
      }
    }
  }

  console.log('Seeding completed successfully with 50 students and expanded directory.');
};

export default mongoose;
