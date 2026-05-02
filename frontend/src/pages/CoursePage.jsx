import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion } from 'framer-motion';
import { BookOpen, Award, ArrowLeft, ArrowRight, CheckCircle2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSectionId, setOpenSectionId] = useState(null);

  useEffect(() => {
    const fetchCourseEvaluations = async () => {
      try {
        const res = await api.get(`/tlfq/courses/${id}/evaluations`);
        setEvaluations(res.data || []);
        if (res.data && res.data.length > 0) {
          setOpenSectionId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'No evaluation questionnaire has been published for this course yet.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourseEvaluations();
  }, [id]);

  const toggleSection = (evalId) => {
    setOpenSectionId(openSectionId === evalId ? null : evalId);
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
            className="flex flex-col gap-6 max-w-4xl"
          >
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition mb-4 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </button>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                Course Evaluation Overview
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your feedback helps us understand and improve course teaching methods.
              </p>
            </div>

            {loading ? (
              <div className="glass p-8 rounded-2xl border border-indigo-50 dark:border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error || evaluations.length === 0 ? (
              <div className="glass p-8 rounded-2xl border border-rose-50 dark:border-rose-950/20 text-center flex flex-col items-center justify-center min-h-[300px] gap-3">
                <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                  <FileText size={28} />
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Evaluations Missing</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  {error || 'There are no active evaluation questionnaires published for this course yet.'}
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-2 bg-indigo-600 dark:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition hover:bg-indigo-700 cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-sm tracking-wide">
                    Available Evaluation Forms ({evaluations.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Click any evaluation to expand</span>
                </div>

                {evaluations.map((ev, idx) => {
                  const isOpen = openSectionId === ev.id;
                  return (
                    <motion.div
                      key={ev.id}
                      className={`glass border rounded-3xl overflow-hidden transition-all duration-300 shadow-sm ${
                        isOpen
                          ? 'border-indigo-400 dark:border-indigo-700 bg-white/40 dark:bg-indigo-950/5'
                          : 'border-indigo-50/60 dark:border-slate-800 hover:border-indigo-200'
                      }`}
                    >
                      {/* Accordion Header */}
                      <button
                        onClick={() => toggleSection(ev.id)}
                        className="w-full flex items-center justify-between p-5 text-left transition select-none cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 gap-3 mr-4">
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                              TLFQ Form {idx + 1}
                            </span>
                            <h2 className="text-base md:text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 line-clamp-1">
                              {ev.title}
                            </h2>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {ev.completed ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                                <CheckCircle2 size={13} /> Evaluation Submitted
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/50 animate-pulse">
                                Pending Feedback
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-slate-400 flex-shrink-0">
                          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </span>
                      </button>

                      {/* Accordion Content */}
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="px-5 pb-5 pt-1 flex flex-col gap-4 border-t border-indigo-50/50 dark:border-slate-800/50"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2 border-t border-b border-indigo-50/40 dark:border-slate-800/40 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                                <BookOpen size={16} />
                              </div>
                              <div>
                                <p className="text-xs text-slate-400">Course Name</p>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                  {ev.course_name || 'Invertis University Course'}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                                <Award size={16} />
                              </div>
                              <div>
                                <p className="text-xs text-slate-400">Instructor/Faculty</p>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                  {ev.faculty_name}
                                </h4>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 bg-indigo-50/30 dark:bg-indigo-950/10 p-3.5 rounded-2xl text-xs text-indigo-800 dark:text-indigo-300 border border-indigo-100/60 dark:border-indigo-900/30 leading-relaxed">
                            <CheckCircle2 className="flex-shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" size={15} />
                            <span>
                              Answer all the direct questions to complete your review. Your response is fully secure, encrypted, and one-time strictly validated.
                            </span>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => navigate(`/courses/${id}/tlfq/${ev.id}`)}
                              className="flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition shadow-md hover:shadow-indigo-300 dark:hover:shadow-none cursor-pointer flex-1 sm:flex-initial"
                            >
                              {ev.completed ? 'Review Response' : 'Answer the questions'}
                              <ArrowRight size={15} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
