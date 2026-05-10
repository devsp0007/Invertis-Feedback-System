import { Department, Section, Course, Faculty, SectionFaculty, User, Enrollment, Tlfq } from '../db.js';
import bcrypt from 'bcryptjs';

// ── Helper: get section with populated data ────────────────────────────────
async function populateSection(sec) {
  const dept = await Department.findById(sec.department_id).lean();
  const assignments = await SectionFaculty.find({ section_id: sec._id }).lean();
  const enriched = await Promise.all(assignments.map(async sf => {
    const faculty = await Faculty.findById(sf.faculty_id).lean();
    const course  = await Course.findById(sf.course_id).lean();
    return { id: sf._id.toString(), faculty_name: faculty?.name, course_name: course?.name, course_code: course?.code, faculty_id: sf.faculty_id.toString(), course_id: sf.course_id.toString() };
  }));
  return { ...sec, id: sec._id.toString(), department_name: dept?.name, assignments: enriched };
}

// ── Departments ────────────────────────────────────────────────────────────
export const getDepartments = async (req, res) => {
  try {
    const depts = await Department.find().lean();
    return res.json(depts.map(d => ({ ...d, id: d._id.toString() })));
  } catch (err) { console.error('getDepartments error:', err); return res.status(500).json({ message: 'Internal Server Error' }); }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'name and code required' });
    const dept = await Department.create({ name, code });
    return res.status(201).json({ ...dept.toJSON(), id: dept._id.toString() });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Department with that name/code already exists.' });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Department deleted' });
  } catch (err) { console.error('deleteDepartment error:', err); return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── Sections ───────────────────────────────────────────────────────────────
export const getSections = async (req, res) => {
  try {
    const { department_id } = req.query;
    const filter = department_id ? { department_id } : {};
    const sections = await Section.find(filter).lean();
    const result = await Promise.all(sections.map(populateSection));
    return res.json(result);
  } catch (err) { console.error('getSections error:', err); return res.status(500).json({ message: 'Internal Server Error' }); }
};

export const createSection = async (req, res) => {
  try {
    const { department_id, semester, label } = req.body;
    if (!department_id || !semester || !label) return res.status(400).json({ message: 'department_id, semester, label required' });
    const dept = await Department.findById(department_id).lean();
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    const name = `${dept.code}-${semester}${label.toUpperCase()}`;
    const code = `${dept.code}${semester}${label.toUpperCase()}`;
    const existing = await Section.findOne({ code });
    if (existing) return res.status(400).json({ message: 'Section already exists.' });
    const section = await Section.create({ name, code, semester: Number(semester), label: label.toUpperCase(), department_id });
    // Use findById+lean so populateSection receives a plain object with string IDs
    const created = await Section.findById(section._id).lean();
    return res.status(201).json({ ...(await populateSection(created)) });
  } catch (err) {
    console.error('createSection error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteSection = async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    await SectionFaculty.deleteMany({ section_id: req.params.id });
    return res.json({ message: 'Section deleted' });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── Courses ────────────────────────────────────────────────────────────────
export const getCourses = async (req, res) => {
  try {
    const { department_id } = req.query;
    const filter = department_id ? { department_id } : {};
    const courses = await Course.find(filter).lean();
    const result = await Promise.all(courses.map(async c => {
      const dept = await Department.findById(c.department_id).lean();
      return { ...c, id: c._id.toString(), department_name: dept?.name };
    }));
    return res.json(result);
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

export const createCourse = async (req, res) => {
  try {
    const { name, code, department_id } = req.body;
    if (!name || !code || !department_id) return res.status(400).json({ message: 'name, code, department_id required' });
    const course = await Course.create({ name, code, department_id });
    return res.status(201).json({ ...course.toJSON() });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Course code already exists.' });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    await SectionFaculty.deleteMany({ course_id: req.params.id });
    return res.json({ message: 'Course deleted' });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── Faculty ────────────────────────────────────────────────────────────────
export const getFaculty = async (req, res) => {
  try {
    const { department_id } = req.query;
    const filter = department_id ? { department_id } : {};
    const list = await Faculty.find(filter).lean();
    const result = await Promise.all(list.map(async f => {
      const dept = await Department.findById(f.department_id).lean();
      return { ...f, id: f._id.toString(), department_name: dept?.name };
    }));
    return res.json(result);
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

export const createFaculty = async (req, res) => {
  try {
    const { name, department_id, teacher_type } = req.body;
    if (!name || !department_id) return res.status(400).json({ message: 'name and department_id required' });
    const validTypes = ['college_faculty', 'trainer'];
    const type = validTypes.includes(teacher_type) ? teacher_type : 'college_faculty';
    const faculty = await Faculty.create({ name, department_id, teacher_type: type });
    return res.status(201).json({ ...faculty.toJSON() });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

export const deleteFaculty = async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    await SectionFaculty.deleteMany({ faculty_id: req.params.id });
    return res.json({ message: 'Faculty deleted' });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── Section-Faculty assignments ─────────────────────────────────────────────
export const assignFacultyToSection = async (req, res) => {
  try {
    const { section_id, faculty_id, course_id } = req.body;
    if (!section_id || !faculty_id || !course_id) return res.status(400).json({ message: 'section_id, faculty_id, course_id required' });
    const existing = await SectionFaculty.findOne({ section_id, faculty_id, course_id }).lean();
    if (existing) return res.status(400).json({ message: 'Assignment already exists.' });
    const sf = await SectionFaculty.create({ section_id, faculty_id, course_id });
    return res.status(201).json({ ...sf.toJSON() });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

export const removeAssignment = async (req, res) => {
  try {
    await SectionFaculty.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Assignment removed' });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── Students ───────────────────────────────────────────────────────────────
export const getStudents = async (req, res) => {
  try {
    const { department_id, section_id } = req.query;
    const filter = { role: 'student' };
    if (department_id) filter.department_id = department_id;
    if (section_id)    filter.section_id    = section_id;
    const students = await User.find(filter).lean();
    const result = await Promise.all(students.map(async s => {
      const section = s.section_id ? await Section.findById(s.section_id).lean() : null;
      return {
        id: s._id.toString(), name: s.name, email: s.email,
        student_id: s.student_id, status: s.status, semester: s.semester,
        batch: s.batch, points: s.points,
        unique_feedback_id: s.unique_feedback_id || null,
        section_name: section?.name || '—',
        section_id: s.section_id?.toString() || null
      };
    }));
    return res.json(result);
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

export const preCreateStudent = async (req, res) => {
  try {
    const { name, student_id, department_id, section_id, semester, batch } = req.body;
    if (!name || !student_id || !department_id || !section_id || !semester) {
      return res.status(400).json({ message: 'name, student_id, department_id, section_id, semester required' });
    }
    const normalizedId = student_id.trim().toUpperCase();
    const exists = await User.findOne({ student_id: normalizedId });
    if (exists) return res.status(400).json({ message: 'Student ID already exists.' });

    const student = await User.create({
      name, student_id: normalizedId, department_id, section_id,
      semester: Number(semester), batch: batch || new Date().getFullYear().toString(),
      role: 'student', status: 'pending', email: null, password: null
    });

    // Auto-enroll in section courses
    const sfList = await SectionFaculty.find({ section_id }).lean();
    const courseIds = [...new Set(sfList.map(sf => sf.course_id.toString()))];
    for (const courseId of courseIds) {
      await Enrollment.create({ student_id: student._id, course_id: courseId, section_id });
    }

    return res.status(201).json({ id: student._id.toString(), name: student.name, student_id: student.student_id, status: 'pending' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Student ID or email already exists.' });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const resetStudentPassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const hashed = await bcrypt.hash(new_password, 10);
    const student = await User.findByIdAndUpdate(req.params.id, { password: hashed }, { new: true }).lean();
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    return res.json({ message: 'Password reset successfully.' });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

export const updateStudent = async (req, res) => {
  try {
    const allowed = ['name', 'email', 'section_id', 'semester', 'batch', 'department_id'];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    const student = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    return res.json({ id: student._id.toString(), ...updates });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};
