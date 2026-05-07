import mongoose from 'mongoose';
import { Department, Course, Faculty, Enrollment, Tlfq, Question, Response, User } from '../db.js';

function serialize(doc) {
  if (!doc) return doc;
  if (typeof doc.toJSON === 'function') {
    try { return doc.toJSON(); } catch (e) { return { ...doc }; }
  }
  return { ...doc };
}

// ── GET /api/tlfq/departments
export const getDepartments = async (req, res) => {
  try {
    const depts = await Department.find();
    return res.status(200).json((depts || []).map(serialize));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq/departments  [admin only]
export const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code are required' });
    const result = await Department.create({ name, code });
    return res.status(201).json(serialize(result));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── DELETE /api/tlfq/departments/:id  [admin only]
export const deleteDepartment = async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Department deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/courses
//    - admin → all courses
//    - hod   → courses in their department
//    - student → enrolled courses (with completion flag)
export const getCourses = async (req, res) => {
  try {
    const { role, id: userId, department_id } = req.user;

    if (role === 'admin') {
      const courses = await Course.find();
      const result = [];
      for (const c of courses || []) {
        const dept = await Department.findById(c.department_id);
        result.push({ ...serialize(c), department_name: dept ? dept.name : 'Unknown' });
      }
      return res.status(200).json(result);
    }

    if (role === 'hod') {
      const courses = await Course.find({ department_id });
      const result = [];
      for (const c of courses || []) {
        const dept = await Department.findById(c.department_id);
        result.push({ ...serialize(c), department_name: dept ? dept.name : 'Unknown' });
      }
      return res.status(200).json(result);
    }

    // student
    const enrollments = await Enrollment.find({ student_id: userId });
    const courseIds = (enrollments || [])
      .map(e => e.course_id)
      .filter(id => id && mongoose.Types.ObjectId.isValid(id));

    let courses;
    if (courseIds.length > 0) {
      try {
        courses = await Course.find({ _id: { $in: courseIds } });
      } catch {
        courses = await Course.find();
      }
    } else {
      courses = [];
    }

    const courseData = [];
    for (const course of courses) {
      const tlfqs = await Tlfq.find({ course_id: course._id });
      const pendingTlfqs = [];
      const completedTlfqs = [];

      for (const tlfq of tlfqs || []) {
        const resp = await Response.findOne({ student_id: userId, tlfq_id: tlfq._id });
        const faculty = await Faculty.findById(tlfq.faculty_id);
        const entry = {
          ...serialize(tlfq),
          faculty_name: faculty ? faculty.name : 'Unknown',
          completed: !!resp
        };
        if (resp) completedTlfqs.push(entry);
        else pendingTlfqs.push(entry);
      }

      courseData.push({
        ...serialize(course),
        tlfqs: [...pendingTlfqs, ...completedTlfqs],
        pending_count: pendingTlfqs.length,
        completed_count: completedTlfqs.length
      });
    }

    return res.status(200).json(courseData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq/courses  [admin only]
export const createCourse = async (req, res) => {
  try {
    const { name, code, department_id } = req.body;
    if (!name || !code || !department_id) return res.status(400).json({ message: 'name, code, department_id required' });
    const result = await Course.create({ name, code, department_id });
    return res.status(201).json(serialize(result));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── DELETE /api/tlfq/courses/:id  [admin only]
export const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/faculty  [admin + hod]
export const getAllFaculty = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const query = role === 'hod' ? { department_id } : {};
    const facultyList = await Faculty.find(query);
    const result = [];
    for (const f of facultyList || []) {
      const dept = await Department.findById(f.department_id);
      result.push({ ...serialize(f), department_name: dept ? dept.name : 'Unknown' });
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq/faculty  [admin only]
export const createFaculty = async (req, res) => {
  try {
    const { name, department_id } = req.body;
    if (!name || !department_id) return res.status(400).json({ message: 'name and department_id required' });
    const result = await Faculty.create({ name, department_id });
    return res.status(201).json(serialize(result));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── DELETE /api/tlfq/faculty/:id  [admin only]
export const deleteFaculty = async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Faculty deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/courses/:courseId/evaluations  [student/hod/admin]
export const getCourseEvaluations = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tlfqs = await Tlfq.find({ course_id: courseId });
    const evaluations = [];

    for (const tlfq of tlfqs || []) {
      const faculty = await Faculty.findById(tlfq.faculty_id);
      const resp = req.user.role === 'student'
        ? await Response.findOne({ student_id: req.user.id, tlfq_id: tlfq._id })
        : null;

      evaluations.push({
        ...serialize(tlfq),
        faculty_name: faculty ? faculty.name : 'Unknown',
        completed: req.user.role === 'student' ? !!resp : undefined
      });
    }

    return res.status(200).json(evaluations);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/courses/:courseId/evaluation/:tlfqId
export const getSpecificEvaluation = async (req, res) => {
  try {
    const { tlfqId } = req.params;
    const tlfq = await Tlfq.findById(tlfqId);
    if (!tlfq) return res.status(404).json({ message: 'Evaluation not found.' });

    const faculty = await Faculty.findById(tlfq.faculty_id);
    const course = await Course.findById(tlfq.course_id);
    const questions = await Question.find({ tlfq_id: tlfq._id });

    return res.status(200).json({
      ...serialize(tlfq),
      faculty_name: faculty ? faculty.name : 'Unknown',
      course_name: course ? course.name : 'Unknown',
      questions: (questions || []).map(serialize)
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq  [admin only]
export const createTlfq = async (req, res) => {
  try {
    const { course_id, faculty_id, title, question_texts } = req.body;
    if (!course_id || !faculty_id || !title) {
      return res.status(400).json({ message: 'course_id, faculty_id, title required' });
    }
    const result = await Tlfq.create({ course_id, faculty_id, title, is_active: true });

    if (question_texts && Array.isArray(question_texts)) {
      for (const qText of question_texts) {
        if (qText) await Question.create({ tlfq_id: result._id, question_text: qText });
      }
    }
    return res.status(201).json({ id: result.id || result._id?.toString(), message: 'TLFQ created successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/students  [admin only — for enrollment management]
export const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    return res.status(200).json((students || []).map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      department_id: s.department_id?.toString() || null
    })));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq/enrollments  [admin only]
export const createEnrollment = async (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) return res.status(400).json({ message: 'student_id and course_id required' });
    const existing = await Enrollment.findOne({ student_id, course_id });
    if (existing) return res.status(400).json({ message: 'Already enrolled' });
    const result = await Enrollment.create({ student_id, course_id });
    return res.status(201).json(serialize(result));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/stats  [admin overview stats]
export const getAdminStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await Faculty.countDocuments({});
    const totalCourses = await Course.countDocuments({});
    const totalDepts = await Department.countDocuments({});
    const totalTlfqs = await Tlfq.countDocuments({});
    const totalResponses = await Response.countDocuments({});

    // Feedback completion rate
    const totalEnrollments = await Enrollment.countDocuments({});
    const completionRate = totalEnrollments > 0
      ? Math.round((totalResponses / totalEnrollments) * 100)
      : 0;

    return res.status(200).json({
      totalStudents,
      totalFaculty,
      totalCourses,
      totalDepts,
      totalTlfqs,
      totalResponses,
      completionRate
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
