import { findInkBlockRanges } from "../obsidian/inkBlockRanges";
import { parseInkBlock } from "../parser/parseInkBlock";

export function replaceInkBlockById(content: string, id: string, replacement: string): string {
  for (const range of findInkBlockRanges(content)) {
    const meta = parseInkBlock(range.source);
    if (meta?.id !== id) continue;
    const suffix = content.slice(range.to).startsWith("\n\n") ? "" : "\n";
    return `${content.slice(0, range.from)}${replacement}${suffix}${content.slice(range.to)}`;
  }
  return content;
}
