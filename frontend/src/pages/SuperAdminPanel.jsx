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
  return <input {...props} className={`bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full ${props.className || ''}`} />;
}

function Select({ children, ...props }) {
  return (
    <select {...props} className={`bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full cursor-pointer ${props.className || ''}`}>
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
    <div className="min-h-screen mesh-bg text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-accent-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-slate-100">Super Admin Panel</h1>
              <p className="text-sm text-slate-400">Manage departments, HODs, coordinators & view student identities</p>
            </div>
          </div>


          {/* Tabs */}
          <div className="flex gap-1.5 p-1.5 card rounded-2xl mb-6 w-fit flex-wrap">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${tab === id ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

              {/* DEPARTMENTS */}
              {tab === 'departments' && (
                <div className="flex flex-col gap-4">
                  <div className="card rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-3">Create Department</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label><Input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="B.Tech Computer Science" /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Code</label><Input value={deptCode} onChange={e => setDeptCode(e.target.value.toUpperCase())} placeholder="BCS" /></div>
                      <div className="flex items-end">
                        <button onClick={createDept} className="flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
                          <Plus size={16} /> Create
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {departments.map(d => (
                      <div key={d.id} className="card rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-100">{d.name}</div>
                          <div className="text-xs font-mono text-slate-500 mt-0.5">{d.code}</div>
                        </div>
                        <button onClick={() => deleteDept(d.id)} className="p-2 text-slate-600 hover:text-accent-400 hover:bg-accent-950/30 rounded-xl cursor-pointer"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HODs */}
              {tab === 'hods' && (
                <div className="flex flex-col gap-4">
                  <div className="card rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-3">Create HOD Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label><Input value={hodName} onChange={e => setHodName(e.target.value)} placeholder="Dr. Rajesh Kumar" /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label><Input type="email" value={hodEmail} onChange={e => setHodEmail(e.target.value)} placeholder="hod.bcs@invertis.edu.in" /></div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <Input type={showHodPass ? 'text' : 'password'} value={hodPass} onChange={e => setHodPass(e.target.value)} placeholder="Min. 8 characters" />
                          <button type="button" onClick={() => setShowHodPass(!showHodPass)} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer">
                            {showHodPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</label>
                        <Select value={hodDept} onChange={e => setHodDept(e.target.value)}>
                          <option value="">Select Department…</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </Select>
                      </div>
                    </div>
                    <button onClick={createHod} className="mt-3 flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
                      <Check size={16} /> Create HOD
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hods.map(h => {
                      const dept = departments.find(d => d.id === h.department_id);
                      return (
                        <div key={h.id} className="card rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-slate-100">{h.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{h.email}</div>
                            <div className="text-xs text-blue-400 mt-0.5">{dept?.name || '—'}</div>
                          </div>
                          <button onClick={() => deleteUser(h.id)} className="p-2 text-slate-600 hover:text-accent-400 hover:bg-accent-950/30 rounded-xl cursor-pointer"><Trash2 size={16} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COORDINATORS */}
              {tab === 'coordinators' && (
                <div className="flex flex-col gap-4">
                  <div className="card rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-1">Create Coordinator Account</h3>
                    <p className="text-xs text-slate-400 mb-3">Coordinators have university-wide access to manage all departments.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label><Input value={coordName} onChange={e => setCoordName(e.target.value)} placeholder="Academic Coordinator" /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label><Input type="email" value={coordEmail} onChange={e => setCoordEmail(e.target.value)} placeholder="coordinator@invertis.edu.in" /></div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <Input type={showCoordPass ? 'text' : 'password'} value={coordPass} onChange={e => setCoordPass(e.target.value)} placeholder="Min. 8 characters" />
                          <button type="button" onClick={() => setShowCoordPass(!showCoordPass)} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer">
                            {showCoordPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={createCoord} className="mt-3 flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
                      <Check size={16} /> Create Coordinator
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {coords.map(c => (
                      <div key={c.id} className="card rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-100">{c.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{c.email}</div>
                          <div className="text-xs text-violet-400 mt-0.5 font-bold">University-wide access</div>
                        </div>
                        <button onClick={() => deleteUser(c.id)} className="p-2 text-slate-600 hover:text-accent-400 hover:bg-accent-950/30 rounded-xl cursor-pointer"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STUDENT LOOKUP — Search by Unique ID & Reveal Identity */}
              {tab === 'students' && (
                <div className="flex flex-col gap-4">
                  {/* Search bar */}
                  <div className="card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-950/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Search size={18} className="text-emerald-400" />
                      <h3 className="text-lg font-bold text-emerald-100">Student Identity Lookup</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      Search by <span className="text-primary-300 font-bold">Anonymous ID</span> (e.g. <span className="font-mono text-emerald-400">ANO-A3F2B1</span>) — the ID shown on leaderboards and feedback — to reveal the real student identity.
                      Student identities are hidden from everyone else. Only Super Admin and Supreme Authority can see them.
                    </p>
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by Anonymous ID (ANO-XXXXXX) or real name..."
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><Hash size={12} /> Total Students: <span className="text-slate-300 font-bold">{students.length}</span></span>
                      {q && <span className="flex items-center gap-1.5"><UserCheck size={12} /> Matches: <span className="text-emerald-400 font-bold">{filteredStudents.length}</span></span>}
                    </div>
                  </div>

                  {/* Student grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredStudents.map(s => {
                      const isRevealed = revealedIds.has(s.id);
                      return (
                        <motion.div key={s.id} layout className="card rounded-2xl p-4 flex flex-col gap-2 border border-slate-800/60 hover:border-emerald-500/30 transition-colors">
                          {/* Anonymous ID — always visible to everyone */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Anonymous ID (Public)</span>
                              <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                {s.unique_feedback_id || 'ANO-?????'}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${s.status === 'active' ? 'bg-primary-500/10 text-primary-300' : 'bg-amber-500/10 text-amber-300'}`}>{s.status}</span>
                          </div>

                          {/* Real identity — hidden by default, revealed by admin */}
                          <div className="flex items-start justify-between gap-2 mt-1 pt-2 border-t border-white/5">
                            {isRevealed ? (
                              <div className="flex flex-col gap-1">
                                <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Real Identity</div>
                                <div className="text-sm font-bold text-slate-100">{s.name}</div>
                                <div className="text-xs font-mono text-accent-300 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20 w-fit">
                                  Roll: {s.student_id || '—'}
                                </div>
                                {s.email && <div className="text-[10px] text-slate-500">{s.email}</div>}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Real Identity</div>
                                <div className="text-sm font-bold text-slate-600 italic">Hidden — Click 👁 to Reveal</div>
                              </div>
                            )}
                            <button
                              onClick={() => toggleReveal(s.id)}
                              title={isRevealed ? 'Hide Identity' : 'Reveal Identity'}
                              className={`p-2 rounded-lg transition-all cursor-pointer flex-shrink-0 ${isRevealed
                                  ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                                  : 'bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                                }`}
                            >
                              {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>

                          {/* Section info */}
                          <div className="text-[10px] text-slate-500 font-medium flex items-center gap-2">
                            <span>{s.section_name || 'No section'}</span>
                            {s.semester && <span>• Sem {s.semester}</span>}
                          </div>
                        </motion.div>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <div className="col-span-full card rounded-2xl p-10 text-center">
                        <GraduationCap size={32} className="text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-semibold">{q ? 'No students match your search.' : 'No students found.'}</p>
                        {q && <p className="text-slate-600 text-xs mt-1">Try searching with a different ID or name.</p>}
                      </div>
                    )}
                  </div>
                  {/* Pagination Controls */}
                  {tab === 'students' && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between card rounded-2xl p-4 mt-6">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Total {pagination.total} records
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          disabled={pagination.page <= 1}
                          onClick={() => loadAll(pagination.page - 1)}
                          className="px-4 py-2 bg-slate-900 hover:bg-white/5 text-slate-400 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <div className="text-xs font-bold text-slate-400">
                          {pagination.page} / {pagination.totalPages}
                        </div>
                        <button
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => loadAll(pagination.page + 1)}
                          className="px-4 py-2 bg-slate-900 hover:bg-white/5 text-slate-400 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
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
        </main>
      </div>
    </div>
  );
}
