
import React, { useState, useRef, useEffect } from 'react';
import { Domain, Message, Feedback, User, Source, MessageIntent } from './types';
import { geminiService } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import Auth from './components/Auth';
import { 
  TerminalIcon, 
  CpuIcon, 
  HeartPulseIcon, 
  SettingsIcon, 
  BookOpenIcon,
  BotIcon,
  LogoutIcon
} from './components/Icons';

const DOMAIN_CONFIG = [
  { id: Domain.SOFTWARE, icon: <TerminalIcon />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: Domain.COMPUTER_SCIENCE, icon: <CpuIcon />, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: Domain.ENGINEERING, icon: <SettingsIcon />, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: Domain.MEDICAL, icon: <HeartPulseIcon />, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: Domain.GENERAL, icon: <BookOpenIcon />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('omni_session');
    if (savedUser) {
      setUser({ username: savedUser, id: savedUser });
      loadHistory(savedUser);
    }
  }, []);

  const loadHistory = (username: string) => {
    const history = localStorage.getItem(`omni_history_${username}`);
    if (history) {
      const parsed = JSON.parse(history).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
      setMessages(parsed);
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `### OmniExpert Prototype Console v3.2\n\nWelcome, **${username}**. I am operating in **Advanced Prototype Mode**. \n\nI can generate full technical specs, architectures, runnable code patches, and verification tests across all domains.\n\n**Ready to prototype. What are we building today?**`,
          timestamp: new Date(),
          intent: MessageIntent.CHAT
        }
      ]);
    }
  };

  const saveHistory = (username: string, msgs: Message[]) => {
    localStorage.setItem(`omni_history_${username}`, JSON.stringify(msgs));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (user) {
      scrollToBottom();
      saveHistory(user.username, messages);
    }
  }, [messages, user]);

  const handleLogin = (username: string) => {
    localStorage.setItem('omni_session', username);
    setUser({ username, id: username });
    loadHistory(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('omni_session');
    setUser(null);
    setMessages([]);
  };

  const handleUpdateFeedback = (messageId: string, feedback: Feedback) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
    
    const feedbackLog = JSON.parse(localStorage.getItem('omni_feedback_logs') || '[]');
    feedbackLog.push({
      user: user?.username,
      messageId,
      feedback,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('omni_feedback_logs', JSON.stringify(feedbackLog));
  };

  const performInference = async (content: string, isSearch: boolean = false) => {
    if (!user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: isSearch ? content : content,
      intent: isSearch ? MessageIntent.SEARCH : MessageIntent.CHAT,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      intent: isSearch ? MessageIntent.SEARCH : MessageIntent.CHAT,
      thinking: '',
      sources: []
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.content }]
      }));

      // High-stakes reasoning logic based on user's system prompt requirements
      const effectivePrompt = isSearch 
        ? `[INTERNAL_ROUTE: /api/v1/search] Query: ${content}. Requirement: Perform broad web search, extract technical citations, and provide a structured synthesis of current findings.` 
        : content;

      const stream = geminiService.streamChat(effectivePrompt, history);
      
      let fullContent = '';
      const uniqueSources = new Map<string, Source>();

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullContent += chunkText;
        }

        const metadata = chunk.candidates?.[0]?.groundingMetadata;
        if (metadata?.groundingChunks) {
          metadata.groundingChunks.forEach(chunk => {
            if (chunk.web?.uri) {
              const uri = chunk.web.uri;
              let title = chunk.web.title;
              if (!title) {
                try {
                  title = new URL(uri).hostname.replace('www.', '');
                } catch {
                  title = 'Technical Document';
                }
              }
              uniqueSources.set(uri, { title, uri });
            }
          });
        }

        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                content: fullContent, 
                sources: uniqueSources.size > 0 ? Array.from(uniqueSources.values()) : msg.sources 
              } 
            : msg
        ));
      }
    } catch (error) {
      console.error('Gemini Error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: "ERROR: Prototype node disconnected. Response sequence terminated." } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 overflow-hidden selection:bg-blue-500/30">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between z-20 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow-lg shadow-blue-500/10">
            <BotIcon />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tighter text-white uppercase">OmniExpert</h1>
              <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-400 rounded">PROTOTYPE MODE</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Node ID: {user.username.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3 mr-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              API: STABLE
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/5 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400">
              SEARCH_V1: ACTIVE
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all flex items-center gap-2 border border-transparent hover:border-rose-500/20"
          >
            <LogoutIcon />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">TERMINATE SESSION</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/20 via-transparent to-transparent">
        <div className="max-w-5xl mx-auto px-6 pt-10 grid grid-cols-2 md:grid-cols-5 gap-4">
          {DOMAIN_CONFIG.map((domain) => (
            <div 
              key={domain.id}
              className={`flex flex-col gap-1 p-4 rounded-2xl border border-slate-800/50 bg-slate-900/20 backdrop-blur-sm hover:bg-slate-800/40 hover:border-slate-700 transition-all group cursor-default shadow-sm hover:shadow-blue-500/5`}
            >
              <div className={`w-fit p-2 rounded-xl ${domain.bg} ${domain.color} group-hover:scale-110 transition-transform mb-1`}>
                {domain.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-slate-300 transition-colors">
                {domain.id}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 pb-40">
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              onUpdateFeedback={handleUpdateFeedback}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="relative">
         <div className="absolute inset-x-0 bottom-full h-24 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none"></div>
         <ChatInput 
          onSend={(content) => performInference(content, false)} 
          onSearch={(content) => performInference(content, true)} 
          isLoading={isLoading} 
         />
      </div>
    </div>
  );
};

export default App;
