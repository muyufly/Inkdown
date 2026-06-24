export interface InkPoint {
  x: number;
  y: number;
  pressure: number;
  time: number;
}

export interface InkStroke {
  id: string;
  tool: "pen";
  color: string;
  width: number;
  points: InkPoint[];
}

export interface InkData {
  version: "0.1.0";
  id: string;
  class: string;
  width: string;
  height: string;
  background: string;
  strokes: InkStroke[];
}

export interface InkBlockMeta {
  id: string;
  className?: string;
  height?: string;
  width?: string;
  background?: string;
  colors?: string[];
  imagePath?: string;
  dataPath?: string;
}

export interface ResolvedInkConfig {
  className: string;
  height: string;
  width: string;
  background: string;
  colors: string[];
  defaultColor: string;
  defaultStrokeWidth: number;
}
