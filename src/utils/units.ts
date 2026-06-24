export const INK_LINE_HEIGHT_PX = 48;
export const DEFAULT_INK_LINES = 4;
export const MIN_INK_LINES = 1;
export const MAX_INK_LINES = 40;

export function normalizeCssSize(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

export function parsePixelSize(value: string, fallback: number): number {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : fallback;
}

export function normalizeLineCount(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d+$/.test(trimmed)) return String(clamp(Number(trimmed), MIN_INK_LINES, MAX_INK_LINES));
  const px = trimmed.match(/^(\d+(?:\.\d+)?)px$/);
  if (px) return String(clamp(Math.round(Number(px[1]) / INK_LINE_HEIGHT_PX), MIN_INK_LINES, MAX_INK_LINES));
  return undefined;
}

export function lineCountToCssHeight(value: string | undefined): string {
  const lines = parseLineCount(value, DEFAULT_INK_LINES);
  return `${lines * INK_LINE_HEIGHT_PX}px`;
}

export function parseLineCount(value: string | undefined, fallback = DEFAULT_INK_LINES): number {
  const normalized = normalizeLineCount(value);
  return normalized ? Number(normalized) : fallback;
}

export function pixelHeightToLineCount(height: number): string {
  return String(clamp(Math.round(height / INK_LINE_HEIGHT_PX), MIN_INK_LINES, MAX_INK_LINES));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
