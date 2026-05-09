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
    const depts = await Department.find().lean();
    return res.status(200).json(depts.map(d => ({ ...d, id: d._id.toString() })));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq/departments  [super_admin only]
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

// ── DELETE /api/tlfq/departments/:id  [super_admin only]
export const deleteDepartment = async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Department deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── PUT /api/tlfq/departments/:id/portal  [hod + super_admin + admin]
export const togglePortal = async (req, res) => {
  try {
    const { open } = req.body;
    const { role, department_id } = req.user;

    // HOD can only toggle their own department
    if (role === 'hod' && req.params.id !== department_id) {
      return res.status(403).json({ message: 'You can only manage your own department portal' });
    }

    const dept = await Department.findByIdAndUpdate(
      req.params.id,
      { portal_open: !!open },
      { new: true }
    );
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    return res.status(200).json({ portal_open: dept.portal_open, message: `Portal ${dept.portal_open ? 'opened' : 'closed'} successfully` });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/courses
export const getCourses = async (req, res) => {
  try {
    const { role, id: userId, department_id } = req.user;

    if (role === 'super_admin' || role === 'admin') {
      const courses = await Course.find().lean();
      const result = [];
      for (const c of courses) {
        const dept = await Department.findById(c.department_id).lean();
        result.push({ ...c, id: c._id.toString(), department_name: dept ? dept.name : 'Unknown' });
      }
      return res.status(200).json(result);
    }

    if (role === 'hod') {
      const courses = await Course.find({ department_id }).lean();
      const result = [];
      for (const c of courses) {
        const dept = await Department.findById(c.department_id).lean();
        result.push({ ...c, id: c._id.toString(), department_name: dept ? dept.name : 'Unknown' });
      }
      return res.status(200).json(result);
    }

    // Student
    const enrollments = await Enrollment.find({ student_id: userId }).lean();
    const courseIds = enrollments.map(e => e.course_id);
    const courses = await Course.find({ _id: { $in: courseIds } }).lean();
    const dept = await Department.findById(department_id).lean();

    // Check portal status
    if (dept && !dept.portal_open) {
      return res.status(200).json({ portal_closed: true, message: 'The feedback portal is currently closed by your HOD.' });
    }

    const student = await User.findById(userId).lean();
    const courseData = [];
    const now = new Date();
    for (const course of courses) {
      const tlfqs = await Tlfq.find({ 
        course_id: course._id,
        semester: student.semester,
        section: student.section,
        is_active: true,
        closing_time: { $gt: now }
      }).lean();
      const pendingTlfqs = [];
      const completedTlfqs = [];

      for (const tlfq of tlfqs) {
        const resp = await Response.findOne({ student_id: userId, tlfq_id: tlfq._id }).lean();
        const faculty = await Faculty.findById(tlfq.faculty_id).lean();
        const entry = {
          ...tlfq,
          id: tlfq._id.toString(),
          faculty_name: faculty ? faculty.name : 'Unknown',
          completed: !!resp
        };
        if (resp) completedTlfqs.push(entry);
        else pendingTlfqs.push(entry);
      }

      courseData.push({
        ...course,
        id: course._id.toString(),
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

// ── POST /api/tlfq/courses  [super_admin only]
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

// ── DELETE /api/tlfq/courses/:id  [super_admin only]
export const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/faculty
export const getAllFaculty = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const query = role === 'hod' ? { department_id } : {};
    const facultyList = await Faculty.find(query).lean();
    const result = [];
    for (const f of facultyList) {
      const dept = await Department.findById(f.department_id).lean();
      result.push({ ...f, id: f._id.toString(), department_name: dept ? dept.name : 'Unknown' });
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq/faculty  [super_admin only]
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

// ── DELETE /api/tlfq/faculty/:id  [super_admin only]
export const deleteFaculty = async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Faculty deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/courses/:courseId/evaluations
export const getCourseEvaluations = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tlfqs = await Tlfq.find({ course_id: courseId }).lean();
    const evaluations = [];
    for (const tlfq of tlfqs) {
      const faculty = await Faculty.findById(tlfq.faculty_id).lean();
      const resp = req.user.role === 'student'
        ? await Response.findOne({ student_id: req.user.id, tlfq_id: tlfq._id }).lean()
        : null;
      evaluations.push({
        ...tlfq,
        id: tlfq._id.toString(),
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
    const tlfq = await Tlfq.findById(tlfqId).lean();
    if (!tlfq) return res.status(404).json({ message: 'Evaluation not found.' });

    const faculty   = await Faculty.findById(tlfq.faculty_id).lean();
    const course    = await Course.findById(tlfq.course_id).lean();
    const questions = await Question.find({ tlfq_id: tlfq._id }).lean();

    return res.status(200).json({
      ...tlfq,
      id: tlfq._id.toString(),
      faculty_name: faculty ? faculty.name : 'Unknown',
      course_name:  course  ? course.name  : 'Unknown',
      questions: questions.map(q => ({ ...q, id: q._id.toString() }))
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq  [super_admin + admin]
export const createTlfq = async (req, res) => {
  try {
    const { course_id, faculty_id, title, question_texts, semester, section, closing_time } = req.body;
    if (!course_id || !faculty_id || !title || !closing_time) {
      return res.status(400).json({ message: 'course_id, faculty_id, title, closing_time required' });
    }
    const result = await Tlfq.create({ 
      course_id, 
      faculty_id, 
      title, 
      is_active: true,
      semester: semester || 1,
      section: section || 'A',
      closing_time: new Date(closing_time)
    });
    if (question_texts && Array.isArray(question_texts)) {
      for (const qText of question_texts) {
        if (qText) await Question.create({ tlfq_id: result._id, question_text: qText });
      }
    }
    return res.status(201).json({ id: result.id || result._id?.toString(), message: 'TLFQ created successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/students  [admin + super_admin — includes student_id but NOT name mapping]
export const getStudents = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const query = { role: 'student' };
    // HOD/admin only see their department
    if (role === 'hod' || role === 'admin') query.department_id = department_id;

    const students = await User.find(query).lean();
    return res.status(200).json(students.map(s => ({
      id: s._id.toString(),
      name: role === 'super_admin' ? s.name : '— Anonymous —',
      email: role === 'super_admin' ? s.email : '—',
      student_id: s.student_id,
      unique_feedback_id: s.unique_feedback_id,
      department_id: s.department_id?.toString() || null,
      points: s.points,
      batch: s.batch,
    })));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq/enrollments  [super_admin + admin]
export const createEnrollment = async (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) return res.status(400).json({ message: 'student_id and course_id required' });
    const existing = await Enrollment.findOne({ student_id, course_id }).lean();
    if (existing) return res.status(400).json({ message: 'Already enrolled' });
    const result = await Enrollment.create({ student_id, course_id });
    return res.status(201).json(serialize(result));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/stats  [admin + super_admin]
export const getAdminStats = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const deptFilter = (role === 'hod') ? { department_id } : {};

    const totalStudents   = await User.countDocuments({ role: 'student', ...deptFilter });
    const totalFaculty    = await Faculty.countDocuments(deptFilter);
    const totalCourses    = await Course.countDocuments(deptFilter);
    const totalDepts      = await Department.countDocuments();
    const totalTlfqs      = await Tlfq.countDocuments();
    const totalResponses  = await Response.countDocuments();
    const totalEnrollments= await Enrollment.countDocuments();
    const completionRate  = totalEnrollments > 0
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

// ── GET /api/tlfq/leaderboard  [student + hod + super_admin]
export const getLeaderboard = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const query = { role: 'student', points: { $gt: 0 } };
    if (role === 'hod') query.department_id = department_id;

    const students = await User.find(query).sort({ points: -1 }).limit(50).lean();

    return res.status(200).json(students.map((s, idx) => ({
      rank: idx + 1,
      unique_feedback_id: s.unique_feedback_id || 'ANO-?????',
      points: s.points,
      batch: s.batch,
      department_id: s.department_id?.toString() || null,
      // Super admin can see real name; everyone else sees anonymous
      name: role === 'super_admin' ? s.name : null,
      student_id: role === 'super_admin' ? s.student_id : null,
    })));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
