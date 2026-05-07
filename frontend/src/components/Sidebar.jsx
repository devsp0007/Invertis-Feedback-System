import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, BarChart2, PlusCircle, LayoutDashboard, Settings, Building2, GraduationCap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const ROLE_LINKS = {
  admin: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/courses', label: 'Create Evaluation', icon: PlusCircle },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/admin/directory', label: 'Directory', icon: Settings },
  ],
  hod: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
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
    <div className="w-full md:w-60 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-2 min-h-[calc(100vh-65px)] select-none">
      {/* Role badge */}
      {badge && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold mb-2 ${badge.colors}`}>
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition-all border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-950/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800 border-transparent'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500'} />
                {link.label}
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mt-auto">
        <p className="text-xs text-slate-500 leading-relaxed">
          All feedback is <span className="text-slate-300 font-semibold">anonymous</span>. Student identities are never disclosed in reports.
        </p>
      </div>
    </div>
  );
}
