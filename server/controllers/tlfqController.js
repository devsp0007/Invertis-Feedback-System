import { Department, Course, Faculty, Enrollment, Tlfq, Question, Response, User } from '../db.js';

// ── GET /api/tlfq/departments
export const getDepartments = async (req, res) => {
  try {
    const depts = await Department.findMany();
    return res.status(200).json(depts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq/departments  [super_admin only]
export const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code are required' });
    const result = await Department.create({ data: { name, code } });
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── DELETE /api/tlfq/departments/:id  [super_admin only]
export const deleteDepartment = async (req, res) => {
  try {
    await Department.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: 'Department deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── PUT /api/tlfq/departments/:id/portal  [hod + super_admin + admin]
export const togglePortal = async (req, res) => {
  try {
    const { open } = req.body;
    const { role, department_id } = req.user;

    if (role === 'hod' && req.params.id !== department_id) {
      return res.status(403).json({ message: 'You can only manage your own department portal' });
    }

    const dept = await Department.update({
      where: { id: req.params.id },
      data: { portal_open: !!open }
    });
    
    return res.status(200).json({ portal_open: dept.portal_open, message: `Portal ${dept.portal_open ? 'opened' : 'closed'} successfully` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/courses
export const getCourses = async (req, res) => {
  try {
    const { role, id: userId, department_id } = req.user;

    if (role === 'super_admin' || role === 'admin' || role === 'coordinator') {
      const courses = await Course.findMany({
        include: { department: true }
      });
      return res.status(200).json(courses.map(c => ({
        ...c,
        department_name: c.department ? c.department.name : 'Unknown'
      })));
    }

    if (role === 'hod') {
      const courses = await Course.findMany({
        where: { department_id },
        include: { department: true }
      });
      return res.status(200).json(courses.map(c => ({
        ...c,
        department_name: c.department ? c.department.name : 'Unknown'
      })));
    }

    // Student
    const student = await User.findUnique({ where: { id: userId } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const dept = await Department.findUnique({ where: { id: student.department_id } });
    if (dept && !dept.portal_open) {
      return res.status(200).json({ portal_closed: true, message: 'The feedback portal is currently closed by your HOD.' });
    }

    const enrollments = await Enrollment.findMany({ 
      where: { student_id: userId },
      include: { 
        course: {
          include: {
            tlfqs: {
              where: {
                is_active: true,
                closing_time: { gt: new Date() },
                section_id: student.section_id // Filter by student's section
              },
              include: {
                faculty: true,
                responses: {
                  where: { student_id: userId }
                }
              }
            }
          }
        }
      }
    });

    const courseData = enrollments.map(e => {
      const course = e.course;
      const tlfqs = course.tlfqs.map(t => ({
        ...t,
        faculty_name: t.faculty ? t.faculty.name : 'Unknown',
        completed: t.responses.length > 0
      }));

      const pending = tlfqs.filter(t => !t.completed);
      const completed = tlfqs.filter(t => t.completed);

      return {
        ...course,
        tlfqs: [...pending, ...completed],
        pending_count: pending.length,
        completed_count: completed.length
      };
    });

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
    const result = await Course.create({ data: { name, code, department_id } });
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── DELETE /api/tlfq/courses/:id  [super_admin only]
export const deleteCourse = async (req, res) => {
  try {
    await Course.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/faculty
export const getAllFaculty = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const where = (role === 'hod') ? { department_id } : {};
    const facultyList = await Faculty.findMany({
      where,
      include: { department: true }
    });
    return res.status(200).json(facultyList.map(f => ({
      ...f,
      department_name: f.department ? f.department.name : 'Unknown'
    })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq/faculty  [super_admin only]
export const createFaculty = async (req, res) => {
  try {
    const { name, department_id, teacher_type } = req.body;
    if (!name || !department_id) return res.status(400).json({ message: 'name and department_id required' });
    const result = await Faculty.create({ 
      data: { name, department_id, teacher_type: teacher_type || 'college_faculty' } 
    });
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── DELETE /api/tlfq/faculty/:id  [super_admin only]
export const deleteFaculty = async (req, res) => {
  try {
    await Faculty.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: 'Faculty deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/courses/:courseId/evaluations
export const getCourseEvaluations = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tlfqs = await Tlfq.findMany({
      where: { course_id: courseId },
      include: {
        faculty: true,
        responses: req.user.role === 'student' ? { where: { student_id: req.user.id } } : false
      }
    });

    const evaluations = tlfqs.map(t => ({
      ...t,
      faculty_name: t.faculty ? t.faculty.name : 'Unknown',
      completed: req.user.role === 'student' ? t.responses.length > 0 : undefined
    }));

    return res.status(200).json(evaluations);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/courses/:courseId/evaluation/:tlfqId
export const getSpecificEvaluation = async (req, res) => {
  try {
    const { tlfqId } = req.params;
    const tlfq = await Tlfq.findUnique({
      where: { id: tlfqId },
      include: {
        faculty: true,
        course: true,
        questions: true
      }
    });

    if (!tlfq) return res.status(404).json({ message: 'Evaluation not found.' });

    return res.status(200).json({
      ...tlfq,
      faculty_name: tlfq.faculty ? tlfq.faculty.name : 'Unknown',
      course_name:  tlfq.course  ? tlfq.course.name  : 'Unknown',
      questions: tlfq.questions
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq  [hod + admin + super_admin]
export const createTlfq = async (req, res) => {
  try {
    const { course_id, faculty_id, title, question_texts, section_id, closing_time } = req.body;
    if (!course_id || !faculty_id || !title || !closing_time || !section_id) {
      return res.status(400).json({ message: 'course_id, faculty_id, section_id, title, closing_time required' });
    }

    const tlfq = await Tlfq.create({
      data: {
        course_id,
        faculty_id,
        section_id,
        title,
        is_active: true,
        closing_time: new Date(closing_time),
        created_by: req.user.id
      }
    });

    if (question_texts && Array.isArray(question_texts)) {
      const qData = question_texts
        .filter(text => !!text)
        .map(text => ({ tlfq_id: tlfq.id, question_text: text }));
      
      if (qData.length > 0) {
        await Question.createMany({ data: qData });
      }
    }

    return res.status(201).json({ id: tlfq.id, message: 'TLFQ created successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/students  [admin + super_admin]
export const getStudents = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const where = { role: 'student' };
    if (role === 'hod' || role === 'admin') where.department_id = department_id;

    const students = await User.findMany({ where });
    
    return res.status(200).json(students.map(s => ({
      id: s.id,
      name: (role === 'super_admin' || role === 'coordinator') ? s.name : '— Anonymous —',
      email: (role === 'super_admin' || role === 'coordinator') ? s.email : '—',
      student_id: s.student_id,
      unique_feedback_id: s.unique_feedback_id,
      department_id: s.department_id,
      points: s.points,
      batch: s.batch,
    })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/tlfq/enrollments  [super_admin + admin]
export const createEnrollment = async (req, res) => {
  try {
    const { student_id, course_id, section_id } = req.body;
    if (!student_id || !course_id || !section_id) return res.status(400).json({ message: 'student_id, course_id and section_id required' });
    
    const existing = await Enrollment.findFirst({
      where: { student_id, course_id }
    });
    if (existing) return res.status(400).json({ message: 'Already enrolled' });
    
    const result = await Enrollment.create({ 
      data: { student_id, course_id, section_id } 
    });
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/stats  [admin + super_admin]
export const getAdminStats = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    const deptFilter = (role === 'hod') ? { department_id } : {};

    const totalStudents    = await User.count({ where: { role: 'student', ...deptFilter } });
    const totalFaculty     = await Faculty.count({ where: deptFilter });
    const totalCourses     = await Course.count({ where: deptFilter });
    const totalDepts       = await Department.count();
    const totalTlfqs       = await Tlfq.count();
    const totalResponses   = await Response.count();
    const totalEnrollments = await Enrollment.count();
    
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
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/tlfq/leaderboard  [student + hod + super_admin]
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

    return res.status(200).json(students.map((s, idx) => ({
      rank: idx + 1,
      unique_feedback_id: s.unique_feedback_id || 'ANO-?????',
      points: s.points,
      batch: s.batch,
      department_id: s.department_id,
      name: (role === 'super_admin' || role === 'coordinator') ? s.name : null,
      student_id: (role === 'super_admin' || role === 'coordinator') ? s.student_id : null,
    })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
