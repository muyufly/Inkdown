import { InkBlockMeta } from "../types/ink";
import { isColorListToken, parseColorList } from "../utils/colors";
import { createInkId } from "../utils/id";
import { normalizeCssSize, normalizeLineCount } from "../utils/units";

const ALIASES: Record<string, string> = {
  m: "SysMath",
  math: "SysMath",
  g: "SysGraph",
  graph: "SysGraph",
  q: "SysQuick",
  quick: "SysQuick",
  d: "SysDark",
  dark: "SysDark",
  default: "SysDefault"
};

const BACKGROUND_ALIASES: Record<string, string> = {
  white: "./backgrounds/white.svg",
  grid: "./backgrounds/grid.svg",
  axis: "./backgrounds/axis.svg",
  line: "./backgrounds/line.svg",
  black: "./backgrounds/black.svg"
};

export function parseInkShortcut(input: string, idFactory = createInkId): InkBlockMeta | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/ink")) return null;
  const tokens = trimmed.split(/\s+/);
  if (tokens[0] !== "/ink") return null;

  const meta: InkBlockMeta = {
    id: idFactory(),
    className: "SysDefault"
  };

  const rest = tokens.slice(1);
  let cursor = 0;
  const first = rest[cursor];
  if (first && !looksLikeSize(first) && !isBackgroundToken(first) && !isColorListToken(first)) {
    meta.className = ALIASES[first] ?? first;
    cursor += 1;
  }

  const height = rest[cursor];
  if (height && looksLikeHeight(height)) {
    meta.height = normalizeLineCount(height);
    cursor += 1;
  }

  const width = rest[cursor];
  if (width && looksLikeSize(width)) {
    meta.width = normalizeCssSize(width);
    cursor += 1;
  }

  const background = rest[cursor];
  if (background && isBackgroundToken(background)) {
    meta.background = BACKGROUND_ALIASES[background] ?? background;
    cursor += 1;
  }

  const colors = rest[cursor];
  if (colors) {
    meta.colors = parseColorList(colors);
  }

  return meta;
}

function looksLikeSize(value: string): boolean {
  return /^\d+(\.\d+)?(%|px|rem|em|vh|vw)?$/.test(value);
}

function looksLikeHeight(value: string): boolean {
  return /^\d+(px)?$/.test(value);
}

function isBackgroundToken(value: string): boolean {
  return value in BACKGROUND_ALIASES || value.startsWith("./") || value.startsWith("/") || value.endsWith(".svg") || value.startsWith("#");
}
