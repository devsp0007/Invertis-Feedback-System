import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Building2, Users, Plus, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';

const TABS = [
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'hods',        label: 'HODs',        icon: Users },
  { id: 'coordinators',label: 'Coordinators',icon: Users },
];

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

export default function SuperAdminPanel() {
  const [tab,          setTab]          = useState('departments');
  const [msg,          setMsg]          = useState(null);
  const [departments,  setDepartments]  = useState([]);
  const [staff,        setStaff]        = useState([]);

  // Department form
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  // HOD form
  const [hodName,   setHodName]   = useState('');
  const [hodEmail,  setHodEmail]  = useState('');
  const [hodPass,   setHodPass]   = useState('');
  const [hodDept,   setHodDept]   = useState('');
  const [showHodPass, setShowHodPass] = useState(false);

  // Coordinator form
  const [coordName,  setCoordName]  = useState('');
  const [coordEmail, setCoordEmail] = useState('');
  const [coordPass,  setCoordPass]  = useState('');
  const [showCoordPass, setShowCoordPass] = useState(false);

  const loadAll = async () => {
    try {
      const [rD, rS] = await Promise.all([
        api.get('/coordinator/departments'),
        api.get('/superadmin/staff'),
      ]);
      setDepartments(rD.data);
      setStaff(rS.data);
    } catch {}
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t); } }, [msg]);

  const showMsg = (type, text) => setMsg({ type, text });

  const createDept = async () => {
    try {
      await api.post('/coordinator/departments', { name: deptName, code: deptCode });
      setDeptName(''); setDeptCode('');
      loadAll(); showMsg('success', 'Department created.');
    } catch (e) { showMsg('error', e.response?.data?.message || 'Failed.'); }
  };

  const deleteDept = async (id) => {
    try { await api.delete(`/coordinator/departments/${id}`); loadAll(); }
    catch (e) { showMsg('error', 'Failed to delete.'); }
  };

  const createHod = async () => {
    try {
      await api.post('/superadmin/hods', { name: hodName, email: hodEmail, password: hodPass, department_id: hodDept });
      setHodName(''); setHodEmail(''); setHodPass(''); setHodDept('');
      loadAll(); showMsg('success', 'HOD created successfully.');
    } catch (e) { showMsg('error', e.response?.data?.message || 'Failed.'); }
  };

  const createCoord = async () => {
    try {
      await api.post('/superadmin/coordinators', { name: coordName, email: coordEmail, password: coordPass });
      setCoordName(''); setCoordEmail(''); setCoordPass('');
      loadAll(); showMsg('success', 'Coordinator created successfully.');
    } catch (e) { showMsg('error', e.response?.data?.message || 'Failed.'); }
  };

  const deleteUser = async (id) => {
    try { await api.delete(`/superadmin/users/${id}`); loadAll(); }
    catch { showMsg('error', 'Failed to delete.'); }
  };

  const hods  = staff.filter(s => s.role === 'hod');
  const coords = staff.filter(s => s.role === 'coordinator');

  return (
    <div className="min-h-screen mesh-bg text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100">Super Admin Panel</h1>
              <p className="text-sm text-slate-400">Manage departments, HODs and coordinators</p>
            </div>
          </div>

          {msg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className={`mb-4 p-3.5 border text-xs font-semibold rounded-xl flex items-center justify-between gap-2 ${msg.type === 'success' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' : 'bg-rose-950/50 text-rose-400 border-rose-900/60'}`}>
              {msg.text}
              <button onClick={() => setMsg(null)} className="cursor-pointer"><X size={14} /></button>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-1.5 p-1.5 card rounded-2xl mb-6 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${tab === id ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
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
                        <button onClick={createDept} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
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
                        <button onClick={() => deleteDept(d.id)} className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl cursor-pointer"><Trash2 size={16} /></button>
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
                    <button onClick={createHod} className="mt-3 flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
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
                          <button onClick={() => deleteUser(h.id)} className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl cursor-pointer"><Trash2 size={16} /></button>
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
                    <button onClick={createCoord} className="mt-3 flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
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
                        <button onClick={() => deleteUser(c.id)} className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl cursor-pointer"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
