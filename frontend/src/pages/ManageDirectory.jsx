import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import { BookOpen, Users, Plus, Trash2, Shield, Settings, Compass } from 'lucide-react';

export default function ManageDirectory() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Creation fields
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [facultyName, setFacultyName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const resCourses = await api.get('/tlfq/courses');
      const resFaculty = await api.get('/tlfq/faculty');
      setCourses(resCourses.data);
      setFaculty(resFaculty.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load courses or faculty directories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseName || !courseCode) return;
    try {
      await api.post('/tlfq/courses', { name: courseName, code: courseCode });
      setCourseName('');
      setCourseCode('');
      loadData();
    } catch (err) {
      alert('Failed to register this course. Check code duplication.');
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!facultyName) return;
    try {
      await api.post('/tlfq/faculty', { name: facultyName });
      setFacultyName('');
      loadData();
    } catch (err) {
      alert('Failed to add the faculty member.');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this course?')) return;
    try {
      await api.delete(`/tlfq/courses/${id}`);
      loadData();
    } catch (err) {
      alert('Failed to remove course.');
    }
  };

  const handleDeleteFaculty = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this faculty member?')) return;
    try {
      await api.delete(`/tlfq/faculty/${id}`);
      loadData();
    } catch (err) {
      alert('Failed to remove faculty.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 max-w-5xl"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                <Settings className="text-indigo-500" />
                University Directory Management
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Maintain course records, manage registered instructors, and prepare evaluations.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Sub-navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-3 px-6 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'courses'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <BookOpen size={16} /> Courses Management
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`py-3 px-6 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'faculty'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <Users size={16} /> Faculty Management
              </button>
            </div>

            {loading ? (
              <div className="glass p-8 rounded-2xl border border-indigo-50 dark:border-slate-800 flex items-center justify-center min-h-[300px]">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {activeTab === 'courses' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Course Addition Form */}
                    <div className="glass p-6 rounded-3xl border border-indigo-50 dark:border-slate-800 h-fit flex flex-col gap-4">
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Plus size={18} className="text-indigo-500" /> Quick-Add Course
                      </h3>
                      <form onSubmit={handleCreateCourse} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                            Course Code
                          </label>
                          <input
                            type="text"
                            placeholder="CS401"
                            value={courseCode}
                            onChange={(e) => setCourseCode(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-200 font-medium transition"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                            Course Name
                          </label>
                          <input
                            type="text"
                            placeholder="Advanced Algorithms"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-200 font-medium transition"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <Plus size={16} /> Register Course
                        </button>
                      </form>
                    </div>

                    {/* Course Inventory Directory */}
                    <div className="lg:col-span-2 glass p-6 rounded-3xl border border-indigo-50 dark:border-slate-800 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <BookOpen size={18} className="text-indigo-500" /> All Courses Directory
                        </h3>
                        <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 px-3 py-1 rounded-full">
                          {courses.length} registered
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-indigo-50 dark:border-slate-800">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-indigo-50 dark:border-slate-800 text-xs font-bold uppercase text-slate-400">
                            <tr>
                              <th className="p-4">Code</th>
                              <th className="p-4">Course Name</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                           <tbody className="divide-y divide-indigo-50/60 dark:divide-slate-800/60 font-medium">
                            {courses.map((c) => (
                              <tr key={c.id || c._id} className="text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50/30">
                                <td className="p-4 font-black text-indigo-600 dark:text-indigo-400">
                                  {c.code}
                                </td>
                                <td className="p-4 font-bold">{c.name}</td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleDeleteCourse(c.id || c._id)}
                                    className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/50 text-rose-500 border border-rose-100 dark:border-rose-900/40 rounded-xl transition cursor-pointer"
                                    title="Delete this course"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'faculty' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Instructor Addition Form */}
                    <div className="glass p-6 rounded-3xl border border-indigo-50 dark:border-slate-800 h-fit flex flex-col gap-4">
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Plus size={18} className="text-indigo-500" /> Quick-Add Faculty
                      </h3>
                      <form onSubmit={handleCreateFaculty} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                            Faculty Name
                          </label>
                          <input
                            type="text"
                            placeholder="Dr. Grace Hopper"
                            value={facultyName}
                            onChange={(e) => setFacultyName(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-200 font-medium transition"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <Plus size={16} /> Add Faculty
                        </button>
                      </form>
                    </div>

                    {/* Instructor Inventory Directory */}
                    <div className="lg:col-span-2 glass p-6 rounded-3xl border border-indigo-50 dark:border-slate-800 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Users size={18} className="text-indigo-500" /> Faculty Instructor Directory
                        </h3>
                        <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 px-3 py-1 rounded-full">
                          {faculty.length} registered
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-indigo-50 dark:border-slate-800">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-indigo-50 dark:border-slate-800 text-xs font-bold uppercase text-slate-400">
                            <tr>
                              <th className="p-4">Instructor Name</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                           <tbody className="divide-y divide-indigo-50/60 dark:divide-slate-800/60 font-medium">
                            {faculty.map((f) => (
                              <tr key={f.id || f._id} className="text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50/30">
                                <td className="p-4 font-bold text-slate-800 dark:text-slate-100">
                                  {f.name}
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleDeleteFaculty(f.id || f._id)}
                                    className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/50 text-rose-500 border border-rose-100 dark:border-rose-900/40 rounded-xl transition cursor-pointer"
                                    title="Delete this faculty member"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
