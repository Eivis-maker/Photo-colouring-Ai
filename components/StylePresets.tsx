
import React, { useState, useEffect } from 'react';
import { Save, Trash2, Plus, Bookmark, PenTool, Highlighter, Wind, Sparkles, PaintBucket, Eraser, Hand, Crop, Contrast, Pencil, MousePointer2 } from 'lucide-react';
import { ToolType } from '../types';

interface StylePreset {
  id: string;
  name: string;
  color: string;
  size: number;
  tool: ToolType;
}

interface StylePresetsProps {
  currentColor: string;
  currentSize: number;
  currentTool: ToolType;
  onApplyPreset: (color: string, size: number, tool: ToolType) => void;
}

const TOOL_ICONS: Record<ToolType, any> = {
  [ToolType.BRUSH]: PenTool,
  [ToolType.HIGHLIGHTER]: Highlighter,
  [ToolType.SPRAY]: Wind,
  [ToolType.CALLIGRAPHY]: PenTool,
  [ToolType.RAINBOW]: Sparkles,
  [ToolType.BUCKET]: PaintBucket,
  [ToolType.ERASER]: Eraser,
  [ToolType.PAN]: Hand,
  [ToolType.CROP]: Crop,
  [ToolType.INVERT]: Contrast,
  [ToolType.CRAYON]: MousePointer2,
  [ToolType.MARKER]: PenTool,
  [ToolType.PENCIL]: Pencil,
};

export const StylePresets: React.FC<StylePresetsProps> = ({
  currentColor,
  currentSize,
  currentTool,
  onApplyPreset,
}) => {
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chromasketch_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    }
  }, []);

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('chromasketch_presets', JSON.stringify(presets));
  }, [presets]);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: StylePreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      color: currentColor,
      size: currentSize,
      tool: currentTool,
    };

    setPresets([newPreset, ...presets]);
    setNewPresetName('');
    setIsAdding(false);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPresets(presets.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Style Library</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`p-1.5 rounded-lg transition-all ${isAdding ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          {isAdding ? <Bookmark className="w-3 h-3" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            placeholder="Preset name..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
          />
          <div className="flex gap-2">
            <button 
              onClick={handleSavePreset}
              className="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <Save className="w-3 h-3" /> Save Current
            </button>
            <button 
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
        {presets.length === 0 && !isAdding && (
          <div className="text-[10px] text-slate-500 italic text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">
            No saved styles yet
          </div>
        )}
        {presets.map((preset) => {
          const ToolIcon = TOOL_ICONS[preset.tool] || PenTool;
          return (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset.color, preset.size, preset.tool)}
              className="group flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left"
            >
              <div className="relative">
                <div 
                  className="w-8 h-8 rounded-lg shadow-inner border border-slate-100"
                  style={{ backgroundColor: preset.color }}
                />
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded shadow-sm border border-slate-100">
                  <ToolIcon className="w-2.5 h-2.5 text-slate-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-slate-700 uppercase truncate">{preset.name}</div>
                <div className="text-[9px] text-slate-400 font-bold">{preset.size}px • {preset.tool.toLowerCase()}</div>
              </div>
              <button 
                onClick={(e) => handleDeletePreset(preset.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );
};