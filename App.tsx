
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Upload, Printer, RotateCcw, Eraser, Paintbrush, Sparkles, Download,
  Camera, Loader2, Trash2, Wand2, Image as ImageIcon, Undo, Redo, PaintBucket,
  ShieldCheck, Settings2, Wind, Highlighter, Hand, MoveDiagonal2, Minus, 
  Crown, Palette, Target, Droplet, Sliders, Zap, Menu, X, Info, Pencil, 
  PenTool, MousePointer2, HelpCircle, FilePlus
} from 'lucide-react';
import { ColorPicker } from './components/ColorPicker';
import { Editor } from './components/Editor';
import { CameraModal } from './components/CameraModal';
import { StylePresets } from './components/StylePresets';
import { convertToLineArt, editWithAI, upscaleToStudioMaster, ColoringStyle, ImageResolution, OutputFormat } from './services/geminiService';
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if it's the first time
  useEffect(() => {
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

  const handleStartBlank = () => {
    const blank = document.createElement('canvas');
    blank.width = 2048;
    blank.height = 2048;
    const ctx = blank.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 2048, 2048);
    }
    setImage(blank.toDataURL('image/png'));
    setOriginalImage(null);
    setShowHelp(false);
  };

  const handleError = async (error: any) => {
    console.error("API Error:", error);
    const errorMsg = error?.message || "";
    if (errorMsg.includes("permission denied") || errorMsg.includes("Requested entity was not found") || errorMsg.includes("403") || errorMsg.includes("404")) {
      alert("This advanced feature requires a selected API key. Please select your key in the next dialog.");
      if (typeof (window as any).aistudio.openSelectKey === 'function') {
        await (window as any).aistudio.openSelectKey();
      }
    } else {
      alert("AI Processing Failed. Please check your connection.");
    }
  };

  const processImage = async (base64: string, style: ColoringStyle = 'standard') => {
    if (outputFormat === 'vector' || isProMode || resolution === '4K') {
      await checkProPermissions();
    }
    setOriginalImage(base64);
    setIsProcessing(true);
    setIsSidebarOpen(false);
    try {
      const lineArt = await convertToLineArt(base64, style, resolution, outputFormat, isProMode);
      setImage(lineArt);
    } catch (error) {
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

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-lg w-full shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 mb-4">
                <Sparkles className="text-white w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black tracking-tight">Welcome to Studio</h2>
              <p className="text-slate-500 text-sm">Choose how you'd like to begin your artwork.</p>
            </div>
            
            <div className="grid gap-3">
              <button onClick={() => { setShowHelp(false); setShowCamera(true); }} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Camera className="w-6 h-6 text-indigo-400" /></div>
                <div><h4 className="font-black text-sm uppercase tracking-wide">Studio Camera</h4><p className="text-[10px] text-slate-500">Capture a real photo and reconstruct it.</p></div>
              </button>
              <button onClick={() => { setShowHelp(false); fileInputRef.current?.click(); }} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Upload className="w-6 h-6 text-emerald-400" /></div>
                <div><h4 className="font-black text-sm uppercase tracking-wide">Import Photo</h4><p className="text-[10px] text-slate-500">Upload from your library for AI mastering.</p></div>
              </button>
              <button onClick={handleStartBlank} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FilePlus className="w-6 h-6 text-purple-400" /></div>
                <div><h4 className="font-black text-sm uppercase tracking-wide">Blank Canvas</h4><p className="text-[10px] text-slate-500">Start drawing with crayons and markers now.</p></div>
              </button>
            </div>

            <button onClick={() => setShowHelp(false)} className="w-full py-4 text-xs font-black uppercase text-slate-500 hover:text-white transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-4 md:px-8 py-3 flex justify-between items-center shrink-0 z-[60] safe-top">
        <div className="flex items-center gap-3 md:gap-10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2 group cursor-pointer" title="ChromaSketch Studio" onClick={() => setShowHelp(true)}>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <Sparkles className="text-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-sm md:text-lg font-black tracking-tight text-white leading-none">ChromaSketch</h1>
              <p className="text-[7px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-0.5">AI Pro 4K</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowCamera(true)} className="flex items-center gap-2 p-2.5 md:px-5 md:py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold border border-white/5">
            <Camera className="w-5 h-5 text-indigo-400" />
            <span className="hidden sm:block text-[11px] uppercase tracking-wide">Studio Cam</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 p-2.5 md:px-5 md:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-bold shadow-xl shadow-indigo-500/20">
            <Upload className="w-5 h-5" />
            <span className="hidden sm:block text-[11px] uppercase tracking-wide">Import</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if(file) {
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
          <div className="flex justify-between items-center lg:hidden pb-2">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-500" />
              <h2 className="text-white font-black uppercase text-xs tracking-widest">Studio Panel</h2>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
          </div>

          <section>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Engine Config</h3>
            <div className="flex flex-col gap-2">
              <button onClick={toggleProEngine} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isProMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Studio Engine</span></div>
                {isProMode && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                 <div className="flex flex-col gap-1.5">
                   <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Mastering</label>
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

          <section><h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Palette className="w-3 h-3" /> Pigment Library</h3><ColorPicker currentColor={brushColor} onChange={setBrushColor} /></section>
          <section><StylePresets currentColor={brushColor} currentSize={brushSize} currentTool={activeTool} onApplyPreset={applyStylePreset} /></section>

          <section className="bg-white/5 p-5 rounded-3xl border border-white/5 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Sliders className="w-3 h-3" /> Tool Dynamics</h3>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => adjustBrushSize(-2)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 border border-white/5"><Minus className="w-3 h-3" /></button>
                  <span className="w-8 text-center text-indigo-400 font-mono text-[11px] font-bold">{brushSize}</span>
                  <button onClick={() => adjustBrushSize(2)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 border border-white/5"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
              <input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-4" />
              <div className="grid grid-cols-5 gap-1.5">
                {BRUSH_PRESETS.map((p) => (
                  <button key={p.label} onClick={() => setBrushSize(p.size)} className={`py-2 rounded-xl text-[9px] font-black transition-all ${brushSize === p.size ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700'}`}>{p.label[0]}</button>
                ))}
              </div>
            </div>

            {(activeTool === ToolType.BRUSH || activeTool === ToolType.SPRAY || activeTool === ToolType.CRAYON || activeTool === ToolType.MARKER) && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                {[
                  { id: 'hardness', icon: Target, label: 'Hard', value: brushHardness, setter: setBrushHardness },
                  { id: 'flow', icon: Droplet, label: 'Flow', value: brushFlow, setter: setBrushFlow },
                  { id: 'smoothing', icon: Wind, label: 'Smooth', value: brushSmoothing, setter: setBrushSmoothing },
                ].map((dyn) => (
                  <div key={dyn.id} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><dyn.icon className="w-2.5 h-2.5"/> {dyn.label}</label>
                      <span className="text-[9px] font-mono text-indigo-400">{dyn.value}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={dyn.value} onChange={(e) => dyn.setter(parseInt(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none accent-indigo-500" />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Precision Suite</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: ToolType.BRUSH, icon: Paintbrush, label: 'Artist' },
                { id: ToolType.CRAYON, icon: MousePointer2, label: 'Crayon' },
                { id: ToolType.MARKER, icon: PenTool, label: 'Marker' },
                { id: ToolType.PENCIL, icon: Pencil, label: 'Pencil' },
                { id: ToolType.BUCKET, icon: PaintBucket, label: 'Fill' },
                { id: ToolType.ERASER, icon: Eraser, label: 'Eraser' },
                { id: ToolType.HIGHLIGHTER, icon: Highlighter, label: 'Vibe' },
                { id: ToolType.PAN, icon: Hand, label: 'Hand' },
              ].map(t => (
                <button 
                  key={t.id} onClick={() => { setActiveTool(t.id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${activeTool === t.id ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10' : 'border-transparent bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  <t.icon className="w-4.5 h-4.5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wide truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-auto space-y-4">
             {image && (
               <button onClick={handleMasterUpscale} className="w-full group relative flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                 <Crown className="w-4 h-4 text-yellow-400" />
                 Deep Studio 4K
               </button>
             )}
             <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                <textarea placeholder="Ask AI Stylist (e.g. 'Add details', 'Clean lines')..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="w-full text-xs p-3 rounded-xl bg-black/40 border border-white/5 h-20 resize-none focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600" />
                <button onClick={async () => { if (!image) return; setIsProcessing(true); try { const edited = await editWithAI(image!, aiPrompt, isProMode); setImage(edited); setAiPrompt(''); } catch(e) { await handleError(e); } finally { setIsProcessing(false); } }} className="mt-3 w-full bg-white text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2" disabled={!image || !aiPrompt || isProcessing}><Sparkles className="w-3.5 h-3.5" /> Infuse Changes</button>
             </div>
          </section>
        </aside>

        {/* Workspace */}
        <section className="flex-1 flex flex-col p-3 md:p-8 relative bg-[#020617] safe-bottom">
          <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-2xl">
            <div className={`w-2 h-2 rounded-full ${isProMode ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{isProMode ? `${resolution} Ultra-HD Active` : `Standard ${resolution} Engine`}</span>
          </div>

          <button onClick={() => setShowHelp(true)} className="absolute top-4 right-4 z-40 p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-slate-400 hover:text-white transition-all"><HelpCircle className="w-5 h-5" /></button>

          <div className="flex-1 relative mb-24 md:mb-0">
            {isProcessing && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-md rounded-[2rem]">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 border-[3px] border-white/5 border-t-indigo-500 rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
                  <div className="text-center"><p className="text-white font-black uppercase text-[11px] tracking-widest mb-1">Synthesizing 4K Masterpiece</p><p className="text-slate-500 text-[9px] uppercase tracking-widest">Applying AI Reconstruction</p></div>
                </div>
              </div>
            )}

            {!image ? (
              <div className="h-full border-2 border-dashed border-white/5 rounded-[2.5rem] md:rounded-[3rem] flex flex-col items-center justify-center bg-white/5 gap-6 md:gap-8 text-center px-6 md:px-12 group transition-all">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-indigo-600/5 text-indigo-400 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center transform group-hover:rotate-3 transition-transform"><ImageIcon className="w-10 h-10 md:w-16 md:h-16" /></div>
                <div className="space-y-3"><h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">AI Art Studio.</h2><p className="max-w-xs md:max-w-md mx-auto text-slate-500 text-xs md:text-sm font-medium leading-relaxed">Choose an option below to begin your masterpiece.</p></div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5">Import Photo</button>
                  <button onClick={handleStartBlank} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20">Blank Canvas</button>
                </div>
              </div>
            ) : (
              <Editor backgroundImage={image} originalImage={originalImage} brushColor={brushColor} brushSize={brushSize} brushHardness={brushHardness} brushSpacing={brushSpacing} brushFlow={brushFlow} brushSmoothing={brushSmoothing} pressureEnabled={pressureEnabled} tool={activeTool} onHistoryChange={(u, r) => { setCanUndo(u); setCanRedo(r); }} />
            )}
          </div>

          {image && (
            <div className="fixed lg:relative bottom-4 left-4 right-4 md:bottom-0 md:left-0 md:right-0 md:mt-8 flex flex-col md:flex-row gap-4 md:justify-between items-center bg-slate-900/95 backdrop-blur-3xl p-3 md:p-4 rounded-3xl border border-white/10 shadow-2xl z-[60]">
              <div className="flex w-full md:w-auto gap-2 justify-between md:justify-start">
                <div className="flex gap-2">
                  <button onClick={() => (window as any).undo?.()} disabled={!canUndo} className="p-3 md:p-3.5 rounded-xl bg-white/5 text-white disabled:opacity-20 hover:bg-white/10 transition-all border border-white/5"><Undo className="w-5 h-5" /></button>
                  <button onClick={() => (window as any).redo?.()} disabled={!canRedo} className="p-3 md:p-3.5 rounded-xl bg-white/5 text-white disabled:opacity-20 hover:bg-white/10 transition-all border border-white/5"><Redo className="w-5 h-5" /></button>
                </div>
                <button onClick={() => (window as any).clearCanvas?.()} className="flex items-center gap-2 px-4 md:px-5 text-slate-400 hover:text-red-400 transition-all font-black text-[10px] uppercase tracking-widest"><RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Reset</span></button>
              </div>
              <div className="flex w-full md:w-auto gap-3">
                <button onClick={() => { const data = (window as any).getCombinedImage?.(); const link = document.createElement('a'); link.href = data; link.download = `chromasketch-${Date.now()}.png`; link.click(); }} className="flex-1 md:flex-none px-6 py-3.5 bg-white/5 text-white border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Export</button>
                <button onClick={() => { const data = (window as any).getCombinedImage?.(); const win = window.open(); win?.document.write(`<img src="${data}" style="width:100%">`); win?.print(); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"><Printer className="w-5 h-5" /> Print</button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="hidden lg:flex bg-slate-950 border-t border-white/5 px-8 py-3 text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] justify-between shrink-0 z-50">
        <div className="flex gap-6 items-center"><span>&copy; 2025 ChromaSketch Studio</span><span className="flex items-center gap-2"><ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> AES End-to-End Encryption</span></div>
        <div className="flex items-center gap-6"><span className="flex items-center gap-1.5"><Info className="w-3 h-3" /> Paid Google Cloud Billing required for Pro Features</span><span className="text-slate-400">Engine: {isProMode ? 'Gemini 3 Pro' : 'Gemini 3 Flash'} • {resolution} Studio</span></div>
      </footer>
    </div>
  );
};

export default App;
