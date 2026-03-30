
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Camera, RefreshCw, Sparkles, Star, Heart, Pencil, Zap, Palette, Scroll, Grid3X3, Shapes, Box, Scissors, Ruler, Cpu, Fingerprint, Timer, FlipHorizontal } from 'lucide-react';
import { ColoringStyle, OutputFormat } from '../services/geminiService';

interface CameraModalProps {
  onCapture: (base64: string, style: ColoringStyle) => void;
  onClose: () => void;
  format: OutputFormat;
}

interface UpgradeItem {
  id: ColoringStyle;
  label: string;
  icon: any;
  description: string;
  color: string;
  isNew?: boolean;
  isVectorFavored?: boolean;
  category?: 'Vector Pro' | 'Artistic' | 'Technical';
}

const UPGRADES: UpgradeItem[] = [
  { id: 'detailed_micro', label: 'Micro Detail', icon: Fingerprint, description: 'Extreme precision vector tracing', color: 'bg-indigo-700', isVectorFavored: true, category: 'Vector Pro' },
  { id: 'detailed_textured', label: 'Engraved Tech', icon: Cpu, description: 'Simulated etching & textures', color: 'bg-indigo-900', isVectorFavored: true, category: 'Vector Pro' },
  { id: 'bold_geometric', label: 'Geometric Bold', icon: Shapes, description: 'Perfect sharp vector edges', color: 'bg-amber-600', isVectorFavored: true, category: 'Vector Pro' },
  { id: 'bold_sticker', label: 'Heavy Sticker', icon: Star, description: 'Thickest paths for cutting', color: 'bg-yellow-600', isVectorFavored: true, category: 'Vector Pro' },
  { id: 'minimalist', label: 'Minimalist', icon: Box, description: 'Pure elegant contour lines', color: 'bg-zinc-800', isVectorFavored: true, category: 'Technical' },
  { id: 'blueprint', label: 'Blueprint', icon: Ruler, description: 'Architectural technical paths', color: 'bg-sky-600', isVectorFavored: true, category: 'Technical' },
  { id: 'stencil', label: 'Stencil', icon: Scissors, description: 'Bold connected black shapes', color: 'bg-red-600', isVectorFavored: true, category: 'Technical' },
  { id: 'comic', label: 'Comic Art', icon: Zap, description: 'Dynamic graphic novel ink', color: 'bg-purple-600', isNew: true, category: 'Artistic' },
  { id: 'vintage', label: 'Vintage', icon: Scroll, description: 'Classic antique engraving', color: 'bg-orange-500', category: 'Artistic' },
  { id: 'sketchy', label: 'Sketchy', icon: Pencil, description: 'Raw artist pencil strokes', color: 'bg-emerald-500', category: 'Artistic' },
  { id: 'zentangle', label: 'Zentangle', icon: Grid3X3, description: 'Intricate pattern therapy', color: 'bg-blue-600', category: 'Artistic' },
  { id: 'popart', label: 'Pop Art', icon: Palette, description: 'Retro halftone dots', color: 'bg-rose-500', category: 'Artistic' },
  { id: 'cute', label: 'Kawaii', icon: Heart, description: 'Cute cartoon vibes', color: 'bg-pink-500', category: 'Artistic' },
  { id: 'standard', label: 'Classic', icon: Camera, description: 'Clean & true outlines', color: 'bg-slate-700', category: 'Artistic' },
];

export const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose, format }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [countdown, setCountdown] = useState<number | null>(null);

  const isVector = format === 'vector';

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      setIsLoading(true);
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsLoading(false);
    } catch {
      setError("Camera access denied. Please allow camera in browser settings.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!capturedImage) startCamera(facingMode);
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [capturedImage, facingMode, startCamera]);

  const handleSnap = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
      }
    }
  }, [facingMode]);

  const handleTimerSnap = () => {
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        handleSnap();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const handleFlip = () => {
    setFacingMode(f => f === 'environment' ? 'user' : 'environment');
  };

  const categories: ('Vector Pro' | 'Technical' | 'Artistic')[] = isVector 
    ? ['Vector Pro', 'Technical', 'Artistic'] 
    : ['Artistic', 'Technical'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[850px]">
        
        <div className="flex-1 relative bg-black flex flex-col min-h-[40vh] md:min-h-0 border-b md:border-b-0 md:border-r border-white/5">
          <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
            <h2 className="text-white font-black text-sm md:text-xl flex items-center gap-2 md:gap-3">
              {capturedImage ? <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" /> : <Camera className="w-5 h-5 md:w-6 md:h-6" />}
              {capturedImage ? 'AI Synthesis' : 'Capture'}
            </h2>
            <button onClick={onClose} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10">
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {isLoading && !capturedImage && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Lens Active...</p>
              </div>
            )}
            
            {error && <div className="p-8 text-center text-red-400 font-black">{error}</div>}

            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${isLoading || error ? 'hidden' : 'block'}`}
                style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : undefined}
              />
            ) : (
              <img src={capturedImage} className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500" alt="Captured" />
            )}
            <canvas ref={canvasRef} className="hidden" />

            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
                <span className="text-white font-black text-9xl animate-in zoom-in-50 duration-200 drop-shadow-2xl">
                  {countdown}
                </span>
              </div>
            )}
          </div>

          {!capturedImage && !error && !isLoading && (
            <div className="p-6 md:p-8 flex justify-center items-center gap-5 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
              {/* Timer button */}
              <button
                onClick={handleTimerSnap}
                disabled={countdown !== null}
                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all disabled:opacity-40"
                title="3 second timer"
              >
                <Timer className="w-5 h-5" />
              </button>

              {/* Snap button */}
              <button
                onClick={handleSnap}
                disabled={countdown !== null}
                className="group w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white flex items-center justify-center transition-all transform active:scale-90 hover:scale-105 shadow-xl disabled:opacity-40"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 md:w-8 md:h-8 text-slate-900" />
                </div>
              </button>

              {/* Flip camera */}
              <button
                onClick={handleFlip}
                disabled={countdown !== null}
                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all disabled:opacity-40"
                title="Flip camera"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {capturedImage && (
          <aside className="w-full md:w-96 bg-slate-900 p-4 md:p-6 flex flex-col gap-4 md:gap-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-black text-lg md:text-2xl tracking-tight">Style Page</h3>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Select AI Logic</p>
              </div>
              <button onClick={() => setCapturedImage(null)} className="p-2 text-slate-400 hover:text-white transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-6 flex-1 pb-4">
              {categories.map((cat) => {
                const filtered = UPGRADES.filter(u => u.category === cat);
                if (filtered.length === 0) return null;
                return (
                  <div key={cat} className="space-y-3">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{cat}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
                      {filtered.map((upgrade) => (
                        <button
                          key={upgrade.id}
                          onClick={() => onCapture(capturedImage, upgrade.id)}
                          className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 group`}
                        >
                          <div className={`p-2 rounded-xl ${upgrade.color} text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <upgrade.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-white font-black text-[10px] uppercase tracking-wide truncate">{upgrade.label}</h4>
                            <p className="text-slate-500 text-[8px] truncate">{upgrade.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
