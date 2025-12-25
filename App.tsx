import React, { useState, useRef, useEffect } from 'react';
import { Domain, Message, Feedback, User, Source, MessageIntent, WorkMode } from './types';
import { geminiService } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Toolbox from './components/Toolbox';
import { 
  TerminalIcon, 
  CpuIcon, 
  HeartPulseIcon, 
  SettingsIcon, 
  BookOpenIcon,
  BotIcon,
  LogoutIcon,
  SearchIcon,
  UsersIcon,
  ShareIcon,
  ToolboxIcon,
  ZapIcon,
  ShieldIcon,
  BarChartIcon,
  LightbulbIcon,
  UserIcon,
  PencilIcon,
  XIcon
} from './components/Icons';

const SUB_DOMAINS = {
  [Domain.ENGINEERING]: [
    'Electrical', 'Mechanical', 'Mechatronics Engineering', 'Civil', 'Aerospace', 'Chemical', 
    'Bioengineering', 'Robotics & Automation', 'Systems Engineering', 
    'Materials Science', 'Environmental Engineering', 'Nuclear', 'Industrial', 
    'Structural', 'Petroleum'
  ],
  [Domain.MEDICAL]: [
    'Human Anatomy', 'Physiology', 'Diagnostics', 'Biotechnology', 
    'Drug Discovery', 'Clinical Medicine', 'Neuroscience', 'Public Health',
    'Cardiology', 'Oncology', 'Immunology', 'Radiology', 'Genetics',
    'Pharmacology', 'Epidemiology'
  ],
  [Domain.SOFTWARE]: [
    'Web Development', 'Mobile Apps', 'Distributed Systems', 'Cloud Native',
    'DevOps', 'Security Engineering', 'Database Design', 'Game Dev'
  ],
  [Domain.COMPUTER_SCIENCE]: [
    'Algorithms', 'Data Structures', 'Operating Systems', 'ML / AI',
    'Cryptography', 'Compilers', 'Parallel Computing', 'Quantum Computing'
  ],
  [Domain.GENERAL]: [
    'Strategic Writing', 'Financial Analysis', 'Business Logic', 'Humanities',
    'Creative Direction', 'Language Synthesis', 'Project Management'
  ]
};

const DOMAIN_TOOLKITS = {
  [Domain.ENGINEERING]: [
    { name: 'CAD Modeler', icon: <SettingsIcon />, desc: '3D geometric construction' },
    { name: 'FEA Simulator', icon: <ZapIcon />, desc: 'Stress/Thermal analysis' },
    { name: 'CFD Analyzer', icon: <BarChartIcon />, desc: 'Fluid dynamics solver' },
    { name: 'P&ID Generator', icon: <ToolboxIcon />, desc: 'Process piping diagrams' },
    { name: 'BIM Integrator', icon: <BookOpenIcon />, desc: 'Building info modeling' },
    { name: 'Material Selector', icon: <ShieldIcon />, desc: 'Alloy & polymer property database' },
    { name: 'EIA Modeler', icon: <BarChartIcon />, desc: 'Environmental Impact Assessment' }
  ],
  [Domain.MEDICAL]: [
    { name: 'ICD-10 Coder', icon: <ToolboxIcon />, desc: 'Diagnostic classification' },
    { name: 'Drug Interaction', icon: <ZapIcon />, desc: 'Pharmacological checker' },
    { name: 'EHR Parser', icon: <BookOpenIcon />, desc: 'Health record analysis' },
    { name: 'Trial Matcher', icon: <UsersIcon />, desc: 'Clinical patient matching' },
    { name: 'Pathology Vision', icon: <CpuIcon />, desc: 'Image diagnostics node' }
  ],
  [Domain.SOFTWARE]: [
    { name: 'Complexity Analyzer', icon: <CpuIcon />, desc: 'Big O & performance profiling' },
    { name: 'Security Scanner', icon: <ShieldIcon />, desc: 'Vulnerability detection' },
    { name: 'Debugger Node', icon: <TerminalIcon />, desc: 'Logic flow verification' },
    { name: 'Container Architect', icon: <ToolboxIcon />, desc: 'Docker/K8s scaffolding' }
  ],
  [Domain.COMPUTER_SCIENCE]: [
    { name: 'Formal Verifier', icon: <ShieldIcon />, desc: 'Mathematical proof logic' },
    { name: 'Graph Visualizer', icon: <BarChartIcon />, desc: 'Pathfinding & topology' },
    { name: 'LLM Benchmarker', icon: <ZapIcon />, desc: 'Model latency & precision' }
  ],
  [Domain.GENERAL]: [
    { name: 'Risk Modeler', icon: <BarChartIcon />, desc: 'Financial volatility forecasting' },
    { name: 'Workflow Automator', icon: <ZapIcon />, desc: 'Task orchestration design' },
    { name: 'Strategic Planner', icon: <BookOpenIcon />, desc: 'SWOT & PESTLE analysis' }
  ]
};

