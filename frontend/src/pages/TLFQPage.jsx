import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import RatingScale from '../components/RatingScale';
import api from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckSquare, RefreshCw, Volume2, Mic, Save, WifiOff, Wifi } from 'lucide-react';

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
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);

  // Load drafted answers from local storage
  useEffect(() => {
    const draftKey = `draftAnswers_${id}_${tlfqId || 'default'}`;
    const draftCommentKey = `draftComment_${id}_${tlfqId || 'default'}`;
    const draft = localStorage.getItem(draftKey);
    const draftComment = localStorage.getItem(draftCommentKey);

    if (draft) {
      try {
        setAnswers(JSON.parse(draft));
      } catch (e) {
        console.error('Failed to parse draft from localStorage', e);
      }
    }
    if (draftComment) {
      setComment(draftComment);
    }

    // Check if voice synthesis/recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
    }
  }, [id, tlfqId]);

  // Auto-save drafts on any state change
  useEffect(() => {
    const draftKey = `draftAnswers_${id}_${tlfqId || 'default'}`;
    const draftCommentKey = `draftComment_${id}_${tlfqId || 'default'}`;

    if (Object.keys(answers).length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    }
    if (comment) {
      localStorage.setItem(draftCommentKey, comment);
    }
  }, [answers, comment, id, tlfqId]);

  useEffect(() => {
    const fetchTlfqQuestions = async () => {
      try {
        const url = tlfqId 
          ? `/tlfq/courses/${id}/evaluation/${tlfqId}` 
          : `/tlfq/courses/${id}/evaluation`;
        const res = await api.get(url);
        setEvaluation(res.data);
        setQuestions(res.data.questions || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load evaluation questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchTlfqQuestions();
  }, [id, tlfqId]);

  const handleRatingChange = (qId, val) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: val
    }));
  };

  // Text-To-Speech: Read question out loud
  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech Synthesis is not supported in this browser.');
    }
  };

  // Speech-To-Text: Microphone voice comment recorder
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not available in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setComment((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const clearDraft = () => {
    const draftKey = `draftAnswers_${id}_${tlfqId || 'default'}`;
    const draftCommentKey = `draftComment_${id}_${tlfqId || 'default'}`;
    localStorage.removeItem(draftKey);
    localStorage.removeItem(draftCommentKey);
    setAnswers({});
    setComment('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if every question has an answer
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      setError(`Please complete all ${questions.length} questions before submitting.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/responses', {
        tlfqId: evaluation.id || evaluation._id,
        answers,
        comment
      });

      // Successful submission cleanup
      clearDraft();
      alert('Evaluation submitted successfully. Thank you for your feedback!');
      navigate(`/courses/${id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit evaluation. Please verify internet connectivity.');
    } finally {
      setSubmitting(false);
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
            className="flex flex-col gap-6 max-w-4xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => navigate(`/courses/${id}`)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition mb-2 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Course
                </button>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">TLFQ Evaluation Sheet</h1>
              </div>

              {/* Status Indicator */}
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 px-3 py-1 font-bold rounded-full">
                  <Wifi size={13} /> Secure
                </span>
                <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1 font-bold rounded-full">
                  <Save size={13} /> Draft Auto-Saving
                </span>
              </div>
            </div>

            {loading ? (
              <div className="glass p-8 rounded-2xl border border-indigo-50 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px]">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error && !evaluation ? (
              <div className="glass p-8 rounded-2xl border border-rose-50 dark:border-rose-950/20 text-center text-rose-600">
                {error}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="glass p-6 rounded-2xl border border-indigo-50 dark:border-slate-800 flex justify-between items-center bg-indigo-50/40 dark:bg-indigo-950/10">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-200">
                      {evaluation?.title || 'Evaluation Questionnaire'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Answer all listed criteria down below to complete the evaluation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-xl transition cursor-pointer select-none"
                  >
                    <RefreshCw size={13} /> Reset Draft Form
                  </button>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs font-semibold">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-5">
                  {questions.map((q, idx) => (
                    <motion.div
                      key={q.id || q._id}
                      whileHover={{ x: 2 }}
                      className="glass p-5 rounded-2xl border border-indigo-50 dark:border-slate-800 flex flex-col gap-4 transition shadow-sm hover:shadow-md"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3">
                          <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-300 font-black rounded-lg text-xs">
                            {idx + 1}
                          </span>
                          <p className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 leading-normal">
                            {q.question_text}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => speakQuestion(q.question_text)}
                          className="flex-shrink-0 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                          title="Read Question Aloud"
                        >
                          <Volume2 size={17} />
                        </button>
                      </div>

                      <div className="pl-0 sm:pl-10">
                        <RatingScale
                          value={answers[q.id || q._id]}
                          onChange={(val) => handleRatingChange(q.id || q._id, val)}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Additional Comment Widget */}
                <div className="glass p-6 rounded-2xl border border-indigo-50 dark:border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Qualitative Comments (Optional)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Provide extra qualitative context or specific actionable advice.
                      </p>
                    </div>
                    {voiceSupported && (
                      <button
                        type="button"
                        onClick={startVoiceInput}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer select-none ${
                          listening
                            ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Voice recognition feedback"
                      >
                        <Mic size={14} className={listening ? 'text-rose-500' : 'text-slate-500'} />
                        {listening ? 'Listening...' : 'Voice Dictate'}
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="E.g. The instructor explained real-world system patterns and concepts exceptionally well..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-200 transition-all leading-relaxed"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-indigo-50/60 dark:border-slate-800/60">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-black py-3.5 px-7 rounded-xl text-sm transition-all shadow-xl hover:shadow-indigo-300 dark:hover:shadow-none hover:scale-[1.01] cursor-pointer disabled:opacity-75"
                  >
                    {submitting ? (
                      <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit Evaluation</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/courses/${id}`)}
                    className="flex-1 sm:flex-initial bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-6 rounded-xl text-sm border border-slate-200 dark:border-slate-700 transition cursor-pointer text-center"
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
