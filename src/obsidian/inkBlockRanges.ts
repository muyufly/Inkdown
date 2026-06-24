import { findInkBlocks } from "../parser/parseInkBlock";

export interface InkBlockRange {
  from: number;
  to: number;
  source: string;
}

export function findInkBlockRanges(doc: string): InkBlockRange[] {
  const ranges: InkBlockRange[] = [];
  const blocks = findInkBlocks(doc);
  let searchFrom = 0;
  for (const source of blocks) {
    const from = doc.indexOf(source, searchFrom);
    if (from < 0) continue;
    const to = from + source.length;
    ranges.push({ from, to, source });
    searchFrom = to;
  }
  return ranges;
}

export interface SelectionLikeRange {
  from: number;
  to: number;
  empty: boolean;
}

export function nonEmptySelectionTouchesRange(ranges: readonly SelectionLikeRange[], from: number, to: number): boolean {
  return ranges.some((range) => {
    if (range.empty) return false;
    return range.from <= to && range.to >= from;
  });
}

export function selectionInteractsWithRange(ranges: readonly SelectionLikeRange[], from: number, to: number): boolean {
  return ranges.some((range) => {
    if (!range.empty) return range.from <= to && range.to >= from;
    return range.from > from && range.from < to;
  });
}
