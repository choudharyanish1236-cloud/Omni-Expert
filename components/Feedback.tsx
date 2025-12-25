
import React, { useState } from 'react';
import { ThumbsUpIcon, ThumbsDownIcon } from './Icons';
import { Feedback as FeedbackType } from '../types';

interface FeedbackProps {
  onFeedback: (feedback: FeedbackType) => void;
  existingFeedback?: FeedbackType;
}

const Feedback: React.FC<FeedbackProps> = ({ onFeedback, existingFeedback }) => {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [activeType, setActiveType] = useState<'up' | 'down' | null>(existingFeedback?.type || null);
  const [isSubmitted, setIsSubmitted] = useState(!!existingFeedback);

  const handleRate = (type: 'up' | 'down') => {
    if (isSubmitted) return;
    setActiveType(type);
    setShowComment(true);
  };

  const handleSubmit = () => {
    onFeedback({ type: activeType!, comment: comment.trim() });
    setIsSubmitted(true);
    setShowComment(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-medium mt-2">
        <span>Thank you for your feedback!</span>
        <div className="flex gap-1">
          {activeType === 'up' ? <ThumbsUpIcon className="w-3 h-3" /> : <ThumbsDownIcon className="w-3 h-3" />}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleRate('up')}
          className={`p-1.5 rounded-lg transition-colors ${activeType === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-700 text-slate-500'}`}
        >
          <ThumbsUpIcon />
        </button>
        <button
          onClick={() => handleRate('down')}
          className={`p-1.5 rounded-lg transition-colors ${activeType === 'down' ? 'bg-rose-500/20 text-rose-400' : 'hover:bg-slate-700 text-slate-500'}`}
        >
          <ThumbsDownIcon />
        </button>
      </div>

      {showComment && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Help us improve. Any details? (Optional)"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 resize-none h-16 focus:ring-1 focus:ring-blue-500/50"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowComment(false)}
              className="px-3 py-1 text-[10px] text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] font-bold rounded-md transition-colors"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
