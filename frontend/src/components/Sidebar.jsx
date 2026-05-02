import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, BarChart2, PlusCircle, LayoutDashboard, Compass, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const studentLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
  ];

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/courses', label: 'Create Evaluation', icon: PlusCircle },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/admin/directory', label: 'Directory Management', icon: Settings }
  ];

  const currentLinks = user?.role === 'admin' ? adminLinks : studentLinks;


  return (
    <div className="w-full md:w-64 glass border-r border-indigo-100 dark:border-slate-800 p-4 flex flex-col gap-2 min-h-[calc(100vh-76px)] select-none">
      <div className="px-3 mb-4">
        <p className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Navigation</p>
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        {currentLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <Link to={link.to} key={link.to}>
              <motion.div
                whileHover={{ x: 5 }}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-indigo-950/20'
                    : 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-transparent'
                }`}
              >
                <Icon size={19} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'} />
                {link.label}
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-4 mt-auto border border-indigo-100 dark:border-slate-800 flex flex-col gap-2">
        <Compass size={22} className="text-indigo-500 dark:text-indigo-400 animate-pulse" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Support System</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">Feedback allows the university to address academic needs.</p>
      </div>
    </div>
  );
}
