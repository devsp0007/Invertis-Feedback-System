import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Award, Compass, BarChart2, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/responses/analytics');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch evaluation analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#10b981', '#3b82f6'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                TLFQ Evaluation Analytics
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Deep analytical view into course ratings, instructor scores, and response trends.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            {loading ? (
              <div className="glass p-8 rounded-2xl border border-indigo-50 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px]">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !data ? (
              <div className="glass p-8 rounded-2xl border border-indigo-50 text-center">
                No telemetry recorded yet.
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {/* Visual Summary Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="glass p-5 rounded-2xl border border-indigo-50 dark:border-slate-800 flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                      <TrendingUp size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Top Faculty Rating</p>
                      <h4 className="text-xl font-black text-slate-800 dark:text-slate-200">
                        {data.avgRatingPerFaculty.length > 0
                          ? Math.max(...data.avgRatingPerFaculty.map((f) => f.avg_rating)).toFixed(1)
                          : '0.0'} / 7.0
                      </h4>
                    </div>
                  </div>

                  <div className="glass p-5 rounded-2xl border border-indigo-50 dark:border-slate-800 flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Submissions Received</p>
                      <h4 className="text-xl font-black text-slate-800 dark:text-slate-200">
                        {data.rawResponses.length} total
                      </h4>
                    </div>
                  </div>

                  <div className="glass p-5 rounded-2xl border border-indigo-50 dark:border-slate-800 flex items-center gap-4">
                    <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                      <BarChart2 size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Active Course Rating</p>
                      <h4 className="text-xl font-black text-slate-800 dark:text-slate-200">
                        {data.questionAnalytics.length > 0
                          ? (
                              data.questionAnalytics.reduce((sum, q) => sum + q.avg_rating, 0) /
                              data.questionAnalytics.length
                            ).toFixed(1)
                          : '0.0'} / 7.0
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Main Visual Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 1. Bar Chart: Question Telemetry Analytics */}
                  <div className="glass p-6 rounded-3xl border border-indigo-50 dark:border-slate-800 flex flex-col gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <HelpCircle size={18} className="text-indigo-500" />
                        Criteria Question Averages
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Mean evaluations across questions</p>
                    </div>

                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.questionAnalytics} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                          <XAxis dataKey="question_id" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 7]} tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(255,255,255,0.92)',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              fontSize: '12px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}
                          />
                          <Bar dataKey="avg_rating" name="Average Rating" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 2. Bar Chart: Faculty Ratings */}
                  <div className="glass p-6 rounded-3xl border border-indigo-50 dark:border-slate-800 flex flex-col gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Award size={18} className="text-indigo-500" />
                        Avg Rating per Faculty
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Evaluations matched directly to faculty</p>
                    </div>

                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.avgRatingPerFaculty} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 7]} tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(255,255,255,0.92)',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              fontSize: '12px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}
                          />
                          <Bar dataKey="avg_rating" name="Average Rating" fill="#a855f7" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 3. Course Participation Rates */}
                  <div className="glass p-6 md:col-span-2 rounded-3xl border border-indigo-50 dark:border-slate-800 flex flex-col gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Course Participation Summary</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Enrolled vs submitted responses per course</p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-indigo-50 dark:border-slate-800">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-indigo-50 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="p-4">Course Name</th>
                            <th className="p-4">Total Students</th>
                            <th className="p-4">Total Responded</th>
                            <th className="p-4">Participation %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50/60 dark:divide-slate-800/60 font-medium">
                          {data.submissionRates.map((c) => (
                            <tr key={c.course_id} className="text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50/30">
                              <td className="p-4 font-bold">[{c.course_code}] {c.course_name}</td>
                              <td className="p-4">{c.enrolled}</td>
                              <td className="p-4">{c.submitted}</td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 font-bold rounded-lg text-xs">
                                  {c.rate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
