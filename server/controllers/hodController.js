import { Department, Section, SectionFaculty, Course, Faculty, Tlfq, Question, Response, Answer, User, Enrollment } from '../db.js';

// ── GET /api/hod/sections — sections in HOD's dept ────────────────────────
export const getHodSections = async (req, res) => {
  try {
    const { department_id } = req.user;
    const sections = await Section.find({ department_id }).lean();
    return res.json(sections.map(s => ({ ...s, id: s._id.toString() })));
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── GET /api/hod/section-faculty — faculty in section ──────────────────────
export const getSectionFaculty = async (req, res) => {
  try {
    const { section_id } = req.query;
    if (!section_id) return res.status(400).json({ message: 'section_id required' });
    const list = await SectionFaculty.find({ section_id }).lean();
    const result = await Promise.all(list.map(async sf => {
      const faculty = await Faculty.findById(sf.faculty_id).lean();
      const course  = await Course.findById(sf.course_id).lean();
      return {
        id: sf._id.toString(),
        section_faculty_id: sf._id.toString(),
        faculty_id: sf.faculty_id.toString(),
        course_id:  sf.course_id.toString(),
        faculty_name: faculty?.name || 'Unknown',
        course_name:  course?.name  || 'Unknown',
        course_code:  course?.code  || '',
      };
    }));
    return res.json(result);
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── POST /api/hod/tlfq — create evaluation form ───────────────────────────
export const createTlfq = async (req, res) => {
  try {
    const { section_id, course_id, faculty_id, title, closing_time, question_texts } = req.body;
    if (!section_id || !course_id || !faculty_id || !title || !closing_time) {
      return res.status(400).json({ message: 'section_id, course_id, faculty_id, title, closing_time required' });
    }
    // Validate section belongs to HOD's dept
    const section = await Section.findById(section_id).lean();
    if (!section || section.department_id.toString() !== req.user.department_id) {
      return res.status(403).json({ message: 'Section not in your department.' });
    }
    const tlfq = await Tlfq.create({
      section_id, course_id, faculty_id, title,
      is_active: false,
      closing_time: new Date(closing_time),
      created_by: req.user.id
    });
    const questions = question_texts?.filter(q => q.trim()) || [];
    if (questions.length > 0) {
      await Question.insertMany(questions.map(q => ({ tlfq_id: tlfq._id, question_text: q })));
    }
    return res.status(201).json({ id: tlfq._id.toString(), message: 'Evaluation form created. Open it to make it available to students.' });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── GET /api/hod/tlfq — my forms ──────────────────────────────────────────
export const getMyForms = async (req, res) => {
  try {
    const forms = await Tlfq.find({ created_by: req.user.id }).lean();
    const now = new Date();
    const result = await Promise.all(forms.map(async f => {
      const section = await Section.findById(f.section_id).lean();
      const faculty = await Faculty.findById(f.faculty_id).lean();
      const course  = await Course.findById(f.course_id).lean();
      const responseCount = await Response.countDocuments({ tlfq_id: f._id });
      const expired = new Date(f.closing_time) < now;
      return {
        id: f._id.toString(), title: f.title, is_active: f.is_active,
        closing_time: f.closing_time, expired,
        status: expired ? 'expired' : f.is_active ? 'open' : 'closed',
        section_name: section?.name || '—',
        faculty_name: faculty?.name || '—',
        course_name:  course?.name  || '—',
        course_code:  course?.code  || '',
        responses: responseCount,
      };
    }));
    return res.json(result);
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── PUT /api/hod/tlfq/:id/toggle — open or close form ─────────────────────
export const toggleForm = async (req, res) => {
  try {
    const { is_active } = req.body;
    const form = await Tlfq.findById(req.params.id).lean();
    if (!form) return res.status(404).json({ message: 'Form not found.' });
    // Verify the HOD owns this form
    if (form.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only manage your own forms.' });
    }
    await Tlfq.findByIdAndUpdate(req.params.id, { is_active: !!is_active });
    return res.json({ message: `Form ${is_active ? 'opened' : 'closed'} successfully.` });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── PUT /api/hod/tlfq/:id/deadline — extend deadline ──────────────────────
export const updateDeadline = async (req, res) => {
  try {
    const { closing_time } = req.body;
    if (!closing_time) return res.status(400).json({ message: 'closing_time required' });
    const form = await Tlfq.findById(req.params.id).lean();
    if (!form) return res.status(404).json({ message: 'Form not found.' });
    if (form.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only manage your own forms.' });
    }
    await Tlfq.findByIdAndUpdate(req.params.id, { closing_time: new Date(closing_time) });
    return res.json({ message: 'Deadline updated.' });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── GET /api/hod/stats ─────────────────────────────────────────────────────
export const getHodStats = async (req, res) => {
  try {
    const { department_id } = req.user;
    const sections  = await Section.countDocuments({ department_id });
    const faculty   = await Faculty.countDocuments({ department_id });
    const courses   = await Course.countDocuments({ department_id });
    const students  = await User.countDocuments({ role: 'student', department_id });
    const myForms   = await Tlfq.countDocuments({ created_by: req.user.id });
    const openForms = await Tlfq.countDocuments({ created_by: req.user.id, is_active: true, closing_time: { $gt: new Date() } });
    return res.json({ sections, faculty, courses, students, myForms, openForms });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── PUT /api/hod/portal — toggle dept portal ──────────────────────────────
export const togglePortal = async (req, res) => {
  try {
    const { open } = req.body;
    const dept = await Department.findByIdAndUpdate(req.user.department_id, { portal_open: !!open }, { new: true }).lean();
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    return res.json({ portal_open: dept.portal_open, message: `Portal ${dept.portal_open ? 'opened' : 'closed'}.` });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

export const getPortalStatus = async (req, res) => {
  try {
    const dept = await Department.findById(req.user.department_id).lean();
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    return res.json({ portal_open: dept.portal_open, department_name: dept.name });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};