const DOMAIN_CONFIG = [
  { id: Domain.SOFTWARE, icon: <TerminalIcon />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: Domain.COMPUTER_SCIENCE, icon: <CpuIcon />, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: Domain.ENGINEERING, icon: <SettingsIcon />, color: 'text-orange-400', bg: 'bg-orange-400/10', hasSub: true },
  { id: Domain.MEDICAL, icon: <HeartPulseIcon />, color: 'text-rose-400', bg: 'bg-rose-400/10', hasSub: true },
  { id: Domain.GENERAL, icon: <BookOpenIcon />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDomain, setActiveDomain] = useState<Domain | null>(null);
  const [activeSubDomain, setActiveSubDomain] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<WorkMode>(WorkMode.PROJECT);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [roomId, setRoomId] = useState<string>('default_research');
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem('omni_session');
    if (savedUsername) {
      const users = JSON.parse(localStorage.getItem('omni_users') || '{}');
      const userData = users[savedUsername];
      if (userData) {
        setUser({ 
          username: savedUsername, 
          id: savedUsername,
          email: userData.email,
          profilePicture: userData.profilePicture
        });
        loadHistory(savedUsername, roomId);
      }
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `omni_history_${roomId}`) {
        if (e.newValue) {
          const parsed = JSON.parse(e.newValue).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(parsed);
        }
      }
      if (e.key === `omni_presence_${roomId}`) {
        if (e.newValue) {
          setCollaborators(JSON.parse(e.newValue));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [roomId]);

  useEffect(() => {
    if (!user || !roomId) return;

    const updatePresence = () => {
      const presenceKey = `omni_presence_${roomId}`;
      const currentPresence: string[] = JSON.parse(localStorage.getItem(presenceKey) || '[]');
      if (!currentPresence.includes(user.username)) {
        const nextPresence = [...currentPresence, user.username];
        localStorage.setItem(presenceKey, JSON.stringify(nextPresence));
        setCollaborators(nextPresence);
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 5000);
    return () => clearInterval(interval);
  }, [user, roomId]);

  const loadHistory = (username: string, currentRoom: string) => {
    const history = localStorage.getItem(`omni_history_${currentRoom}`);
    if (history) {
      const parsed = JSON.parse(history).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
      setMessages(parsed);
    } else {
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `### OmniExpert Collaborative Research Node: ${currentRoom}\n\nSession initialized for **${username}**. This is a high-fidelity shared project space.\n\nSelect a **Work Mode**, specialized sub-domain or activate **Intelligence Toolkits** to focus targeted intelligence. Any research query sent here will be visible to all active collaborators.\n\n**Ready for project work. Select a domain context.**`,
        timestamp: new Date(),
        intent: MessageIntent.CHAT
      };
      setMessages([welcomeMsg]);
      saveHistory(currentRoom, [welcomeMsg]);
    }
  };

  const saveHistory = (currentRoom: string, msgs: Message[]) => {
    localStorage.setItem(`omni_history_${currentRoom}`, JSON.stringify(msgs));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (user && roomId) {
      scrollToBottom();
      saveHistory(roomId, messages);
    }
  }, [messages, user, roomId]);

  const handleLogin = (u: User) => {
    localStorage.setItem('omni_session', u.username);
    setUser(u);
    loadHistory(u.username, roomId);
  };

  const handleLogout = () => {
    localStorage.removeItem('omni_session');
    const presenceKey = `omni_presence_${roomId}`;
    const currentPresence: string[] = JSON.parse(localStorage.getItem(presenceKey) || '[]');
    localStorage.setItem(presenceKey, JSON.stringify(currentPresence.filter(u => u !== user?.username)));
    
    setUser(null);
    setMessages([]);
    setActiveDomain(null);
    setActiveSubDomain(null);
    setActiveTools([]);
  };

  const handleUpdateProfile = (updatedUser: User) => {
    const users = JSON.parse(localStorage.getItem('omni_users') || '{}');
    const oldUsername = user?.username;
    
    if (oldUsername && oldUsername !== updatedUser.username) {
      // Logic for username change (renaming key in storage)
      const userData = users[oldUsername];
      delete users[oldUsername];
      users[updatedUser.username] = { 
        ...userData, 
        email: updatedUser.email, 
        profilePicture: updatedUser.profilePicture 
      };
      localStorage.setItem('omni_session', updatedUser.username);
    } else if (oldUsername) {
      users[oldUsername] = { 
        ...users[oldUsername], 
        email: updatedUser.email, 
        profilePicture: updatedUser.profilePicture 
      };
    }

    localStorage.setItem('omni_users', JSON.stringify(users));
    setUser(updatedUser);
    setShowProfile(false);
  };

  const handleJoinRoom = () => {
    const nextRoom = prompt("Enter Research Room ID:", roomId);
    if (nextRoom && nextRoom !== roomId) {
      setRoomId(nextRoom);
      loadHistory(user!.username, nextRoom);
    }
  };

  const handleShareRoom = () => {
    navigator.clipboard.writeText(roomId);
    alert(`Project Room ID "${roomId}" copied to clipboard.`);
  };

  const handleUpdateFeedback = (messageId: string, feedback: Feedback) => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    );
    setMessages(updatedMessages);
    saveHistory(roomId, updatedMessages);
  };

  const toggleTool = (toolName: string) => {
    setActiveTools(prev => 
      prev.includes(toolName) 
        ? prev.filter(t => t !== toolName) 
        : [...prev, toolName]
    );
  };

  const performInference = async (content: string, isSearch: boolean = false) => {
    if (!user) return;

    let contextPrefix = `[MODE: ${activeMode.toUpperCase()}] `;
    if (activeSubDomain) contextPrefix += `[FOCUS: ${activeSubDomain}] `;
    else if (activeDomain) contextPrefix += `[DOMAIN: ${activeDomain}] `;
    
    if (activeTools.length > 0) {
      contextPrefix += `[ACTIVE_TOOLS: ${activeTools.join(', ')}] `;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      sender: user.username,
      content: contextPrefix + content,
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

      const toolsContext = activeTools.length > 0 ? ` leveraging active toolkits: ${activeTools.join(', ')}` : '';
      const domainContext = activeSubDomain 
        ? `acting as a world-class expert in ${activeSubDomain} (${activeDomain}) ${toolsContext} for deep ${activeMode === WorkMode.RESEARCH ? 'research and literature review' : 'technical prototyping'}` 
        : activeDomain 
          ? `acting as a senior lead expert in ${activeDomain} ${toolsContext}` 
          : `acting as a multi-disciplinary technical lead ${toolsContext}`;
      
      const effectivePrompt = isSearch 
        ? `[INTERNAL_ROUTE: /api/v1/search] ${domainContext}. Query: ${content}. Requirement: Conduct high-fidelity professional research, prioritize peer-reviewed citations where applicable, and synthesize findings into an actionable report.` 
        : `${domainContext}. Task: ${content}. Mode is ${activeMode}. Ensure technical precision and provide only relevant content without unwanted filler.`;

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
              let title = chunk.web.title || new URL(uri).hostname;
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
          ? { ...msg, content: "COMMUNICATION BREAKDOWN: Node synchronization failure. Please resend query." } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDomainClick = (domain: Domain) => {
    if (activeDomain === domain) {
      setActiveDomain(null);
      setActiveSubDomain(null);
      setActiveTools([]);
    } else {
      setActiveDomain(domain);
      setActiveSubDomain(null);
      setActiveTools([]);
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
              <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-400 rounded">COLLABORATIVE HUB</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Room: {roomId.toUpperCase()}</p>
              <button onClick={handleShareRoom} className="p-1 text-slate-600 hover:text-blue-400 transition-colors" title="Copy Room ID">
                <ShareIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowToolbox(!showToolbox)}
            className={`p-2 rounded-lg transition-all border ${
              showToolbox 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
            title="Intelligence Toolbox"
          >
            <ToolboxIcon />
          </button>

          <button 
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-full transition-all group"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-slate-900 overflow-hidden flex items-center justify-center text-[8px] font-black uppercase group-hover:scale-110 transition-transform shadow-lg">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.username.charAt(0)
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none pr-2">
              <span className="text-[10px] font-black uppercase text-slate-200">{user.username}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active Operator</span>
            </div>
          </button>

          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all flex items-center gap-2 border border-transparent hover:border-rose-500/20"
          >
            <LogoutIcon />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">TERMINATE</span>
          </button>
        </div>
      </header>

      {showProfile && (
        <Profile 
          user={user} 
          onUpdate={handleUpdateProfile} 
          onClose={() => setShowProfile(false)} 
        />
      )}

      {showToolbox && (
        <Toolbox 
          activeDomain={activeDomain}
          onSelectDomain={handleDomainClick}
          activeSubDomain={activeSubDomain}
          onSelectSubDomain={setActiveSubDomain}
          activeTools={activeTools}
          onToggleTool={toggleTool}
          onClose={() => setShowToolbox(false)}
          subDomains={SUB_DOMAINS}
          toolkits={DOMAIN_TOOLKITS}
        />
      )}

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/20 via-transparent to-transparent relative">
        <div className="max-w-7xl mx-auto px-6 pt-10">
          
          {/* Mode Switcher */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-900/80 border border-slate-800 p-1 rounded-2xl flex gap-1 shadow-2xl">
              <button 
                onClick={() => setActiveMode(WorkMode.RESEARCH)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
                  activeMode === WorkMode.RESEARCH 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                <LightbulbIcon />
                <span className="text-xs font-black uppercase tracking-widest">{WorkMode.RESEARCH}</span>
              </button>
              <button 
                onClick={() => setActiveMode(WorkMode.PROJECT)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
                  activeMode === WorkMode.PROJECT 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                <SettingsIcon />
                <span className="text-xs font-black uppercase tracking-widest">{WorkMode.PROJECT}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            {DOMAIN_CONFIG.map((domain) => (
              <button 
                key={domain.id}
                onClick={() => handleDomainClick(domain.id as Domain)}
                className={`flex flex-col gap-1 p-4 rounded-2xl border transition-all group flex-1 min-w-[160px] ${
                  activeDomain === domain.id 
                  ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10 scale-[1.02]' 
                  : 'border-slate-800/50 bg-slate-900/20 hover:bg-slate-800/40'
                }`}
              >
                <div className={`w-fit p-2 rounded-xl ${domain.bg} ${domain.color} group-hover:scale-110 transition-transform mb-1`}>
                  {domain.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
                  activeDomain === domain.id ? 'text-blue-400' : 'text-slate-500'
                }`}>
                  {domain.id}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Domain Indicator */}
          {activeDomain && !showToolbox && (
             <div className="flex items-center gap-4 mb-8 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl animate-in fade-in zoom-in duration-300">
               <div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg">
                 <SettingsIcon />
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Intelligence Node</span>
                 <span className="text-xs font-bold text-white uppercase">{activeDomain} {activeSubDomain && `> ${activeSubDomain}`}</span>
               </div>
               <button 
                onClick={() => setShowToolbox(true)}
                className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-700 rounded-xl"
               >
                 Expand Toolkit
               </button>
             </div>
          )}

          <div className="mt-8 pb-48">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onUpdateFeedback={handleUpdateFeedback}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      <div className="relative">
         {(activeSubDomain || activeTools.length > 0) && (
           <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-2xl flex items-center gap-3 whitespace-nowrap z-10 border border-white/10 animate-pulse ${
             activeDomain === Domain.ENGINEERING ? 'bg-orange-600' : activeDomain === Domain.MEDICAL ? 'bg-rose-600' : 'bg-blue-600'
           }`}>
             <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
             </span>
             {activeMode === WorkMode.RESEARCH ? 'Researching:' : 'Building:'} {activeSubDomain || activeDomain} {activeTools.length > 0 && `+ ${activeTools.length} Tools Active`}
           </div>
         )}
         <div className="absolute inset-x-0 bottom-full h-32 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent pointer-events-none"></div>
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