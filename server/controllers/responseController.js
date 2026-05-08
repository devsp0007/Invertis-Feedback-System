import { Department, Section, SectionFaculty, Course, Faculty, Tlfq, Question, Response, Answer, User, Enrollment } from '../db.js';

// ── Student: GET courses + TLFQs for their section ─────────────────────────
export const getStudentCourses = async (req, res) => {
  try {
    const { id: userId, department_id } = req.user;
    const student = await User.findById(userId).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const dept = await Department.findById(department_id).lean();
    if (dept && !dept.portal_open) {
      return res.status(200).json({ portal_closed: true, message: 'The feedback portal is currently closed by your HOD.' });
    }

    const now = new Date();
    const section_id = student.section_id;
    if (!section_id) return res.json([]);

    // Get all active, non-expired TLFQs for this section
    const tlfqs = await Tlfq.find({
      section_id,
      is_active: true,
      closing_time: { $gt: now }
    }).lean();

    // Group by course
    const courseMap = {};
    for (const tlfq of tlfqs) {
      const courseId = tlfq.course_id.toString();
      if (!courseMap[courseId]) {
        const course = await Course.findById(tlfq.course_id).lean();
        courseMap[courseId] = { ...course, id: courseId, tlfqs: [], pending_count: 0, completed_count: 0 };
      }
      const faculty = await Faculty.findById(tlfq.faculty_id).lean();
      const resp = await Response.findOne({ student_id: userId, tlfq_id: tlfq._id }).lean();
      const entry = {
        ...tlfq, id: tlfq._id.toString(),
        faculty_name: faculty?.name || 'Unknown',
        completed: !!resp,
        closing_time: tlfq.closing_time
      };
      courseMap[courseId].tlfqs.push(entry);
      if (resp) courseMap[courseId].completed_count++;
      else courseMap[courseId].pending_count++;
    }
    return res.json(Object.values(courseMap));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET specific evaluation form ───────────────────────────────────────────
export const getEvaluation = async (req, res) => {
  try {
    const tlfq = await Tlfq.findById(req.params.tlfqId).lean();
    if (!tlfq) return res.status(404).json({ message: 'Form not found.' });
    if (!tlfq.is_active || new Date(tlfq.closing_time) < new Date()) {
      return res.status(403).json({ message: 'This evaluation is closed or expired.' });
    }
    const faculty   = await Faculty.findById(tlfq.faculty_id).lean();
    const course    = await Course.findById(tlfq.course_id).lean();
    const section   = await Section.findById(tlfq.section_id).lean();
    const questions = await Question.find({ tlfq_id: tlfq._id }).lean();
    return res.json({
      ...tlfq, id: tlfq._id.toString(),
      faculty_name: faculty?.name || 'Unknown',
      course_name:  course?.name  || 'Unknown',
      course_code:  course?.code  || '',
      section_name: section?.name || '',
      questions: questions.map(q => ({ ...q, id: q._id.toString() }))
    });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── POST /api/student/submit ────────────────────────────────────────────────
export const submitResponse = async (req, res) => {
  try {
    const { id: student_id, department_id } = req.user;
    const { tlfq_id, answers, comment } = req.body;

    const dept = await Department.findById(department_id).lean();
    if (dept && !dept.portal_open) {
      return res.status(403).json({ message: 'The feedback portal is currently closed.' });
    }

    const tlfq = await Tlfq.findById(tlfq_id).lean();
    if (!tlfq || !tlfq.is_active || new Date(tlfq.closing_time) < new Date()) {
      return res.status(403).json({ message: 'This evaluation form is closed or expired.' });
    }

    const existing = await Response.findOne({ student_id, tlfq_id }).lean();
    if (existing) return res.status(400).json({ message: 'Evaluation already submitted.' });

    const resp = await Response.create({ student_id, tlfq_id, submitted_at: new Date().toISOString(), comment: comment || '' });
    if (answers && Array.isArray(answers)) {
      for (const { question_id, rating } of answers) {
        await Answer.create({ response_id: resp._id, question_id, rating: Number(rating) });
      }
    }
    await User.findByIdAndUpdate(student_id, { $inc: { points: 10 } });
    return res.status(201).json({ message: 'Feedback submitted successfully. +10 points!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── Analytics (super_admin) ─────────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    const { department_id } = req.query;
    const deptFilter = department_id ? { department_id } : {};

    // Fetch all depts for overview
    const allDepts = await Department.find().lean();

    // Responses and answers
    const allResponses = await Response.find().lean();
    const responseIds  = allResponses.map(r => r._id);
    const allAnswers   = await Answer.find({ response_id: { $in: responseIds } }).lean();

    // Build avg rating per faculty (filtered by dept if selected)
    const facultyFilter = department_id ? { department_id } : {};
    const allFaculty    = await Faculty.find(facultyFilter).lean();
    const allTlfqs      = await Tlfq.find().lean();

    const facultyMap = {};
    for (const f of allFaculty) {
      facultyMap[f._id.toString()] = { id: f._id.toString(), name: f.name, department_id: f.department_id.toString(), total_responses: 0, total_rating: 0 };
    }

    for (const tlfq of allTlfqs) {
      const fId = tlfq.faculty_id.toString();
      if (!facultyMap[fId]) continue;
      const tlfqResponses = allResponses.filter(r => r.tlfq_id.toString() === tlfq._id.toString());
      for (const resp of tlfqResponses) {
        const respAnswers = allAnswers.filter(a => a.response_id.toString() === resp._id.toString());
        if (respAnswers.length > 0) {
          const avg = respAnswers.reduce((s, a) => s + a.rating, 0) / respAnswers.length;
          facultyMap[fId].total_rating += avg;
          facultyMap[fId].total_responses++;
        }
      }
    }

    const avgRatingPerFaculty = Object.values(facultyMap)
      .filter(f => f.total_responses > 0)
      .map(f => ({ ...f, avg_rating: parseFloat((f.total_rating / f.total_responses).toFixed(2)) }))
      .sort((a, b) => b.avg_rating - a.avg_rating);

    // Recent comments (filtered by dept)
    const filteredTlfqIds = allTlfqs
      .filter(t => !department_id || allFaculty.some(f => f._id.toString() === t.faculty_id.toString()))
      .map(t => t._id.toString());
    const recentResponses = allResponses.filter(r => r.comment && filteredTlfqIds.includes(r.tlfq_id.toString())).slice(-20);
    const recentComments  = await Promise.all(recentResponses.map(async r => {
      const tlfq    = allTlfqs.find(t => t._id.toString() === r.tlfq_id.toString());
      const faculty  = tlfq ? allFaculty.find(f => f._id.toString() === tlfq.faculty_id.toString()) : null;
      const course   = tlfq ? await Course.findById(tlfq.course_id).lean() : null;
      const section  = tlfq ? await Section.findById(tlfq.section_id).lean() : null;
      const deptObj  = faculty ? allDepts.find(d => d._id.toString() === faculty.department_id.toString()) : null;
      return {
        comment: r.comment, submitted_at: r.submitted_at,
        faculty_name: faculty?.name, course_name: course?.name,
        section_name: section?.name,
        department_id: deptObj?._id?.toString()
      };
    }));

    const deptOverview = allDepts.map(d => ({
      id: d._id.toString(), name: d.name, code: d.code, portal_open: d.portal_open
    }));

    return res.json({ avgRatingPerFaculty, recentComments, deptOverview });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── Leaderboard ─────────────────────────────────────────────────────────────
export const getLeaderboard = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const query = { role: 'student', points: { $gt: 0 } };
    if (role === 'hod') query.department_id = department_id;
    const students = await User.find(query).sort({ points: -1 }).limit(50).lean();
    return res.json(students.map((s, i) => ({
      rank: i + 1,
      unique_feedback_id: s.unique_feedback_id || 'ANO-?????',
      points: s.points, batch: s.batch,
      name: role === 'super_admin' ? s.name : null,
      student_id: role === 'super_admin' ? s.student_id : null,
    })));
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};
