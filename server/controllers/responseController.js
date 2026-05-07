import { Faculty, Tlfq, Question, Response, Answer, Course, Enrollment, Department, User } from '../db.js';

function serialize(doc) {
  if (!doc) return doc;
  if (typeof doc.toJSON === 'function') {
    try { return doc.toJSON(); } catch (e) { return { ...doc }; }
  }
  return { ...doc };
}

// ── POST /api/responses/submit  [student only]
export const submitResponse = async (req, res) => {
  try {
    const { tlfqId, answers, comment } = req.body;
    const student_id = req.user.id;

    if (!tlfqId || !answers) {
      return res.status(400).json({ message: 'tlfqId and answers are required' });
    }

    const existing = await Response.findOne({ student_id, tlfq_id: tlfqId });
    if (existing) {
      return res.status(400).json({ message: 'Evaluation already submitted. Edits are not allowed.' });
    }

    const resp = await Response.create({
      student_id,
      tlfq_id: tlfqId,
      submitted_at: new Date().toISOString(),
      comment: comment || ''
    });

    for (const [question_id, rating] of Object.entries(answers)) {
      await Answer.create({
        response_id: resp._id,
        question_id,
        rating: parseInt(rating)
      });
    }

    return res.status(201).json({ message: 'Evaluation submitted successfully. Thank you!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/responses/analytics  [admin + hod]
//    HOD sees only their department's data
export const getAnalytics = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const isHod = role === 'hod';

    // ── 1. Faculty avg ratings
    const facultyQuery = isHod ? { department_id } : {};
    const facultyList = await Faculty.find(facultyQuery);
    const avgRatingPerFaculty = [];

    for (const f of facultyList || []) {
      const tlfqs = await Tlfq.find({ faculty_id: f._id });
      const tlfqIds = (tlfqs || []).map(t => t._id);
      const responses = await Response.find({ tlfq_id: { $in: tlfqIds } });
      const responseIds = (responses || []).map(r => r._id);
      const answers = await Answer.find({ response_id: { $in: responseIds } });
      const sum = (answers || []).reduce((acc, cur) => acc + cur.rating, 0);
      const count = (answers || []).length;
      const dept = await Department.findById(f.department_id);

      avgRatingPerFaculty.push({
        id: f.id,
        name: f.name,
        department_name: dept ? dept.name : 'Unknown',
        avg_rating: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0,
        total_responses: (responses || []).length
      });
    }
    avgRatingPerFaculty.sort((a, b) => b.avg_rating - a.avg_rating);

    // ── 2. Course submission rates
    const courseQuery = isHod ? { department_id } : {};
    const courses = await Course.find(courseQuery);
    const submissionRates = [];

    for (const course of courses || []) {
      const enrolledCount = await Enrollment.countDocuments({ course_id: course._id });
      const tlfqs = await Tlfq.find({ course_id: course._id });
      let submittedCount = 0;
      for (const tlfq of tlfqs || []) {
        submittedCount += await Response.countDocuments({ tlfq_id: tlfq._id });
      }
      const rate = enrolledCount > 0 ? (submittedCount / enrolledCount) * 100 : 0;
      const dept = await Department.findById(course.department_id);

      submissionRates.push({
        course_id: course.id,
        course_name: course.name,
        course_code: course.code,
        department_name: dept ? dept.name : 'Unknown',
        enrolled: enrolledCount,
        submitted: submittedCount,
        rate: Math.min(100, Math.round(rate))
      });
    }

    // ── 3. Department-level overview
    const deptQuery = isHod ? { _id: department_id } : {};
    const departments = await Department.find(deptQuery);
    const deptOverview = [];

    for (const dept of departments || []) {
      const deptCourses = await Course.find({ department_id: dept._id });
      const deptFaculty = await Faculty.find({ department_id: dept._id });
      const deptStudents = await User.find({ role: 'student', department_id: dept._id });

      let totalRatings = 0, ratingCount = 0;
      for (const c of deptCourses || []) {
        const tlfqs = await Tlfq.find({ course_id: c._id });
        for (const t of tlfqs || []) {
          const responses = await Response.find({ tlfq_id: t._id });
          const responseIds = (responses || []).map(r => r._id);
          const answers = await Answer.find({ response_id: { $in: responseIds } });
          totalRatings += (answers || []).reduce((a, c) => a + c.rating, 0);
          ratingCount += (answers || []).length;
        }
      }

      deptOverview.push({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        course_count: (deptCourses || []).length,
        faculty_count: (deptFaculty || []).length,
        student_count: (deptStudents || []).length,
        avg_rating: ratingCount > 0 ? parseFloat((totalRatings / ratingCount).toFixed(2)) : 0
      });
    }

    // ── 4. Recent anonymous comments (HOD/Admin)
    const recentComments = [];
    const responses = await Response.find().sort({ submitted_at: -1 });
    for (const r of (responses || []).slice(0, 20)) {
      const tlfq = await Tlfq.findById(r.tlfq_id);
      if (!tlfq) continue;
      if (isHod) {
        const course = await Course.findById(tlfq.course_id);
        if (!course || course.department_id?.toString() !== department_id?.toString()) continue;
      }
      const faculty = await Faculty.findById(tlfq.faculty_id);
      const course = await Course.findById(tlfq.course_id);
      if (r.comment && r.comment.trim()) {
        recentComments.push({
          comment: r.comment,
          faculty_name: faculty ? faculty.name : 'Unknown',
          course_name: course ? course.name : 'Unknown',
          submitted_at: r.submitted_at
        });
      }
    }

    return res.status(200).json({
      avgRatingPerFaculty,
      submissionRates,
      deptOverview,
      recentComments
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
