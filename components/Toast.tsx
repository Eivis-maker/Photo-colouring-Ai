
import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-3 bg-red-950/95 border border-red-500/40 text-red-200 px-4 py-3 rounded-2xl shadow-2xl max-w-sm">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-xs font-medium leading-snug">{message}</span>
        <button onClick={onClose} className="ml-1 p-0.5 hover:text-white transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
