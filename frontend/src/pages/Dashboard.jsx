import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Users, BookOpen, Building2, BarChart2,
  ArrowRight, CheckCircle2, Clock, ClipboardList, Shield, PlusCircle
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-black text-slate-100">{value ?? '—'}</div>
        <div className="text-xs text-slate-400 font-medium mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD ────────────────────────────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/tlfq/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const cards = stats ? [
    { icon: Users, label: 'Total Students', value: stats.totalStudents, color: 'bg-emerald-600' },
    { icon: GraduationCap, label: 'Total Faculty (Records)', value: stats.totalFaculty, color: 'bg-blue-600' },
    { icon: BookOpen, label: 'Courses', value: stats.totalCourses, color: 'bg-indigo-600' },
    { icon: Building2, label: 'Departments', value: stats.totalDepts, color: 'bg-violet-600' },
    { icon: ClipboardList, label: 'Active TLFQs', value: stats.totalTlfqs, color: 'bg-amber-600' },
    { icon: BarChart2, label: 'Completion Rate', value: `${stats.completionRate}%`, color: 'bg-rose-600' },
  ] : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield size={20} className="text-violet-400" />
          <h1 className="text-2xl font-black text-slate-100">System Control Tower</h1>
        </div>
        <p className="text-sm text-slate-400">University-wide overview and management hub.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats ? cards.map((c, i) => <StatCard key={i} {...c} />) : (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 animate-pulse rounded-2xl border border-slate-700" />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
          <PlusCircle size={17} className="text-indigo-400" /> Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Create New TLFQ', desc: 'Design & assign questionnaire', path: '/admin/courses', icon: ClipboardList, color: 'text-indigo-400' },
            { label: 'Full Analytics', desc: 'University-wide reports', path: '/admin/analytics', icon: BarChart2, color: 'text-blue-400' },
            { label: 'Manage Directory', desc: 'Departments, courses, faculty', path: '/admin/directory', icon: Building2, color: 'text-violet-400' },
          ].map(({ label, desc, path, icon: Icon, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-3 p-4 bg-slate-900 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl transition-all text-left cursor-pointer group"
            >
              <Icon size={18} className={color} />
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-200">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
              <ArrowRight size={15} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── HOD DASHBOARD ──────────────────────────────────────────────────────────────
function HODOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={20} className="text-blue-400" />
          <h1 className="text-2xl font-black text-slate-100">Department Overview</h1>
        </div>
        <p className="text-sm text-slate-400">Welcome back, {user?.name}. View analytics for your department.</p>
      </div>

      <div className="bg-slate-800 border border-blue-900/40 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
        <div className="h-16 w-16 bg-blue-900/40 rounded-2xl flex items-center justify-center">
          <BarChart2 size={28} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Department Analytics</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md">
            View faculty performance, course ratings, anonymous student comments, and feedback completion rates for your department.
          </p>
        </div>
        <button
          onClick={() => navigate('/hod/analytics')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg shadow-blue-950/50"
        >
          View Analytics <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── STUDENT DASHBOARD ──────────────────────────────────────────────────────────
function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tlfq/courses')
      .then(r => setCourses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = courses.reduce((a, c) => a + (c.pending_count || 0), 0);
  const completedCount = courses.reduce((a, c) => a + (c.completed_count || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100">Good day, {user?.name} 👋</h1>
        <p className="text-sm text-slate-400 mt-1">Your enrolled courses and pending feedback questionnaires.</p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-amber-900/30 border border-amber-800/50 text-amber-300 text-xs font-bold px-4 py-2 rounded-full">
          <Clock size={13} /> {pendingCount} Pending
        </div>
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 text-xs font-bold px-4 py-2 rounded-full">
          <CheckCircle2 size={13} /> {completedCount} Completed
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(n => <div key={n} className="h-48 bg-slate-800 animate-pulse rounded-2xl border border-slate-700" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center">
          <GraduationCap size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No courses enrolled. Contact admin for enrollment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(course => (
            <motion.div
              key={course.id}
              whileHover={{ y: -2 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-800/50 px-2.5 py-1 rounded-lg">
                    {course.code}
                  </span>
                  <h2 className="text-base font-extrabold text-slate-100 mt-2 line-clamp-1">{course.name}</h2>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                  {course.pending_count > 0 && (
                    <span className="text-xs font-bold bg-amber-900/40 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock size={11} /> {course.pending_count} pending
                    </span>
                  )}
                  {course.completed_count > 0 && (
                    <span className="text-xs font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 size={11} /> {course.completed_count} done
                    </span>
                  )}
                </div>
              </div>

              {/* TLFQs inside the course */}
              {(course.tlfqs || []).length > 0 && (
                <div className="flex flex-col gap-2">
                  {course.tlfqs.map(tlfq => (
                    <button
                      key={tlfq.id}
                      onClick={() => !tlfq.completed && navigate(`/courses/${course.id}/tlfq/${tlfq.id}`)}
                      disabled={tlfq.completed}
                      className={`flex items-center justify-between p-3 rounded-xl text-left text-xs border transition-all ${
                        tlfq.completed
                          ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-default'
                          : 'bg-slate-900 border-indigo-800/40 hover:border-indigo-600 hover:bg-indigo-950/30 text-slate-200 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">{tlfq.faculty_name}</div>
                        <div className="text-slate-500 text-xs mt-0.5 line-clamp-1">{tlfq.title}</div>
                      </div>
                      {tlfq.completed
                        ? <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                        : <ArrowRight size={14} className="text-indigo-400 flex-shrink-0" />
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

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();

  const renderContent = () => {
    if (user?.role === 'admin') return <AdminDashboard />;
    if (user?.role === 'hod') return <HODOverview />;
    return <StudentDashboard />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
