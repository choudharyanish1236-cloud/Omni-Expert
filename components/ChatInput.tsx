
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, SearchIcon, ToolboxIcon, XIcon } from './Icons';
import { WorkMode, Attachment } from '../types';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  onSearch: (query: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  mode: WorkMode;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onSearch, isLoading, mode }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isResearch = mode === WorkMode.RESEARCH;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSend(input.trim(), attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSearch(input.trim(), attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments: Attachment[] = await Promise.all(
      files.map(async (file) => {
        return new Promise<Attachment>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              data: base64,
              size: file.size
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
    ? "Draft research query or upload papers..." 
    : "Describe project requirements or attach specs...";

  return (
    <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-md p-4 sticky bottom-0 z-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 duration-300">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 shadow-lg group">
                <div className="text-blue-400">
                  {file.mimeType.includes('pdf') ? 'PDF' : file.mimeType.includes('image') ? 'IMG' : 'DOC'}
                </div>
                <span className="text-[10px] font-bold text-slate-300 truncate max-w-[120px]">{file.name}</span>
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-end w-full">
          {/* File Upload Trigger */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.py,.js,.ts"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all shadow-inner"
            title="Attach Documents (PDF, Images, Code)"
          >
            <ToolboxIcon />
          </button>

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
            <button
              type="button"
              onClick={handleSearchClick}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${
                (input.trim() || attachments.length > 0) && !isLoading 
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 hover:bg-blue-600/20 hover:border-blue-400 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'
              }`}
            >
              <SearchIcon />
              <span className="hidden lg:inline">Deep Search</span>
            </button>

            <button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${
                (input.trim() || attachments.length > 0) && !isLoading 
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
            Multi-modal Reasoning Enabled
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
