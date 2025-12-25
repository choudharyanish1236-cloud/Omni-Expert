
import React, { useState, useRef, useEffect } from 'react';
import { Domain, Message, Feedback, User, Source, MessageIntent, WorkMode, Attachment } from './types';
import { geminiService } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Toolbox from './components/Toolbox';
import { Part } from '@google/genai';
import { 
  TerminalIcon, 
  CpuIcon, 
  HeartPulseIcon, 
  SettingsIcon, 
  BookOpenIcon,
  BotIcon,
  LogoutIcon,
  ToolboxIcon,
  LightbulbIcon,
  CheckIcon,
  ZapIcon
} from './components/Icons';

const SUB_DOMAINS = {
  [Domain.ENGINEERING]: ['Electrical', 'Mechanical', 'Aerospace', 'Civil', 'Robotics', 'Nuclear', 'Structural', 'Cybernetics'],
  [Domain.MEDICAL]: ['Anatomy', 'Diagnostics', 'Biotech', 'Clinical Medicine', 'Neuroscience', 'Pharmacology'],
  [Domain.SOFTWARE]: ['Frontend', 'Backend', 'DevOps', 'Distributed Systems', 'Security', 'Web3'],
  [Domain.COMPUTER_SCIENCE]: ['Algorithms', 'Quantum Computing', 'AI/ML', 'Cryptography', 'OS Theory'],
  [Domain.GENERAL]: ['Strategy', 'Finance', 'Creative Writing', 'Language Learning', 'Humanities']
};

const DOMAIN_TOOLKITS = {
  [Domain.ENGINEERING]: [
    { name: 'CAD Modeler', icon: <SettingsIcon />, desc: '3D geometry synthesis' },
    { name: 'FEA Simulator', icon: <ZapIcon />, desc: 'Stress/Thermal analysis' },
    { name: 'BIM Integrator', icon: <BookOpenIcon />, desc: 'Building info modeling' }
  ],
  [Domain.MEDICAL]: [
    { name: 'ICD-10 Coder', icon: <ToolboxIcon />, desc: 'Diagnostic classification' },
    { name: 'Drug Interaction', icon: <ZapIcon />, desc: 'Pharmacological checker' }
  ],
  [Domain.SOFTWARE]: [
    { name: 'Big O Analyzer', icon: <CpuIcon />, desc: 'Complexity profiling' },
    { name: 'Container Architect', icon: <TerminalIcon />, desc: 'Docker/K8s scaffolding' }
  ],
  [Domain.COMPUTER_SCIENCE]: [
    { name: 'Quantum Lab', icon: <CpuIcon />, desc: 'Circuit logic simulation' }
  ],
  [Domain.GENERAL]: [
    { name: 'Strategic Planner', icon: <BookOpenIcon />, desc: 'SWOT & PESTLE logic' }
  ]
};

