import { Course, Faculty, Enrollment, Tlfq, Question, Response, Answer, User } from '../db.js';

export const submitResponse = async (req, res) => {
  try {
    const { tlfqId, answers, comment } = req.body;
    const student_id = req.user.id;

    if (!tlfqId || !answers) {
      return res.status(400).json({ message: 'tlfqId and answers are required' });
    }

    const existing = await Response.findOne({ student_id, tlfq_id: tlfqId });
    if (existing) {
      return res.status(400).json({ message: 'Evaluation already submitted' });
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

    return res.status(201).json({ message: 'Evaluation submitted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    // 1. Avg rating per faculty
    const avgRatingPerFaculty = [];
    const facultyList = await Faculty.find();
    for (const f of facultyList) {
      const tlfqs = await Tlfq.find({ faculty_id: f._id });
      const tlfqIds = tlfqs.map(t => t._id);

      const responses = await Response.find({ tlfq_id: { $in: tlfqIds } });
      const responseIds = responses.map(r => r._id);

      const answers = await Answer.find({ response_id: { $in: responseIds } });
      const sum = answers.reduce((acc, cur) => acc + cur.rating, 0);
      const count = answers.length;
      const avg_rating = count > 0 ? (sum / count) : 0;

      avgRatingPerFaculty.push({
        id: f.id,
        name: f.name,
        avg_rating: parseFloat(avg_rating.toFixed(2))
      });
    }

    // 2. Submission % per course
    const submissionRates = [];
    const courses = await Course.find();
    for (const course of courses) {
      const enrolledCount = await Enrollment.countDocuments({ course_id: course._id });
      
      const tlfq = await Tlfq.findOne({ course_id: course._id });
      let submittedCount = 0;
      if (tlfq) {
        submittedCount = await Response.countDocuments({ tlfq_id: tlfq._id });
      }

      const rate = enrolledCount > 0 ? (submittedCount / enrolledCount) * 100 : 0;

      submissionRates.push({
        course_id: course.id,
        course_name: course.name,
        course_code: course.code,
        enrolled: enrolledCount,
        submitted: submittedCount,
        rate: Math.round(rate)
      });
    }

    // 3. Overall question average ratings
    const questionAnalytics = [];
    const questions = await Question.find();
    for (const q of questions) {
      const answers = await Answer.find({ question_id: q._id });
      const sum = answers.reduce((acc, cur) => acc + cur.rating, 0);
      const count = answers.length;
      const avg_rating = count > 0 ? (sum / count) : 0;

      questionAnalytics.push({
        question_id: q.id,
        question_text: q.question_text,
        avg_rating: parseFloat(avg_rating.toFixed(2)),
        total_ratings: count
      });
    }

    // 4. Complete answers / all submissions
    const rawResponses = [];
    const responses = await Response.find().sort({ submitted_at: -1 });
    for (const r of responses) {
      const user = await User.findById(r.student_id);
      const tlfq = await Tlfq.findById(r.tlfq_id);
      rawResponses.push({
        response_id: r.id,
        student_name: user ? user.name : 'Unknown',
        evaluation_title: tlfq ? tlfq.title : 'Unknown',
        submitted_at: r.submitted_at,
        comment: r.comment
      });
    }

    return res.status(200).json({
      avgRatingPerFaculty,
      submissionRates,
      questionAnalytics,
      rawResponses
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
