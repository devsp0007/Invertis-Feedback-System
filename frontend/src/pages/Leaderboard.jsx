import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Trophy, Star, Medal, Users, ShieldAlert } from 'lucide-react';

export default function Leaderboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/leaderboard')
      .then(res => setStudents(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen mesh-bg text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-4xl mx-auto">

            {/* Header */}
            <div className="text-center mb-2">
              <div className="inline-flex h-16 w-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl items-center justify-center shadow-xl shadow-amber-500/20 mb-4">
                <Trophy size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-100">Top Contributors</h1>
              <p className="text-sm text-slate-400 mt-2">
                Earn points by submitting feedback and improving teaching quality.
              </p>
            </div>

            {/* Anonymity notice */}
            <div className="flex items-start gap-3 p-3.5 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl">
              <ShieldAlert size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-300 leading-relaxed">
                <span className="font-bold">Anonymous Leaderboard</span> — Student identities are protected.
                Only their system-generated anonymous ID is displayed here.
                Real identities can only be viewed by Super Admin or Supreme Authority.
              </p>
            </div>

            {loading ? (
              <div className="card rounded-3xl p-12 flex justify-center">
                <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="card rounded-3xl p-12 text-center flex flex-col items-center">
                <Users size={40} className="text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-300">No data available yet</h3>
                <p className="text-slate-500 text-sm mt-1">Submit feedback to appear on the leaderboard!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {students.map((s, idx) => (
                  <motion.div
                    key={s.unique_feedback_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      idx === 0 ? 'bg-gradient-to-r from-amber-900/40 to-slate-900/80 border-amber-500/50 shadow-lg shadow-amber-900/20 scale-[1.02]' :
                      idx === 1 ? 'card border-slate-400/30' :
                      idx === 2 ? 'card border-amber-700/30' :
                      'card hover:border-white/15'
                    }`}
                  >
                    {/* Rank badge */}
                    <div className={`h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-lg shadow-inner ${
                      idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-white' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                      idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      #{s.rank}
                    </div>

                    {/* Anonymous ID */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-slate-100 text-lg tracking-wider">
                          {s.unique_feedback_id}
                        </span>
                        {idx === 0 && <Medal size={16} className="text-amber-400 flex-shrink-0" />}
                        {idx === 1 && <Medal size={16} className="text-slate-300 flex-shrink-0" />}
                        {idx === 2 && <Medal size={16} className="text-amber-700 flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">
                        Anonymous Participant · Batch: {s.batch || '2025'}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="font-black text-amber-400 text-sm">{s.points}</span>
                        <span className="text-xs text-slate-500 font-bold">PTS</span>
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
