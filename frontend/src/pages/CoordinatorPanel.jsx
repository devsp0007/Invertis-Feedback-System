import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, X, Users, BookOpen, GraduationCap, Link2, Building2, ChevronDown, Key } from 'lucide-react';

const TABS = [
  { id: 'departments', label: 'Departments',  icon: Building2 },
  { id: 'sections',    label: 'Sections',     icon: Link2 },
  { id: 'courses',     label: 'Courses',      icon: BookOpen },
  { id: 'faculty',     label: 'Faculty',      icon: Users },
  { id: 'assignments', label: 'Assignments',  icon: Link2 },
  { id: 'students',    label: 'Students',     icon: GraduationCap },
];

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  const styles = type === 'success' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' : 'bg-rose-950/50 text-rose-400 border-rose-900/60';
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      className={`p-3.5 border text-xs font-semibold rounded-xl flex items-center justify-between gap-2 ${styles}`}>
      {msg}
      <button onClick={onClose} className="cursor-pointer"><X size={14} /></button>
    </motion.div>
  );
}

function Card({ children, className = '' }) {
  return <div className={`card rounded-2xl p-5 ${className}`}>{children}</div>;
}

function Label({ children }) {
  return <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{children}</label>;
}

function Input({ ...props }) {
  return <input {...props} className={`bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full ${props.className || ''}`} />;
}

function Select({ children, ...props }) {
  return (
    <select {...props} className={`bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full cursor-pointer ${props.className || ''}`}>
      {children}
    </select>
  );
}

