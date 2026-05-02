import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Plus, Check, FileText, Compass, Trash2, Award, BookOpen } from 'lucide-react';

export default function AdminPanel() {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Creation state
  const [courseId, setCourseId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState(['', '', '']);

  const loadData = async () => {
    try {
      setLoading(true);
      const resCourses = await api.get('/tlfq/courses');
      const resFaculty = await api.get('/tlfq/faculty');
      setCourses(resCourses.data);
      setFaculty(resFaculty.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch platform records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddQuestionField = () => {
    setQuestions([...questions, '']);
  };

  const handleRemoveQuestionField = (index) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleQuestionTextChange = (index, value) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const handleCreateTlfq = async (e) => {
    e.preventDefault();
    if (!courseId || !facultyId || !title) {
      alert('Please select course, faculty and enter an evaluation title.');
      return;
    }

    const filteredQs = questions.filter((q) => q.trim() !== '');
    if (filteredQs.length === 0) {
      alert('Please define at least 1 evaluation question text.');
      return;
    }

    try {
      await api.post('/tlfq', {
        course_id: courseId,
        faculty_id: facultyId,
        title,
        question_texts: filteredQs
      });

      setTitle('');
      setCourseId('');
      setFacultyId('');
      setQuestions(['', '', '']);
      alert('TLFQ evaluation created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to publish the TLFQ. Verify if one already exists.');
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
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Admin System Operations</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Author and publish specific evaluation questionnaires mapped to courses and faculty members.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            {loading ? (
              <div className="glass p-8 rounded-2xl border border-indigo-50 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px]">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="glass p-6 md:p-8 rounded-3xl border border-indigo-50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <form onSubmit={handleCreateTlfq} className="flex flex-col gap-5">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Compass className="text-indigo-500" />
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-200">
                      Create New TLFQ Questionnaire
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        Select Course
                      </label>
                      <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                      >
                        <option value="">Choose Course</option>
                        {courses.map((c) => (
                          <option key={c.id || c._id} value={c.id || c._id}>
                            [{c.code}] {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        Assigned Instructor
                      </label>
                      <select
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                      >
                        <option value="">Choose Instructor</option>
                        {faculty.map((f) => (
                          <option key={f.id || f._id} value={f.id || f._id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Evaluation Title / Period
                    </label>
                    <input
                      type="text"
                      placeholder="E.g. Full-Year Evaluation for DBMS Course"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-200 transition-all"
                    />
                  </div>

                  {/* Dynamic Question Inputs */}
                  <div className="flex flex-col gap-3 mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        Evaluation Questions
                      </label>
                      <button
                        type="button"
                        onClick={handleAddQuestionField}
                        className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl transition cursor-pointer select-none"
                      >
                        <Plus size={14} /> Add Another Question
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {questions.map((qText, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="h-9 w-9 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900 font-bold rounded-xl text-xs text-indigo-600 dark:text-indigo-300 flex-shrink-0">
                            Q{idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="Type question text..."
                            value={qText}
                            onChange={(e) => handleQuestionTextChange(idx, e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-200 transition-all"
                          />
                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionField(idx)}
                              className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                              title="Delete Question Field"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                    <button
                      type="submit"
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-lg hover:shadow-indigo-300 cursor-pointer"
                    >
                      <Check size={17} /> Create Evaluation
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
