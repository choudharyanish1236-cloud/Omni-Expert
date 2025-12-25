
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, SearchIcon } from './Icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onSearch, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-md p-4 sticky bottom-0 z-10">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2 items-end">
        <div className="flex-1 relative bg-slate-800/80 border border-slate-700/50 rounded-xl overflow-hidden focus-within:ring-2 ring-blue-500/30 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or use Deep Search..."
            className="w-full bg-transparent border-none focus:ring-0 text-slate-200 p-3 resize-none custom-scrollbar min-h-[44px] text-sm md:text-base placeholder:text-slate-600"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={!input.trim() || isLoading}
            title="Deep Web Search"
            className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
              input.trim() && !isLoading 
                ? 'bg-slate-800 border-slate-700 hover:border-blue-500/50 text-blue-400 hover:bg-slate-700 shadow-lg' 
                : 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'
            }`}
          >
            <SearchIcon />
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            title="Send Message"
            className={`p-3 rounded-xl transition-all flex items-center justify-center ${
              input.trim() && !isLoading 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-slate-900 text-slate-700 cursor-not-allowed'
            }`}
          >
            <SendIcon />
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center gap-4 mt-3">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          OmniExpert v3.2 [Prototype]
        </p>
        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          Verified citations enabled
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
