import React, { useState, useEffect, useRef } from 'react';
import { AppState } from '../types';
import { runAgentConversation, analyzeBusinessHealth } from '../services/geminiService';
import { Sparkles, Send, Lightbulb, User, Briefcase, MessageCircle, RefreshCw } from 'lucide-react';

interface AIAssistantProps {
  state: AppState;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ state }) => {
  const [mode, setMode] = useState<'MERCHANT' | 'SUPPORT'>('MERCHANT');
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ summary: string, actionableTip: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      const res = await analyzeBusinessHealth(state);
      setAnalysis(res);
    };
    fetchAnalysis();
  }, [state]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleAsk = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', text: query, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    const historyForApi = chatHistory.map(m => ({ role: m.role, text: m.text }));
    historyForApi.push({ role: 'user', text: query });

    const aiResponseText = await runAgentConversation(historyForApi, mode, state);
    
    const aiMessage: ChatMessage = { role: 'model', text: aiResponseText, timestamp: Date.now() };
    setChatHistory(prev => [...prev, aiMessage]);
    setLoading(false);
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  const merchantPrompts = [
    "Who owes me the most money?",
    "How was my revenue this week?",
    "Suggest a collection strategy"
  ];

  const supportPrompts = [
    "Draft a reply for a missing delivery",
    "How to tell a customer their bill is overdue?",
    "Welcome message for a new customer"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-violet-100 text-violet-600 rounded-xl">
              <Sparkles size={24} className={loading ? 'animate-pulse' : ''} />
            </div>
            AI Agent
          </h2>
          <button 
            onClick={clearChat}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} /> Clear Chat
          </button>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button 
            onClick={() => { setMode('MERCHANT'); clearChat(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${mode === 'MERCHANT' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Briefcase size={14} /> Business Advisor
          </button>
          <button 
            onClick={() => { setMode('SUPPORT'); clearChat(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${mode === 'SUPPORT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <MessageCircle size={14} /> Support Specialist
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
              {analysis && mode === 'MERCHANT' ? (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 p-6 rounded-3xl border border-violet-100 animate-in fade-in zoom-in-95">
                  <Lightbulb size={32} className="text-violet-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-700 font-medium mb-2">{analysis.summary}</p>
                  <p className="text-xs text-violet-600 font-black uppercase tracking-wider">Quick Tip: {analysis.actionableTip}</p>
                </div>
              ) : (
                <div className="opacity-40 flex flex-col items-center">
                  <MessageCircle size={48} className="text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-400">Ask me anything about your {mode === 'MERCHANT' ? 'business' : 'customers'}</p>
                </div>
              )}
              
              <div className="w-full max-w-xs space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggested</p>
                {(mode === 'MERCHANT' ? merchantPrompts : supportPrompts).map(p => (
                  <button 
                    key={p}
                    onClick={() => { setQuery(p); }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-600 hover:border-violet-300 hover:bg-white transition-all active:scale-95"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-violet-600 text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-2 items-center">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <form onSubmit={handleAsk} className="relative flex items-center gap-2">
            <input 
              type="text"
              className="flex-1 bg-white p-4 pr-12 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm transition-all"
              placeholder={mode === 'MERCHANT' ? "Analyze business..." : "Draft a customer reply..."}
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={!query.trim() || loading}
              className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 ${query.trim() && !loading ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-400'}`}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};