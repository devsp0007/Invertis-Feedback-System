import { Department, Section, Course, Faculty, Tlfq, Question, Response, Answer, User, Enrollment, REWARD_POINTS } from '../db.js';

// ── Student: GET courses + TLFQs for their section ─────────────────────────
export const getStudentCourses = async (req, res) => {
  try {
    const { id: userId, department_id } = req.user;
    const student = await User.findUnique({ where: { id: userId } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const dept = await Department.findUnique({ where: { id: department_id } });
    if (dept && !dept.portal_open) {
      return res.status(200).json({ portal_closed: true, message: 'The feedback portal is currently closed by your HOD.' });
    }

    const section_id = student.section_id;
    if (!section_id) return res.json([]);

    const tlfqs = await Tlfq.findMany({
      where: {
        section_id,
        is_active: true,
        closing_time: { gt: new Date() }
      },
      include: {
        course: true,
        faculty: true,
        responses: {
          where: { student_id: userId }
        }
      }
    });

    const courseMap = {};
    for (const tlfq of tlfqs) {
      const courseId = tlfq.course_id;
      if (!courseMap[courseId]) {
        courseMap[courseId] = { 
          ...tlfq.course, 
          tlfqs: [], 
          pending_count: 0, 
          completed_count: 0 
        };
      }
      
      const isCompleted = tlfq.responses.length > 0;
      const entry = {
        ...tlfq,
        faculty_name: tlfq.faculty ? tlfq.faculty.name : 'Unknown',
        completed: isCompleted
      };
      
      courseMap[courseId].tlfqs.push(entry);
      if (isCompleted) courseMap[courseId].completed_count++;
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
    const tlfq = await Tlfq.findUnique({
      where: { id: req.params.tlfqId },
      include: {
        faculty: true,
        course: true,
        section: true,
        questions: true
      }
    });

    if (!tlfq) return res.status(404).json({ message: 'Form not found.' });
    if (!tlfq.is_active || tlfq.closing_time < new Date()) {
      return res.status(403).json({ message: 'This evaluation is closed or expired.' });
    }

    return res.json({
      ...tlfq,
      faculty_name: tlfq.faculty?.name || 'Unknown',
      course_name:  tlfq.course?.name  || 'Unknown',
      course_code:  tlfq.course?.code  || '',
      section_name: tlfq.section?.name || '',
      questions: tlfq.questions
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/student/submit ────────────────────────────────────────────────
export const submitResponse = async (req, res) => {
  try {
    const { id: student_id, department_id } = req.user;
    const { tlfq_id, answers, comment } = req.body;

    const dept = await Department.findUnique({ where: { id: department_id } });
    if (dept && !dept.portal_open) {
      return res.status(403).json({ message: 'The feedback portal is currently closed.' });
    }

    const tlfq = await Tlfq.findUnique({ where: { id: tlfq_id } });
    if (!tlfq || !tlfq.is_active || tlfq.closing_time < new Date()) {
      return res.status(403).json({ message: 'This evaluation form is closed or expired.' });
    }

    const existing = await Response.findFirst({
      where: { student_id, tlfq_id }
    });
    if (existing) return res.status(400).json({ message: 'Evaluation already submitted.' });

    const resp = await Response.create({
      data: {
        student_id,
        tlfq_id,
        submitted_at: new Date().toISOString(),
        comment: comment || '',
        answers: {
          create: answers.map(a => ({
            question_id: a.question_id,
            rating: Number(a.rating)
          }))
        }
      }
    });

    await User.update({
      where: { id: student_id },
      data: { points: { increment: REWARD_POINTS } }
    });

    return res.status(201).json({ message: `Feedback submitted successfully. +${REWARD_POINTS} points!` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── Analytics (super_admin) ─────────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    const { department_id } = req.query;

    const allDepts = await Department.findMany({
      include: {
        courses: {
          include: {
            enrollments: true,
            tlfqs: {
              include: { responses: true }
            }
          }
        }
      }
    });
    
    // 1. Submission Rates (Course-wise)
    const submissionRates = [];
    allDepts.forEach(dept => {
      // If dept filter is active, we only calculate for that dept
      if (department_id && dept.id !== department_id) return;
      
      dept.courses.forEach(course => {
        const enrolled = course.enrollments.length;
        // Count unique students who submitted feedback for any TLFQ of this course
        const submittedSet = new Set();
        course.tlfqs.forEach(tlfq => {
          tlfq.responses.forEach(r => submittedSet.add(r.student_id));
        });
        const submitted = submittedSet.size;
        const rate = enrolled > 0 ? Math.round((submitted / enrolled) * 100) : 0;
        
        submissionRates.push({
          course_id: course.id,
          course_name: course.name,
          course_code: course.code,
          department_id: dept.id,
          enrolled,
          submitted,
          rate
        });
      });
    });

    // 2. Faculty Rankings & Attribute Analysis
    const facultyList = await Faculty.findMany({
      where: department_id ? { department_id } : {},
      include: {
        department: true,
        tlfqs: {
          include: {
            responses: {
              include: {
                answers: { include: { question: true } }
              }
            }
          }
        }
      }
    });

    const attributeMap = {}; // To store ratings per question text

    const avgRatingPerFaculty = facultyList.map(f => {
      let totalRating = 0;
      let totalResponses = 0;

      f.tlfqs.forEach(tlfq => {
        tlfq.responses.forEach(resp => {
          if (resp.answers.length > 0) {
            const avg = resp.answers.reduce((s, a) => s + a.rating, 0) / resp.answers.length;
            totalRating += avg;
            totalResponses++;

            // Track question-wise scores for radar chart
            resp.answers.forEach(ans => {
              const qText = ans.question.question_text;
              if (!attributeMap[qText]) attributeMap[qText] = { sum: 0, count: 0 };
              attributeMap[qText].sum += ans.rating;
              attributeMap[qText].count++;
            });
          }
        });
      });

      return {
        id: f.id,
        name: f.name,
        department_id: f.department_id,
        teacher_type: f.teacher_type,
        total_responses: totalResponses,
        avg_rating: totalResponses > 0 ? parseFloat((totalRating / totalResponses).toFixed(2)) : 0
      };
    }).filter(f => f.total_responses > 0)
      .sort((a, b) => b.avg_rating - a.avg_rating);

    // Format attributes for Radar Chart
    const attributeAnalytics = Object.keys(attributeMap).map(key => ({
      attribute: key.length > 20 ? key.substring(0, 17) + '...' : key,
      score: parseFloat((attributeMap[key].sum / attributeMap[key].count).toFixed(2)),
      full_text: key
    }));

    // 3. Department Overview & Performance
    const deptOverview = allDepts.map(d => {
      const deptFaculty = avgRatingPerFaculty.filter(f => f.department_id === d.id);
      const avgDeptRating = deptFaculty.length > 0 
        ? parseFloat((deptFaculty.reduce((s, f) => s + f.avg_rating, 0) / deptFaculty.length).toFixed(2))
        : 0;

      return {
        id: d.id, 
        name: d.name, 
        code: d.code, 
        portal_open: d.portal_open,
        avg_rating: avgDeptRating,
        faculty_count: deptFaculty.length
      };
    });

    // 4. Timeline Trends (Responses per day)
    const allResponses = await Response.findMany({
      where: department_id ? { tlfq: { faculty: { department_id } } } : {},
      select: { submitted_at: true }
    });

    const trendMap = {};
    allResponses.forEach(r => {
      try {
        const date = new Date(r.submitted_at).toISOString().split('T')[0];
        trendMap[date] = (trendMap[date] || 0) + 1;
      } catch (e) {
        // Skip malformed dates if any
      }
    });

    const timelineData = Object.keys(trendMap).map(date => ({
      date,
      count: trendMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // 5. Recent comments
    const recentResponses = await Response.findMany({
      where: {
        comment: { not: "" },
        tlfq: {
          faculty: department_id ? { department_id } : {}
        }
      },
      include: {
        tlfq: {
          include: {
            faculty: { include: { department: true } },
            course: true,
            section: true
          }
        }
      },
      orderBy: { id: 'desc' },
      take: 20
    });

    const recentComments = recentResponses.map(r => ({
      comment: r.comment,
      submitted_at: r.submitted_at,
      faculty_name: r.tlfq.faculty?.name,
      course_name: r.tlfq.course?.name,
      section_name: r.tlfq.section?.name,
      department_id: r.tlfq.faculty?.department_id
    }));

    return res.json({ 
      avgRatingPerFaculty, 
      submissionRates, 
      recentComments, 
      deptOverview,
      attributeAnalytics,
      timelineData
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── Leaderboard ─────────────────────────────────────────────────────────────
export const getLeaderboard = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const where = { role: 'student', points: { gt: 0 } };
    if (role === 'hod') where.department_id = department_id;

    const students = await User.findMany({
      where,
      orderBy: { points: 'desc' },
      take: 50
    });

    return res.json(students.map((s, i) => ({
      rank: i + 1,
      unique_feedback_id: s.unique_feedback_id || 'ANO-?????',
      points: s.points,
      batch: s.batch,
    })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
