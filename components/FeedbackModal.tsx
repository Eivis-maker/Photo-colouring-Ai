
import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { track } from '../services/analytics';

const FORM_ID = '1FAIpQLSd2e84811m7SPswgDMFLIJ0OWjW7dzVM_3xcU7uYck04ViSLw';
const ENTRY_RATING  = 'entry.2077966667';
const ENTRY_COMMENT = 'entry.1861786847';
const ENTRY_SESSION = 'entry.1057610432';

function getSessionId() {
  let id = sessionStorage.getItem('colorpage_session');
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('colorpage_session', id); }
  return id;
}

interface FeedbackModalProps {
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!rating) return;

    track('feedback_submitted', { rating, comment: comment.trim() || undefined });

    // Submit silently to Google Forms
    const body = new URLSearchParams({
      [ENTRY_RATING]:  String(rating),
      [ENTRY_COMMENT]: comment.trim(),
      [ENTRY_SESSION]: getSessionId(),
    });

    fetch(`https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }).catch(() => {});

    setSubmitted(true);
    setTimeout(onClose, 1200);
  };

  const handleDismiss = () => {
    track('feedback_dismissed');
    onClose();
  };

  const displayRating = hovered ?? rating;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl space-y-5 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
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

            {/* 5 star rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(null)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className="w-8 h-8 transition-colors"
                    fill={displayRating !== null && star <= displayRating ? '#f59e0b' : 'transparent'}
                    stroke={displayRating !== null && star <= displayRating ? '#f59e0b' : '#475569'}
                  />
                </button>
              ))}
            </div>

            {rating && (
              <textarea
                placeholder={rating <= 2 ? 'What could be better? (optional)' : 'Anything else to say? (optional)'}
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
