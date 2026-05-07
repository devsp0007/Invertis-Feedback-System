import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Award, BarChart2, TrendingUp, BookOpen, Building2, MessageSquare, Star } from 'lucide-react';

const COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('faculty');

  useEffect(() => {
    api.get('/responses/analytics')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'faculty', label: 'Faculty Rankings', icon: Award },
    { id: 'courses', label: 'Course Reports', icon: BookOpen },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'comments', label: 'Feedback Insights', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 size={20} className="text-indigo-400" />
                <h1 className="text-2xl font-black text-slate-100">University Analytics</h1>
              </div>
              <p className="text-sm text-slate-400">Full visibility into all feedback data across departments.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800 flex-wrap">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer -mb-px ${
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
            ) : !data ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center text-slate-400">No analytics data available.</div>
            ) : (
              <>
                {/* FACULTY TAB */}
                {activeTab === 'faculty' && (
                  <div className="flex flex-col gap-5">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <TrendingUp size={15} className="text-indigo-400" /> Faculty Average Ratings (out of 7)
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.avgRatingPerFaculty} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <XAxis type="number" domain={[0, 7]} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={140} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0' }}
                              formatter={v => [`${v}/7`, 'Avg. Rating']}
                            />
                            <Bar dataKey="avg_rating" radius={[0, 6, 6, 0]}>
                              {data.avgRatingPerFaculty.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {data.avgRatingPerFaculty.map((f, i) => (
                        <div key={f.id} className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-700'}`}>
                            #{i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-slate-200">{f.name}</div>
                            <div className="text-xs text-slate-500">{f.department_name} • {f.total_responses} responses</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <span className={`text-base font-black ${f.avg_rating >= 5 ? 'text-emerald-400' : f.avg_rating >= 3.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {f.avg_rating.toFixed(1)}<span className="text-xs text-slate-500 font-normal">/7</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* COURSES TAB */}
                {activeTab === 'courses' && (
                  <div className="flex flex-col gap-3">
                    {(data.submissionRates || []).map(c => (
                      <div key={c.course_id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/40">{c.course_code}</span>
                              <h4 className="text-sm font-bold text-slate-200">{c.course_name}</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{c.department_name}</p>
                          </div>
                          <span className={`text-lg font-black ${c.rate >= 70 ? 'text-emerald-400' : c.rate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{c.rate}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${c.rate >= 70 ? 'bg-emerald-500' : c.rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${c.rate}%` }}
                          />
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-slate-500">
                          <span>{c.enrolled} enrolled</span><span>•</span><span>{c.submitted} submitted</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* DEPARTMENTS TAB */}
                {activeTab === 'departments' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(data.deptOverview || []).map(dept => (
                      <div key={dept.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-base font-bold text-slate-100">{dept.name}</h3>
                            <span className="text-xs font-mono text-slate-500">{dept.code}</span>
                          </div>
                          <span className={`text-xl font-black ${dept.avg_rating >= 5 ? 'text-emerald-400' : dept.avg_rating >= 3.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {dept.avg_rating.toFixed(1)}<span className="text-xs text-slate-500 font-normal">/7</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { label: 'Courses', value: dept.course_count },
                            { label: 'Faculty', value: dept.faculty_count },
                            { label: 'Students', value: dept.student_count },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-slate-900 border border-slate-700 rounded-xl p-2">
                              <div className="text-lg font-black text-slate-100">{value}</div>
                              <div className="text-xs text-slate-500">{label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* COMMENTS TAB */}
                {activeTab === 'comments' && (
                  <div className="flex flex-col gap-3">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-400">
                      All student comments are fully anonymous. No identity data is stored or displayed.
                    </div>
                    {(data.recentComments || []).map((c, i) => (
                      <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                        <p className="text-sm text-slate-300 italic leading-relaxed">"{c.comment}"</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                          <span className="font-medium text-slate-400">{c.faculty_name}</span>
                          <span>•</span><span>{c.course_name}</span>
                          <span>•</span><span>{new Date(c.submitted_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {(data.recentComments || []).length === 0 && (
                      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center text-slate-400 text-sm">No comments submitted yet.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
