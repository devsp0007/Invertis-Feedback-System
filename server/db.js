import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://alokyadav83956_db_user:tlfq@cluster0.1fuevhc.mongodb.net/tlfq';

const inMemoryStore = {
  User: [],
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
      const ret = { ...this };
      ret.id = this._id.toString();
      delete ret._id;
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
  constructor(data) {
    this.data = data;
  }
  select() { return this; }
  sort(criteria) {
    if (this.data && Array.isArray(this.data) && criteria && criteria.submitted_at === -1) {
      this.data.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    }
    return this;
  }
  then(resolve, reject) {
    return Promise.resolve(this.data).then(resolve, reject);
  }
  catch(reject) {
    return Promise.resolve(this.data).catch(reject);
  }
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

// Original Schemas & Models setup
const uSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'student'] }
}, { toJSON: transform, toObject: transform });
const rUser = mongoose.model('User', uSchema);
export const User = createModelWrapper('User', rUser);

const cSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true }
}, { toJSON: transform, toObject: transform });
const rCourse = mongoose.model('Course', cSchema);
export const Course = createModelWrapper('Course', rCourse);

const fSchema = new mongoose.Schema({
  name: { type: String, required: true }
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
  title: { type: String, required: true }
}, { toJSON: transform, toObject: transform });
const rTlfq = mongoose.model('Tlfq', tlfqSchema);
export const Tlfq = createModelWrapper('Tlfq', rTlfq);

const qSchema = new mongoose.Schema({
  tlfq_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tlfq', required: true },
  question_text: { type: String, required: true }
}, { toJSON: transform, toObject: transform });
const rQuestion = mongoose.model('Question', qSchema);
export const Question = createModelWrapper('Question', rQuestion);

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
  rating: { type: Number, required: true }
}, { toJSON: transform, toObject: transform });
const rAnswer = mongoose.model('Answer', aSchema);
export const Answer = createModelWrapper('Answer', rAnswer);

