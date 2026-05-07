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
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 select-none backdrop-blur-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-950">
          TL
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 leading-none">Invertis TLFQ Platform</h1>
          <p className="text-xs text-slate-500 mt-0.5">Teaching-Learning Feedback System</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden md:flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-200">{user.name}</div>
              <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[user.role]}`}>
                <RoleIcon size={10} />
                {user.role === 'hod' ? 'Head of Department' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all border border-slate-700"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-800 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </motion.nav>
  );
}
