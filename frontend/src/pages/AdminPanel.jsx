import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Plus, Check, Trash2, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';

const DEFAULT_QUESTIONS = [
  'The instructor explains course material clearly and effectively.',
  'The instructor is responsive to questions during and outside of class.',
  'The assignments and projects contribute significantly to learning.',
  'The course stimulated my interest in the subject matter.',
  'Overall, I would rate this instructor\'s effectiveness as high.'
];

export default function AdminPanel() {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [courseId, setCourseId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([...DEFAULT_QUESTIONS]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rC, rF, rD] = await Promise.all([
        api.get('/tlfq/courses'),
        api.get('/tlfq/faculty'),
        api.get('/tlfq/departments')
      ]);
      setCourses(rC.data);
      setFaculty(rF.data);
      setDepartments(rD.data);
    } catch (err) {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateTlfq = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!courseId || !facultyId || !title) { setError('Please fill in all required fields.'); return; }
    const filteredQs = questions.filter(q => q.trim());
    if (filteredQs.length === 0) { setError('Add at least 1 question.'); return; }
    try {
      await api.post('/tlfq', { course_id: courseId, faculty_id: facultyId, title, question_texts: filteredQs });
      setTitle(''); setCourseId(''); setFacultyId(''); setQuestions([...DEFAULT_QUESTIONS]);
      setSuccess('TLFQ evaluation created and published successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create TLFQ.');
    }
  };

  // Group courses by department
  const coursesByDept = (departments || []).reduce((acc, d) => {
    acc[d.id] = { name: d.name, courses: (courses || []).filter(c => c.department_id?.toString() === d.id?.toString()) };
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-4xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList size={20} className="text-indigo-400" />
                <h1 className="text-2xl font-black text-slate-100">Create New TLFQ</h1>
              </div>
              <p className="text-sm text-slate-400">Design and publish a questionnaire mapped to a specific course and faculty record.</p>
            </div>

            {success && (
              <div className="p-4 bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Check size={16} /> {success}
              </div>
            )}
            {error && (
              <div className="p-4 bg-rose-950/40 text-rose-400 border border-rose-900/50 rounded-xl text-sm font-semibold">{error}</div>
            )}

            {loading ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 flex justify-center">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleCreateTlfq} className="flex flex-col gap-5 bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Select Course</label>
                    <select
                      value={courseId} onChange={e => setCourseId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">Choose Course…</option>
                      {Object.values(coursesByDept).map(({ name, courses: dCourses }) => (
                        <optgroup key={name} label={`── ${name}`}>
                          {dCourses.map(c => (
                            <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Assigned Faculty</label>
                    <select
                      value={facultyId} onChange={e => setFacultyId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">Choose Faculty…</option>
                      {(faculty || []).map(f => (
                        <option key={f.id} value={f.id}>{f.name} — {f.department_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Evaluation Title / Semester</label>
                  <input
                    type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="E.g. Spring 2025 – Advanced Algorithms (CS401)"
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Questions */}
                <div className="flex flex-col gap-3 pt-2 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Evaluation Questions</label>
                    <button
                      type="button"
                      onClick={() => setQuestions([...questions, ''])}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Plus size={13} /> Add Question
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {questions.map((qText, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="h-8 w-8 flex items-center justify-center bg-indigo-900/40 border border-indigo-800/50 font-bold rounded-lg text-xs text-indigo-300 flex-shrink-0">
                          Q{idx + 1}
                        </span>
                        <input
                          type="text" value={qText}
                          onChange={e => { const u = [...questions]; u[idx] = e.target.value; setQuestions(u); }}
                          placeholder="Type question text…"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-xl text-sm transition-all shadow-lg shadow-indigo-950/50 cursor-pointer"
                  >
                    <Check size={16} /> Publish TLFQ Evaluation
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
