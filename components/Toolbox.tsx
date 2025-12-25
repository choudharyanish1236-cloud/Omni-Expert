import React, { useState, useMemo } from 'react';
import { Domain } from '../types';
import { 
  XIcon, 
  SearchIcon, 
  SettingsIcon, 
  ZapIcon, 
  BarChartIcon, 
  ToolboxIcon, 
  BookOpenIcon, 
  ShieldIcon, 
  CpuIcon, 
  TerminalIcon 
} from './Icons';

interface Tool {
  name: string;
  icon: React.ReactNode;
  desc: string;
}

interface ToolboxProps {
  activeDomain: Domain | null;
  onSelectDomain: (domain: Domain) => void;
  activeSubDomain: string | null;
  onSelectSubDomain: (sub: string) => void;
  activeTools: string[];
  onToggleTool: (tool: string) => void;
  onClose: () => void;
  subDomains: Record<string, string[]>;
  toolkits: Record<string, Tool[]>;
}

const Toolbox: React.FC<ToolboxProps> = ({
  activeDomain,
  onSelectDomain,
  activeSubDomain,
  onSelectSubDomain,
  activeTools,
  onToggleTool,
  onClose,
  subDomains,
  toolkits
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const domains = Object.values(Domain);

  const filteredSubDomains = useMemo(() => {
    if (!activeDomain) return [];
    return subDomains[activeDomain].filter(sub => 
      sub.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeDomain, subDomains, searchQuery]);

  const filteredTools = useMemo(() => {
    if (!activeDomain) return [];
    return toolkits[activeDomain].filter(tool => 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeDomain, toolkits, searchQuery]);

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 z-[60] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg">
            <ToolboxIcon />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Intelligence Toolbox</h2>
        </div>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
          <XIcon />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Domain Selector Dropdown */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Intelligence Domain</label>
          <select 
            value={activeDomain || ''}
            onChange={(e) => onSelectDomain(e.target.value as Domain)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/30 outline-none appearance-none cursor-pointer shadow-inner"
          >
            <option value="" disabled>Select Domain Context...</option>
            {domains.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {activeDomain ? (
          <>
            {/* Search Tools */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </div>
              <input 
                type="text"
                placeholder="Search disciplines & tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/30 transition-all outline-none placeholder:text-slate-600"
              />
            </div>

            {/* Disciplines Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-3 rounded-full bg-blue-500"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disciplines</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredSubDomains.map(sub => (
                  <button
                    key={sub}
                    onClick={() => onSelectSubDomain(sub === activeSubDomain ? '' : sub)}
                    className={`px-3 py-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                      activeSubDomain === sub
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
                {filteredSubDomains.length === 0 && (
                  <p className="text-[10px] text-slate-600 italic px-1">No disciplines match filter.</p>
                )}
              </div>
            </div>

            {/* Analysis Software Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-3 rounded-full bg-indigo-500"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analysis Software</h3>
              </div>
              <div className="space-y-2">
                {filteredTools.map(tool => (
                  <button
                    key={tool.name}
                    onClick={() => onToggleTool(tool.name)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left ${
                      activeTools.includes(tool.name)
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-200'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/80 hover:border-slate-500'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${activeTools.includes(tool.name) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      {tool.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-black uppercase tracking-widest truncate">{tool.name}</span>
                      <span className="text-[9px] text-slate-600 font-medium truncate">{tool.desc}</span>
                    </div>
                    {activeTools.includes(tool.name) && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    )}
                  </button>
                ))}
                {filteredTools.length === 0 && (
                  <p className="text-[10px] text-slate-600 italic px-1">No tools match filter.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
            <div className="p-4 bg-slate-800 rounded-2xl">
              <ToolboxIcon />
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-[200px]">
              Select a domain context above to initialize available intelligence toolkits.
            </p>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900/50 border-t border-slate-800">
        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <span>Active Contexts:</span>
          <span className="text-blue-400">{activeTools.length + (activeSubDomain ? 1 : 0)} Modules</span>
        </div>
      </div>
    </div>
  );
};

export default Toolbox;