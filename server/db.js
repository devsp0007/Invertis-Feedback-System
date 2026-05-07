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

  console.log('Seeding initial data...');

  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Course.deleteMany({}),
    Faculty.deleteMany({}),
    Enrollment.deleteMany({}),
    Tlfq.deleteMany({}),
    Question.deleteMany({}),
    Response.deleteMany({}),
    Answer.deleteMany({})
  ]);

  // ── Departments
  const deptCS = await Department.create({ name: 'Computer Science & Engineering', code: 'CSE' });
  const deptEC = await Department.create({ name: 'Electronics & Communication', code: 'ECE' });

  // ── Users: 1 admin, 2 HODs, 3 students
  const [hAdmin, hHod1, hHod2, hS1, hS2, hS3] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('hod123', 10),
    bcrypt.hash('hod123', 10),
    bcrypt.hash('student123', 10),
    bcrypt.hash('student123', 10),
    bcrypt.hash('student123', 10),
  ]);

  const adminUser = await User.create({
    name: 'System Administrator',
    email: 'admin@invertis.edu.in',
    password: hAdmin,
    role: 'admin',
    department_id: null
  });

  const hod1 = await User.create({
    name: 'Dr. Priya Sharma (HOD CSE)',
    email: 'hod.cse@invertis.edu.in',
    password: hHod1,
    role: 'hod',
    department_id: deptCS._id
  });

  const hod2 = await User.create({
    name: 'Dr. Rajesh Kumar (HOD ECE)',
    email: 'hod.ece@invertis.edu.in',
    password: hHod2,
    role: 'hod',
    department_id: deptEC._id
  });

  const s1 = await User.create({
    name: 'Alok Yadav',
    email: 'student1@invertis.edu.in',
    password: hS1,
    role: 'student',
    department_id: deptCS._id
  });

  const s2 = await User.create({
    name: 'Priya Patel',
    email: 'student2@invertis.edu.in',
    password: hS2,
    role: 'student',
    department_id: deptCS._id
  });

  const s3 = await User.create({
    name: 'Ravi Verma',
    email: 'student3@invertis.edu.in',
    password: hS3,
    role: 'student',
    department_id: deptEC._id
  });

  // ── Faculty (data entities, not users)
  const f1 = await Faculty.create({ name: 'Dr. Alan Turing', department_id: deptCS._id });
  const f2 = await Faculty.create({ name: 'Dr. Grace Hopper', department_id: deptCS._id });
  const f3 = await Faculty.create({ name: 'Dr. Richard Feynman', department_id: deptEC._id });
  const f4 = await Faculty.create({ name: 'Dr. Ada Lovelace', department_id: deptCS._id });

  // ── Courses
  const c1 = await Course.create({ name: 'Advanced Algorithms', code: 'CS401', department_id: deptCS._id });
  const c2 = await Course.create({ name: 'Database Systems & Cloud', code: 'CS302', department_id: deptCS._id });
  const c3 = await Course.create({ name: 'Applied AI & Ethics', code: 'CS405', department_id: deptCS._id });
  const c4 = await Course.create({ name: 'Signal Processing', code: 'EC301', department_id: deptEC._id });

  // ── Enrollments
  await Enrollment.create({ student_id: s1._id, course_id: c1._id });
  await Enrollment.create({ student_id: s1._id, course_id: c2._id });
  await Enrollment.create({ student_id: s1._id, course_id: c3._id });
  await Enrollment.create({ student_id: s2._id, course_id: c1._id });
  await Enrollment.create({ student_id: s2._id, course_id: c2._id });
  await Enrollment.create({ student_id: s3._id, course_id: c4._id });

  // ── TLFQs
  const qs = [
    'The instructor explains course material clearly and effectively.',
    'The instructor is responsive to questions during and outside of class.',
    'The assignments and projects contribute significantly to learning.',
    'The course stimulated my interest in the subject matter.',
    'Overall, I would rate this instructor\'s effectiveness as high.'
  ];

  const createTlfqWithQuestions = async (courseId, facultyId, title) => {
    const tlfq = await Tlfq.create({ course_id: courseId, faculty_id: facultyId, title, is_active: true });
    const questions = [];
    for (const qText of qs) {
      const q = await Question.create({ tlfq_id: tlfq._id, question_text: qText });
      questions.push(q);
    }
    return { tlfq, questions };
  };

  const { tlfq: t1, questions: q1s } = await createTlfqWithQuestions(c1._id, f1._id, 'Spring Evaluation – Advanced Algorithms (CS401)');
  const { tlfq: t2, questions: q2s } = await createTlfqWithQuestions(c2._id, f2._id, 'Spring Evaluation – Database Systems (CS302)');
  const { tlfq: t3, questions: q3s } = await createTlfqWithQuestions(c3._id, f4._id, 'Spring Evaluation – Applied AI (CS405)');
  const { tlfq: t4, questions: q4s } = await createTlfqWithQuestions(c4._id, f3._id, 'Spring Evaluation – Signal Processing (EC301)');

  // ── Seed responses (student1 submits for t1, student2 submits for t2)
  const r1 = await Response.create({
    student_id: s1._id, tlfq_id: t1._id,
    submitted_at: new Date().toISOString(),
    comment: 'Excellent course and deep conceptual teaching.'
  });
  for (const q of q1s) {
    await Answer.create({ response_id: r1._id, question_id: q._id, rating: 6 });
  }

  const r2 = await Response.create({
    student_id: s2._id, tlfq_id: t2._id,
    submitted_at: new Date().toISOString(),
    comment: 'Great explanations of cloud and storage topics.'
  });
  for (const q of q2s) {
    await Answer.create({ response_id: r2._id, question_id: q._id, rating: 7 });
  }

  console.log('Seeding completed successfully.');
};

export default mongoose;
