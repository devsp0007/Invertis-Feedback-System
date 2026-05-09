import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Award, BarChart2, TrendingUp, BookOpen, MessageSquare, Star, Filter, ArrowRight } from 'lucide-react';

const COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('faculty');
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const [teacherTypeFilter, setTeacherTypeFilter] = useState('all'); // 'all' | 'college_faculty' | 'trainer'

  useEffect(() => {
    api.get('/responses/analytics')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deptFiltered = selectedDeptId === 'all'
    ? (data?.avgRatingPerFaculty || [])
    : (data?.avgRatingPerFaculty || []).filter(f => f.department_id === selectedDeptId);

  const filteredAvgRatingPerFaculty = teacherTypeFilter === 'all'
    ? deptFiltered
    : deptFiltered.filter(f => f.teacher_type === teacherTypeFilter);

  const filteredSubmissionRates = selectedDeptId === 'all'
    ? []
    : (data?.submissionRates || []).filter(c => c.department_id === selectedDeptId);

  const filteredRecentComments = selectedDeptId === 'all'
    ? []
    : (data?.recentComments || []).filter(c => c.department_id === selectedDeptId);

  const tabs = [
    { id: 'faculty', label: 'Faculty Rankings', icon: Award },
    { id: 'courses', label: 'Course Reports', icon: BookOpen },
    { id: 'comments', label: 'Feedback Insights', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 lg:p-12 relative overflow-hidden">
          
          {/* Decorative background glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 relative z-10 max-w-6xl mx-auto">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 p-6 rounded-3xl shadow-2xl">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <BarChart2 size={20} className="text-white" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    Targeted Analytics
                  </h1>
                </div>
                <p className="text-sm text-slate-400 font-medium ml-1">Analyze performance and feedback for specific departments.</p>
              </div>

              {data && data.deptOverview && data.deptOverview.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Dept filter */}
                  <div className="flex items-center gap-3 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800/80">
                    <div className="pl-3 text-slate-500"><Filter size={16} /></div>
                    <select
                      value={selectedDeptId}
                      onChange={e => setSelectedDeptId(e.target.value)}
                      className="bg-transparent pl-1 pr-10 py-2.5 text-sm font-bold text-slate-200 focus:outline-none cursor-pointer appearance-none w-full md:w-52"
                      style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                    >
                      <option value="all" className="bg-slate-900">Choose a Department...</option>
                      {data.deptOverview.map(d => (
                        <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Teacher type filter */}
                  <div className="flex items-center gap-1 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800/80">
                    {[['all','All Types'],['college_faculty','Faculty'],['trainer','Trainer']].map(([val, lbl]) => (
                      <button key={val} onClick={() => setTeacherTypeFilter(val)}
                        className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          teacherTypeFilter === val
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-16 flex justify-center">
                <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-500/20" />
              </div>
            ) : !data ? (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-16 text-center text-slate-400 font-medium">No analytics data available.</div>
            ) : selectedDeptId === 'all' ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-2xl">
                <div className="h-24 w-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
                  <BarChart2 size={40} className="text-indigo-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-100 mb-3">Select a Department</h2>
                <p className="text-slate-400 text-sm max-w-md leading-relaxed font-medium">
                  To view faculty rankings, course submission reports, and detailed feedback insights, please select a specific department from the dropdown menu above.
                </p>
                <div className="mt-8 flex items-center gap-2 text-indigo-400 text-sm font-bold animate-pulse">
                  <span>Use the filter above</span>
                  <ArrowRight size={16} />
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-900/50 backdrop-blur-md border border-slate-800/60 rounded-2xl w-fit">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                        activeTab === id
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* FACULTY TAB */}
                    {activeTab === 'faculty' && (
                      <div className="flex flex-col gap-6">
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 shadow-xl">
                          <h3 className="text-base font-black text-slate-100 mb-6 flex items-center gap-2">
                            <TrendingUp size={18} className="text-indigo-400" /> Faculty Average Ratings (out of 7)
                          </h3>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={filteredAvgRatingPerFaculty} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <XAxis type="number" domain={[0, 7]} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }} width={160} axisLine={false} tickLine={false} />
                                <Tooltip
                                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 16, color: '#f8fafc', fontWeight: 600, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                  formatter={v => [`${v}/7`, 'Avg. Rating']}
                                />
                                <Bar dataKey="avg_rating" radius={[0, 8, 8, 0]} barSize={24}>
                                  {filteredAvgRatingPerFaculty.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredAvgRatingPerFaculty.map((f, i) => (
                            <div key={f.id} className="flex items-center gap-5 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-5 hover:bg-slate-800/40 transition-colors shadow-lg">
                              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-inner ${i === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-600 shadow-amber-900/50' : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 shadow-slate-900/50' : i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 shadow-amber-950/50' : 'bg-slate-800'}`}>
                                #{i + 1}
                              </div>
                              <div className="flex-1">
                                <div className="text-base font-bold text-slate-100">{f.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    f.teacher_type === 'trainer'
                                      ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25'
                                      : 'text-violet-300 bg-violet-500/10 border-violet-500/25'
                                  }`}>
                                    {f.teacher_type === 'trainer' ? 'Trainer' : 'College Faculty'}
                                  </span>
                                  <span className="text-xs text-slate-400 font-medium">{f.total_responses} responses</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
                                <Star size={16} className="text-amber-400 fill-amber-400" />
                                <span className={`text-lg font-black ${f.avg_rating >= 5 ? 'text-emerald-400' : f.avg_rating >= 3.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                                  {f.avg_rating.toFixed(1)}<span className="text-xs text-slate-500 font-bold ml-0.5">/7</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* COURSES TAB */}
                    {activeTab === 'courses' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredSubmissionRates.map(c => (
                          <div key={c.course_id} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between mb-4">
                                <div className="pr-4">
                                  <span className="inline-block text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20 mb-2">{c.course_code}</span>
                                  <h4 className="text-base font-bold text-slate-100 leading-tight">{c.course_name}</h4>
                                </div>
                                <span className={`text-xl font-black ${c.rate >= 70 ? 'text-emerald-400' : c.rate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{c.rate}%</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-4">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${c.rate}%` }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                  className={`h-full rounded-full ${c.rate >= 70 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : c.rate >= 40 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-rose-500 to-rose-400'}`}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-bold text-slate-400 bg-slate-950/30 p-3 rounded-xl border border-slate-800/50">
                              <div className="flex flex-col">
                                <span className="text-slate-500 text-xs uppercase tracking-wider">Enrolled</span>
                                <span className="text-slate-200">{c.enrolled}</span>
                              </div>
                              <div className="w-px h-8 bg-slate-700" />
                              <div className="flex flex-col">
                                <span className="text-slate-500 text-xs uppercase tracking-wider">Submitted</span>
                                <span className="text-slate-200">{c.submitted}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* COMMENTS TAB */}
                    {activeTab === 'comments' && (
                      <div className="flex flex-col gap-4">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3 text-sm text-indigo-300 font-medium">
                          <MessageSquare size={18} className="text-indigo-400 flex-shrink-0" />
                          Student feedback is rigorously anonymized. No identifying details are exposed here.
                        </div>
                        {filteredRecentComments.length === 0 ? (
                          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-12 text-center text-slate-400 font-medium">No comments submitted yet for this department.</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredRecentComments.map((c, i) => (
                              <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 shadow-xl flex flex-col">
                                <p className="text-base text-slate-300 italic leading-relaxed mb-4 flex-1">"{c.comment}"</p>
                                <div className="pt-4 border-t border-slate-800 flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2 text-sm text-slate-400 font-bold">
                                    <span className="text-indigo-400">{c.faculty_name}</span>
                                    <span className="text-slate-600">•</span>
                                    <span>{c.course_name}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium">
                                    Submitted on {new Date(c.submitted_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
