import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Shield, Building2, Users, Plus, Trash2, Check, X, Eye, EyeOff, GraduationCap, Search, UserCheck, Hash } from 'lucide-react';

const TABS = [
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'hods', label: 'HODs', icon: Users },
  { id: 'coordinators', label: 'Coordinators', icon: Users },
  { id: 'students', label: 'Student Lookup', icon: GraduationCap },
];

function Input({ ...props }) {
  return <input {...props} className={`bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm text-slate-800 dark:text-[var(--text-main)] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-full transition-all shadow-sm ${props.className || ''}`} />;
}

function Select({ children, ...props }) {
  return (
    <select {...props} className={`bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm text-slate-800 dark:text-[var(--text-main)] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-full cursor-pointer transition-all shadow-sm ${props.className || ''}`}>
      {children}
    </select>
  );
}

export default function SuperAdminPanel() {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  // Department form
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  // HOD form
  const [hodName, setHodName] = useState('');
  const [hodEmail, setHodEmail] = useState('');
  const [hodPass, setHodPass] = useState('');
  const [hodDept, setHodDept] = useState('');
  const [showHodPass, setShowHodPass] = useState(false);

  // Coordinator form
  const [coordName, setCoordName] = useState('');
  const [coordEmail, setCoordEmail] = useState('');
  const [coordPass, setCoordPass] = useState('');
  const [showCoordPass, setShowCoordPass] = useState(false);

  // Student search
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedIds, setRevealedIds] = useState(new Set());

  const loadAll = async (page = 1) => {
    try {
      const [rD, rS, rStud] = await Promise.all([
        api.get('/coordinator/departments'),
        api.get('/superadmin/staff'),
        api.get('/coordinator/students?page=' + page + '&limit=50'),
      ]);
      setDepartments(rD.data);
      setStaff(rS.data);
      setStudents(rStud.data.students || []);
      setPagination(rStud.data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 });
    } catch { }
  };

  useEffect(() => { loadAll(); }, []);

  const createDept = async () => {
    try {
      await api.post('/coordinator/departments', { name: deptName, code: deptCode });
      setDeptName(''); setDeptCode('');
      loadAll(); toast.success('Department created.');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed.'); }
  };

  const deleteDept = async (id) => {
    try { await api.delete(`/coordinator/departments/${id}`); loadAll(); }
    catch (e) { toast.error('Failed to delete.'); }
  };

  const createHod = async () => {
    try {
      await api.post('/superadmin/hods', { name: hodName, email: hodEmail, password: hodPass, department_id: hodDept });
      setHodName(''); setHodEmail(''); setHodPass(''); setHodDept('');
      loadAll(); toast.success('HOD created successfully.');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed.'); }
  };

  const createCoord = async () => {
    try {
      await api.post('/superadmin/coordinators', { name: coordName, email: coordEmail, password: coordPass });
      setCoordName(''); setCoordEmail(''); setCoordPass('');
      loadAll(); toast.success('Coordinator created successfully.');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed.'); }
  };

  const deleteUser = async (id) => {
    try { await api.delete(`/superadmin/users/${id}`); loadAll(); }
    catch { toast.error('Failed to delete.'); }
  };

  const toggleReveal = (id) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hods = staff.filter(s => s.role === 'hod');
  const coords = staff.filter(s => s.role === 'coordinator');

  // Filter students — search by ANO ID (unique_feedback_id) OR real name
  const q = searchQuery.trim().toUpperCase();
  const filteredStudents = q
    ? students.filter(s =>
      (s.unique_feedback_id || '').toUpperCase().includes(q) ||
      s.name?.toUpperCase().includes(q) ||
      (s.student_id || '').toUpperCase().includes(q)
    )
    : students;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 max-w-6xl">
            
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-500/20 flex-shrink-0">
                <Shield size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[var(--text-main)]">User Management</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">Create and manage departments, HODs, coordinators & student records</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 flex-wrap overflow-x-auto">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex items-center gap-2.5 px-6 py-4 text-sm font-black border-b-2 transition -mb-px cursor-pointer uppercase tracking-widest ${tab === id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[var(--text-main)]'
                  }`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-8">

                {/* DEPARTMENTS */}
                {tab === 'departments' && (
                  <div className="flex flex-col gap-8">
                    {/* Create Form - Full Width */}
                    <div className="card-main flex flex-col gap-6">
                      <h3 className="font-black text-slate-900 dark:text-[var(--text-main)] flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Plus size={18} className="text-primary-500" /> New Department
                      </h3>
                      <form onSubmit={(e) => { e.preventDefault(); createDept(); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Name</label>
                          <Input type="text" placeholder="B.Tech Computer Science" value={deptName} onChange={e => setDeptName(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Code</label>
                          <Input type="text" placeholder="BCS" value={deptCode} onChange={e => setDeptCode(e.target.value.toUpperCase())} />
                        </div>
                        <div className="flex items-end">
                          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white py-4 font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 cursor-pointer active:scale-95">
                            + Create
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Departments List - Full Width Below */}
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="font-black text-slate-900 dark:text-[var(--text-main)] text-sm flex items-center gap-2 uppercase tracking-wider">
                          <Building2 size={18} className="text-primary-500" /> All Departments
                        </h3>
                        <span className="text-[10px] font-black bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 border border-primary-100 dark:border-primary-800/40 px-3 py-1 rounded-full uppercase tracking-widest">
                          {departments.length} Total
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {departments.map(d => (
                          <motion.div
                            key={d.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card-main group hover:border-primary-500/40 relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2 translate-y-2 group-hover:translate-y-0">
                              <button
                                onClick={() => deleteDept(d.id)}
                                className="p-3 bg-white dark:bg-slate-800 hover:bg-accent-600 text-accent-500 hover:text-white rounded-2xl transition-all cursor-pointer shadow-lg border border-slate-100 dark:border-slate-700 hover:border-accent-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="flex items-center gap-5">
                              <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary-500 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                                <Building2 size={28} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-black text-slate-900 dark:text-white text-base truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                  {d.name}
                                </h3>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200/50 dark:border-slate-700/50 mt-1.5">
                                  {d.code}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* HODs */}
                {tab === 'hods' && (
                  <div className="flex flex-col gap-8">
                    {/* Create Form - Full Width */}
                    <div className="card-main flex flex-col gap-6">
                      <h3 className="font-black text-slate-900 dark:text-[var(--text-main)] flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Plus size={18} className="text-primary-500" /> New HOD
                      </h3>
                      <form onSubmit={(e) => { e.preventDefault(); createHod(); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Full Name</label>
                          <Input type="text" placeholder="Dr. Rajesh Kumar" value={hodName} onChange={e => setHodName(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Email</label>
                          <Input type="email" placeholder="hod.bcs@invertis.edu.in" value={hodEmail} onChange={e => setHodEmail(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Department</label>
                          <Select value={hodDept} onChange={e => setHodDept(e.target.value)}>
                            <option value="">Select Department…</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Password</label>
                          <div className="relative">
                            <Input type={showHodPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={hodPass} onChange={e => setHodPass(e.target.value)} />
                            <button type="button" onClick={() => setShowHodPass(!showHodPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer transition-colors">
                              {showHodPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-end">
                          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white py-4 font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 cursor-pointer active:scale-95">
                            + Create HOD
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* HODs List - Full Width Below */}
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="font-black text-slate-900 dark:text-[var(--text-main)] text-sm flex items-center gap-2 uppercase tracking-wider">
                          <Users size={18} className="text-primary-500" /> All HODs
                        </h3>
                        <span className="text-[10px] font-black bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 border border-primary-100 dark:border-primary-800/40 px-3 py-1 rounded-full uppercase tracking-widest">
                          {hods.length} Active
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {hods.map(h => {
                          const dept = departments.find(d => d.id === h.department_id);
                          return (
                            <motion.div
                              key={h.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="card-main group hover:border-primary-500/40 relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2 translate-y-2 group-hover:translate-y-0">
                                <button
                                  onClick={() => deleteUser(h.id)}
                                  className="p-3 bg-white dark:bg-slate-800 hover:bg-accent-600 text-accent-500 hover:text-white rounded-2xl transition-all cursor-pointer shadow-lg border border-slate-100 dark:border-slate-700 hover:border-accent-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary-500 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                                  <Users size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-black text-slate-900 dark:text-white text-base truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {h.name}
                                  </h3>
                                  <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1">{h.email}</div>
                                  <div className="text-[10px] text-primary-600 dark:text-primary-400 font-bold mt-1.5">{dept?.name || '—'}</div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* COORDINATORS */}
                {tab === 'coordinators' && (
                  <div className="flex flex-col gap-8">
                    {/* Create Form - Full Width */}
                    <div className="card-main flex flex-col gap-6">
                      <h3 className="font-black text-slate-900 dark:text-[var(--text-main)] flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Plus size={18} className="text-primary-500" /> New Coordinator
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">Coordinators have university-wide access to manage all departments and resources.</p>
                      <form onSubmit={(e) => { e.preventDefault(); createCoord(); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Full Name</label>
                          <Input type="text" placeholder="Academic Coordinator" value={coordName} onChange={e => setCoordName(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Email</label>
                          <Input type="email" placeholder="coordinator@invertis.edu.in" value={coordEmail} onChange={e => setCoordEmail(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Password</label>
                          <div className="relative">
                            <Input type={showCoordPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={coordPass} onChange={e => setCoordPass(e.target.value)} />
                            <button type="button" onClick={() => setShowCoordPass(!showCoordPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer transition-colors">
                              {showCoordPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-end md:col-span-3">
                          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white py-4 font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 cursor-pointer active:scale-95">
                            + Create Coordinator
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Coordinators List - Full Width Below */}
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="font-black text-slate-900 dark:text-[var(--text-main)] text-sm flex items-center gap-2 uppercase tracking-wider">
                          <Users size={18} className="text-primary-500" /> All Coordinators
                        </h3>
                        <span className="text-[10px] font-black bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 border border-primary-100 dark:border-primary-800/40 px-3 py-1 rounded-full uppercase tracking-widest">
                          {coords.length} Active
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {coords.map(c => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card-main group hover:border-primary-500/40 relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2 translate-y-2 group-hover:translate-y-0">
                              <button
                                onClick={() => deleteUser(c.id)}
                                className="p-3 bg-white dark:bg-slate-800 hover:bg-accent-600 text-accent-500 hover:text-white rounded-2xl transition-all cursor-pointer shadow-lg border border-slate-100 dark:border-slate-700 hover:border-accent-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="flex items-center gap-5">
                              <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary-500 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                                <Users size={28} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-black text-slate-900 dark:text-white text-base truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                  {c.name}
                                </h3>
                                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1">{c.email}</div>
                                <div className="text-[10px] text-primary-600 dark:text-primary-400 font-bold mt-1.5">University-wide Access</div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STUDENT LOOKUP */}
                {tab === 'students' && (
                  <div className="flex flex-col gap-6">
                    {/* Search bar */}
                    <div className="card-main border border-primary-500/20 bg-gradient-to-br from-primary-50/50 via-transparent to-transparent dark:from-primary-950/20 dark:via-transparent dark:to-transparent">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center">
                          <Search size={24} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-slate-900 dark:text-white">Student Directory</h3>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Find and manage student records</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                        Search by <span className="font-bold text-primary-600 dark:text-primary-400">Anonymous ID</span> (e.g. <span className="font-mono text-primary-500">ANO-A3F2B1</span>), name, or college ID to find and view student records.
                      </p>
                      <div className="relative">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search by Anonymous ID, name, or college ID…"
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-14 pr-5 py-4 text-sm text-slate-800 dark:text-[var(--text-main)] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">
                            <X size={18} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-6 mt-4 text-xs font-bold">
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Hash size={14} /> Total: <span className="text-slate-900 dark:text-white">{students.length}</span>
                        </span>
                        {q && <span className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                          <UserCheck size={14} /> Found: <span className="text-slate-900 dark:text-white">{filteredStudents.length}</span>
                        </span>}
                      </div>
                    </div>

                    {/* Student grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredStudents.map(s => {
                        const isRevealed = revealedIds.has(s.id);
                        return (
                          <motion.div
                            key={s.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card-main group hover:border-primary-500/40 flex flex-col gap-3 relative"
                          >
                            {/* Anonymous ID - always visible */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Anonymous ID (Public)</span>
                                <span className="text-sm font-mono font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-3 py-2 rounded-xl border border-primary-100 dark:border-primary-800/40">
                                  {s.unique_feedback_id || 'ANO-?????'}
                                </span>
                              </div>
                              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase whitespace-nowrap ${s.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'}`}>
                                {s.status}
                              </span>
                            </div>

                            {/* Real identity - hidden/revealed */}
                            <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                              {isRevealed ? (
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                  <span className="text-[9px] font-bold text-accent-600 dark:text-accent-400 uppercase tracking-widest">Real Identity (Revealed)</span>
                                  <div>
                                    <div className="text-base font-black text-slate-900 dark:text-white truncate">{s.name}</div>
                                    {s.student_id && <div className="text-[10px] font-mono text-accent-600 dark:text-accent-400 mt-1.5 font-bold">Roll: {s.student_id}</div>}
                                    {s.email && <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 truncate">{s.email}</div>}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Real Identity</span>
                                  <span className="text-[10px] text-slate-600 dark:text-slate-400 italic">Click 👁 to reveal</span>
                                </div>
                              )}
                              <button
                                onClick={() => toggleReveal(s.id)}
                                className={`p-2.5 rounded-xl transition-all cursor-pointer flex-shrink-0 ${isRevealed
                                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                                }`}
                                title={isRevealed ? 'Hide Identity' : 'Reveal Identity'}
                              >
                                {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>

                            {/* Section info */}
                            {(s.section_name || s.semester) && (
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold flex items-center gap-2 flex-wrap pt-1">
                                {s.section_name && <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">{s.section_name}</span>}
                                {s.semester && <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">Sem {s.semester}</span>}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full card-main flex flex-col items-center justify-center py-16 text-center">
                          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-600 dark:text-slate-400">
                            <GraduationCap size={32} />
                          </div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No Students Found</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
                            {q ? 'Try searching with a different ID, name, or college ID.' : 'Student records will appear here when available.'}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="card-main flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                          {pagination.total} total records
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            disabled={pagination.page <= 1}
                            onClick={() => loadAll(pagination.page - 1)}
                            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all"
                          >
                            Prev
                          </button>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-fit">
                            {pagination.page} / {pagination.totalPages}
                          </span>
                          <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => loadAll(pagination.page + 1)}
                            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
