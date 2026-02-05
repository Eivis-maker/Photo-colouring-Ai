
export interface ImageState {
  original: string | null;
  lineArt: string | null;
  history: string[];
}

export interface ColorPreset {
  name: string;
  value: string;
}

export enum ToolType {
  BRUSH = 'BRUSH',
  ERASER = 'ERASER',
  BUCKET = 'BUCKET',
  CROP = 'CROP',
  HIGHLIGHTER = 'HIGHLIGHTER',
  SPRAY = 'SPRAY',
  CALLIGRAPHY = 'CALLIGRAPHY',
  RAINBOW = 'RAINBOW',
  PAN = 'PAN',
  INVERT = 'INVERT',
  CRAYON = 'CRAYON',
  MARKER = 'MARKER',
  PENCIL = 'PENCIL'
}

export interface DrawingPoint {
  x: number;
  y: number;
  color: string;
  size: number;
  type: ToolType;
  isDragging: boolean;
}