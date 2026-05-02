import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout, theme, toggleTheme } = useAuth();

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass sticky top-0 z-50 flex items-center justify-between px-6 py-4 shadow-sm border-b border-indigo-100 dark:border-slate-800 transition-colors duration-300 select-none backdrop-blur-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950 font-bold tracking-wide">
          TL
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 leading-none">
            Invertis Feedback Platform
            {user?.role === 'admin' && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800">
                <Shield size={12} /> Admin
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Silently improving teaching & learning</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden md:flex flex-col items-end text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{user.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role} Account</span>
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 border border-rose-100 dark:border-rose-900/50 px-3.5 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </motion.nav>
  );
}
