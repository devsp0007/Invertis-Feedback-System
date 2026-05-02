import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, CheckCircle2, Circle, GraduationCap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states for Admin shortcuts
  const [facultyName, setFacultyName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');

  const fetchCourses = async () => {
    try {
      const res = await api.get('/tlfq/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load courses data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!facultyName) return;
    try {
      await api.post('/tlfq/faculty', { name: facultyName });
      setFacultyName('');
      alert('Faculty added successfully.');
    } catch (err) {
      alert('Failed to add faculty.');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseName || !courseCode) return;
    try {
      await api.post('/tlfq/courses', { name: courseName, code: courseCode });
      setCourseName('');
      setCourseCode('');
      fetchCourses();
      alert('Course added successfully.');
    } catch (err) {
      alert('Failed to add course.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                Good day, {user?.name} 👋
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your portal to the Invertis feedback system
              </p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-sm">
                {error}
              </div>
            )}

            {/* IF STUDENT: Show Enrolled Courses Grid */}
            {user?.role === 'student' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <GraduationCap size={22} className="text-indigo-500" />
                    Enrolled Courses for Evaluation
                  </h3>
                  <span className="text-xs bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1 font-bold rounded-full">
                    {courses.length} courses
                  </span>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-44 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <motion.div
                        key={course.id}
                        whileHover={{ scale: 1.02 }}
                        className="glass p-5 rounded-2xl flex flex-col justify-between border border-indigo-50 hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-800 shadow-sm hover:shadow-lg transition-all min-h-[170px]"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg">
                              {course.code}
                            </span>
                            {course.completed ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                                <CheckCircle2 size={13} /> Completed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md">
                                <Circle size={13} /> Pending
                              </span>
                            )}
                          </div>
                          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-2 line-clamp-2">
                            {course.name}
                          </h2>
                        </div>

                        <button
                          onClick={() => navigate(`/courses/${course.id}`)}
                          className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer border ${
                            course.completed
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                              : 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 text-white shadow-md hover:shadow-indigo-300 dark:hover:shadow-none hover:bg-indigo-700'
                          }`}
                        >
                          {course.completed ? 'Review Response' : 'Start TLFQ Evaluation'}
                          <ArrowRight size={15} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* IF ADMIN: Show Quick Control Widgets & Analytics Summary */}
            {user?.role === 'admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Add Faculty Widget */}
                <div className="glass p-6 rounded-2xl border border-indigo-50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={22} className="text-indigo-500" />
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Quick-Add Faculty</h3>
                  </div>
                  <form onSubmit={handleCreateFaculty} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Faculty Name (e.g. Dr. Ada Lovelace)"
                      value={facultyName}
                      onChange={(e) => setFacultyName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer select-none"
                    >
                      <Plus size={16} /> Add Faculty
                    </button>
                  </form>
                </div>

                {/* Add Course Widget */}
                <div className="glass p-6 rounded-2xl border border-indigo-50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap size={22} className="text-indigo-500" />
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Quick-Add Course</h3>
                  </div>
                  <form onSubmit={handleCreateCourse} className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Code"
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
                        className="col-span-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-slate-800 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="Course Name (e.g. Linear Algebra)"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="col-span-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer select-none"
                    >
                      <Plus size={16} /> Add Course
                    </button>
                  </form>
                </div>

                {/* Additional navigation shortcuts for admin */}
                <div className="glass md:col-span-2 p-6 rounded-3xl border border-indigo-50 dark:border-slate-800 bg-gradient-to-r from-indigo-50/40 via-transparent to-transparent dark:from-indigo-950/20">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Administration Management & Analytics</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">View comprehensive evaluation results, design new questionnaires, and direct course policies.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => navigate('/admin/courses')}
                      className="p-4 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left select-none shadow-sm hover:shadow-md"
                    >
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Create New TLFQ Evaluation</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Define questions & map to courses</p>
                      </div>
                      <Plus className="text-indigo-500" />
                    </button>

                    <button
                      onClick={() => navigate('/admin/analytics')}
                      className="p-4 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left select-none shadow-sm hover:shadow-md"
                    >
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Detailed Feedback Analytics</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Faculty averages & response heatmaps</p>
                      </div>
                      <ArrowRight className="text-indigo-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
