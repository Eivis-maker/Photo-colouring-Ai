
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ToolType } from '../types';
import { ZoomIn, ZoomOut, Maximize, Image as ImageIcon, Layers, Undo, Redo, RotateCcw, Hand } from 'lucide-react';

interface EditorProps {
  backgroundImage: string | null;
  originalImage?: string | null;
  brushColor: string;
  brushSize: number;
  brushHardness?: number;
  brushSpacing?: number;
  brushFlow?: number;
  brushSmoothing?: number;
  pressureEnabled?: boolean;
  tool: ToolType;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onToolChange?: (tool: ToolType) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  readOnly?: boolean;
}

const MAX_HISTORY = 40;

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export const Editor: React.FC<EditorProps> = ({
  backgroundImage,
  originalImage,
  brushColor,
  brushSize,
  brushHardness = 100,
  brushSpacing = 10,
  brushFlow = 100,
  brushSmoothing = 30,
  pressureEnabled = false,
  tool,
  onHistoryChange,
  onToolChange,
  canvasWidth,
  canvasHeight,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null); 
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lineOpacity, setLineOpacity] = useState(100);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [substrate, setSubstrate] = useState<'none' | 'paper' | 'canvas'>('paper');
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  
  const pointers = useRef<Map<number, { x: number, y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchMid = useRef<{ x: number, y: number } | null>(null);
  
  const lastCoordsRef = useRef<{x: number, y: number} | null>(null);
  const smoothedCoordsRef = useRef<{x: number, y: number} | null>(null);
  const distanceAccumulatorRef = useRef(0);

  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const updateHistoryStatus = useCallback(() => {
    if (onHistoryChange) {
      onHistoryChange(
        historyIndexRef.current > 0,
        historyIndexRef.current < historyRef.current.length - 1
      );
    }
  }, [onHistoryChange]);

  const saveState = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      }
      historyRef.current.push(imageData);
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      } else {
        historyIndexRef.current++;
      }
      updateHistoryStatus();
    }
  }, [updateHistoryStatus]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const canvas = drawingCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
        updateHistoryStatus();
      }
    }
  }, [updateHistoryStatus]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const canvas = drawingCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
        updateHistoryStatus();
      }
    }
  }, [updateHistoryStatus]);

  const clearDrawing = useCallback(() => {
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, drawingCanvasRef.current!.width, drawingCanvasRef.current!.height);
      saveState();
    }
  }, [saveState]);

  const floodFill = useCallback((x: number, y: number) => {
    const bgCanvas = canvasRef.current;
    const drawCanvas = drawingCanvasRef.current;
    if (!bgCanvas || !drawCanvas) return;

    const w = bgCanvas.width;
    const h = bgCanvas.height;

    // Build composite image to sample colors from
    const composite = document.createElement('canvas');
    composite.width = w;
    composite.height = h;
    const compCtx = composite.getContext('2d')!;
    compCtx.fillStyle = '#ffffff';
    compCtx.fillRect(0, 0, w, h);
    compCtx.drawImage(drawCanvas, 0, 0);
    compCtx.globalCompositeOperation = 'multiply';
    compCtx.drawImage(bgCanvas, 0, 0);

    const compData = compCtx.getImageData(0, 0, w, h).data;

    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= w || py >= h) return;

    const si = (py * w + px) * 4;
    const targetR = compData[si];
    const targetG = compData[si + 1];
    const targetB = compData[si + 2];

    const fillRgb = hexToRgb(brushColor);
    // Skip if already same color
    if (Math.abs(targetR - fillRgb.r) < 5 && Math.abs(targetG - fillRgb.g) < 5 && Math.abs(targetB - fillRgb.b) < 5) return;

    const drawCtx = drawCanvas.getContext('2d')!;
    const drawImageData = drawCtx.getImageData(0, 0, w, h);
    const dd = drawImageData.data;

    const tolerance = 40;
    const matches = (i: number) =>
      Math.abs(compData[i] - targetR) <= tolerance &&
      Math.abs(compData[i + 1] - targetG) <= tolerance &&
      Math.abs(compData[i + 2] - targetB) <= tolerance;

    const visited = new Uint8Array(w * h);
    const stack: number[] = [py * w + px];
    visited[py * w + px] = 1;

    while (stack.length > 0) {
      const pos = stack.pop()!;
      const cx = pos % w;
      const cy = (pos / w) | 0;
      const i = pos * 4;
      dd[i] = fillRgb.r;
      dd[i + 1] = fillRgb.g;
      dd[i + 2] = fillRgb.b;
      dd[i + 3] = 255;

      for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const npos = ny * w + nx;
        if (visited[npos]) continue;
        visited[npos] = 1;
        if (matches(npos * 4)) stack.push(npos);
      }
    }

    drawCtx.putImageData(drawImageData, 0, 0);
    saveState();
  }, [brushColor, saveState]);

  const fitToScreen = useCallback(() => {
    // rAF x2 — užtikrina, kad DOM sublayout bus baigtas prieš matavimą
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const parent = containerRef.current;
        if (!parent) return;
        const containerW = parent.clientWidth;
        const containerH = parent.clientHeight;
        if (containerW === 0 || containerH === 0) return;
        const targetW = canvasWidth || 2048;
        const targetH = canvasHeight || 2048;
        const scaleToFit = Math.min(containerW / targetW, containerH / targetH) * 0.92;
        setView({
          scale: scaleToFit,
          x: (containerW - targetW * scaleToFit) / 2,
          y: (containerH - targetH * scaleToFit) / 2
        });
      });
    });
  }, [canvasWidth, canvasHeight]);

  const resize = useCallback(() => {
    const parent = containerRef.current;
    if (!parent || !canvasRef.current || !drawingCanvasRef.current) return;
    
    const targetW = canvasWidth || 2048;
    const targetH = canvasHeight || 2048;

    if (canvasRef.current.width !== targetW) {
      canvasRef.current.width = targetW;
      canvasRef.current.height = targetH;
      drawingCanvasRef.current.width = targetW;
      drawingCanvasRef.current.height = targetH;
    }

    if (backgroundImage) {
      const bgCtx = canvasRef.current.getContext('2d');
      if (bgCtx) {
        const img = new Image();
        img.onload = () => {
          const w = canvasRef.current!.width;
          const h = canvasRef.current!.height;
          bgCtx.clearRect(0, 0, w, h);
          const scaleFactor = Math.min(w / img.width, h / img.height);
          const x = (w / 2) - (img.width / 2) * scaleFactor;
          const y = (h / 2) - (img.height / 2) * scaleFactor;
          bgCtx.drawImage(img, x, y, img.width * scaleFactor, img.height * scaleFactor);
        };
        img.src = backgroundImage;
      }
    }
    fitToScreen();
  }, [backgroundImage, canvasWidth, canvasHeight, fitToScreen]);

  useEffect(() => {
    resize();
    window.addEventListener('resize', fitToScreen);
    return () => window.removeEventListener('resize', fitToScreen);
  }, [resize, fitToScreen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setView(prev => {
        const newScale = Math.max(0.1, Math.min(20, prev.scale * scaleFactor));
        const dx = (mouseX - prev.x) / prev.scale;
        const dy = (mouseY - prev.y) / prev.scale;
        return {
          scale: newScale,
          x: mouseX - dx * newScale,
          y: mouseY - dy * newScale
        };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const getCoords = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - view.x) / view.scale,
      y: (clientY - rect.top - view.y) / view.scale
    };
  };

  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, hardness: number, flow: number, currentTool: ToolType) => {
    const radius = size / 2;
    if (radius <= 0) return;
    const rgb = hexToRgb(color);
    
    // Default dynamics
    let alpha = flow / 100;
    let finalHardness = hardness;
    
    // Tool Specific Logic
    if (currentTool === ToolType.CRAYON) {
      // Grainy effect: vary radius and alpha slightly per stamp
      const jitter = Math.random() * 2 - 1;
      const stampRadius = radius + jitter;
      const stampAlpha = alpha * (0.6 + Math.random() * 0.4);
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(0, stampRadius));
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${stampAlpha})`);
      gradient.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${stampAlpha * 0.3})`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius * 1.2, y - radius * 1.2, size * 2.4, size * 2.4);
      return;
    }

    if (currentTool === ToolType.MARKER) {
      // Markers have flatter caps and translucency that builds up
      ctx.globalCompositeOperation = 'multiply';
      alpha = Math.min(0.3, alpha); // Force translucency for marker feel
      finalHardness = 95;
    }

    if (currentTool === ToolType.PENCIL) {
      // Pencils are sharp and dry
      alpha = 0.8;
      finalHardness = 100;
    }

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const hardStop = Math.max(0, Math.min(0.99, finalHardness / 100));
    
    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
    gradient.addColorStop(hardStop, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, size, size);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (readOnly) {
      setIsPanning(true);
      return;
    }

    if (pointers.current.size >= 2) {
      setIsDrawing(false);
      setIsPanning(true);
      lastPinchDist.current = null;
      lastPinchMid.current = null;
      return;
    }

    if (tool === ToolType.PAN) {
      setIsPanning(true);
      setIsDrawing(false);
      return;
    }

    if (tool === ToolType.BUCKET) {
      const coords = getCoords(e.clientX, e.clientY);
      floodFill(coords.x, coords.y);
      return;
    }

    setIsDrawing(true);
    const coords = getCoords(e.clientX, e.clientY);
    lastCoordsRef.current = coords;
    smoothedCoordsRef.current = coords;
    distanceAccumulatorRef.current = 0;

    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (ctx) {
      const pressure = (pressureEnabled && e.pressure > 0) ? e.pressure : 1.0;
      const size = pressureEnabled ? brushSize * (0.3 + 0.7 * pressure) : brushSize;

      // Reset composite for standard tools
      ctx.globalCompositeOperation = 'source-over';

      if (tool === ToolType.BRUSH || tool === ToolType.CRAYON || tool === ToolType.MARKER || tool === ToolType.PENCIL) {
        drawStamp(ctx, coords.x, coords.y, size, brushColor, brushHardness, brushFlow, tool);
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    const p1 = pointers.current.get(e.pointerId);
    if (p1) {
      p1.x = e.clientX;
      p1.y = e.clientY;
    }

    if (pointers.current.size >= 2) {
      const pArray = Array.from(pointers.current.values()) as { x: number; y: number }[];
      const dist = Math.hypot(pArray[0].x - pArray[1].x, pArray[0].y - pArray[1].y);
      const mid = { x: (pArray[0].x + pArray[1].x) / 2, y: (pArray[0].y + pArray[1].y) / 2 };

      if (lastPinchDist.current !== null && lastPinchMid.current !== null) {
        const scaleFactor = dist / lastPinchDist.current;
        const dx = mid.x - lastPinchMid.current.x;
        const dy = mid.y - lastPinchMid.current.y;

        setView(prev => {
          const newScale = Math.max(0.1, Math.min(20, prev.scale * scaleFactor));
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return prev;
          
          const centerX = mid.x - rect.left;
          const centerY = mid.y - rect.top;
          const focalX = (centerX - prev.x) / prev.scale;
          const focalY = (centerY - prev.y) / prev.scale;

          return {
            scale: newScale,
            x: centerX - focalX * newScale + dx,
            y: centerY - focalY * newScale + dy
          };
        });
      }
      lastPinchDist.current = dist;
      lastPinchMid.current = mid;
      return;
    }

    if (isPanning || tool === ToolType.PAN) {
      if (!p1) return;
      const dx = e.movementX;
      const dy = e.movementY;
      if (pointers.current.size === 1) {
        setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      }
      return;
    }

    if (!isDrawing || !lastCoordsRef.current || !smoothedCoordsRef.current) return;
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    const rawCoords = getCoords(e.clientX, e.clientY);
    const factor = Math.max(0.01, 1 - (brushSmoothing / 100));
    const coords = {
      x: smoothedCoordsRef.current.x + (rawCoords.x - smoothedCoordsRef.current.x) * factor,
      y: smoothedCoordsRef.current.y + (rawCoords.y - smoothedCoordsRef.current.y) * factor
    };
    smoothedCoordsRef.current = coords;

    const pressure = (pressureEnabled && e.pressure > 0) ? e.pressure : 1.0;
    const size = pressureEnabled ? brushSize * (0.3 + 0.7 * pressure) : brushSize;

    if (tool === ToolType.BRUSH || tool === ToolType.CRAYON || tool === ToolType.MARKER || tool === ToolType.PENCIL) {
      const dx = coords.x - lastCoordsRef.current.x;
      const dy = coords.y - lastCoordsRef.current.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const spacingValue = Math.max(0.5, (brushSpacing / 100) * brushSize);
      distanceAccumulatorRef.current += dist;

      if (distanceAccumulatorRef.current >= spacingValue) {
        const steps = Math.floor(distanceAccumulatorRef.current / spacingValue);
        for (let i = 1; i <= steps; i++) {
          const stepDist = (i * spacingValue) - (distanceAccumulatorRef.current - dist);
          const px = lastCoordsRef.current.x + Math.cos(angle) * stepDist;
          const py = lastCoordsRef.current.y + Math.sin(angle) * stepDist;
          drawStamp(ctx, px, py, size, brushColor, brushHardness, brushFlow, tool);
        }
        distanceAccumulatorRef.current %= spacingValue;
        lastCoordsRef.current = coords;
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(lastCoordsRef.current.x, lastCoordsRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = size;
      ctx.strokeStyle = tool === ToolType.ERASER ? '#FFFFFF' : brushColor;
      ctx.globalCompositeOperation = tool === ToolType.ERASER ? 'destination-out' : 'source-over';
      ctx.globalAlpha = tool === ToolType.HIGHLIGHTER ? 0.3 : 1.0;
      ctx.stroke();
      lastCoordsRef.current = coords;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      lastPinchDist.current = null;
      lastPinchMid.current = null;
    }
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
    if (pointers.current.size === 0) {
      setIsPanning(false);
    }
  };

  const handleZoomBtn = (factor: number) => {
    setView(v => {
      const nextScale = Math.max(0.1, Math.min(20, v.scale * factor));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { ...v, scale: nextScale };
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (cx - v.x) / v.scale;
      const dy = (cy - v.y) / v.scale;
      return {
        scale: nextScale,
        x: cx - dx * nextScale,
        y: cy - dy * nextScale
      };
    });
  };

  useEffect(() => {
    (window as any).undo = undo;
    (window as any).redo = redo;
    (window as any).clearCanvas = clearDrawing;
    (window as any).getCombinedImage = () => {
      const final = document.createElement('canvas');
      final.width = canvasRef.current!.width;
      final.height = canvasRef.current!.height;
      const ctx = final.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, final.width, final.height);
      ctx.drawImage(drawingCanvasRef.current!, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(canvasRef.current!, 0, 0);
      return final.toDataURL('image/png');
    };
  }, [undo, redo, clearDrawing]);

  const isDrawTool = tool !== ToolType.PAN && tool !== ToolType.BUCKET;
  const cursorStyle = tool === ToolType.PAN
    ? (isPanning ? 'grabbing' : 'grab')
    : tool === ToolType.BUCKET
    ? 'crosshair'
    : 'none';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group touch-none"
      style={{ backgroundColor: '#1e2130', cursor: cursorStyle }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => setCursorPos(null)}
    >
      <div
        className="absolute origin-top-left pointer-events-none"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          boxShadow: '0 8px 48px 0 rgba(0,0,0,0.6)',
        }}
      >
        {/* Baltas popierius tik po canvas sluoksniais */}
        <div
          className={substrate === 'paper' ? 'paper-grain' : (substrate === 'canvas' ? 'canvas-texture' : '')}
          style={{
            position: 'absolute', inset: 0,
            backgroundColor: '#ffffff',
            width: canvasWidth || 2048,
            height: canvasHeight || 2048,
          }}
        />
        <canvas ref={drawingCanvasRef} className="absolute inset-0 z-10" />
        <canvas ref={canvasRef} style={{ opacity: lineOpacity / 100 }} className="absolute inset-0 mix-blend-multiply z-20" />
      </div>

      <div className="absolute top-3 right-3 md:top-4 md:right-4 flex items-center gap-2 z-30">
        <div className="flex bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-0.5 md:p-1 shadow-lg">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowReference(!showReference); }} 
            className={`p-2 rounded-lg transition-all ${showReference ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:text-white'}`}
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setSubstrate(s => s === 'paper' ? 'canvas' : (s === 'canvas' ? 'none' : 'paper')); }} 
            className="p-2 text-slate-200 hover:text-white rounded-lg"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showReference && originalImage && (
        <div className="absolute bottom-32 md:bottom-24 left-4 md:left-6 w-32 h-32 md:w-40 md:h-40 bg-slate-900 border-2 border-white/20 rounded-xl shadow-2xl overflow-hidden z-40 animate-in zoom-in-95">
           <img src={originalImage} className="w-full h-full object-cover" />
           <div className="absolute bottom-1 bg-black/60 px-2 py-0.5 rounded text-[7px] font-black uppercase text-white left-1/2 -translate-x-1/2">Ref</div>
        </div>
      )}

      {/* FIXED POSITIONING: Increased bottom distance on mobile to clear the app footer */}
      <div className="absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-5 bg-slate-900/95 backdrop-blur-xl border border-white/10 px-4 md:px-6 py-2 md:py-2.5 rounded-2xl shadow-2xl z-50 scale-90 sm:scale-100">
        <button onClick={(e) => { e.stopPropagation(); handleZoomBtn(0.8); }} className="p-1.5 text-white hover:text-indigo-300 transition-colors" title="Zoom out"><ZoomOut className="w-5 h-5 md:w-4 md:h-4" /></button>
        <span className="text-[10px] md:text-[9px] font-black text-indigo-400 w-10 text-center">{Math.round(view.scale * 100)}%</span>
        <button onClick={(e) => { e.stopPropagation(); handleZoomBtn(1.25); }} className="p-1.5 text-white hover:text-indigo-300 transition-colors" title="Zoom in"><ZoomIn className="w-5 h-5 md:w-4 md:h-4" /></button>
        <div className="w-px h-5 bg-white/20" />
        <button onClick={(e) => { e.stopPropagation(); fitToScreen(); }} className="p-1.5 text-white hover:text-indigo-300 transition-colors" title="Fit to screen"><Maximize className="w-5 h-5 md:w-4 md:h-4" /></button>
        <div className="w-px h-5 bg-white/20" />
        <button
          onClick={(e) => { e.stopPropagation(); onToolChange?.(tool === ToolType.PAN ? ToolType.BRUSH : ToolType.PAN); }}
          className={`p-1.5 rounded-lg transition-all ${tool === ToolType.PAN ? 'text-indigo-400 bg-indigo-500/20' : 'text-white hover:text-indigo-300'}`}
          title="Move / Pan"
        >
          <Hand className="w-5 h-5 md:w-4 md:h-4" />
        </button>
        <div className="hidden xs:flex w-px h-5 bg-white/20 mx-1" />
        <div className="hidden xs:flex flex-col items-center gap-0.5">
          <input 
            type="range" min="0" max="100" value={lineOpacity} 
            onChange={(e) => { e.stopPropagation(); setLineOpacity(parseInt(e.target.value)); }} 
            className="w-16 md:w-20 h-0.5 accent-indigo-500" 
          />
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Ink Fade</span>
        </div>
      </div>

      {readOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-40">
          <div className="bg-amber-500/90 text-black text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg tracking-widest">Original Photo</div>
        </div>
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none lg:hidden">
        {!readOnly && isPanning ? (
          <div className="bg-indigo-600/90 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full animate-in fade-in zoom-in-95 shadow-lg">Panning View</div>
        ) : null}
      </div>

      {/* Custom brush cursor */}
      {cursorPos && isDrawTool && !readOnly && (
        <div
          className="pointer-events-none absolute z-50 rounded-full border border-black/60"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: Math.max(2, brushSize * view.scale),
            height: Math.max(2, brushSize * view.scale),
            transform: 'translate(-50%, -50%)',
            backgroundColor: tool === ToolType.ERASER ? 'rgba(255,255,255,0.25)' : `${brushColor}30`,
            borderColor: tool === ToolType.ERASER ? 'rgba(150,150,150,0.8)' : 'rgba(0,0,0,0.6)',
            outline: '1px solid rgba(255,255,255,0.4)',
          }}
        />
      )}
    </div>
  );
};