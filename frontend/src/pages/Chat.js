import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const SUGGESTIONS = [
  { icon: '📅', text: 'When is the registration deadline?' },
  { icon: '💳', text: 'How do I pay tuition fees?' },
  { icon: '🏢', text: "Where is the Registrar's office?" },
  { icon: '📚', text: 'What courses are available?' },
  { icon: '🗓️', text: 'How do I get my class schedule?' },
  { icon: '📞', text: 'Department contact numbers?' },
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
        <span className="text-white text-xs font-bold">AI</span>
      </div>
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></span>
          <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></span>
          <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></span>
        </div>
      </div>
    </div>
  );
}

function Message({ msg, userName }) {
  const isUser = msg.role === 'user';
  const initial = userName?.[0]?.toUpperCase() || 'U';
  return (
    <div className={`flex items-end gap-3 fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md ${
        isUser
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
          : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
      }`}>
        {isUser ? initial : 'AI'}
      </div>
      <div className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
          : 'bg-slate-800 border border-slate-700/50 text-slate-100 rounded-bl-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

export default function Chat() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await axios.get('/chat/history');
      setSessions(data);
    } catch {}
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startNewChat = () => {
    setActiveSession(uuidv4());
    setMessages([]);
  };

  const loadSession = (session) => {
    setActiveSession(session.sessionId);
    setMessages(session.messages);
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`/chat/${id}`);
      setSessions(prev => prev.filter(s => s._id !== id));
      if (sessions.find(s => s._id === id)?.sessionId === activeSession) {
        setActiveSession(null);
        setMessages([]);
      }
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const sessionId = activeSession || uuidv4();
    if (!activeSession) setActiveSession(sessionId);

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const { data } = await axios.post('/chat/send-message', { message: msg, sessionId });
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      loadHistory();
    } catch {
      toast.error('Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0 bg-slate-800/40 border-r border-slate-700/40 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-white">UniSupport AI</p>
              <p className="text-xs text-slate-400">Student Assistant</p>
            </div>
          </div>
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition shadow-lg shadow-blue-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto chat-scroll p-3 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-slate-700/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-slate-500 text-xs">No chats yet</p>
              <p className="text-slate-600 text-xs mt-1">Start a new conversation</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 uppercase tracking-wider px-2 py-1">Recent</p>
              {sessions.map(s => (
                <div
                  key={s._id}
                  onClick={() => loadSession(s)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                    s.sessionId === activeSession
                      ? 'bg-blue-600/15 border border-blue-500/25'
                      : 'hover:bg-slate-700/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <svg className={`w-3.5 h-3.5 flex-shrink-0 ${s.sessionId === activeSession ? 'text-blue-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-300 truncate">{s.title || 'New Chat'}</p>
                      <p className="text-xs text-slate-500">{formatTime(s.updatedAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteSession(e, s._id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition p-1 rounded-lg hover:bg-red-400/10 flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-700/40">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700/30 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold shadow-md flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-400/10"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/40 bg-slate-800/20 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-700/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
              <span className="text-sm font-semibold text-slate-200">AI Student Support</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/50">Online</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            Powered by GPT-3.5
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto chat-scroll px-6 py-6 space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center fade-in px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20 rounded-3xl flex items-center justify-center mb-5 shadow-xl shadow-blue-500/10">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Hi {user?.name?.split(' ')[0]} 👋
              </h2>
              <p className="text-slate-400 text-sm mb-2">I'm your AI Student Support Assistant</p>
              <p className="text-slate-500 text-xs mb-8 max-w-sm">Ask me anything about courses, registration, fees, schedules, or campus services.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full max-w-2xl">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="text-left text-sm bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-blue-500/40 text-slate-300 hover:text-white px-4 py-3 rounded-xl transition group"
                  >
                    <span className="mr-2">{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <Message key={i} msg={msg} userName={user?.name} />)
          )}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="px-5 py-4 border-t border-slate-700/40 bg-slate-800/20">
          <div className="flex items-end gap-3 bg-slate-800 border border-slate-700/60 rounded-2xl px-4 py-3 focus-within:border-blue-500/50 focus-within:shadow-lg focus-within:shadow-blue-500/5 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              placeholder="Ask about courses, registration, fees, schedules..."
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none focus:outline-none leading-relaxed"
              style={{ minHeight: '24px', maxHeight: '128px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all flex-shrink-0 shadow-lg shadow-blue-500/20"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-600 text-center mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
