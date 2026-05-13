import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn, Lock, User, ChevronRight, Eye, EyeOff,
  GraduationCap, Building2, Shield, Users, ArrowRight, ChevronLeft
} from 'lucide-react';
import api from '../services/api';

const roleHint = (id) => {
  if (!id) return null;
  if (id.includes('@')) {
    if (id.includes('admin')) return { icon: Shield, label: 'Super Admin', color: 'text-accent-400' };
    if (id.includes('coordinator')) return { icon: Users, label: 'Coordinator', color: 'text-violet-400' };
    if (id.includes('hod')) return { icon: Building2, label: 'Head of Department', color: 'text-blue-400' };
    return { icon: User, label: 'Staff Account', color: 'text-primary-400' };
  }
  if (/^[A-Z]{2,4}\d{4}_\d+$/.test(id.toUpperCase())) {
    return { icon: GraduationCap, label: 'Student Account', color: 'text-emerald-400' };
  }
  return null;
};

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  // Step 1: identifier. Step 2: password (+ optional pending registration)
  const [step,       setStep]       = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  // For pending students detected during login
  const [pendingStudent, setPendingStudent] = useState(null); // { student_id, name }

  // For new student registration (step 3)
  const [regEmail,   setRegEmail]   = useState('');
  const [regPass,    setRegPass]    = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  const hint = roleHint(identifier);
  const isStudentId = identifier && !identifier.includes('@');

  // ── Step 1: Validate identifier → go to step 2 ─────────────────────────
  const handleNext = async (e) => {
    e.preventDefault();
    setError('');
    const id = identifier.trim();
    if (!id) { setError('Please enter your email or Student ID.'); return; }

    // If it's a student ID, check its status first
    if (!id.includes('@')) {
      setLoading(true);
      try {
        const res = await api.post('/auth/check-student', { student_id: id.toUpperCase() });
        if (res.data.status === 'pending') {
          // Pending student → go to registration
          setPendingStudent({ student_id: id.toUpperCase(), name: res.data.name });
          setStep(3);
          return;
        }
        // Active student → go to password step
        setStep(2);
      } catch (err) {
        setError(err.response?.data?.message || 'Student ID not found. Contact your coordinator.');
      } finally {
        setLoading(false);
      }
    } else {
      // Staff email → go straight to password
      setStep(2);
    }
  };

  // ── Step 2: Submit login ────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      await login({ identifier: identifier.trim(), password });
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === 'ACCOUNT_PENDING') {
        // Should have been caught at step 1, but handle it anyway
        setPendingStudent({ student_id: err.response.data.student_id, name: err.response.data.name });
        setStep(3);
        return;
      }
      setError(msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Complete student registration ──────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regEmail || !regPass || !regConfirm) { setError('All fields are required.'); return; }
    if (regPass !== regConfirm) { setError('Passwords do not match.'); return; }
    if (regPass.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/complete-registration', {
        student_id: pendingStudent.student_id, email: regEmail, password: regPass
      });
      await login({ identifier: regEmail, password: regPass });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetToStep1 = () => {
    setStep(1); setError(''); setPassword(''); setPendingStudent(null);
    setRegEmail(''); setRegPass(''); setRegConfirm('');
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0F2D52, transparent)' }} />
      <div className="absolute bottom-1/3 right-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #1D4E89, transparent)' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-sm z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #0F2D52 0%, #1D4E89 100%)', boxShadow: '0 0 40px rgba(15, 45, 82, 0.6)' }}>
              IF
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Invertis Feedback</h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">Teaching-Learning Feedback System</p>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
          {/* Progress bar */}
          <div className="h-0.5 bg-white/5">
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #0F2D52, #1D4E89)' }}
              animate={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
              transition={{ duration: 0.4, ease: 'easeOut' }} />
          </div>

          <div className="p-7">
            {/* Step label */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">
                  Step {step} of {pendingStudent || step === 3 ? 3 : 2}
                </div>
                <h2 className="text-base font-bold text-slate-100">
                  {step === 1 && 'Sign In'}
                  {step === 2 && 'Enter Password'}
                  {step === 3 && `Welcome, ${pendingStudent?.name?.split(' ')[0]}!`}
                </h2>
              </div>
              {step > 1 && (
                <button onClick={resetToStep1}
                  className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-300 transition-colors cursor-pointer">
                  <ChevronLeft size={14} /> Back
                </button>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-accent-500/10 text-accent-400 border border-accent-500/20 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-400 flex-shrink-0 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">

              {/* ── STEP 1: Identifier ─────────────────────────────────────── */}
              {step === 1 && (
                <motion.form key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  onSubmit={handleNext} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">
                      Email or Student ID
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
                      <input
                        type="text"
                        value={identifier}
                        onChange={e => { setIdentifier(e.target.value); setError(''); }}
                        placeholder="email@invertis.edu.in  or  BCS2025_01"
                        autoFocus
                        className="input-base pl-10 pr-10"
                      />
                      {hint && (
                        <hint.icon className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${hint.color}`} size={15} />
                      )}
                    </div>
                    {hint && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-1.5 text-[10px] font-bold ${hint.color}`}>
                        <hint.icon size={11} /> {hint.label}
                      </motion.div>
                    )}
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary justify-center py-3 mt-1">
                    {loading
                      ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><span>Continue</span><ChevronRight size={16} /></>
                    }
                  </button>

                  <p className="text-center text-[11px] text-slate-600">
                    Enter your university email or student roll number
                  </p>
                </motion.form>
              )}

              {/* ── STEP 2: Password ────────────────────────────────────────── */}
              {step === 2 && (
                <motion.form key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  onSubmit={handleLogin} className="flex flex-col gap-4">

                  {/* Who is logging in */}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                    {hint && <hint.icon size={14} className={hint.color} />}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200 truncate">{identifier}</div>
                      {hint && <div className={`text-[10px] font-semibold ${hint.color}`}>{hint.label}</div>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="Enter your password"
                        autoFocus
                        className="input-base pl-10 pr-11"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary justify-center py-3">
                    {loading
                      ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><LogIn size={16} /><span>Sign In</span></>
                    }
                  </button>
                </motion.form>
              )}

              {/* ── STEP 3: First-time Student Registration ─────────────────── */}
              {step === 3 && (
                <motion.form key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  onSubmit={handleRegister} className="flex flex-col gap-3.5">

                  <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-[11px] text-emerald-300">
                    Your account is pending activation. Set your email and create a password to get started.
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Your Email Address</label>
                    <input type="email" value={regEmail} onChange={e => { setRegEmail(e.target.value); setError(''); }}
                      placeholder="yourname@email.com" autoFocus className="input-base" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Create Password</label>
                    <div className="relative">
                      <input type={showRegPass ? 'text' : 'password'} value={regPass}
                        onChange={e => { setRegPass(e.target.value); setError(''); }}
                        placeholder="Min. 8 characters" className="input-base pr-11" />
                      <button type="button" onClick={() => setShowRegPass(!showRegPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 cursor-pointer">
                        {showRegPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Confirm Password</label>
                    <input type="password" value={regConfirm} onChange={e => { setRegConfirm(e.target.value); setError(''); }}
                      placeholder="Re-enter password" className="input-base" />
                  </div>

                  <button type="submit" disabled={loading}
                    className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm text-white cursor-pointer disabled:opacity-50 transition-all mt-1"
                    style={{ background: 'linear-gradient(135deg, #A61E2D, #C62828)', boxShadow: '0 0 20px rgba(198, 40, 40, 0.4)' }}>
                    {loading
                      ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><ArrowRight size={16} /><span>Activate Account & Login</span></>
                    }
                  </button>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6">
          Invertis University, Bareilly &nbsp;·&nbsp; TLFQ v2.0 &nbsp;·&nbsp; © 2025
        </p>
      </motion.div>
    </div>
  );
}
