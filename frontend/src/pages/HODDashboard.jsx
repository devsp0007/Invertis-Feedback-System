import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  BarChart2, Star, Users, BookOpen, Building2,
  MessageSquare, TrendingUp, Award, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

function RatingBadge({ value, max = 7 }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400';
  return <span className={`text-lg font-black ${color}`}>{value.toFixed(1)}<span className="text-xs text-slate-500 font-normal">/{max}</span></span>;
}

export default function HODDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get('/responses/analytics')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleTogglePortal = async (deptId, currentStatus) => {
    try {
      const res = await api.put(`/tlfq/departments/${deptId}/portal`, { open: !currentStatus });
      setData(prev => ({
        ...prev,
        deptOverview: prev.deptOverview.map(d =>
          d.id === deptId ? { ...d, portal_open: res.data.portal_open } : d
        )
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to toggle portal status');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'faculty', label: 'Faculty Rankings', icon: Award },
    { id: 'courses', label: 'Course Reports', icon: BookOpen },
    { id: 'comments', label: 'Feedback Insights', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 size={20} className="text-blue-400" />
                <h1 className="text-2xl font-black text-slate-100">Department Analytics</h1>
              </div>
              <p className="text-sm text-slate-400">
                Feedback insights for your department — all data is fully anonymous.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-0 flex-wrap">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer -mb-px ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(n => <div key={n} className="h-36 bg-slate-800 animate-pulse rounded-2xl border border-slate-700" />)}
              </div>
            ) : !data ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center text-slate-400">No data available.</div>
            ) : (
              <>
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="flex flex-col gap-5">
                    {(data.deptOverview || []).map(dept => (
                      <div key={dept.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-slate-100">{dept.name}</h3>
                              <button
                                onClick={() => handleTogglePortal(dept.id, dept.portal_open)}
                                className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                                  dept.portal_open
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                                }`}
                              >
                                {dept.portal_open ? '● Forms Open' : '○ Forms Closed'}
                              </button>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">{dept.code}</span>
                          </div>
                          <RatingBadge value={dept.avg_rating} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { icon: BookOpen, label: 'Courses', value: dept.course_count },
                            { icon: Users, label: 'Faculty Records', value: dept.faculty_count },
                            { icon: Users, label: 'Students', value: dept.student_count },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center">
                              <Icon size={16} className="text-blue-400 mx-auto mb-1" />
                              <div className="text-xl font-black text-slate-100">{value}</div>
                              <div className="text-xs text-slate-500">{label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(data.deptOverview || []).length === 0 && (
                      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center text-slate-400 text-sm">
                        No department data found.
                      </div>
                    )}
                  </div>
                )}

                {/* FACULTY TAB */}
                {activeTab === 'faculty' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <TrendingUp size={15} className="text-blue-400" /> Faculty Performance Ranking
                      </h3>
                      {(data.avgRatingPerFaculty || []).length === 0 ? (
                        <p className="text-slate-500 text-sm">No faculty data yet.</p>
                      ) : (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.avgRatingPerFaculty} layout="vertical" margin={{ left: 0, right: 20 }}>
                              <XAxis type="number" domain={[0, 7]} tick={{ fill: '#64748b', fontSize: 11 }} />
                              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={130} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0' }}
                                formatter={(v) => [`${v}/7`, 'Avg. Rating']}
                              />
                              <Bar dataKey="avg_rating" radius={[0, 6, 6, 0]}>
                                {(data.avgRatingPerFaculty || []).map((_, i) => (
                                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {(data.avgRatingPerFaculty || []).map((f, i) => (
                        <div key={f.id} className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-700'}`}>
                            #{i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-200 text-sm">{f.name}</div>
                            <div className="text-xs text-slate-500">{f.total_responses} responses • {f.department_name}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <RatingBadge value={f.avg_rating} />
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
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded">{c.course_code}</span>
                              <h4 className="text-sm font-bold text-slate-200">{c.course_name}</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{c.department_name}</p>
                          </div>
                          <span className={`text-sm font-black ${c.rate >= 70 ? 'text-emerald-400' : c.rate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {c.rate}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${c.rate >= 70 ? 'bg-emerald-500' : c.rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${c.rate}%` }}
                          />
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-slate-500">
                          <span>{c.enrolled} enrolled</span>
                          <span>•</span>
                          <span>{c.submitted} submitted</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* COMMENTS TAB */}
                {activeTab === 'comments' && (
                  <div className="flex flex-col gap-3">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-400">
                      <Users size={13} className="text-blue-400 flex-shrink-0" />
                      All comments are fully anonymous. No student identity is ever linked to a comment.
                    </div>
                    {(data.recentComments || []).length === 0 ? (
                      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center text-slate-400 text-sm">No comments submitted yet.</div>
                    ) : (
                      (data.recentComments || []).map((c, i) => (
                        <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                          <p className="text-sm text-slate-300 italic leading-relaxed">"{c.comment}"</p>
                          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                            <span className="font-medium text-slate-400">{c.faculty_name}</span>
                            <span>•</span>
                            <span>{c.course_name}</span>
                            <span>•</span>
                            <span>{new Date(c.submitted_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
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
