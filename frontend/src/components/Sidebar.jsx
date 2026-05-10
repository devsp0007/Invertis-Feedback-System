import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart2, PlusCircle, LayoutDashboard, 
  Settings, Building2, GraduationCap, Shield, Users 
} from 'lucide-react';
import { motion } from 'framer-motion';

const ROLE_LINKS = {
  admin: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Manage Students', icon: Users },
    { to: '/admin/courses', label: 'Create Evaluation', icon: PlusCircle },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/admin/directory', label: 'Directory', icon: Settings },
  ],
  hod: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/hod/students', label: 'My Students', icon: Users },
    { to: '/hod/analytics', label: 'Dept. Analytics', icon: BarChart2 },
  ],
  student: [
    { to: '/dashboard', label: 'My Courses', icon: GraduationCap },
  ],
};

const ROLE_BADGES = {
  admin: { label: 'System Admin', icon: Shield, colors: 'bg-violet-900/40 text-violet-300 border-violet-800' },
  hod: { label: 'Head of Dept.', icon: Building2, colors: 'bg-blue-900/40 text-blue-300 border-blue-800' },
  student: { label: 'Student', icon: GraduationCap, colors: 'bg-emerald-900/40 text-emerald-300 border-emerald-800' },
};

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const links = ROLE_LINKS[user?.role] || ROLE_LINKS.student;
  const badge = ROLE_BADGES[user?.role];

  return (
    <div className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-2 min-h-[calc(100vh-65px)] select-none transition-colors duration-300">
      {/* Role badge */}
      {badge && (
        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-wider mb-4 ${
          user.role === 'admin' ? 'bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 border-violet-100 dark:border-violet-800' :
          user.role === 'hod' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800' :
          'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800'
        }`}>
          <badge.icon size={14} />
          {badge.label}
        </div>
      )}

      <div className="flex flex-col gap-1 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link to={link.to} key={link.to}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer text-sm font-bold transition-all border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-100 hover:bg-indigo-50/50 dark:hover:bg-slate-800 border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                {link.label}
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mt-auto">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-wide">
          Confidentiality
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Feedback is strictly <span className="text-indigo-500 dark:text-slate-300 font-bold">anonymous</span>.
        </p>
      </div>
    </div>
  );
}
