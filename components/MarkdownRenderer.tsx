
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const parseContent = (text: string) => {
    // Escape HTML to prevent XSS while we build our own structure
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks with syntax highlighting simulation
    html = html.replace(/```(\w+)?([\s\S]*?)```/g, (_match, lang, code) => {
      return `<div class="relative group my-4">
        <div class="absolute right-3 top-3 text-[10px] text-slate-500 uppercase font-bold">${lang || 'code'}</div>
        <pre class="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto text-xs md:text-sm font-mono text-blue-300"><code>${code.trim()}</code></pre>
      </div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

    // Section Headers (e.g., 1) Summary or 2. Architecture)
    html = html.replace(/^(\d+[\)\.]\s+)(.+)$/gm, '<h3 class="text-blue-400 font-bold text-lg mt-6 mb-2 flex items-center gap-2 border-b border-slate-800 pb-1"><span class="text-slate-500">$1</span>$2</h3>');

    // Bold text
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');

    // Bullet points
    html = html.replace(/^\s*[-•]\s+(.+)$/gm, '<li class="ml-4 mb-1 text-slate-300">$1</li>');
    
    // Numbered lists (alternative)
    html = html.replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li class="ml-4 mb-1 text-slate-300 list-decimal">$1</li>');

    // Wrap list items in lists
    const lines = html.split('\n');
    let inList = false;
    const finalLines = lines.map(line => {
      if (line.includes('<li') && !inList) {
        inList = true;
        return '<ul class="list-disc space-y-1 my-3">' + line;
      } else if (!line.includes('<li') && inList) {
        inList = false;
        return '</ul>' + line;
      }
      return line;
    });
    if (inList) finalLines.push('</ul>');

    html = finalLines.join('\n').replace(/\n/g, '<br/>');

    return { __html: html };
  };

  return (
    <div 
      className="markdown-content text-slate-300 leading-relaxed text-sm md:text-base selection:bg-blue-500/30"
      dangerouslySetInnerHTML={parseContent(content)}
    />
  );
};

export default MarkdownRenderer;
