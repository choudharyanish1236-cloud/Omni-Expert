
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, SearchIcon } from './Icons';
import { WorkMode } from '../types';

interface ChatInputProps {
  onSend: (message: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  mode: WorkMode;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onSearch, isLoading, mode }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isResearch = mode === WorkMode.RESEARCH;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSearch(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const placeholder = isResearch 
    ? "Draft research query or article title..." 
    : "Describe project requirements or code task...";

  return (
    <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-md p-4 sticky bottom-0 z-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end w-full">
          <div className="flex-1 relative bg-slate-800/80 border border-slate-700/50 rounded-xl overflow-hidden focus-within:ring-2 ring-blue-500/30 transition-all shadow-inner">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent border-none focus:ring-0 text-slate-200 p-3 resize-none custom-scrollbar min-h-[44px] text-sm md:text-base placeholder:text-slate-600 outline-none"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2 shrink-0">
            {/* Dedicated Search Button */}
            <button
              type="button"
              onClick={handleSearchClick}
              disabled={!input.trim() || isLoading}
              title="Perform Deep Web Research"
              className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${
                input.trim() && !isLoading 
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 hover:bg-blue-600/20 hover:border-blue-400 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'
              }`}
            >
              <SearchIcon />
              <span className="hidden lg:inline">Deep Search</span>
            </button>

            {/* Send (Process) Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              title="Submit to Engine"
              className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${
                input.trim() && !isLoading 
                  ? `bg-${isResearch ? 'blue' : 'indigo'}-600 hover:bg-${isResearch ? 'blue' : 'indigo'}-500 text-white shadow-lg` 
                  : 'bg-slate-900 text-slate-700 cursor-not-allowed'
              }`}
            >
              <SendIcon />
              <span className="hidden lg:inline">Process</span>
            </button>
          </div>
        </form>
        
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isResearch ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'}`}></div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              {isResearch ? 'Research Engine Active' : 'Project Core Engaged'}
            </p>
          </div>
          <span className="w-1 h-1 rounded-full bg-slate-800"></span>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            {isResearch ? 'Literature Synthesis' : 'Technical Validation'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
