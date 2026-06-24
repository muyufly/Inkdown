import { Notice, TFile, Vault } from "obsidian";
import { findInkBlocks, parseInkBlock } from "../parser/parseInkBlock";
import { getNoteDirectory, resolveMarkdownPath } from "../storage/assetPath";

export async function exportAiBundle(vault: Vault, file: TFile): Promise<void> {
  const source = await vault.read(file);
  const bundleDir = await ensureExportFolder(vault, file);
  const pngDir = `${bundleDir}/png`;
  await ensureFolderPath(vault, pngDir);

  let exported = source;
  for (const block of findInkBlocks(source)) {
    const meta = parseInkBlock(block);
    if (!meta?.imagePath) continue;
    const imageFile = vault.getAbstractFileByPath(resolveMarkdownPath(file, meta.imagePath));
    if (!(imageFile instanceof TFile)) continue;

    const targetPath = `${pngDir}/${imageFile.name}`;
    await copyBinaryFile(vault, imageFile, targetPath);
    exported = exported.split(meta.imagePath).join(`./png/${imageFile.name}`);
  }

  const mdPath = `${bundleDir}/${file.basename}.md`;
  await writeTextFile(vault, mdPath, exported);
  new Notice(`Inkdown exported AI bundle: ${bundleDir}`);
}

async function ensureExportFolder(vault: Vault, file: TFile): Promise<string> {
  const noteDir = getNoteDirectory(file);
  const base = `${noteDir ? `${noteDir}/` : ""}inkdown-export-${safeName(file.basename)}`;
  let candidate = base;
  let index = 1;
  while (vault.getAbstractFileByPath(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  await ensureFolderPath(vault, candidate);
  return candidate;
}

async function copyBinaryFile(vault: Vault, source: TFile, targetPath: string): Promise<void> {
  const bytes = await vault.readBinary(source);
  const existing = vault.getAbstractFileByPath(targetPath);
  if (existing instanceof TFile) {
    await vault.modifyBinary(existing, bytes);
  } else {
    await vault.createBinary(targetPath, bytes);
  }
}

async function writeTextFile(vault: Vault, path: string, content: string): Promise<void> {
  const existing = vault.getAbstractFileByPath(path);
  if (existing instanceof TFile) {
    await vault.modify(existing, content);
  } else {
    await vault.create(path, content);
  }
}

async function ensureFolderPath(vault: Vault, dir: string): Promise<void> {
  const parts = dir.split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!vault.getAbstractFileByPath(current)) await vault.createFolder(current);
  }
}

function safeName(value: string): string {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|#^[\]]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "note"
  );
}
