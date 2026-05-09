import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import RatingScale from '../components/RatingScale';
import api from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, RefreshCw, Volume2, Mic, CheckCircle2, Lock, GraduationCap } from 'lucide-react';

export default function TLFQPage() {
  const { id, tlfqId } = useParams();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);

  // Load draft
  useEffect(() => {
    const draftKey = `draft_${tlfqId}`;
    const draftCommentKey = `draftComment_${tlfqId}`;
    try {
      const d = localStorage.getItem(draftKey);
      if (d) setAnswers(JSON.parse(d));
      const dc = localStorage.getItem(draftCommentKey);
      if (dc) setComment(dc);
    } catch {}
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) setVoiceSupported(true);
  }, [tlfqId]);

  // Auto-save draft
  useEffect(() => {
    if (Object.keys(answers).length > 0) localStorage.setItem(`draft_${tlfqId}`, JSON.stringify(answers));
    if (comment) localStorage.setItem(`draftComment_${tlfqId}`, comment);
  }, [answers, comment, tlfqId]);

  useEffect(() => {
    api.get(`/student/tlfq/${tlfqId}`)
      .then(r => { setEvaluation(r.data); setQuestions(r.data.questions || []); })
      .catch(err => setError(err.response?.data?.message || 'Failed to load evaluation.'))
      .finally(() => setLoading(false));
  }, [id, tlfqId]);

  const handleRatingChange = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(text), { lang: 'en-US' }));
    }
  };

  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'en-US';
    r.onstart = () => setListening(true);
    r.onresult = e => setComment(p => p ? p + ' ' + e.results[0][0].transcript : e.results[0][0].transcript);
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  };

  const clearDraft = () => {
    localStorage.removeItem(`draft_${tlfqId}`);
    localStorage.removeItem(`draftComment_${tlfqId}`);
    setAnswers({});
    setComment('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (Object.keys(answers).length < questions.length) {
      setError(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/student/submit', {
        tlfq_id: evaluation.id || evaluation._id,
        answers: Object.entries(answers).map(([question_id, rating]) => ({ question_id, rating })),
        comment
      });
      clearDraft();
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex flex-col md:flex-row flex-1">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 border border-emerald-800/50 rounded-3xl p-10 max-w-md w-full text-center flex flex-col items-center gap-5"
            >
              <div className="h-20 w-20 bg-emerald-900/40 rounded-2xl flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100">Feedback Submitted!</h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Your feedback has been recorded anonymously. Thank you for helping improve teaching quality.
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-full text-left">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <Lock size={12} className="text-emerald-400" /> Submission Locked
                </div>
                <p className="text-xs text-slate-500">This evaluation cannot be edited after submission.</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <GraduationCap size={16} /> Back to My Courses
              </button>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-3xl">

            {/* Back + title */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-400 transition mb-2 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
                <h1 className="text-2xl font-black text-slate-100">TLFQ Evaluation Sheet</h1>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 px-3 py-1.5 rounded-full">
                  Anonymous
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold bg-indigo-900/30 border border-indigo-800/50 text-indigo-300 px-3 py-1.5 rounded-full">
                  Auto-Saving Draft
                </span>
              </div>
            </div>

            {loading ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 flex justify-center">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error && !evaluation ? (
              <div className="bg-rose-950/30 border border-rose-900/50 text-rose-400 p-6 rounded-2xl text-sm">{error}</div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Evaluation header */}
                <div className="bg-slate-800 border border-indigo-900/40 rounded-2xl p-5 flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-black text-slate-100">{evaluation?.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Faculty: <span className="text-slate-200 font-semibold">{evaluation?.faculty_name}</span>
                      &nbsp;•&nbsp; Course: <span className="text-slate-200 font-semibold">{evaluation?.course_name}</span>
                    </p>
                  </div>
                  <button
                    type="button" onClick={clearDraft}
                    className="text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1 p-2 hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  >
                    <RefreshCw size={12} /> Reset
                  </button>
                </div>

                {error && (
                  <div className="bg-rose-950/30 border border-rose-900/50 text-rose-400 p-4 rounded-xl text-xs font-semibold">{error}</div>
                )}

                {/* Progress */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{Object.keys(answers).length} / {questions.length} answered</span>
                  <div className="w-40 bg-slate-800 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(Object.keys(answers).length / Math.max(questions.length, 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="flex flex-col gap-4">
                  {questions.map((q, idx) => (
                    <motion.div
                      key={q.id || q._id}
                      whileHover={{ x: 2 }}
                      className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex gap-3">
                          <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 bg-indigo-900/50 text-indigo-300 font-black rounded-lg text-xs border border-indigo-800/50">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-semibold text-slate-200 leading-normal">{q.question_text}</p>
                        </div>
                        <button
                          type="button" onClick={() => speakQuestion(q.question_text)}
                          className="flex-shrink-0 p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                          title="Read aloud"
                        >
                          <Volume2 size={15} />
                        </button>
                      </div>
                      <div className="pl-10">
                        <RatingScale
                          value={answers[q.id || q._id]}
                          onChange={val => handleRatingChange(q.id || q._id, val)}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Comment box */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">Additional Comments <span className="text-slate-500 font-normal">(Optional)</span></h3>
                      <p className="text-xs text-slate-500 mt-0.5">Your comment is 100% anonymous and will only be visible to the HOD.</p>
                    </div>
                    {voiceSupported && (
                      <button
                        type="button" onClick={startVoiceInput}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition border cursor-pointer ${
                          listening
                            ? 'bg-rose-900/40 border-rose-800 text-rose-300 animate-pulse'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <Mic size={13} /> {listening ? 'Listening...' : 'Voice Input'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share any specific feedback about teaching style, course content, or improvement suggestions..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit" disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-950/50 cursor-pointer disabled:opacity-70"
                  >
                    {submitting
                      ? <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><Send size={16} /><span>Submit Evaluation</span></>
                    }
                  </button>
                  <button
                    type="button" onClick={() => navigate('/dashboard')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-6 rounded-xl text-sm border border-slate-700 transition cursor-pointer"
                  >
                    Cancel
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
