import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, Shield, Building2, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

const ROLE_COLORS = {
  admin: 'bg-violet-900/50 text-violet-300 border-violet-800',
  hod:   'bg-blue-900/50 text-blue-300 border-blue-800',
  student: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
};
const ROLE_ICONS = { admin: Shield, hod: Building2, student: GraduationCap };

export default function Navbar() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const RoleIcon = ROLE_ICONS[user?.role] || GraduationCap;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 select-none backdrop-blur-md transition-colors duration-300"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-xs shadow-lg shadow-indigo-500/20">
          TL
        </div>
        <div>
          <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">Invertis TLFQ</h1>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">Evaluation Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden md:flex items-center gap-3 pr-4 border-r border-slate-100 dark:border-slate-800">
            <div className="text-right">
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">{user.name}</div>
              <div className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-md border ${
                user.role === 'admin' ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border-violet-100 dark:border-violet-800' :
                user.role === 'hod' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800' :
                'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800'
              }`}>
                <RoleIcon size={10} />
                {user.role}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all border border-slate-100 dark:border-slate-700 cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-slate-100 dark:border-slate-700 hover:border-rose-100 dark:hover:border-rose-900/50 px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
