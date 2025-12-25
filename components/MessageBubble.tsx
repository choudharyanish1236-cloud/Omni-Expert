
import React from 'react';
import { Message, Feedback as FeedbackType, MessageIntent } from '../types';
import { BotIcon, UserIcon, LightbulbIcon, ExternalLinkIcon, SearchIcon } from './Icons';
import MarkdownRenderer from './MarkdownRenderer';
import Feedback from './Feedback';

interface MessageBubbleProps {
  message: Message;
  onUpdateFeedback?: (messageId: string, feedback: FeedbackType) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onUpdateFeedback }) => {
  const isAssistant = message.role === 'assistant';
  const isSearch = message.intent === MessageIntent.SEARCH;

  return (
    <div className={`flex flex-col gap-4 py-8 ${isAssistant ? 'bg-slate-800/20' : ''}`}>
      <div className="max-w-4xl mx-auto w-full px-4 flex gap-4 md:gap-6">
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 shadow-lg ${
          isAssistant 
            ? isSearch 
              ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-indigo-500/10'
              : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/10' 
            : 'bg-slate-700 text-slate-300'
        }`}>
          {isAssistant ? (isSearch ? <SearchIcon /> : <BotIcon />) : <UserIcon />}
        </div>
        
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              {isAssistant 
                ? (isSearch ? 'Deep Search Result' : 'OmniExpert Node') 
                : `Operator: ${message.sender || 'Unknown'}`}
            </span>
            <span className="text-[10px] text-slate-600 font-mono">
              [{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
            </span>
            {isSearch && !isAssistant && (
              <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 rounded uppercase">Search Query</span>
            )}
          </div>

          {isAssistant && message.thinking && (
            <details className="bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden group">
              <summary className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-800/50 flex items-center gap-2 list-none transition-colors">
                <LightbulbIcon />
                <span>Internal Processing Sequence</span>
                <span className="ml-auto opacity-40 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-800 italic leading-relaxed whitespace-pre-wrap font-mono">
                {message.thinking}
              </div>
            </details>
          )}

          <div className="relative">
            <MarkdownRenderer content={message.content} />
          </div>

          {isAssistant && message.sources && message.sources.length > 0 && (
            <div className={`mt-6 pt-6 border-t border-slate-800/60 ${isSearch ? 'bg-blue-500/5 -mx-4 px-4 py-6 rounded-2xl border border-blue-500/10' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-3 rounded-full ${isSearch ? 'bg-indigo-500' : 'bg-blue-500'}`}></div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Citations [{message.sources.length}]</h4>
                </div>
                {isSearch && (
                  <span className="text-[9px] font-mono text-indigo-400/60 uppercase">Validated via /v1/search</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {message.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col gap-1 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl group hover:bg-slate-800 hover:border-blue-500/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-300 group-hover:text-blue-200 truncate">
                        {source.title}
                      </span>
                      <ExternalLinkIcon className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-600 truncate group-hover:text-slate-500">
                      {new URL(source.uri).hostname}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {isAssistant && message.content && (
            <div className="mt-2 opacity-60 hover:opacity-100 transition-opacity">
              <Feedback 
                existingFeedback={message.feedback}
                onFeedback={(f) => onUpdateFeedback?.(message.id, f)} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
