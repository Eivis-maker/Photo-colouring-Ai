
import React, { useState } from 'react';
import { Palette, Hash } from 'lucide-react';

interface ColorPickerProps {
  currentColor: string;
  onChange: (color: string) => void;
}

const PALETTES = {
  Classic: [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#808080', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080', '#A52A2A'
  ],
  Pastel: [
    '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#F3D1F4', '#FF9AA2', '#FFFFD8',
    '#D4F0F0', '#CCE2CB', '#E8D1C5', '#FCE1E4', '#DAEAF1', '#E2D1F9', '#D1E8E2', '#FFF5E1'
  ],
  Jewel: [
    '#800020', '#C41E3A', '#E0115F', '#FF4F00', '#FFD700', '#50C878', '#008080', '#000080',
    '#4B0082', '#6A0DAD', '#DA70D6', '#704214', '#191970', '#3B3C36', '#483D8B', '#2F4F4F'
  ],
  Skin: [
    '#FFDBAC', '#F1C27D', '#E0AC69', '#8D5524', '#C68642', '#3C2E28', '#2D221E', '#EBCBB9',
    '#D2B48C', '#DEB887', '#C58C85', '#9E7E6F', '#7D5A4E', '#5D4037', '#422F29', '#31211B'
  ],
  Metallic: [
    '#C0C0C0', '#A9A9A9', '#808080', '#D4AF37', '#FFD700', '#CD7F32', '#B87333', '#813810',
    '#E5E4E2', '#B5B5BD', '#8A8A8A', '#747474', '#CFB53B', '#DFAF2B', '#8C7853', '#665D1E'
  ],
  Ocean: [
    '#006994', '#0077BE', '#0096FF', '#00FFFF', '#7DF9FF', '#40E0D0', '#008080', '#2E8B57',
    '#3EB489', '#9FE2BF', '#AFDBF5', '#6495ED', '#1E90FF', '#00008B', '#0818A8', '#012169'
  ],
  Neon: [
    '#FF00FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF00AA', '#AA00FF', '#00AAFF', '#AAFF00',
    '#FF5500', '#00FF55', '#5500FF', '#FF0055', '#0055FF', '#55FF00', '#FFAA00', '#00FFAA'
  ],
  Earth: [
    '#4B3621', '#6E4F32', '#8B5A2B', '#A67B5B', '#C2A385', '#D9C5B2', '#2E3B23', '#4A5D23',
    '#738625', '#9EAD3D', '#2F4F4F', '#556B2F', '#8FBC8F', '#BDB76B', '#BC8F8F', '#DEB887'
  ]
};

type PaletteName = keyof typeof PALETTES;

export const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onChange }) => {
  const [activePalette, setActivePalette] = useState<PaletteName>('Classic');
  const [hexInput, setHexInput] = useState(currentColor);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onChange(val);
    }
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    setHexInput(color);
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Active Color Preview & Custom Hex */}
      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
        <div className="relative">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => handleColorSelect(e.target.value)}
            className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white/20 shadow-sm appearance-none bg-transparent overflow-hidden"
          />
          <div className="absolute inset-0 rounded-xl pointer-events-none border border-white/10" />
        </div>
        
        <div className="flex-1 flex flex-col gap-0.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <Hash className="w-2.5 h-2.5" /> Hex Color
          </label>
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            placeholder="#000000"
            className="text-sm font-mono font-bold text-white bg-transparent border-none p-0 focus:ring-0 uppercase w-full outline-none"
          />
        </div>
      </div>

      {/* Palette Tabs - Scrollable on Mobile */}
      <div className="flex gap-1 p-1 bg-black/40 rounded-xl overflow-x-auto no-scrollbar scroll-smooth">
        {(Object.keys(PALETTES) as PaletteName[]).map((name) => (
          <button
            key={name}
            onClick={() => setActivePalette(name)}
            className={`whitespace-nowrap px-4 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider ${
              activePalette === name
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Color Grid - Larger buttons for touch */}
      <div className="grid grid-cols-4 xs:grid-cols-6 sm:grid-cols-8 gap-2">
        {PALETTES[activePalette].map((color) => (
          <button
            key={color}
            onClick={() => handleColorSelect(color)}
            title={color}
            className={`w-full aspect-square rounded-xl border-2 transition-all active:scale-90 ${
              currentColor.toLowerCase() === color.toLowerCase()
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-110 z-10'
                : 'border-white/10 hover:border-white/30'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mt-1 px-1">
        <Palette className="w-3 h-3 text-slate-600" />
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Library: {activePalette}</span>
      </div>
    </div>
  );
};
