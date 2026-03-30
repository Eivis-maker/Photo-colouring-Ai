
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Upload, Printer, RotateCcw, Eraser, Paintbrush, Sparkles, Download,
  Camera, Loader2, Trash2, Wand2, Image as ImageIcon, Undo, Redo, PaintBucket,
  ShieldCheck, Settings2, Wind, Highlighter, Hand, MoveDiagonal2, Minus,
  Crown, Palette, Target, Droplet, Sliders, Zap, Menu, X, Info, Pencil,
  PenTool, MousePointer2, HelpCircle
} from 'lucide-react';
import { ColorPicker } from './components/ColorPicker';
import { Editor } from './components/Editor';
import { CameraModal } from './components/CameraModal';
import { StylePresets } from './components/StylePresets';
import { convertToLineArt, editWithAI, upscaleToStudioMaster, ColoringStyle, ImageResolution, OutputFormat } from './services/geminiService';
import { track } from './services/analytics';
import { FeedbackModal } from './components/FeedbackModal';
import { Toast } from './components/Toast';
import { ToolType } from './types';

const BRUSH_PRESETS = [
  { label: 'Detail', size: 1 },
  { label: 'Fine', size: 4 },
  { label: 'Normal', size: 12 },
  { label: 'Bold', size: 32 },
  { label: 'Max', size: 80 },
];

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [brushColor, setBrushColor] = useState('#4f46e5');
  const [brushSize, setBrushSize] = useState(12);
  const [brushHardness, setBrushHardness] = useState(90);
  const [brushSpacing, setBrushSpacing] = useState(15);
  const [brushFlow, setBrushFlow] = useState(100);
  const [brushSmoothing, setBrushSmoothing] = useState(30);
  const [pressureEnabled, setPressureEnabled] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.BRUSH);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  const [resolution, setResolution] = useState<ImageResolution>('2K'); 
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('raster');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [basicStyle, setBasicStyle] = useState<'simple' | 'standard' | 'detailed'>('standard');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackShownRef = useRef(false);

  const triggerFeedback = () => {
    if (!feedbackShownRef.current) {
      feedbackShownRef.current = true;
      setShowFeedback(true);
      track('feedback_shown');
    }
  };

  useEffect(() => {
    track('landing_view');
    const visited = localStorage.getItem('chromasketch_visited');
    if (!visited) {
      setShowHelp(true);
      localStorage.setItem('chromasketch_visited', 'true');
    }
  }, []);

  const checkProPermissions = async () => {
    try {
      if (typeof (window as any).aistudio.hasSelectedApiKey === 'function' && !await (window as any).aistudio.hasSelectedApiKey()) {
        await (window as any).aistudio.openSelectKey();
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const DEMO_EMOJIS = ['🦁', '🐱', '🌸', '🦋', '🐘', '🦄', '🐶', '🦊', '🐸', '🌵', '🦀', '🐬'];

  const handleDemoSelect = (emoji: string) => {
    setShowDemoModal(false);
    setShowHelp(false);
    track('demo_emoji_selected', { emoji });
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.font = `${size * 0.7}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2);
    processImage(canvas.toDataURL('image/png'));
  };

  const handleError = async (error: unknown) => {
    console.error("API Error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("permission denied") || errorMsg.includes("Requested entity was not found") || errorMsg.includes("403") || errorMsg.includes("404")) {
      setToastMessage("API key issue — please check your key and try again.");
    } else if (errorMsg.includes("quota") || errorMsg.includes("429")) {
      setToastMessage("Too many requests — please wait a moment and try again.");
    } else if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
      setToastMessage("Connection error — check your internet and try again.");
    } else {
      setToastMessage("Coloring page generation failed. Please try again.");
    }
  };

  const BASIC_STYLE_MAP: Record<'simple' | 'standard' | 'detailed', ColoringStyle> = {
    simple: 'bold',
    standard: 'standard',
    detailed: 'detailed',
  };

  const processImage = async (base64: string, style?: ColoringStyle) => {
    const resolvedStyle: ColoringStyle = style ?? BASIC_STYLE_MAP[basicStyle];
    if (outputFormat === 'vector' || isProMode || resolution === '4K') {
      await checkProPermissions();
    }
    setOriginalImage(base64);
    setShowOriginal(false);
    setIsProcessing(true);
    setIsSidebarOpen(false);
    track('generate_started', { style: resolvedStyle, resolution, outputFormat, isProMode });
    try {
      const lineArt = await convertToLineArt(base64, resolvedStyle, resolution, outputFormat, isProMode);
      setImage(lineArt);
      track('generate_success', { style: resolvedStyle });
    } catch (error) {
      track('generate_failed', { error: String(error) });
      await handleError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMasterUpscale = async () => {
    const success = await checkProPermissions();
    if (!success) return;
    setIsProcessing(true);
    try {
      const data = (window as any).getCombinedImage?.();
      if (!data) return;
      const mastered = await upscaleToStudioMaster(data);
      setImage(mastered);
      setResolution('4K');
      setIsProMode(true);
    } catch (error) {
      await handleError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const adjustBrushSize = (delta: number) => {
    setBrushSize(prev => Math.max(1, Math.min(100, prev + delta)));
  };

  const downloadJPG = () => {
    const data = (window as any).getCombinedImage?.();
    if (!data) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.download = `coloring-page-${Date.now()}.jpg`;
      link.click();
    };
    img.src = data;
  };

  const applyStylePreset = (color: string, size: number, tool: ToolType) => {
    setBrushColor(color);
    setBrushSize(size);
    setActiveTool(tool);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const toggleProEngine = async () => {
    if (!isProMode) {
      const success = await checkProPermissions();
      if (success) {
        setIsProMode(true);
        setResolution('4K');
      }
    } else {
      setIsProMode(false);
      setResolution('2K');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      {showCamera && (
        <CameraModal 
          onCapture={(base64, style) => { setShowCamera(false); processImage(base64, style); }} 
          onClose={() => setShowCamera(false)} 
          format={outputFormat}
        />
      )}

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black tracking-tight">Pick an emoji</h2>
              <p className="text-slate-500 text-sm">We'll turn it into a coloring page.</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {DEMO_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleDemoSelect(emoji)}
                  className="text-4xl h-16 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-indigo-500/20 hover:scale-110 transition-all border border-white/5 hover:border-indigo-500/40"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button onClick={() => setShowDemoModal(false)} className="w-full py-3 text-xs font-black uppercase text-slate-500 hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackModal onClose={() => { setShowFeedback(false); track('feedback_dismissed'); }} />
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-lg w-full shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 mb-4">
                <Sparkles className="text-white w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black tracking-tight">Turn any photo into a coloring page</h2>
              <p className="text-slate-500 text-sm">Upload a photo and get a printable coloring page in seconds.</p>
            </div>
            
            <div className="grid gap-3">
              <button onClick={() => { setShowHelp(false); setShowCamera(true); }} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Camera className="w-6 h-6 text-indigo-400" /></div>
                <div><h4 className="font-black text-sm uppercase tracking-wide">Take a Photo</h4><p className="text-[10px] text-slate-500">Use your camera to capture a photo.</p></div>
              </button>
              <button onClick={() => { setShowHelp(false); fileInputRef.current?.click(); }} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Upload className="w-6 h-6 text-emerald-400" /></div>
                <div><h4 className="font-black text-sm uppercase tracking-wide">Upload Photo</h4><p className="text-[10px] text-slate-500">Choose a photo from your device.</p></div>
              </button>
              <button onClick={() => { setShowHelp(false); setShowDemoModal(true); }} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Sparkles className="w-6 h-6 text-purple-400" /></div>
                <div><h4 className="font-black text-sm uppercase tracking-wide">Try Demo</h4><p className="text-[10px] text-slate-500">Pick an emoji and see it as a coloring page.</p></div>
              </button>
            </div>

            <button onClick={() => setShowHelp(false)} className="w-full py-4 text-xs font-black uppercase text-slate-500 hover:text-white transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-4 md:px-6 py-2.5 flex justify-between items-center shrink-0 z-[60] safe-top gap-3">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setShowHelp(true)}>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black tracking-tight text-white leading-none">ColorPage</h1>
              <p className="text-[7px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-0.5">Photo to Coloring Page</p>
            </div>
          </div>
        </div>

        {/* Center: action buttons when image exists — desktop only */}
        {image && (
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-center">
            {/* Before/After toggle */}
            {originalImage && (
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 mr-1">
                <button
                  onClick={() => { setShowOriginal(false); track('before_after_toggled', { view: 'result' }); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${!showOriginal ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Result
                </button>
                <button
                  onClick={() => { setShowOriginal(true); track('before_after_toggled', { view: 'original' }); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${showOriginal ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Original
                </button>
              </div>
            )}
            <button onClick={() => (window as any).undo?.()} disabled={!canUndo || showOriginal} className="p-2 rounded-xl bg-white/5 text-white disabled:opacity-20 hover:bg-white/10 transition-all border border-white/5" title="Undo"><Undo className="w-4 h-4" /></button>
            <button onClick={() => (window as any).redo?.()} disabled={!canRedo || showOriginal} className="p-2 rounded-xl bg-white/5 text-white disabled:opacity-20 hover:bg-white/10 transition-all border border-white/5" title="Redo"><Redo className="w-4 h-4" /></button>
            <button onClick={() => (window as any).clearCanvas?.()} disabled={showOriginal} className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-red-400 disabled:opacity-30 transition-all font-black text-[10px] uppercase tracking-widest bg-white/5 border border-white/5 rounded-xl" title="Reset"><RotateCcw className="w-3.5 h-3.5" /><span className="hidden md:inline">Reset</span></button>
            <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />
            <button onClick={() => { track('png_download_clicked'); triggerFeedback(); const data = (window as any).getCombinedImage?.(); const link = document.createElement('a'); link.href = data; link.download = `colorpage-${Date.now()}.png`; link.click(); }} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-white border border-white/5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"><Download className="w-4 h-4" /><span className="hidden md:inline">PNG</span></button>
            <button onClick={() => { track('jpg_download_clicked'); triggerFeedback(); downloadJPG(); }} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-white border border-white/5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"><Download className="w-4 h-4" /><span className="hidden md:inline">JPG</span></button>
            <button onClick={() => { track('print_clicked'); triggerFeedback(); const data = (window as any).getCombinedImage?.(); const win = window.open(); win?.document.write(`<img src="${data}" style="width:100%">`); win?.print(); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20"><Printer className="w-4 h-4" /><span className="hidden sm:inline">Print</span></button>
          </div>
        )}

        {/* Right: Camera + Upload */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => { track('camera_click'); setShowCamera(true); }} className="hidden md:flex items-center gap-2 p-2.5 md:px-4 md:py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold border border-white/5">
            <Camera className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:block text-[11px] uppercase tracking-wide">Camera</span>
          </button>
          <button onClick={() => { track('upload_click'); fileInputRef.current?.click(); }} className="flex items-center gap-2 p-2.5 md:px-4 md:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-bold shadow-xl shadow-indigo-500/20">
            <Upload className="w-4 h-4" />
            <span className="hidden md:block text-[11px] uppercase tracking-wide">{image ? 'New Photo' : 'Upload Photo'}</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              track('photo_uploaded');
              const reader = new FileReader();
              reader.onload = (ev) => processImage(ev.target?.result as string);
              reader.readAsDataURL(file);
            }
          }} />
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
        
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-slate-950/95 lg:bg-slate-950/40 backdrop-blur-3xl lg:backdrop-blur-2xl border-r border-white/5 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar z-[80] lg:z-40 lg:relative lg:translate-x-0 transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
          {/* Mobile header */}
          <div className="flex justify-between items-center lg:hidden pb-2">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-500" />
              <h2 className="text-white font-black uppercase text-xs tracking-widest">Settings</h2>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
          </div>

          {!image ? (
            /* ── Empty state ── */
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <h2 className="text-sm font-black text-white">Get started</h2>
                <p className="text-xs text-slate-500 leading-relaxed">Upload any photo and we'll turn it into a printable coloring page in seconds.</p>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => { track('upload_click'); fileInputRef.current?.click(); }} className="flex items-center gap-3 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wide transition-all shadow-lg shadow-indigo-500/20">
                  <Upload className="w-4 h-4 shrink-0" />
                  Upload Photo
                </button>
                <button onClick={() => { track('camera_click'); setShowCamera(true); }} className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-wide transition-all border border-white/5">
                  <Camera className="w-4 h-4 shrink-0" />
                  Take a Photo
                </button>
                <button onClick={() => { track('demo_opened'); setShowDemoModal(true); }} className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-wide transition-all border border-white/5">
                  <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
                  Try Demo
                </button>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/5">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">How it works</p>
                {[
                  { n: '1', text: 'Upload any photo — pet, portrait, landscape' },
                  { n: '2', text: 'AI converts it to a clean coloring page' },
                  { n: '3', text: 'Color it in the app, download or print' },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{s.n}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <>
          {/* BASIC: Colors */}
          <section>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Palette className="w-3 h-3" /> Colors</h3>
            <ColorPicker currentColor={brushColor} onChange={setBrushColor} />
          </section>

          {/* BASIC: Brush size */}
          <section className="bg-white/5 p-5 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Sliders className="w-3 h-3" /> Brush Size</h3>
              <div className="flex items-center gap-1.5">
                <button onClick={() => adjustBrushSize(-2)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 border border-white/5"><Minus className="w-3 h-3" /></button>
                <span className="w-8 text-center text-indigo-400 font-mono text-[11px] font-bold">{brushSize}</span>
                <button onClick={() => adjustBrushSize(2)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 border border-white/5"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
            <input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
          </section>

          {/* BASIC: 3 core tools */}
          <section>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Tools</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: ToolType.BRUSH, icon: Paintbrush, label: 'Brush' },
                { id: ToolType.BUCKET, icon: PaintBucket, label: 'Fill' },
                { id: ToolType.ERASER, icon: Eraser, label: 'Eraser' },
              ].map(t => (
                <button
                  key={t.id} onClick={() => { setActiveTool(t.id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all ${activeTool === t.id ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10' : 'border-transparent bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  <t.icon className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wide">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* BASIC: Line style */}
          <section>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Line Style</h3>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'simple', label: 'Simple', desc: 'Bold lines' },
                { id: 'standard', label: 'Standard', desc: 'Balanced' },
                { id: 'detailed', label: 'Detailed', desc: 'Fine lines' },
              ] as const).map(s => (
                <button
                  key={s.id}
                  onClick={() => setBasicStyle(s.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all ${basicStyle === s.id ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-transparent bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  <span className="text-[11px] font-black uppercase">{s.label}</span>
                  <span className="text-[8px] text-slate-500">{s.desc}</span>
                </button>
              ))}
            </div>
            {originalImage && (
              <button
                onClick={() => processImage(originalImage)}
                disabled={isProcessing}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-white/10"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Regenerate
              </button>
            )}
          </section>

          {/* Advanced Settings toggle */}
          <button
            onClick={() => setIsAdvancedMode(v => !v)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all ${isAdvancedMode ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'}`}
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Advanced Settings</span>
            </div>
            <span className="text-[10px] opacity-70">{isAdvancedMode ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {/* ADVANCED sections */}
          {isAdvancedMode && (
            <>
              {/* Engine Config */}
              <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Processing</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={toggleProEngine} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isProMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                    <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Enhanced Mode</span></div>
                    {isProMode && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Output Type</label>
                      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        {(['raster', 'vector'] as OutputFormat[]).map(f => (
                          <button key={f} onClick={() => setOutputFormat(f)} className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${outputFormat === f ? 'bg-white/10 text-white' : 'text-slate-500'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Resolution</label>
                      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        {(['1K', '2K', '4K'] as ImageResolution[]).map(r => (
                          <button key={r} onClick={async () => { if (r !== '1K') await checkProPermissions(); setResolution(r); }} className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${resolution === r ? 'bg-indigo-500 text-white' : 'text-slate-500'}`}>{r}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Style Presets */}
              <section><StylePresets currentColor={brushColor} currentSize={brushSize} currentTool={activeTool} onApplyPreset={applyStylePreset} /></section>

              {/* All tools */}
              <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">All Tools</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: ToolType.BRUSH, icon: Paintbrush, label: 'Brush' },
                    { id: ToolType.CRAYON, icon: MousePointer2, label: 'Crayon' },
                    { id: ToolType.MARKER, icon: PenTool, label: 'Marker' },
                    { id: ToolType.PENCIL, icon: Pencil, label: 'Pencil' },
                    { id: ToolType.BUCKET, icon: PaintBucket, label: 'Fill' },
                    { id: ToolType.ERASER, icon: Eraser, label: 'Eraser' },
                    { id: ToolType.HIGHLIGHTER, icon: Highlighter, label: 'Highlighter' },
                    { id: ToolType.PAN, icon: Hand, label: 'Hand' },
                  ].map(t => (
                    <button
                      key={t.id} onClick={() => { setActiveTool(t.id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${activeTool === t.id ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10' : 'border-transparent bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      <t.icon className="w-4 h-4 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-wide truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Advanced brush dynamics */}
              {(activeTool === ToolType.BRUSH || activeTool === ToolType.SPRAY || activeTool === ToolType.CRAYON || activeTool === ToolType.MARKER) && (
                <section className="bg-white/5 p-5 rounded-3xl border border-white/5 space-y-4">
                  {[
                    { id: 'hardness', icon: Target, label: 'Hardness', value: brushHardness, setter: setBrushHardness },
                    { id: 'flow', icon: Droplet, label: 'Flow', value: brushFlow, setter: setBrushFlow },
                    { id: 'smoothing', icon: Wind, label: 'Smoothing', value: brushSmoothing, setter: setBrushSmoothing },
                  ].map((dyn) => (
                    <div key={dyn.id} className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><dyn.icon className="w-2.5 h-2.5" /> {dyn.label}</label>
                        <span className="text-[9px] font-mono text-indigo-400">{dyn.value}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={dyn.value} onChange={(e) => dyn.setter(parseInt(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none accent-indigo-500" />
                    </div>
                  ))}
                </section>
              )}

              {/* Enhance + AI edit */}
              <section className="space-y-4">
                {image && (
                  <button onClick={handleMasterUpscale} className="w-full group relative flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    Enhance Lines
                  </button>
                )}
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                  <textarea placeholder="Edit with AI (e.g. 'Clean lines', 'Add details')..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="w-full text-xs p-3 rounded-xl bg-black/40 border border-white/5 h-20 resize-none focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600" />
                  <button onClick={async () => { if (!image) return; setIsProcessing(true); try { const edited = await editWithAI(image!, aiPrompt, isProMode); setImage(edited); setAiPrompt(''); } catch(e) { await handleError(e); } finally { setIsProcessing(false); } }} className="mt-3 w-full bg-white text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2" disabled={!image || !aiPrompt || isProcessing}><Sparkles className="w-3.5 h-3.5" /> Apply</button>
                </div>
              </section>
            </>
          )}
          </>
          )}
        </aside>

        {/* Workspace */}
        <section className="flex-1 flex flex-col p-3 md:p-8 relative bg-[#020617] safe-bottom">
          <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-2xl">
            <div className={`w-2 h-2 rounded-full ${isProMode ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{isProMode ? 'Enhanced mode' : 'Standard mode'}</span>
          </div>

          <button onClick={() => setShowHelp(true)} className="absolute top-4 right-4 z-40 p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-slate-400 hover:text-white transition-all"><HelpCircle className="w-5 h-5" /></button>

          <div className="flex-1 relative pb-20 lg:pb-0">
            {isProcessing && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-md rounded-[2rem]">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 border-[3px] border-white/5 border-t-indigo-500 rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
                  <div className="text-center"><p className="text-white font-black uppercase text-[11px] tracking-widest mb-1">Creating your coloring page...</p><p className="text-slate-500 text-[9px] uppercase tracking-widest">This may take a few seconds</p></div>
                </div>
              </div>
            )}

            {!image ? (
              <div className="h-full border-2 border-dashed border-white/5 rounded-[2.5rem] md:rounded-[3rem] flex flex-col items-center justify-center bg-white/5 gap-6 md:gap-8 text-center px-6 md:px-12 group transition-all">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-indigo-600/5 text-indigo-400 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center transform group-hover:rotate-3 transition-transform"><ImageIcon className="w-10 h-10 md:w-16 md:h-16" /></div>
                <div className="space-y-3"><h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">Turn any photo into a coloring page.</h2><p className="max-w-xs md:max-w-md mx-auto text-slate-500 text-xs md:text-sm font-medium leading-relaxed">Upload a photo and get a printable coloring page instantly.</p></div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5">Upload Photo</button>
                  <button onClick={() => { track('demo_opened'); setShowDemoModal(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20">Try Demo</button>
                </div>
              </div>
            ) : (
              <Editor
                backgroundImage={showOriginal ? originalImage : image}
                originalImage={originalImage}
                brushColor={brushColor}
                brushSize={brushSize}
                brushHardness={brushHardness}
                brushSpacing={brushSpacing}
                brushFlow={brushFlow}
                brushSmoothing={brushSmoothing}
                pressureEnabled={pressureEnabled}
                tool={showOriginal ? ToolType.PAN : activeTool}
                onHistoryChange={(u, r) => { setCanUndo(u); setCanRedo(r); }}
                onToolChange={setActiveTool}
                readOnly={showOriginal}
              />
            )}
          </div>

        </section>

        {/* Mobile bottom action bar */}
        {image && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-slate-950/98 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center gap-2 safe-bottom">
            {/* Color dot — opens sidebar */}
            {!showOriginal && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="shrink-0 w-9 h-9 rounded-xl border-2 border-white/20 shadow-lg"
                style={{ backgroundColor: brushColor }}
                title="Change color"
              />
            )}
            {/* Draw toggle */}
            {!showOriginal && (
              <button
                onClick={() => setActiveTool(activeTool === ToolType.PAN ? ToolType.BRUSH : ToolType.PAN)}
                className={`shrink-0 p-2.5 rounded-xl border transition-all ${activeTool !== ToolType.PAN ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                title={activeTool !== ToolType.PAN ? 'Drawing ON' : 'Drawing OFF'}
              >
                <Paintbrush className="w-4 h-4" />
              </button>
            )}
            {/* Before/After */}
            {originalImage && (
              <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 shrink-0">
                <button onClick={() => { setShowOriginal(false); track('before_after_toggled', { view: 'result' }); }} className={`px-2.5 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wide transition-all ${!showOriginal ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Result</button>
                <button onClick={() => { setShowOriginal(true); track('before_after_toggled', { view: 'original' }); }} className={`px-2.5 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wide transition-all ${showOriginal ? 'bg-white/15 text-white' : 'text-slate-400'}`}>Original</button>
              </div>
            )}
            {/* Undo / Redo */}
            <button onClick={() => (window as any).undo?.()} disabled={!canUndo || showOriginal} className="p-2.5 rounded-xl bg-white/5 text-white disabled:opacity-20 border border-white/5 shrink-0"><Undo className="w-4 h-4" /></button>
            <div className="flex-1" />
            {/* Download + Print */}
            <button onClick={() => { track('jpg_download_clicked'); triggerFeedback(); downloadJPG(); }} className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 text-white border border-white/5 rounded-xl font-black text-[9px] uppercase tracking-wide shrink-0"><Download className="w-3.5 h-3.5" />Save</button>
            <button onClick={() => { track('print_clicked'); triggerFeedback(); const data = (window as any).getCombinedImage?.(); const win = window.open(); win?.document.write(`<img src="${data}" style="width:100%">`); win?.print(); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-wide shrink-0 shadow-lg shadow-indigo-500/20"><Printer className="w-3.5 h-3.5" />Print</button>
          </div>
        )}
      </main>

      <footer className="hidden lg:flex bg-slate-950 border-t border-white/5 px-8 py-3 text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] justify-between shrink-0 z-50">
        <div className="flex gap-6 items-center"><span>&copy; 2025 ColorPage</span></div>
        <div className="flex items-center gap-6"><span className="text-slate-400">Powered by Google Gemini</span></div>
      </footer>
    </div>
  );
};

export default App;
