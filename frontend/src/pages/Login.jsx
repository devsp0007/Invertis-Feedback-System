import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Zap, Shield, Building2, GraduationCap } from 'lucide-react';

const QUICK_LOGINS = [
  { label: 'System Admin', email: 'admin@invertis.edu.in', pass: 'admin123', icon: Shield, color: 'from-violet-600 to-purple-700', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { label: 'HOD – CSE', email: 'hod.cse@invertis.edu.in', pass: 'hod123', icon: Building2, color: 'from-blue-600 to-cyan-700', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { label: 'Student', email: 'student1@invertis.edu.in', pass: 'student123', icon: GraduationCap, color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(null);

  const handleLogin = async (e, qEmail, qPass) => {
    if (e) e.preventDefault();
    const loginEmail = qEmail || email;
    const loginPass = qPass || password;
    setError('');
    if (!loginEmail || !loginPass) { setError('Email and password are required.'); return; }

    if (qEmail) setQuickLoading(qEmail);
    else setLoading(true);

    try {
      const user = await login(loginEmail, loginPass);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
      setQuickLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

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
          <h1 className="text-2xl font-black text-white tracking-tight">TLFQ Platform</h1>
          <p className="text-sm text-slate-400 mt-1">Teaching-Learning Feedback System • Invertis University</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Sign in to your account</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3.5 bg-rose-950/50 text-rose-400 border border-rose-900/60 text-xs font-semibold rounded-xl"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-600" size={18} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@invertis.edu.in"
                  className="w-full bg-slate-800 text-slate-100 pl-11 pr-4 py-3 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-600" size={18} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 text-slate-100 pl-11 pr-4 py-3 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder-slate-600"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer disabled:opacity-75 mt-1"
            >
              {loading
                ? <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><LogIn size={17} /><span>Sign In</span></>
              }
            </button>
          </form>

          {/* Quick Login */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-800" />
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Zap size={12} /> Quick Demo Login
            </span>
            <div className="flex-grow border-t border-slate-800" />
          </div>

          <div className="flex flex-col gap-2.5">
            {QUICK_LOGINS.map(({ label, email: qEmail, pass, icon: Icon, color, badge }) => (
              <button
                key={qEmail}
                onClick={() => handleLogin(null, qEmail, pass)}
                disabled={!!quickLoading}
                className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl transition-all cursor-pointer group disabled:opacity-60"
              >
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                  {quickLoading === qEmail
                    ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Icon size={15} className="text-white" />
                  }
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-slate-200">{label}</div>
                  <div className="text-xs text-slate-500">{qEmail}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${badge}`}>
                  {label.includes('Admin') ? 'admin' : label.includes('HOD') ? 'hod' : 'student'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
