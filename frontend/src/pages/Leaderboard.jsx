import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Trophy, Star, Medal, Users, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    api.get('/student/leaderboard')
      .then(res => setStudents(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-4xl mx-auto">
            
            <div className="text-center mb-6">
              <div className="inline-flex h-16 w-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl items-center justify-center shadow-xl shadow-amber-500/20 mb-4">
                <Trophy size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-100">Top Contributors</h1>
              <p className="text-sm text-slate-400 mt-2">Earn points by submitting feedback and improving teaching quality.</p>
            </div>

            {loading ? (
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-12 flex justify-center">
                <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-12 text-center flex flex-col items-center">
                <Users size={40} className="text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-300">No data available</h3>
                <p className="text-slate-500 text-sm mt-1">Submit feedback to appear on the leaderboard!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {students.map((s, idx) => (
                  <motion.div 
                    key={s.unique_feedback_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      idx === 0 ? 'bg-gradient-to-r from-amber-900/40 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-900/20 scale-[1.02]' :
                      idx === 1 ? 'bg-slate-800 border-slate-400/50' :
                      idx === 2 ? 'bg-slate-800 border-amber-700/50' :
                      'bg-slate-900 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className={`h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-lg shadow-inner ${
                      idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-white shadow-amber-900' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-slate-700' :
                      idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-amber-950' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      #{s.rank}
                    </div>

                    {/* ID & Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {user?.role === 'super_admin' ? (
                          <>
                            <h3 className="font-bold text-slate-100 text-lg">{s.name}</h3>
                            <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/50">{s.student_id}</span>
                          </>
                        ) : (
                          <h3 className="font-mono font-bold text-slate-200 text-lg">{s.unique_feedback_id}</h3>
                        )}
                        {idx === 0 && <Medal size={16} className="text-amber-400" />}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">Batch: {s.batch || '2025'}</div>
                    </div>

                    {/* Points */}
                    <div className="flex flex-col items-end justify-center">
                      <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="font-black text-amber-400">{s.points}</span>
                        <span className="text-xs text-slate-500 font-bold ml-0.5">PTS</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
