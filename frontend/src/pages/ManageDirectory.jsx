import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import { BookOpen, Users, Plus, Trash2, Settings, Building2, Download, Upload, RefreshCw } from 'lucide-react';

const inputCls = 'bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full transition';

export default function ManageDirectory() {
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Create state
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseDept, setCourseDept] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [facultyDept, setFacultyDept] = useState('');
  const [syncMode, setSyncMode] = useState('merge');
  const [importFile, setImportFile] = useState(null);

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 4000); };

  const loadData = async () => {
    try {
      setLoading(true);
      const [rD, rC, rF] = await Promise.all([
        api.get('/tlfq/departments'),
        api.get('/tlfq/courses'),
        api.get('/tlfq/faculty')
      ]);
      setDepartments(rD.data);
      setCourses(rC.data);
      setFaculty(rF.data);
    } catch { showMsg('Failed to load data.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    try {
      await api.post('/tlfq/departments', { name: deptName, code: deptCode });
      setDeptName(''); setDeptCode('');
      showMsg('Department added successfully.'); loadData();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to add department.', 'error'); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseName || !courseCode || !courseDept) return;
    try {
      await api.post('/tlfq/courses', { name: courseName, code: courseCode, department_id: courseDept });
      setCourseName(''); setCourseCode(''); setCourseDept('');
      showMsg('Course added successfully.'); loadData();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to add course.', 'error'); }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!facultyName || !facultyDept) return;
    try {
      await api.post('/tlfq/faculty', { name: facultyName, department_id: facultyDept });
      setFacultyName(''); setFacultyDept('');
      showMsg('Faculty record added.'); loadData();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to add faculty.', 'error'); }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    try {
      await api.delete(`/tlfq/${type}/${id}`);
      showMsg(`${type} deleted.`); loadData();
    } catch { showMsg(`Failed to delete ${type}.`, 'error'); }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/sync/export');
      const a = document.createElement('a');
      a.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(res.data, null, 2))}`;
      a.download = `tlfq-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch { showMsg('Export failed.', 'error'); }
  };

  const handleImportData = async () => {
    if (!importFile) return;
    if (syncMode === 'overwrite' && !window.confirm('WARNING: This will erase all current data. Are you sure?')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await api.post('/sync/import', { data: JSON.parse(e.target.result), mode: syncMode });
        showMsg(`Data synchronized successfully (${syncMode} mode).`);
        setImportFile(null); loadData();
      } catch { showMsg('Import failed. Ensure valid JSON.', 'error'); }
    };
    reader.readAsText(importFile);
  };

  const TABS = [
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'sync', label: 'Data Sync', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-5xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Settings size={20} className="text-indigo-400" />
                <h1 className="text-2xl font-black">Directory Management</h1>
              </div>
              <p className="text-sm text-slate-400">Manage departments, courses, and faculty data records.</p>
            </div>

            {msg.text && (
              <div className={`p-4 rounded-xl text-sm font-semibold border ${
                msg.type === 'error'
                  ? 'bg-rose-950/40 text-rose-400 border-rose-900/50'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
              }`}>{msg.text}</div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800 flex-wrap">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px cursor-pointer ${
                    activeTab === id
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 flex justify-center">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* DEPARTMENTS */}
                {activeTab === 'departments' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 h-fit">
                      <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm"><Plus size={15} className="text-indigo-400" /> Add Department</h3>
                      <form onSubmit={handleCreateDept} className="flex flex-col gap-3">
                        <input type="text" placeholder="E.g. Computer Science & Engineering" value={deptName} onChange={e => setDeptName(e.target.value)} className={inputCls} />
                        <input type="text" placeholder="Code (e.g. CSE)" value={deptCode} onChange={e => setDeptCode(e.target.value)} className={inputCls} />
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 font-bold rounded-xl text-xs cursor-pointer">Add Department</button>
                      </form>
                    </div>
                    <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2"><Building2 size={15} className="text-indigo-400" /> All Departments</h3>
                        <span className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-800/40 px-2.5 py-1 rounded-full font-bold">{departments.length}</span>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-slate-900 text-xs text-slate-500 uppercase">
                          <tr><th className="p-4 text-left">Name</th><th className="p-4 text-left">Code</th><th className="p-4"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {departments.map(d => (
                            <tr key={d.id} className="hover:bg-slate-700/30 text-xs text-slate-300">
                              <td className="p-4 font-semibold">{d.name}</td>
                              <td className="p-4 font-mono text-slate-400">{d.code}</td>
                              <td className="p-4 text-right">
                                <button onClick={() => handleDelete('departments', d.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* COURSES */}
                {activeTab === 'courses' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 h-fit">
                      <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm"><Plus size={15} className="text-indigo-400" /> Add Course</h3>
                      <form onSubmit={handleCreateCourse} className="flex flex-col gap-3">
                        <input type="text" placeholder="Course Code (e.g. CS401)" value={courseCode} onChange={e => setCourseCode(e.target.value)} className={inputCls} />
                        <input type="text" placeholder="Course Name" value={courseName} onChange={e => setCourseName(e.target.value)} className={inputCls} />
                        <select value={courseDept} onChange={e => setCourseDept(e.target.value)} className={inputCls + ' cursor-pointer'}>
                          <option value="">Select Department…</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 font-bold rounded-xl text-xs cursor-pointer">Add Course</button>
                      </form>
                    </div>
                    <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2"><BookOpen size={15} className="text-indigo-400" /> All Courses</h3>
                        <span className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-800/40 px-2.5 py-1 rounded-full font-bold">{courses.length}</span>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-slate-900 text-xs text-slate-500 uppercase">
                          <tr><th className="p-4 text-left">Code</th><th className="p-4 text-left">Name</th><th className="p-4 text-left">Dept.</th><th className="p-4"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {courses.map(c => (
                            <tr key={c.id} className="hover:bg-slate-700/30 text-xs text-slate-300">
                              <td className="p-4 font-mono text-indigo-300">{c.code}</td>
                              <td className="p-4 font-semibold">{c.name}</td>
                              <td className="p-4 text-slate-500">{c.department_name}</td>
                              <td className="p-4 text-right">
                                <button onClick={() => handleDelete('courses', c.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* FACULTY */}
                {activeTab === 'faculty' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 h-fit">
                      <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm"><Plus size={15} className="text-indigo-400" /> Add Faculty Record</h3>
                      <p className="text-xs text-slate-500">Faculty are data records only — they do not have login access.</p>
                      <form onSubmit={handleCreateFaculty} className="flex flex-col gap-3">
                        <input type="text" placeholder="Full Name (e.g. Dr. Alan Turing)" value={facultyName} onChange={e => setFacultyName(e.target.value)} className={inputCls} />
                        <select value={facultyDept} onChange={e => setFacultyDept(e.target.value)} className={inputCls + ' cursor-pointer'}>
                          <option value="">Select Department…</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 font-bold rounded-xl text-xs cursor-pointer">Add Faculty</button>
                      </form>
                    </div>
                    <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2"><Users size={15} className="text-indigo-400" /> Faculty Records</h3>
                        <span className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-800/40 px-2.5 py-1 rounded-full font-bold">{faculty.length}</span>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-slate-900 text-xs text-slate-500 uppercase">
                          <tr><th className="p-4 text-left">Name</th><th className="p-4 text-left">Department</th><th className="p-4"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {faculty.map(f => (
                            <tr key={f.id} className="hover:bg-slate-700/30 text-xs text-slate-300">
                              <td className="p-4 font-semibold">{f.name}</td>
                              <td className="p-4 text-slate-400">{f.department_name}</td>
                              <td className="p-4 text-right">
                                <button onClick={() => handleDelete('faculty', f.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SYNC */}
                {activeTab === 'sync' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
                      <h3 className="font-bold text-slate-200 flex items-center gap-2"><Download size={16} className="text-indigo-400" /> Export System Data</h3>
                      <p className="text-xs text-slate-400">Export all records as a JSON backup file.</p>
                      <button onClick={handleExportData} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer">
                        <Download size={15} /> Download Backup JSON
                      </button>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
                      <h3 className="font-bold text-slate-200 flex items-center gap-2"><Upload size={16} className="text-indigo-400" /> Import / Synchronize</h3>
                      <input type="file" accept="application/json" onChange={e => setImportFile(e.target.files[0])} className="text-xs bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-400 cursor-pointer focus:outline-none" />
                      <div className="grid grid-cols-2 gap-2">
                        {['merge', 'overwrite'].map(m => (
                          <button key={m} onClick={() => setSyncMode(m)} className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${syncMode === m ? 'bg-indigo-900/40 border-indigo-600 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                            {m === 'merge' ? 'Merge (Safe)' : 'Full Overwrite'}
                          </button>
                        ))}
                      </div>
                      <button onClick={handleImportData} disabled={!importFile} className={`w-full font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer ${importFile ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                        <RefreshCw size={14} /> {syncMode === 'merge' ? 'Merge & Sync' : 'Overwrite & Sync'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
