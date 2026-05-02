import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Sparkles, UserPlus, Shield } from 'lucide-react';

export default function Login() {
  const { login, register, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);

  // Sign In / Sign Up fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister) {
      if (!name || !email || !password) {
        setError('All fields are required for registration.');
        return;
      }
      setLoading(true);
      try {
        await register(name, email, password, role);
        setSuccess('Registration successful! You can now sign in.');
        setIsRegister(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to create an account. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        setError('Both email and password are required.');
        return;
      }
      setLoading(true);
      try {
        await login(email, password);
        navigate('/dashboard');
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Invalid login credentials. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickLogin = async (usrEmail, usrPass) => {
    setEmail(usrEmail);
    setPassword(usrPass);
    setIsRegister(false);
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await login(usrEmail, usrPass);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Quick Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200/40 via-transparent to-transparent dark:from-indigo-900/10 pointer-events-none select-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl border border-indigo-100 dark:border-slate-800 z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 bg-indigo-600 dark:bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-black mb-3 shadow-xl shadow-indigo-200 dark:shadow-indigo-950/50">
            TL
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            {isRegister ? 'Student Registration' : 'Sign in to Platform'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Teaching-Learning Feedback Questionnaire</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 text-xs font-semibold rounded-xl"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 text-xs font-semibold rounded-xl"
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Full Name</label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" size={19} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Student Name"
                  className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all font-medium text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" size={19} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@invertis.edu.in"
                className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" size={19} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all font-medium text-sm"
              />
            </div>
          </div>

          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all font-medium text-sm"
              >
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-400/30 dark:shadow-indigo-950 flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer disabled:opacity-75"
          >
            {loading ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isRegister ? (
              <>
                <UserPlus size={18} />
                <span>Create Student Account</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center mt-5 text-xs text-slate-600 dark:text-slate-400">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline select-none cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline select-none cursor-pointer"
              >
                Register here
              </button>
            </p>
          )}
        </div>

        {!isRegister && (
          <>
            <div className="relative flex py-4 items-center mt-2">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400">Quick Test Credentials</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickLogin('student1@invertis.edu.in', 'student123')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700 font-semibold text-xs cursor-pointer select-none"
              >
                <Sparkles size={13} className="text-indigo-500" /> Student Login
              </button>
              <button
                onClick={() => handleQuickLogin('admin@invertis.edu.in', 'admin123')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700 font-semibold text-xs cursor-pointer select-none"
              >
                <Sparkles size={13} className="text-indigo-500" /> Admin Login
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
