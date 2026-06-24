import type { TFile } from "obsidian";

export function isTFileLike(value: unknown): value is TFile {
  return !!value && typeof value === "object" && typeof (value as { path?: unknown }).path === "string";
}
