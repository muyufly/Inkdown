import type { TFile } from "obsidian";

export function getNoteDirectory(file: TFile): string {
  const parts = file.path.split("/");
  parts.pop();
  return parts.join("/");
}

export function getInkAssetDirectory(file: TFile): string {
  return getInkAssetRootDirectory(file);
}

export function getInkAssetRootDirectory(file: TFile): string {
  const noteDir = getNoteDirectory(file);
  const folder = `inkdown-${getArticleSlug(file)}`;
  return normalizeVaultPath(noteDir ? `${noteDir}/${folder}` : folder);
}

export function getInkAssetSubdirectory(file: TFile, kind: "png" | "data"): string {
  return normalizeVaultPath(`${getInkAssetRootDirectory(file)}/${kind}`);
}

export function getInkAssetVaultPath(file: TFile, id: string, ext: "ink.json" | "png"): string {
  const kind = ext === "ink.json" ? "data" : ext;
  return normalizeVaultPath(`${getInkAssetSubdirectory(file, kind)}/${id}.${ext}`);
}

export function getInkAssetMarkdownPath(file: TFile, id: string, ext: "ink.json" | "png"): string {
  const kind = ext === "ink.json" ? "data" : ext;
  return `./inkdown-${getArticleSlug(file)}/${kind}/${id}.${ext}`;
}

export function resolveMarkdownPath(file: TFile, path: string): string {
  const clean = path.replace(/^\.\//, "");
  if (clean.startsWith("/")) return normalizeVaultPath(clean.slice(1));
  const noteDir = getNoteDirectory(file);
  return normalizeVaultPath(noteDir ? `${noteDir}/${clean}` : clean);
}

function normalizeVaultPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\.\//, "");
}

function getArticleSlug(file: TFile): string {
  const basename = file.basename || file.name.replace(/\.md$/i, "");
  const slug = basename
    .trim()
    .replace(/[\\/:*?"<>|#^[\]]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "note";
}
