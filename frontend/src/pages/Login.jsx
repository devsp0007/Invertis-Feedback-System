import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Zap, Shield, Building2, GraduationCap, Sun, Moon } from 'lucide-react';

const QUICK_LOGINS = [
  { label: 'System Admin', id: 'admin@invertis.edu.in', pass: 'admin123', icon: Shield, color: 'from-indigo-600 to-violet-700', badge: 'bg-indigo-900/40 text-indigo-300', role: 'admin' },
  { label: 'HOD (CSE)', id: 'hod.cse@invertis.edu.in', pass: 'staff123', icon: Building2, color: 'from-amber-500 to-orange-600', badge: 'bg-amber-900/40 text-amber-300', role: 'hod' },
  { label: 'Student (Demo)', id: '2024001', pass: 'student123', icon: GraduationCap, color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-900/40 text-emerald-300', role: 'student' },
];

export default function Login() {
  const { login, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(null);

  const handleLogin = async (e, qId, qPass) => {
    if (e) e.preventDefault();
    const loginId = qId || identifier;
    const loginPass = qPass || password;
    setError('');
    if (!loginId || !loginPass) { setError('Identifier and password are required.'); return; }

    if (qId) setQuickLoading(qId);
    else setLoading(true);

    try {
      await login(loginId, loginPass);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
      setQuickLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Theme Toggle in Login */}
      <div className="absolute top-8 right-8 z-20">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white shadow-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-4 shadow-2xl shadow-indigo-500/30">
            TL
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">TLFQ Platform</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Teaching-Learning Feedback System • Invertis University</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-500/5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Sign in to your account</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 text-xs font-semibold rounded-xl"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider ml-1">College ID / Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder="2024XXX or staff@invertis.edu.in"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 pl-12 pr-4 py-3.5 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 pl-12 pr-4 py-3.5 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-75 mt-2"
            >
              {loading
                ? <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><LogIn size={17} /><span>Sign In to Platform</span></>
              }
            </button>
          </form>

          {/* Quick Login */}
          <div className="relative flex py-6 items-center">
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
            <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 flex items-center gap-1.5">
              <Zap size={12} /> Quick Demo Access
            </span>
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
          </div>

          <div className="flex flex-col gap-2.5">
            {QUICK_LOGINS.map(({ label, id: qId, pass, icon: Icon, color, badge, role }) => (
              <button
                key={qId}
                onClick={() => handleLogin(null, qId, pass)}
                disabled={!!quickLoading}
                className="w-full flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-slate-600 rounded-2xl transition-all cursor-pointer group disabled:opacity-60 shadow-sm hover:shadow-lg active:scale-95"
              >
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/10`}>
                  {quickLoading === qId
                    ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Icon size={18} className="text-white" />
                  }
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{label}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{qId}</div>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                  role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-300' :
                  role === 'hod' ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-300' :
                  'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-500 dark:text-emerald-300'
                }`}>
                  {role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
