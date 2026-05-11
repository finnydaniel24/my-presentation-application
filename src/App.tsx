/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  Lock, 
  ChevronRight, 
  Save, 
  LogOut,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STUDENTS, TEAMS, Team, Student, Evaluation, EvaluationCategories } from './constants';
import { cn } from './lib/utils';

// --- Types & Storage Helpers ---
const STORAGE_KEY = 'peer_eval_data';

const getInitialData = (): Evaluation[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  // Initialize 40 rows: Each student v all other teams
  const evals: Evaluation[] = [];
  STUDENTS.forEach(student => {
    TEAMS.filter(t => t.id !== student.teamId).forEach(team => {
      evals.push({
        id: `${student.id}-${team.id}`,
        evaluatorId: student.id,
        evaluatedTeamId: team.id,
        scores: {
          content: null,
          clarity: null,
          delivery: null,
          visuals: null,
          teamwork: null,
          timeManagement: null
        },
        comments: '',
        updatedAt: Date.now()
      });
    });
  });
  return evals;
};

// --- Components ---

const Login = ({ onLogin }: { onLogin: (s: Student) => void }) => {
  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-natural-card overflow-hidden"
      >
        <div className="bg-natural-header p-8 text-natural-text text-center border-b border-natural-border">
          <div className="w-12 h-12 bg-natural-accent rounded-xl mx-auto mb-4 flex items-center justify-center text-white shadow-sm">
            <Trophy className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Presentation Evaluation</h1>
          <p className="text-natural-muted text-[10px] uppercase font-bold tracking-widest mt-2 italic">Student Access Portal</p>
        </div>
        
        <div className="p-8">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-4 flex items-center gap-2">
            <Users className="w-3 h-3" />
            Identify Yourself
          </label>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto px-1 custom-scrollbar">
            {STUDENTS.map((student) => (
              <button
                key={student.id}
                onClick={() => onLogin(student)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-natural-header transition-colors border border-transparent hover:border-natural-border group flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-natural-text">{student.name}</div>
                  <div className="text-[10px] text-natural-muted uppercase font-semibold">
                    {TEAMS.find(t => t.id === student.teamId)?.name}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-natural-accent transition-transform group-hover:translate-x-1" />
              </button>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-natural-border flex items-center justify-center">
            <button 
              onClick={() => window.location.href = '/admin'}
              className="px-4 py-2 bg-natural-header rounded-md text-[10px] font-bold border border-natural-border flex items-center gap-2 text-natural-muted hover:text-natural-accent hover:border-natural-accent/30 transition-all"
            >
              <Lock className="w-3 h-3" />
              ADMIN MODE LOCKED
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Header = ({ title, sub, user, onLogout }: { title: string, sub?: string, user?: Student | 'Admin', onLogout: () => void }) => (
  <header className="sticky top-0 z-50 bg-natural-header/90 backdrop-blur-md border-b border-natural-border px-6 py-4 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-natural-accent rounded-lg flex items-center justify-center text-white shadow-sm font-bold">
        PE
      </div>
      <div>
        <h1 className="text-lg font-bold tracking-tight text-natural-text">{title}</h1>
        {sub && <p className="text-[10px] text-natural-muted uppercase font-bold tracking-wider italic">{sub}</p>}
      </div>
    </div>
    
    <div className="flex items-center gap-4">
      {user && (
        <div className="text-right hidden sm:block">
          <div className="text-[11px] font-bold text-natural-text uppercase tracking-tight">{typeof user === 'string' ? user : user.name}</div>
          <div className="text-[9px] text-natural-muted font-bold uppercase tracking-widest">
            {typeof user === 'string' ? 'Authorized access' : TEAMS.find(t => t.id === user.teamId)?.name}
          </div>
        </div>
      )}
      <button 
        onClick={onLogout}
        className="p-2 rounded-lg hover:bg-stone-200/50 text-natural-muted hover:text-red-600 transition-colors"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  </header>
);

const EvaluationSheet = ({ user, evaluations, onUpdate }: { user: Student, evaluations: Evaluation[], onUpdate: (e: Evaluation) => void }) => {
  const userEvals = useMemo(() => evaluations.filter(e => e.evaluatorId === user.id), [evaluations, user.id]);
  
  const calculateOverall = (scores: Record<EvaluationCategories, number | null>) => {
    const vals = Object.values(scores).filter((v): v is number => v !== null);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const handleScoreChange = (evalId: string, category: EvaluationCategories, value: string) => {
    const num = parseInt(value);
    if (value !== '' && (isNaN(num) || num < 1 || num > 10)) return;
    
    const evaluation = evaluations.find(e => e.id === evalId);
    if (!evaluation) return;

    onUpdate({
      ...evaluation,
      scores: {
        ...evaluation.scores,
        [category]: value === '' ? null : num
      },
      updatedAt: Date.now()
    });
  };

  const handleCommentChange = (evalId: string, value: string) => {
    const evaluation = evaluations.find(e => e.id === evalId);
    if (!evaluation) return;

    onUpdate({
      ...evaluation,
      comments: value,
      updatedAt: Date.now()
    });
  };

  return (
    <div className="min-h-screen bg-natural-bg font-sans selection:bg-natural-accent selection:text-white pb-12">
      <Header 
        title="Presentation Evaluation Portal" 
        sub="Academic Year 2023-24 • Peer Review System" 
        user={user} 
        onLogout={() => window.location.href = '/'} 
      />
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-white border border-natural-card rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-natural-header px-6 py-3 border-b border-natural-border flex justify-between items-center">
            <span className="text-sm font-bold">Evaluator: <span className="text-natural-accent">{user.name}</span> ({TEAMS.find(t => t.id === user.teamId)?.name})</span>
            <span className="text-xs font-bold text-natural-muted uppercase tracking-widest">
              Log: {userEvals.filter(e => Object.values(e.scores).every(v => v !== null)).length} of 4 Completed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 text-[10px] uppercase font-bold text-natural-muted tracking-widest sticky top-0 border-b border-natural-card">
                <tr>
                  <th className="p-4 bg-stone-50">Target Team</th>
                  <th className="p-4 bg-stone-50">Presenters</th>
                  <th className="p-4 text-center bg-stone-50">Content</th>
                  <th className="p-4 text-center bg-stone-50">Clarity</th>
                  <th className="p-4 text-center bg-stone-50">Delivery</th>
                  <th className="p-4 text-center bg-stone-50">Visuals</th>
                  <th className="p-4 text-center bg-stone-50">Teamwork</th>
                  <th className="p-4 text-center bg-stone-50">Time</th>
                  <th className="p-4 text-right bg-stone-50">Overall Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-header">
                {userEvals.map((evaluation) => {
                  const team = TEAMS.find(t => t.id === evaluation.evaluatedTeamId);
                  const isCompleted = Object.values(evaluation.scores).every(v => v !== null);
                  const overall = calculateOverall(evaluation.scores);
                  
                  return (
                    <tr 
                      key={evaluation.id}
                      className={cn(
                        "transition-colors",
                        isCompleted ? "bg-emerald-50/20" : "hover:bg-natural-header/30"
                      )}
                    >
                      <td className="p-4">
                        <div className="font-bold text-natural-text text-xs">{team?.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-[10px] font-bold text-natural-muted leading-tight uppercase tracking-tight">
                          {team?.members.join(' • ')}
                        </div>
                      </td>
                      
                      {(['content', 'clarity', 'delivery', 'visuals', 'teamwork', 'timeManagement'] as EvaluationCategories[]).map((cat) => (
                        <td key={cat} className="p-4 text-center">
                          <input
                            type="text"
                            pattern="[1-9]|10"
                            value={evaluation.scores[cat] || ''}
                            onChange={(e) => handleScoreChange(evaluation.id, cat, e.target.value)}
                            placeholder="-"
                            className="w-10 h-10 rounded border border-natural-border text-center text-xs font-bold focus:ring-1 focus:ring-natural-accent outline-none transition-all bg-white hover:border-natural-muted disabled:bg-stone-100 disabled:text-stone-300 mx-auto"
                          />
                        </td>
                      ))}

                      <td className="p-4 text-right">
                        <span className={cn(
                          "font-mono font-bold text-sm",
                          overall > 0 ? "text-emerald-700" : "text-stone-300"
                        )}>
                          {overall > 0 ? overall.toFixed(2) : '0.00'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-natural-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-4 h-4 text-natural-accent" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-natural-muted">Qualitative Feedback</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userEvals.map((e) => {
              const team = TEAMS.find(t => t.id === e.evaluatedTeamId);
              return (
                <div key={e.id} className="space-y-2">
                  <div className="text-[10px] font-bold text-natural-muted uppercase tracking-tight">{team?.name} Observations</div>
                  <textarea
                    value={e.comments}
                    onChange={(ev) => handleCommentChange(e.id, ev.target.value)}
                    placeholder={`Share observations for ${team?.name}...`}
                    className="w-full h-24 bg-stone-50 border border-natural-border rounded-lg p-3 text-xs focus:ring-1 focus:ring-natural-accent outline-none resize-none placeholder:italic"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <footer className="flex gap-6 text-[10px] text-natural-muted uppercase tracking-widest font-bold">
            <div className="flex items-center gap-2">
              Form Validation: <span className="text-emerald-600">ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              Auto-Saving: <span className="text-natural-text">SYNCED</span>
            </div>
          </footer>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 bg-natural-accent text-white rounded-md text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
          >
            SUBMIT FEEDBACK
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};

const AdminSummary = ({ evaluations, onUpdate }: { evaluations: Evaluation[], onUpdate: (e: Evaluation) => void }) => {
  const [pass, setPass] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [error, setError] = useState(false);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    const evaluation = evaluations.find(e => e.id === id);
    if (!evaluation) return;

    if (window.confirm('Are you sure you want to clear this evaluation record?')) {
      onUpdate({
        ...evaluation,
        scores: {
          content: null,
          clarity: null,
          delivery: null,
          visuals: null,
          teamwork: null,
          timeManagement: null
        },
        comments: '',
        updatedAt: Date.now()
      });
    }
  };

  const teamStats = useMemo(() => {
    return TEAMS.map(team => {
      const teamEvals = evaluations.filter(e => e.evaluatedTeamId === team.id);
      
      const averages = {
        content: 0,
        clarity: 0,
        delivery: 0,
        visuals: 0,
        teamwork: 0,
        timeManagement: 0,
        overall: 0
      };

      const categories = ['content', 'clarity', 'delivery', 'visuals', 'teamwork', 'timeManagement'] as EvaluationCategories[];
      
      let overallSum = 0;
      let overallCount = 0;

      categories.forEach(cat => {
        const scores = teamEvals.map(e => e.scores[cat]).filter((v): v is number => v !== null);
        if (scores.length > 0) {
          averages[cat] = scores.reduce((a, b) => a + b, 0) / scores.length;
          overallSum += averages[cat];
        }
      });

      averages.overall = overallSum / categories.length;

      return {
        ...team,
        averages,
        submissionCount: teamEvals.filter(e => Object.values(e.scores).every(v => v !== null)).length
      };
    });
  }, [evaluations]);

  const selectedEvaluator = useMemo(() => {
    if (!selectedEvaluatorId) return null;
    return STUDENTS.find(s => s.id === selectedEvaluatorId);
  }, [selectedEvaluatorId]);

  const evaluatorResponses = useMemo(() => {
    if (!selectedEvaluatorId) return [];
    return evaluations.filter(e => e.evaluatorId === selectedEvaluatorId);
  }, [selectedEvaluatorId, evaluations]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === 'admin2026') {
      setIsAuthed(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const downloadCSV = () => {
    const headers = ['Evaluator', 'Evaluated Team', 'Presenter 1', 'Presenter 2', 'Content', 'Clarity', 'Delivery', 'Visuals', 'Teamwork', 'Time', 'Avg', 'Comments'];
    const rows = evaluations.map(e => {
      const evaluator = STUDENTS.find(s => s.id === e.evaluatorId);
      const team = TEAMS.find(t => t.id === e.evaluatedTeamId);
      const avg = Object.values(e.scores).filter((v): v is number => v !== null).reduce((a, b, _, arr) => a + b / arr.length, 0).toFixed(1);
      
      return [
        evaluator?.name,
        team?.name,
        team?.members[0],
        team?.members[1],
        e.scores.content || 0,
        e.scores.clarity || 0,
        e.scores.delivery || 0,
        e.scores.visuals || 0,
        e.scores.teamwork || 0,
        e.scores.timeManagement || 0,
        avg,
        `"${e.comments.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "presentation_evaluation_raw.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm bg-natural-header rounded-2xl p-8 border border-natural-border shadow-sm flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-6 stroke-natural-accent">
            <Lock className="w-8 h-8 text-natural-accent" />
          </div>
          <h1 className="text-lg font-bold text-natural-text text-center mb-2">Admin Summary</h1>
          <p className="text-natural-muted text-center text-[10px] uppercase font-bold tracking-widest mb-8 italic">Restricted to Instructor access only</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="relative">
              <input 
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Enter access code"
                className={cn(
                  "w-full bg-white border border-natural-border rounded-lg px-4 py-3 text-natural-text text-sm placeholder:text-stone-300 outline-none focus:ring-1 focus:ring-natural-accent transition-all",
                  error && "border-red-500 animate-shake"
                )}
              />
              {error && <AlertCircle className="absolute right-4 top-3.5 w-5 h-5 text-red-500" />}
            </div>
            <button 
              type="submit"
              className="w-full bg-natural-accent text-white py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm"
            >
              Verify Identity
            </button>
          </form>

          <button 
            onClick={() => window.location.href = '/'}
            className="mt-6 text-xs text-natural-muted hover:text-natural-accent font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            Back to Student Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text pb-20">
      <Header 
        title="Instructor Dashboard" 
        sub="Class-wide Presentation Performance Metrics" 
        user="Admin" 
        onLogout={() => setIsAuthed(false)} 
      />
      
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamStats.map((team, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={team.id}
              className="bg-white border border-natural-card rounded-xl p-6 shadow-sm group hover:border-natural-accent/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-bold text-natural-muted tracking-widest uppercase">{team.id}</div>
                  <div className="text-[10px] font-bold px-2 py-1 bg-natural-header rounded text-natural-accent uppercase">
                    {team.submissionCount} SUBMITTED
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-1 tracking-tight">{team.name}</h3>
                <p className="text-[10px] text-natural-muted font-bold uppercase tracking-tight mb-4 truncate">{team.members.join(' • ')}</p>
              </div>
              
              <div className="pt-4 border-t border-natural-header">
                <div className="text-4xl font-mono font-bold text-natural-accent">
                  {team.averages.overall > 0 ? team.averages.overall.toFixed(2) : '0.00'}
                </div>
                <div className="text-[9px] text-natural-muted font-bold uppercase tracking-widest mt-1">Class Average Rating</div>
              </div>
            </motion.div>
          ))}
          
          <div className="bg-natural-header rounded-xl border border-natural-border p-6 flex flex-col justify-between h-full relative overflow-hidden">
            <div className="relative z-10">
              <BarChart3 className="w-8 h-8 mb-4 text-natural-accent opacity-50" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Grading Package</h3>
              <p className="text-[10px] text-natural-muted mt-2 italic font-medium">Download the full evaluation matrix as a standardized CSV file.</p>
            </div>
            <button 
              onClick={downloadCSV}
              className="w-full bg-natural-accent text-white rounded-md py-3 text-[10px] font-bold tracking-widest uppercase shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-6 relative z-10"
            >
              <Download className="w-3 h-3" />
              Export Records
            </button>
          </div>
        </div>

        {/* Master Log Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-natural-muted flex items-center gap-2">
              <ClipboardCheck className="w-3.5 h-3.5" />
              Comprehensive Review Log
            </h2>
            <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {evaluations.filter(e => Object.values(e.scores).every(v => v !== null)).length} / 40 Collected
            </div>
          </div>
          
          <div className="bg-white border border-natural-card rounded-xl overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-stone-50 text-[10px] uppercase font-bold text-natural-muted tracking-widest border-b border-natural-card">
                <tr>
                  <th className="p-4 border-r border-natural-header">Evaluator</th>
                  <th className="p-4 border-r border-natural-header">Subject</th>
                  <th className="p-4 text-center border-r border-natural-header">Content</th>
                  <th className="p-4 text-center border-r border-natural-header">Clarity</th>
                  <th className="p-4 text-center border-r border-natural-header">Delivery</th>
                  <th className="p-4 text-center border-r border-natural-header">Visuals</th>
                  <th className="p-4 text-center border-r border-natural-header">Teamwork</th>
                  <th className="p-4 text-center border-r border-natural-header">Time</th>
                  <th className="p-4 text-center border-r border-natural-header bg-natural-header/30">Overall Score</th>
                  <th className="p-4 whitespace-nowrap border-r border-natural-header">Instructor Overview</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {evaluations
                  .filter(e => Object.values(e.scores).some(v => v !== null))
                  .map((e) => {
                    const evaluator = STUDENTS.find(s => s.id === e.evaluatorId);
                    const team = TEAMS.find(t => t.id === e.evaluatedTeamId);
                    const scores = Object.values(e.scores).filter((v): v is number => v !== null);
                    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
                    
                    return (
                      <tr key={e.id} className="border-b border-natural-header hover:bg-natural-header/20 transition-colors">
                        <td className="p-4 border-r border-natural-header">
                          <button 
                            onClick={() => setSelectedEvaluatorId(evaluator?.id || null)}
                            className="text-left group"
                          >
                            <div className="font-bold text-natural-text underline decoration-natural-accent/20 decoration-2 underline-offset-2 group-hover:text-natural-accent group-hover:decoration-natural-accent transition-all">{evaluator?.name}</div>
                            <div className="text-[9px] text-natural-muted font-bold uppercase">{evaluator?.teamId}</div>
                          </button>
                        </td>
                        <td className="p-4 border-r border-natural-header font-bold text-natural-text">{team?.name}</td>
                        <td className="p-4 border-r border-natural-header text-center font-mono font-bold">{e.scores.content || '–'}</td>
                        <td className="p-4 border-r border-natural-header text-center font-mono font-bold">{e.scores.clarity || '–'}</td>
                        <td className="p-4 border-r border-natural-header text-center font-mono font-bold">{e.scores.delivery || '–'}</td>
                        <td className="p-4 border-r border-natural-header text-center font-mono font-bold">{e.scores.visuals || '–'}</td>
                        <td className="p-4 border-r border-natural-header text-center font-mono font-bold">{e.scores.teamwork || '–'}</td>
                        <td className="p-4 border-r border-natural-header text-center font-mono font-bold">{e.scores.timeManagement || '–'}</td>
                        <td className="p-4 border-r border-natural-header text-center font-mono font-bold text-emerald-800 bg-emerald-50/20">{avg}</td>
                        <td className="p-4 text-natural-muted italic max-w-sm overflow-hidden text-ellipsis whitespace-nowrap border-r border-natural-header">{e.comments || 'No qualitative data available'}</td>
                        <td className="p-2 text-center">
                          <button 
                            onClick={() => handleDelete(e.id)}
                            className="p-2 rounded hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Evaluator Detail Modal */}
        <AnimatePresence>
          {selectedEvaluator && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedEvaluatorId(null)}
                className="absolute inset-0 bg-natural-text/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-4xl bg-natural-bg rounded-2xl shadow-2xl border border-natural-border overflow-hidden flex flex-col max-h-[90vh]"
              >
                <header className="bg-natural-header p-6 border-b border-natural-border flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-natural-accent rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      {selectedEvaluator.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-natural-text">{selectedEvaluator.name}</h2>
                      <p className="text-[10px] text-natural-muted uppercase font-bold tracking-widest italic">
                        Submissions from {TEAMS.find(t => t.id === selectedEvaluator.teamId)?.name}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedEvaluatorId(null)}
                    className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-natural-muted" />
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {evaluatorResponses.map((res) => {
                    const team = TEAMS.find(t => t.id === res.evaluatedTeamId);
                    const scores = Object.values(res.scores).filter((v): v is number => v !== null);
                    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0.00';
                    const hasData = scores.length > 0;

                    return (
                      <div key={res.id} className="bg-white border border-natural-card rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-stone-50 px-4 py-2 border-b border-natural-card flex justify-between items-center">
                          <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">{team?.name} Evaluation</span>
                          {hasData && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-natural-muted uppercase">Overall:</span>
                              <span className="text-xs font-mono font-bold text-emerald-700">{avg}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(res.scores).map(([cat, val]) => (
                              <div key={cat} className="bg-natural-bg/50 border border-natural-border/30 rounded p-2 text-center">
                                <div className="text-[8px] uppercase font-bold text-natural-muted mb-1 truncate">{cat}</div>
                                <div className="text-sm font-mono font-bold text-natural-text">{val || '–'}</div>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-col">
                            <div className="text-[9px] font-bold text-natural-muted uppercase tracking-tight mb-2 flex items-center gap-1">
                              <ClipboardCheck className="w-3 h-3" />
                              Qualitative Observations
                            </div>
                            <div className={cn(
                              "flex-1 bg-stone-50 border border-natural-border rounded-lg p-3 text-xs italic",
                              !res.comments && "text-stone-300"
                            )}>
                              {res.comments || 'No comments provided for this presentation.'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <footer className="p-4 bg-natural-header border-t border-natural-border flex justify-end">
                  <button 
                    onClick={() => setSelectedEvaluatorId(null)}
                    className="px-6 py-2 bg-natural-accent text-white rounded-md text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
                  >
                    Close Viewer
                  </button>
                </footer>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// --- Main App Entry ---

export default function App() {
  const [user, setUser] = useState<Student | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(getInitialData());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
  }, [evaluations]);

  const handleUpdateEvaluation = (updated: Evaluation) => {
    setEvaluations(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            user ? (
              <EvaluationSheet 
                user={user} 
                evaluations={evaluations} 
                onUpdate={handleUpdateEvaluation} 
              />
            ) : (
              <Login onLogin={setUser} />
            )
          } 
        />
        <Route 
          path="/admin" 
          element={<AdminSummary evaluations={evaluations} onUpdate={handleUpdateEvaluation} />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
