
import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { track } from '../services/analytics';

interface FeedbackModalProps {
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    track('feedback_submitted', { rating, comment: comment.trim() || undefined });
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  const handleDismiss = () => {
    track('feedback_dismissed');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl space-y-5 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {submitted ? (
          <div className="text-center py-4 space-y-2">
            <div className="text-3xl">🎉</div>
            <p className="font-black text-white text-sm uppercase tracking-wide">Thanks for the feedback!</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-white text-base">How did it turn out?</h3>
                <p className="text-slate-500 text-xs mt-0.5">Help us improve the coloring pages.</p>
              </div>
              <button onClick={handleDismiss} className="p-1.5 text-slate-600 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRating('up')}
                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${rating === 'up' ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
              >
                <ThumbsUp className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-wide">Looks great</span>
              </button>
              <button
                onClick={() => setRating('down')}
                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${rating === 'down' ? 'bg-red-500/20 border-red-500/60 text-red-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
              >
                <ThumbsDown className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-wide">Needs work</span>
              </button>
            </div>

            {rating && (
              <textarea
                placeholder={rating === 'down' ? 'What could be better? (optional)' : 'Anything else to say? (optional)'}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-black/40 border border-white/10 h-20 resize-none focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600 text-white animate-in fade-in duration-150"
                autoFocus
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={!rating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              Send Feedback
            </button>
          </>
        )}
      </div>
    </div>
  );
};
