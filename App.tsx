/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Code2, 
  Brain, 
  History, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Terminal,
  Sparkles,
  Trash2,
  Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';

import { cn } from './lib/utils';
import { Message, UserStats } from './types';
import { mentorService } from './services/mentorService';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    language: 'None detected',
    weakTopics: [],
    mistakes: [],
    progress: 0,
    level: 'Beginner'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Prism.highlightAll();
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  const handleSend = async () => {
    if (!input.trim() && !code.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      code: code,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setCode('');
    setIsAnalyzing(true);

    // Simulate API call or call Gemini
    try {
      const response = await mentorService.analyzeCode(userMessage.code || userMessage.content, messages, stats);
      
      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: response.content || '',
        timestamp: Date.now(),
        metadata: response.metadata
      };

      setMessages(prev => [...prev, mentorMessage]);

      // Update stats based on mentor feedback
      if (response.metadata) {
        setStats(prev => ({
          ...prev,
          language: response.metadata?.language || prev.language,
          mistakes: Array.from(new Set([...prev.mistakes, ...(response.metadata?.mistakes || [])])),
          weakTopics: Array.from(new Set([...prev.weakTopics, response.metadata?.topic || ''])),
          progress: Math.min(100, prev.progress + 5)
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStats({
      language: 'None detected',
      weakTopics: [],
      mistakes: [],
      progress: 0,
      level: 'Beginner'
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#161b22]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Brain className="text-slate-900 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">AI Coding Mentor</h1>
            <p className="text-xs text-slate-400 font-medium">Learns From Your Mistakes</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={clearChat}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-red-400"
            title="Clear Session"
          >
            <Trash2 size={20} />
          </button>
          <div className="h-8 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Online</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Learning Insights */}
        <aside className="w-72 border-r border-white/5 bg-[#0d1117] hidden lg:flex flex-col p-6 gap-8 overflow-y-auto no-scrollbar">
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={14} />
              Learning Progress
            </h2>
            <div className="space-y-4">
              <div className="bg-[#161b22] border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-slate-300">Overall Mastery</span>
                  <span className="text-xl font-bold text-emerald-400">{stats.progress}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.progress}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-slate-500">Level</span>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-tighter">{stats.level}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Code2 size={14} />
              Primary Language
            </h2>
            <div className="px-4 py-3 bg-[#161b22] border border-white/5 rounded-xl flex items-center gap-3">
              <Terminal size={18} className="text-cyan-400" />
              <span className="text-sm font-mono text-slate-200">{stats.language}</span>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-400" />
              Memory: Past Mistakes
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.mistakes.length > 0 ? (
                stats.mistakes.map((m, i) => (
                  <span key={i} className="px-2 py-1 bg-red-400/10 border border-red-400/20 rounded text-[10px] text-red-400 font-medium">
                    {m}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-600 italic">No mistakes recorded yet. Keep coding!</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              Weak Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.weakTopics.length > 0 ? (
                stats.weakTopics.map((t, i) => (
                  <span key={i} className="px-2 py-1 bg-amber-400/10 border border-amber-400/20 rounded text-[10px] text-amber-400 font-medium">
                    {t}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-600 italic">Start chatting to identify areas for growth.</p>
              )}
            </div>
          </section>
        </aside>

        {/* Main Content - Unified Chat Area */}
        <main className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
          {/* Unified Chat Messages */}
          <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
            <div className="max-w-4xl mx-auto w-full p-6 space-y-10">
              <AnimatePresence initial={false}>
                {messages.length === 0 && !isAnalyzing && (
                  <div className="h-[60vh] flex flex-col items-center justify-center text-center p-12 opacity-40">
                    <Brain size={48} className="mb-4 text-slate-600" />
                    <h3 className="text-lg font-bold mb-2">Ready to Mentor</h3>
                    <p className="text-sm max-w-xs">Paste your code below to get started with personalized feedback and learning paths.</p>
                  </div>
                )}
                
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, x: msg.role === 'mentor' ? -10 : 10 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                      "flex flex-col w-full",
                      msg.role === 'mentor' ? "items-start" : "items-end"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] p-5 rounded-2xl shadow-xl transition-all duration-300",
                      msg.role === 'mentor' 
                        ? "bg-[#161b22] border border-white/10 rounded-tl-none" 
                        : "bg-emerald-500/10 border border-emerald-500/20 rounded-tr-none shadow-emerald-500/5 hover:border-emerald-500/40"
                    )}>
                      {msg.role === 'mentor' && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
                            <Brain size={14} className="text-emerald-400" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">AI Mentor</span>
                        </div>
                      )}
                      
                      {msg.content && (
                        <div className={cn(
                          "prose prose-invert prose-sm max-w-none leading-relaxed",
                          msg.role === 'mentor' ? "text-slate-100" : "text-slate-300"
                        )}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}

                      {msg.code && (
                        <div className="mt-4 w-full bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                          <div className="px-3 py-1.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Code Snippet</span>
                            <Code2 size={12} className="text-slate-500" />
                          </div>
                          <pre className="p-4 text-xs font-mono overflow-x-auto no-scrollbar">
                            <code className="language-javascript">{msg.code}</code>
                          </pre>
                        </div>
                      )}

                      {msg.metadata && (
                        <div className="grid grid-cols-1 gap-4 mt-6">
                          {msg.metadata.suggestions && msg.metadata.suggestions.length > 0 && (
                            <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                              <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <CheckCircle2 size={12} />
                                Improvements
                              </h4>
                              <ul className="space-y-2">
                                {msg.metadata.suggestions.map((s, i) => (
                                  <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                    <ChevronRight size={12} className="mt-0.5 text-cyan-500/50" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {msg.metadata.challenge && (
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <TrendingUp size={12} />
                                Next Challenge
                              </h4>
                              <p className="text-xs text-slate-400 leading-relaxed">{msg.metadata.challenge}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] text-slate-600 mt-2 px-2 font-medium",
                      msg.role === 'mentor' ? "text-left" : "text-right"
                    )}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 text-slate-500 mr-auto pl-4"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span className="text-xs font-medium animate-pulse">Mentor is analyzing your code...</span>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-6 bg-[#161b22]/50 border-t border-white/5 space-y-4">
            <div className="max-w-4xl mx-auto w-full space-y-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-3 py-1.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Code Input</span>
                    <Terminal size={12} className="text-slate-500" />
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code here..."
                    className="w-full h-32 bg-transparent p-4 text-xs font-mono text-emerald-400 placeholder:text-slate-700 focus:outline-none resize-none no-scrollbar"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask your mentor something..."
                  className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={isAnalyzing || (!input.trim() && !code.trim())}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2 font-bold text-sm"
                >
                  <span className="hidden sm:inline">Send</span>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
