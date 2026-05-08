import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  GraduationCap, Users, BookOpen, Building2, BarChart2,
  ArrowRight, CheckCircle2, Clock, ClipboardList, Shield,
  PlusCircle, Layers, TrendingUp, Activity
} from 'lucide-react';

const PageShell = ({ children }) => (
  <div className="min-h-screen mesh-bg text-slate-100 flex flex-col">
    <Navbar />
    <div className="flex flex-col md:flex-row flex-1 min-h-0">
      <Sidebar />
      <main className="flex-1 p-5 md:p-7 overflow-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {children}
        </motion.div>
      </main>
    </div>
  </div>
);

function StatCard({ icon: Icon, label, value, color, glow }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="card-hover p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
        style={{ boxShadow: `0 0 20px ${glow}` }}>
        <Icon size={19} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-black text-white tracking-tight">{value ?? '—'}</div>
        <div className="text-[11px] text-slate-500 font-medium mt-0.5">{label}</div>
      </div>
    </motion.div>
  );
}

// ── SUPER ADMIN DASHBOARD ───────────────────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/responses/analytics').then(r => {
      const d = r.data;
      setStats({
        depts: d.deptOverview?.length ?? 0,
        faculty: d.avgRatingPerFaculty?.length ?? 0,
      });
    }).catch(() => {});
  }, []);

  const cards = [
    { icon: Building2,    label: 'Departments',        value: stats?.depts,   color: 'bg-violet-600', glow: 'rgba(139,92,246,0.4)' },
    { icon: GraduationCap,label: 'Faculty Evaluated',  value: stats?.faculty, color: 'bg-blue-600',   glow: 'rgba(59,130,246,0.4)' },
  ];

  const actions = [
    { label: 'User Management',    desc: 'Create HODs & coordinators', path: '/superadmin',  icon: Shield,       glow: '#6366f1' },
    { label: 'Coordinator Panel',  desc: 'Sections, courses, faculty', path: '/coordinator', icon: Layers,       glow: '#8b5cf6' },
    { label: 'Analytics',          desc: 'University-wide insights',   path: '/analytics',   icon: BarChart2,    glow: '#3b82f6' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Super Admin</span>
        </div>
        <h1 className="text-2xl font-black text-white">Control Tower</h1>
        <p className="text-sm text-slate-400 mt-1">University-wide system overview and management.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c, i) => <StatCard key={i} {...c} />)}
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map(({ label, desc, path, icon: Icon, glow }) => (
            <motion.button key={path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate(path)}
              className="card-hover p-4 text-left flex flex-col gap-3 cursor-pointer group">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: `${glow}22`, border: `1px solid ${glow}44` }}>
                <Icon size={17} style={{ color: glow }} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">{label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors mt-auto" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── HOD OVERVIEW ────────────────────────────────────────────────────────────
function HODOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const cards = [
    { label: 'Create Forms',  desc: 'Design & assign evaluation forms', path: '/hod',       icon: ClipboardList, glow: '#3b82f6' },
    { label: 'Analytics',     desc: 'Department performance insights',   path: '/analytics', icon: BarChart2,     glow: '#6366f1' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Head of Department</span>
        </div>
        <h1 className="text-2xl font-black text-white">Welcome back, {user?.name?.split(' ')[1] || user?.name}</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your department's feedback cycle.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(({ label, desc, path, icon: Icon, glow }) => (
          <motion.button key={path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate(path)}
            className="card-hover p-5 text-left flex flex-col gap-4 cursor-pointer group">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: `${glow}20`, border: `1px solid ${glow}40` }}>
              <Icon size={18} style={{ color: glow }} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 group-hover:text-white">{label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
            </div>
            <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── COORDINATOR REDIRECT ──────────────────────────────────────────────────
function CoordinatorRedirect() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/coordinator'); }, [navigate]);
  return null;
}

// ── STUDENT DASHBOARD ──────────────────────────────────────────────────────
function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/courses')
      .then(r => {
        if (r.data?.portal_closed) setCourses([]);
        else setCourses(Array.isArray(r.data) ? r.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendingCount   = courses.reduce((a, c) => a + (c.pending_count || 0), 0);
  const completedCount = courses.reduce((a, c) => a + (c.completed_count || 0), 0);
  const total          = pendingCount + completedCount;
  const progress       = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Student Dashboard</span>
        </div>
        <h1 className="text-2xl font-black text-white">Hey, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-slate-400 mt-1">Your section's feedback forms for this semester.</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock,          label: 'Pending',   value: pendingCount,   color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/20' },
          { icon: CheckCircle2,   label: 'Completed', value: completedCount, color: 'text-emerald-400',bg: 'bg-emerald-400/10 border-emerald-400/20' },
          { icon: TrendingUp,     label: 'Progress',  value: `${progress}%`, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`card p-4 border ${bg} flex flex-col gap-1.5`}>
            <Icon size={15} className={color} />
            <div className={`text-xl font-black ${color}`}>{value}</div>
            <div className="text-[10px] text-slate-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Completion</span>
            <span>{completedCount}/{total} forms</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
          </div>
        </div>
      )}

      {/* Courses */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3].map(n => <div key={n} className="h-44 skeleton rounded-2xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="card border border-white/7 p-12 text-center flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center">
            <GraduationCap size={26} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm">No active feedback forms for your section right now.</p>
          <p className="text-slate-600 text-xs">Forms appear here when opened by your HOD.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(course => (
            <motion.div key={course.id} whileHover={{ y: -2 }} className="card-hover p-5 flex flex-col gap-4">
              {/* Course header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-lg font-mono-styled">
                    {course.code}
                  </span>
                  <h2 className="text-sm font-bold text-slate-100 mt-2 line-clamp-1">{course.name}</h2>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {course.pending_count > 0 && (
                    <span className="badge-pending flex items-center gap-1">
                      <Clock size={10} /> {course.pending_count}
                    </span>
                  )}
                  {course.completed_count > 0 && (
                    <span className="badge-active flex items-center gap-1">
                      <CheckCircle2 size={10} /> {course.completed_count}
                    </span>
                  )}
                </div>
              </div>

              {/* TLFQs */}
              {(course.tlfqs || []).length > 0 && (
                <div className="flex flex-col gap-2">
                  {course.tlfqs.map(tlfq => (
                    <button key={tlfq.id}
                      onClick={() => !tlfq.completed && navigate(`/courses/${course.id}/tlfq/${tlfq.id}`)}
                      disabled={tlfq.completed}
                      className={`flex items-center justify-between p-3 rounded-xl text-left text-xs border transition-all ${
                        tlfq.completed
                          ? 'bg-white/3 border-white/5 text-slate-500 cursor-default'
                          : 'bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-400/40 hover:bg-indigo-500/10 text-slate-200 cursor-pointer'
                      }`}>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{tlfq.faculty_name}</div>
                        <div className="text-slate-500 mt-0.5 line-clamp-1">{tlfq.title}</div>
                      </div>
                      {tlfq.completed
                        ? <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 ml-2" />
                        : <ArrowRight size={13} className="text-indigo-400 flex-shrink-0 ml-2" />
                      }
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();

  const content = {
    super_admin: <AdminDashboard />,
    hod:         <HODOverview />,
    coordinator: <CoordinatorRedirect />,
  }[user?.role] ?? <StudentDashboard />;

  return <PageShell>{content}</PageShell>;
}