const DOMAIN_CONFIG = [
  { id: Domain.SOFTWARE, icon: <TerminalIcon /> },
  { id: Domain.COMPUTER_SCIENCE, icon: <CpuIcon /> },
  { id: Domain.ENGINEERING, icon: <SettingsIcon /> },
  { id: Domain.MEDICAL, icon: <HeartPulseIcon /> },
  { id: Domain.GENERAL, icon: <BookOpenIcon /> },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDomain, setActiveDomain] = useState<Domain | null>(null);
  const [activeSubDomain, setActiveSubDomain] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<WorkMode | null>(null);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [roomId, setRoomId] = useState<string>('node_primary');
  const [showProfile, setShowProfile] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const savedMode = localStorage.getItem(`omni_mode_${roomId}`);
    if (savedMode) {
      setActiveMode(savedMode as WorkMode);
    } else {
      setShowModeSelector(true);
    }
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId) return;
    const channel = new BroadcastChannel(`omni_room_${roomId}`);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'NEW_MESSAGE') {
        setMessages(prev => prev.find(m => m.id === payload.id) ? prev : [...prev, { ...payload, timestamp: new Date(payload.timestamp) }]);
      } else if (type === 'UPDATE_MESSAGE') {
        setMessages(prev => prev.map(m => m.id === payload.id ? { ...payload, timestamp: new Date(payload.timestamp) } : m));
      } else if (type === 'MODE_CHANGE') {
        setActiveMode(payload);
      }
    };
    return () => channel.close();
  }, [roomId]);

  useEffect(() => {
    const savedUsername = localStorage.getItem('omni_session');
    if (savedUsername) {
      const users = JSON.parse(localStorage.getItem('omni_users') || '{}');
      const userData = users[savedUsername];
      if (userData) {
        setUser({ username: savedUsername, id: savedUsername, email: userData.email, profilePicture: userData.profilePicture });
        loadHistory(roomId);
      }
    }
  }, []);

  const loadHistory = (currentRoom: string) => {
    const history = localStorage.getItem(`omni_history_${currentRoom}`);
    if (history) {
      setMessages(JSON.parse(history).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    } else {
      setMessages([]);
    }
  };

  const saveHistory = (msgs: Message[]) => {
    localStorage.setItem(`omni_history_${roomId}`, JSON.stringify(msgs));
  };

  useEffect(() => {
    if (user && roomId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (!isLoading && messages.length > 0) saveHistory(messages);
    }
  }, [messages, isLoading]);

  const handleModeChange = (mode: WorkMode) => {
    setActiveMode(mode);
    localStorage.setItem(`omni_mode_${roomId}`, mode);
    channelRef.current?.postMessage({ type: 'MODE_CHANGE', payload: mode });
    setShowModeSelector(false);
  };

  const toggleTool = (tool: string) => {
    setActiveTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]);
  };

  const performInference = async (content: string, isSearch: boolean = false, attachments: Attachment[] = []) => {
    if (!user || !activeMode) return;
    
    const contextPrefix = `[MODE: ${activeMode.toUpperCase()}] ${activeDomain ? `[DOMAIN: ${activeDomain}]` : ''} ${activeSubDomain ? `[FOCUS: ${activeSubDomain}]` : ''}`;
    const userMessage: Message = { 
      id: Math.random().toString(36).substr(2, 9), 
      role: 'user', 
      sender: user.username, 
      content: `${contextPrefix} ${content}`, 
      intent: isSearch ? MessageIntent.SEARCH : MessageIntent.CHAT, 
      timestamp: new Date(),
      attachments: attachments
    };

    setMessages(prev => [...prev, userMessage]);
    channelRef.current?.postMessage({ type: 'NEW_MESSAGE', payload: userMessage });
    setIsLoading(true);

    const assistantMessageId = Math.random().toString(36).substr(2, 9);
    const assistantMessage: Message = { id: assistantMessageId, role: 'assistant', content: '', timestamp: new Date(), intent: isSearch ? MessageIntent.SEARCH : MessageIntent.CHAT, thinking: '', sources: [] };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const history = messagesRef.current.map(msg => {
        const parts: Part[] = [];
        if (msg.attachments) {
          msg.attachments.forEach(att => {
            parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
          });
        }
        parts.push({ text: msg.content });
        return { 
          role: msg.role === 'user' ? 'user' as const : 'model' as const, 
          parts: parts
        };
      });
      
      const promptText = `${content} [TOOLS: ${activeTools.join(', ')}]`;
      const stream = geminiService.streamChat(promptText, history, attachments);
      let fullContent = '';
      const uniqueSources = new Map<string, Source>();

      for await (const chunk of stream) {
        fullContent += chunk.text || '';
        const metadata = chunk.candidates?.[0]?.groundingMetadata;
        if (metadata?.groundingChunks) {
          metadata.groundingChunks.forEach(c => { 
            if (c.web?.uri) uniqueSources.set(c.web.uri, { title: c.web.title || new URL(c.web.uri).hostname, uri: c.web.uri }); 
          });
        }
        const updatedMsg = { ...assistantMessage, content: fullContent, sources: Array.from(uniqueSources.values()) };
        setMessages(prev => prev.map(m => m.id === assistantMessageId ? updatedMsg : m));
        channelRef.current?.postMessage({ type: 'UPDATE_MESSAGE', payload: updatedMsg });
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: 'Error processing intelligence stream. Please verify your connection.' } : m));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <Auth onLogin={(u) => { localStorage.setItem('omni_session', u.username); setUser(u); loadHistory(roomId); }} />;

  const isResearch = activeMode === WorkMode.RESEARCH;
  const themeColor = isResearch ? 'blue' : 'indigo';

  return (
    <div className={`flex flex-col h-screen bg-[#020617] text-slate-200 overflow-hidden selection:bg-${themeColor}-500/30`}>
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-gradient-to-br from-${themeColor}-600 to-${themeColor}-700 rounded-lg shadow-lg`}>
            {isResearch ? <LightbulbIcon /> : <SettingsIcon />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">OmniExpert</h1>
              <span className={`px-2 py-0.5 bg-${themeColor}-500/10 border border-${themeColor}-500/20 text-[10px] font-black text-${themeColor}-400 rounded`}>
                {isResearch ? 'RESEARCH NODE' : 'PROJECT HUB'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Node: {roomId.toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            <button 
              onClick={() => handleModeChange(WorkMode.RESEARCH)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isResearch ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Research
            </button>
            <button 
              onClick={() => handleModeChange(WorkMode.PROJECT)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isResearch && activeMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Project
            </button>
          </div>
          <button onClick={() => setShowToolbox(!showToolbox)} className={`p-2 rounded-lg border ${showToolbox ? `bg-${themeColor}-600 border-${themeColor}-500 text-white` : 'bg-slate-800 border-slate-700 text-slate-400'}`}><ToolboxIcon /></button>
          <button onClick={() => setShowProfile(true)} className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
            {user.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : user.username.charAt(0)}
          </button>
          <button onClick={() => { localStorage.removeItem('omni_session'); setUser(null); }} className="p-2 text-slate-500 hover:text-rose-400"><LogoutIcon /></button>
        </div>
      </header>

      {showModeSelector && (
        <div className="fixed inset-0 z-[110] bg-[#020617]/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="max-w-4xl w-full text-center space-y-12">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white italic">Initialize Path</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button onClick={() => handleModeChange(WorkMode.RESEARCH)} className="group p-10 rounded-[40px] border-2 border-slate-800 bg-slate-900/40 hover:border-blue-500/50 transition-all text-left space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white"><LightbulbIcon /></div>
                <h3 className="text-2xl font-black text-white uppercase italic">Research Track</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Synthesis of data, scholarly literature reviews, and article drafting powered by deep web grounding and multi-modal document analysis.</p>
              </button>
              <button onClick={() => handleModeChange(WorkMode.PROJECT)} className="group p-10 rounded-[40px] border-2 border-slate-800 bg-slate-900/40 hover:border-indigo-500/50 transition-all text-left space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white"><SettingsIcon /></div>
                <h3 className="text-2xl font-black text-white uppercase italic">Project Track</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Technical architecture, code implementation, and production-ready engineering specifications based on your docs and schematics.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfile && <Profile user={user} onUpdate={setUser} onClose={() => setShowProfile(false)} />}
      {showToolbox && <Toolbox activeDomain={activeDomain} onSelectDomain={setActiveDomain} activeSubDomain={activeSubDomain} onSelectSubDomain={setActiveSubDomain} activeTools={activeTools} onToggleTool={toggleTool} onClose={() => setShowToolbox(false)} subDomains={SUB_DOMAINS} toolkits={DOMAIN_TOOLKITS} />}

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-48">
          <div className="flex flex-wrap gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
            {DOMAIN_CONFIG.map((d) => (
              <button key={d.id} onClick={() => setActiveDomain(d.id as Domain)} className={`flex-1 min-w-[160px] p-4 rounded-3xl border-2 transition-all flex flex-col gap-3 ${activeDomain === d.id ? `border-${themeColor}-500 bg-${themeColor}-500/5` : 'border-slate-800/50 bg-slate-900/40 hover:border-slate-700'}`}>
                <div className={`w-fit p-3 rounded-2xl bg-slate-800 ${activeDomain === d.id ? `text-${themeColor}-400` : 'text-slate-600'}`}>{d.icon}</div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${activeDomain === d.id ? 'text-white' : 'text-slate-500'}`}>{d.id}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onUpdateFeedback={(mid, f) => setMessages(prev => prev.map(m => m.id === mid ? { ...m, feedback: f } : m))} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      <div className="relative">
        {activeDomain && (
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-6 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl flex items-center gap-3 border border-white/10 z-10 ${isResearch ? 'bg-blue-600 shadow-blue-500/20' : 'bg-indigo-600 shadow-indigo-500/20'}`}>
            <span className="flex h-2 w-2 relative"><span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span><span className="relative h-2 w-2 rounded-full bg-white"></span></span>
            {isResearch ? 'ANALYZING' : 'CONSTRUCTING'}: {activeSubDomain || activeDomain}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-full h-32 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none"></div>
        <ChatInput 
          onSend={(c, att) => performInference(c, false, att)} 
          onSearch={(c, att) => performInference(c, true, att)} 
          isLoading={isLoading} 
          mode={activeMode || WorkMode.PROJECT}
        />
      </div>
    </div>
  );
};

export default App;
