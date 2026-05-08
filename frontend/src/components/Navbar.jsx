import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, Building2, GraduationCap, Users, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin',  icon: Shield,       color: 'text-rose-300',   bg: 'bg-rose-500/10 border-rose-500/25' },
  coordinator: { label: 'Coordinator',  icon: Users,        color: 'text-violet-300', bg: 'bg-violet-500/10 border-violet-500/25' },
  hod:         { label: 'Head of Dept', icon: Building2,    color: 'text-blue-300',   bg: 'bg-blue-500/10 border-blue-500/25' },
  student:     { label: 'Student',      icon: GraduationCap,color: 'text-emerald-300',bg: 'bg-emerald-500/10 border-emerald-500/25' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const role = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student;
  const RoleIcon = role.icon;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 border-b border-white/[0.06] select-none"
      style={{ background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
          <span className="text-white font-black text-xs tracking-tight">IF</span>
        </div>
        <div className="hidden sm:block">
          <div className="text-[13px] font-bold text-white leading-none">Invertis Feedback</div>
          <div className="text-[10px] text-slate-500 mt-0.5 leading-none">Teaching-Learning Feedback System</div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {user && (
          <div className="hidden md:flex items-center gap-3 mr-1">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-200 leading-none">{user.name}</div>
              {user.student_id && <div className="text-[10px] text-slate-500 mt-0.5 font-mono-styled">{user.student_id}</div>}
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border ${role.bg} ${role.color}`}>
              <RoleIcon size={10} />
              {role.label}
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/8 hover:border-rose-500/25 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </motion.nav>
  );
}