export const initDb = async () => {
  try {
    // Attempt real connection
    console.log('Attempting connection to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB via Mongoose successfully.');
    useFallback = false;
  } catch (err) {
    console.warn('MongoDB Atlas connection failed. Using in-memory fallback store instead.');
    useFallback = true;
  }

  console.log('Seeding initial data...');

  // Clear everything unconditionally
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Faculty.deleteMany({}),
    Enrollment.deleteMany({}),
    Tlfq.deleteMany({}),
    Question.deleteMany({}),
    Response.deleteMany({}),
    Answer.deleteMany({})
  ]);

  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedStudent1 = await bcrypt.hash('student123', 10);
  const hashedStudent2 = await bcrypt.hash('student123', 10);
  const hashedStudent3 = await bcrypt.hash('student123', 10);

  // Users
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@invertis.edu.in',
    password: hashedAdmin,
    role: 'admin'
  });

  const s1 = await User.create({
    name: 'Student One',
    email: 'student1@invertis.edu.in',
    password: hashedStudent1,
    role: 'student'
  });

  const s2 = await User.create({
    name: 'Student Two',
    email: 'student2@invertis.edu.in',
    password: hashedStudent2,
    role: 'student'
  });

  const s3 = await User.create({
    name: 'Student Three',
    email: 'student3@invertis.edu.in',
    password: hashedStudent3,
    role: 'student'
  });

  // Add faculty
  const f1 = await Faculty.create({ name: 'Dr. Alan Turing' });
  const f2 = await Faculty.create({ name: 'Dr. Grace Hopper' });
  const f3 = await Faculty.create({ name: 'Dr. Richard Feynman' });
  const f4 = await Faculty.create({ name: 'Dr. Ada Lovelace' });

  // Add courses
  const c1 = await Course.create({ name: 'Advanced Algorithms', code: 'CS401' });
  const c2 = await Course.create({ name: 'Database Systems & Cloud', code: 'CS302' });
  const c3 = await Course.create({ name: 'Applied AI & Ethics', code: 'CS405' });
  const c4 = await Course.create({ name: 'Quantum Computing Foundations', code: 'CS501' });

  // Enrollments for Student 1
  await Enrollment.create({ student_id: s1._id, course_id: c1._id });
  await Enrollment.create({ student_id: s1._id, course_id: c2._id });
  await Enrollment.create({ student_id: s1._id, course_id: c3._id });
  await Enrollment.create({ student_id: s1._id, course_id: c4._id });

  // Enrollments for Student 2
  await Enrollment.create({ student_id: s2._id, course_id: c1._id });
  await Enrollment.create({ student_id: s2._id, course_id: c2._id });

  // Enrollments for Student 3
  await Enrollment.create({ student_id: s3._id, course_id: c1._id });
  await Enrollment.create({ student_id: s3._id, course_id: c2._id });
  await Enrollment.create({ student_id: s3._id, course_id: c3._id });

  // Create TLFQs
  const t1 = await Tlfq.create({
    course_id: c1._id,
    faculty_id: f1._id,
    title: 'Spring Course Evaluation for CS401'
  });
  const t1_alt = await Tlfq.create({
    course_id: c1._id,
    faculty_id: f4._id,
    title: 'Autumn Course Evaluation for CS401'
  });
  const t2 = await Tlfq.create({
    course_id: c2._id,
    faculty_id: f2._id,
    title: 'Mid-Semester Feedback for CS302'
  });
  const t3 = await Tlfq.create({
    course_id: c3._id,
    faculty_id: f3._id,
    title: 'Winter Evaluation for CS405'
  });
  const t4 = await Tlfq.create({
    course_id: c4._id,
    faculty_id: f4._id,
    title: 'Fall Assessment for CS501'
  });

  // Questions for evaluations
  const qs = [
    "The instructor explains course material clearly and effectively.",
    "The instructor is responsive to questions during and outside of class.",
    "The assignments and projects contribute significantly to learning.",
    "The course stimulated my interest in the subject matter.",
    "Overall, I would rate this instructor's effectiveness as high."
  ];

  const qObjects1 = [];
  const qObjects2 = [];
  const qObjects3 = [];
  const qObjects4 = [];

  for (const qText of qs) {
    const q1 = await Question.create({ tlfq_id: t1._id, question_text: qText });
    await Question.create({ tlfq_id: t1_alt._id, question_text: qText });
    const q2 = await Question.create({ tlfq_id: t2._id, question_text: qText });
    const q3 = await Question.create({ tlfq_id: t3._id, question_text: qText });
    const q4 = await Question.create({ tlfq_id: t4._id, question_text: qText });
    qObjects1.push(q1);
    qObjects2.push(q2);
    qObjects3.push(q3);
    qObjects4.push(q4);
  }

  // Seeding test responses
  const r1 = await Response.create({
    student_id: s1._id,
    tlfq_id: t1._id,
    submitted_at: new Date().toISOString(),
    comment: 'Excellent course and deep conceptual teaching.'
  });

  for (const q of qObjects1) {
    await Answer.create({
      response_id: r1._id,
      question_id: q._id,
      rating: 6
    });
  }

  const r2 = await Response.create({
    student_id: s2._id,
    tlfq_id: t2._id,
    submitted_at: new Date().toISOString(),
    comment: 'Great explanations of cloud and storage topics.'
  });

  for (const q of qObjects2) {
    await Answer.create({
      response_id: r2._id,
      question_id: q._id,
      rating: 7
    });
  }

  const r3 = await Response.create({
    student_id: s3._id,
    tlfq_id: t3._id,
    submitted_at: new Date().toISOString(),
    comment: 'Interesting ethics case studies and interactive discussions.'
  });

  for (const q of qObjects3) {
    await Answer.create({
      response_id: r3._id,
      question_id: q._id,
      rating: 5
    });
  }

  console.log('Seeding completed successfully.');
};

export default mongoose;