function Btn({ children, variant = 'primary', ...props }) {
  const cls = variant === 'primary'
    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
    : variant === 'danger'
    ? 'bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-800/50'
    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700';
  return (
    <button {...props} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 ${cls}`}>
      {children}
    </button>
  );
}

// ── Departments Tab ──────────────────────────────────────────────────────────
function DepartmentsTab({ departments, onRefresh, setMsg }) {
  const [name, setName] = useState(''); const [code, setCode] = useState('');
  const create = async () => {
    try { await api.post('/coordinator/departments', { name, code }); setName(''); setCode(''); onRefresh(); setMsg({ type: 'success', text: 'Department created.' }); }
    catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed.' }); }
  };
  const del = async (id) => {
    try { await api.delete(`/coordinator/departments/${id}`); onRefresh(); }
    catch (e) { setMsg({ type: 'error', text: 'Failed to delete.' }); }
  };
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="text-sm font-bold text-slate-200 mb-3">Add Department</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="B.Tech Computer Science" /></div>
          <div className="flex flex-col gap-1"><Label>Code</Label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="BCS" /></div>
          <div className="flex items-end"><Btn onClick={create}><Plus size={16} /> Create</Btn></div>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {departments.map(d => (
          <Card key={d.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-100">{d.name}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{d.code}</div>
            </div>
            <Btn variant="danger" onClick={() => del(d.id)}><Trash2 size={14} /></Btn>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Sections Tab ──────────────────────────────────────────────────────────────
function SectionsTab({ departments, sections, onRefresh, setMsg }) {
  const [deptId, setDeptId] = useState(''); const [sem, setSem] = useState('3'); const [label, setLabel] = useState('A');
  const create = async () => {
    try { await api.post('/coordinator/sections', { department_id: deptId, semester: sem, label }); onRefresh(); setMsg({ type: 'success', text: 'Section created.' }); }
    catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed.' }); }
  };
  const del = async (id) => {
    try { await api.delete(`/coordinator/sections/${id}`); onRefresh(); }
    catch (e) { setMsg({ type: 'error', text: 'Failed to delete.' }); }
  };
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="text-sm font-bold text-slate-200 mb-3">Create Section</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1 col-span-2 md:col-span-1"><Label>Department</Label>
            <Select value={deptId} onChange={e => setDeptId(e.target.value)}>
              <option value="">Select…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1"><Label>Semester</Label>
            <Select value={sem} onChange={e => setSem(e.target.value)}>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1"><Label>Section</Label>
            <Select value={label} onChange={e => setLabel(e.target.value)}>
              {['A','B','C','D'].map(l => <option key={l} value={l}>{l}</option>)}
            </Select>
          </div>
          <div className="flex items-end"><Btn onClick={create}><Plus size={16} /> Create</Btn></div>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sections.map(s => (
          <Card key={s.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-100">{s.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.department_name} • Semester {s.semester}</div>
            </div>
            <Btn variant="danger" onClick={() => del(s.id)}><Trash2 size={14} /></Btn>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Courses Tab ──────────────────────────────────────────────────────────────
function CoursesTab({ departments, courses, onRefresh, setMsg }) {
  const [name, setName] = useState(''); const [code, setCode] = useState(''); const [deptId, setDeptId] = useState('');
  const create = async () => {
    try { await api.post('/coordinator/courses', { name, code, department_id: deptId }); setName(''); setCode(''); onRefresh(); setMsg({ type: 'success', text: 'Course created.' }); }
    catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed.' }); }
  };
  const del = async (id) => {
    try { await api.delete(`/coordinator/courses/${id}`); onRefresh(); }
    catch (e) { setMsg({ type: 'error', text: 'Failed to delete.' }); }
  };
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="text-sm font-bold text-slate-200 mb-3">Add Course</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1 col-span-2 md:col-span-1"><Label>Course Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Data Structures" /></div>
          <div className="flex flex-col gap-1"><Label>Code</Label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="BCS201" /></div>
          <div className="flex flex-col gap-1"><Label>Department</Label>
            <Select value={deptId} onChange={e => setDeptId(e.target.value)}>
              <option value="">Select…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="flex items-end"><Btn onClick={create}><Plus size={16} /> Add</Btn></div>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {courses.map(c => (
          <Card key={c.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-100">{c.name}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">{c.code} • {c.department_name}</div>
            </div>
            <Btn variant="danger" onClick={() => del(c.id)}><Trash2 size={14} /></Btn>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Faculty Tab ───────────────────────────────────────────────────────────────
function FacultyTab({ departments, faculty, onRefresh, setMsg }) {
  const [name, setName] = useState('');
  const [deptId, setDeptId] = useState('');
  const [teacherType, setTeacherType] = useState('college_faculty');

  const create = async () => {
    try {
      await api.post('/coordinator/faculty', { name, department_id: deptId, teacher_type: teacherType });
      setName('');
      onRefresh();
      setMsg({ type: 'success', text: 'Faculty added.' });
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed.' }); }
  };
  const del = async (id) => {
    try { await api.delete(`/coordinator/faculty/${id}`); onRefresh(); }
    catch (e) { setMsg({ type: 'error', text: 'Failed to delete.' }); }
  };
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="text-sm font-bold text-slate-200 mb-3">Add Faculty Member</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1 md:col-span-2"><Label>Faculty Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Alan Turing" /></div>
          <div className="flex flex-col gap-1"><Label>Department</Label>
            <Select value={deptId} onChange={e => setDeptId(e.target.value)}>
              <option value="">Select…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1"><Label>Type</Label>
            <Select value={teacherType} onChange={e => setTeacherType(e.target.value)}>
              <option value="college_faculty">College Faculty</option>
              <option value="trainer">Trainer</option>
            </Select>
          </div>
        </div>
        <div className="mt-3"><Btn onClick={create}><Plus size={16} /> Add Faculty</Btn></div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {faculty.map(f => (
          <Card key={f.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-100">{f.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{f.department_name}</div>
              <span className={`inline-flex mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                f.teacher_type === 'trainer'
                  ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25'
                  : 'text-violet-300 bg-violet-500/10 border-violet-500/25'
              }`}>
                {f.teacher_type === 'trainer' ? 'Trainer' : 'College Faculty'}
              </span>
            </div>
            <Btn variant="danger" onClick={() => del(f.id)}><Trash2 size={14} /></Btn>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Assignments Tab ──────────────────────────────────────────────────────────
function AssignmentsTab({ departments, sections, faculty, courses, onRefresh, setMsg }) {
  const [sectionId, setSectionId] = useState(''); const [facultyId, setFacultyId] = useState(''); const [courseId, setCourseId] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const filteredSections = deptFilter ? sections.filter(s => s.department_id === deptFilter) : sections;
  const filteredFaculty  = deptFilter ? faculty.filter(f => f.department_id === deptFilter) : faculty;
  const filteredCourses  = deptFilter ? courses.filter(c => c.department_id === deptFilter) : courses;

  const assign = async () => {
    if (!sectionId || !facultyId || !courseId) { setMsg({ type: 'error', text: 'All fields required.' }); return; }
    try { await api.post('/coordinator/assignments', { section_id: sectionId, faculty_id: facultyId, course_id: courseId }); onRefresh(); setMsg({ type: 'success', text: 'Faculty assigned to section.' }); }
    catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed.' }); }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="text-sm font-bold text-slate-200 mb-3">Assign Faculty to Section</h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1"><Label>Filter by Department</Label>
            <Select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1"><Label>Section</Label>
              <Select value={sectionId} onChange={e => setSectionId(e.target.value)}>
                <option value="">Select Section…</option>
                {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1"><Label>Faculty</Label>
              <Select value={facultyId} onChange={e => setFacultyId(e.target.value)}>
                <option value="">Select Faculty…</option>
                {filteredFaculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1"><Label>Course</Label>
              <Select value={courseId} onChange={e => setCourseId(e.target.value)}>
                <option value="">Select Course…</option>
                {filteredCourses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}
              </Select>
            </div>
          </div>
          <div><Btn onClick={assign}><Link2 size={16} /> Assign</Btn></div>
        </div>
      </Card>
      <Card>
        <p className="text-xs text-slate-400">Assignments are shown per section. Manage existing assignments by deleting a section or recreating assignments.</p>
      </Card>
    </div>
  );
}

// ── Students Tab ──────────────────────────────────────────────────────────────
function StudentsTab({ departments, sections, students, onRefresh, setMsg }) {
  const [name, setName] = useState(''); const [stdId, setStdId] = useState('');
  const [deptId, setDeptId] = useState(''); const [sectionId, setSectionId] = useState('');
  const [sem, setSem] = useState('3'); const [batch, setBatch] = useState('2025');
  const [resetId, setResetId] = useState(''); const [newPwd, setNewPwd] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const filteredSections = deptId ? sections.filter(s => s.department_id === deptId) : [];
  const filteredStudents = filterDept ? students.filter(s => {
    const sec = sections.find(sec => sec.id === s.section_id);
    return sec?.department_id === filterDept;
  }) : students;

  const create = async () => {
    try {
      await api.post('/coordinator/students', { name, student_id: stdId, department_id: deptId, section_id: sectionId, semester: sem, batch });
      setName(''); setStdId(''); setSectionId('');
      onRefresh(); setMsg({ type: 'success', text: `Student ${stdId} pre-created as PENDING.` });
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed.' }); }
  };

  const resetPwd = async (id) => {
    if (!newPwd) { setMsg({ type: 'error', text: 'Enter new password.' }); return; }
    try {
      await api.put(`/coordinator/students/${id}/reset-password`, { new_password: newPwd });
      setResetId(''); setNewPwd('');
      setMsg({ type: 'success', text: 'Password reset successfully.' });
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed.' }); }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="text-sm font-bold text-slate-200 mb-3">Pre-Create Student Account</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" /></div>
          <div className="flex flex-col gap-1"><Label>Student ID</Label><Input value={stdId} onChange={e => setStdId(e.target.value.toUpperCase())} placeholder="BCS2025_55" className="font-mono" /></div>
          <div className="flex flex-col gap-1"><Label>Department</Label>
            <Select value={deptId} onChange={e => { setDeptId(e.target.value); setSectionId(''); }}>
              <option value="">Select…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1"><Label>Section</Label>
            <Select value={sectionId} onChange={e => setSectionId(e.target.value)}>
              <option value="">Select…</option>
              {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1"><Label>Semester</Label>
            <Select value={sem} onChange={e => setSem(e.target.value)}>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1"><Label>Batch Year</Label><Input value={batch} onChange={e => setBatch(e.target.value)} placeholder="2025" /></div>
        </div>
        <div className="mt-3"><Btn onClick={create}><Plus size={16} /> Pre-Create Student</Btn></div>
      </Card>

      {/* Student list */}
      <div className="flex items-center gap-3 mb-1">
        <Label>Filter by Department</Label>
        <Select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="w-48">
          <option value="">All</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredStudents.map(s => (
          <Card key={s.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold text-slate-100">{s.name}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{s.student_id}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.section_name} • Sem {s.semester}</div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${s.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/40 text-amber-400'}`}>
                {s.status}
              </span>
            </div>
            {resetId === s.id ? (
              <div className="flex gap-2">
                <Input value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="New password (min 8)" type="password" />
                <Btn onClick={() => resetPwd(s.id)}><Check size={14} /></Btn>
                <Btn variant="secondary" onClick={() => setResetId('')}><X size={14} /></Btn>
              </div>
            ) : (
              <button onClick={() => setResetId(s.id)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer">
                <Key size={13} /> Reset Password
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main CoordinatorPanel ────────────────────────────────────────────────────
export default function CoordinatorPanel() {
  const [tab,         setTab]         = useState('departments');
  const [msg,         setMsg]         = useState(null);
  const [departments, setDepartments] = useState([]);
  const [sections,    setSections]    = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [faculty,     setFaculty]     = useState([]);
  const [students,    setStudents]    = useState([]);

  const loadAll = async () => {
    try {
      const [rD, rS, rC, rF, rSt] = await Promise.all([
        api.get('/coordinator/departments'),
        api.get('/coordinator/sections'),
        api.get('/coordinator/courses'),
        api.get('/coordinator/faculty'),
        api.get('/coordinator/students'),
      ]);
      setDepartments(rD.data);
      setSections(rS.data);
      setCourses(rC.data);
      setFaculty(rF.data);
      setStudents(rSt.data);
    } catch {}
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t); } }, [msg]);

  const setMsgHelper = ({ type, text }) => setMsg({ type, text });

  return (
    <div className="min-h-screen mesh-bg text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100">Coordinator Panel</h1>
              <p className="text-sm text-slate-400">Manage departments, sections, faculty and students</p>
            </div>
          </div>

          {msg && <div className="mb-4"><Alert type={msg.type} msg={msg.text} onClose={() => setMsg(null)} /></div>}

          {/* Tabs */}
          <div className="flex gap-1.5 flex-wrap p-1.5 card rounded-2xl mb-6">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${tab === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {tab === 'departments' && <DepartmentsTab departments={departments} onRefresh={loadAll} setMsg={setMsgHelper} />}
              {tab === 'sections'    && <SectionsTab    departments={departments} sections={sections} onRefresh={loadAll} setMsg={setMsgHelper} />}
              {tab === 'courses'     && <CoursesTab     departments={departments} courses={courses}   onRefresh={loadAll} setMsg={setMsgHelper} />}
              {tab === 'faculty'     && <FacultyTab     departments={departments} faculty={faculty}   onRefresh={loadAll} setMsg={setMsgHelper} />}
              {tab === 'assignments' && <AssignmentsTab departments={departments} sections={sections} faculty={faculty} courses={courses} onRefresh={loadAll} setMsg={setMsgHelper} />}
              {tab === 'students'    && <StudentsTab    departments={departments} sections={sections} students={students} onRefresh={loadAll} setMsg={setMsgHelper} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
