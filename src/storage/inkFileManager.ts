import { normalizePath, TFile, Vault } from "obsidian";
import { InkBlockMeta, InkData, ResolvedInkConfig } from "../types/ink";
import { getInkAssetRootDirectory, getInkAssetMarkdownPath, getInkAssetVaultPath, resolveMarkdownPath } from "./assetPath";
import { stringifyInkBlock } from "../parser/parseInkBlock";
import { replaceInkBlockById } from "./replaceInkBlock";

export class InkFileManager {
  constructor(private readonly vault: Vault) {}

  async ensureInkFiles(file: TFile, meta: InkBlockMeta, config: ResolvedInkConfig): Promise<InkBlockMeta> {
    await this.ensureAssetFolder(file);
    const next = withDefaultAssetPaths(file, meta);
    const dataPath = resolveMarkdownPath(file, next.dataPath);
    if (!this.vault.getAbstractFileByPath(dataPath)) {
      const oldData = meta.dataPath ? this.vault.getAbstractFileByPath(resolveMarkdownPath(file, meta.dataPath)) : null;
      if (oldData instanceof TFile) {
        await this.writeJsonPath(dataPath, JSON.parse(await this.vault.read(oldData)));
      } else {
        await this.writeJsonPath(dataPath, createEmptyInkData(next, config));
      }
    }
    const imagePath = resolveMarkdownPath(file, next.imagePath);
    if (!this.vault.getAbstractFileByPath(imagePath) && meta.imagePath) {
      const oldImage = this.vault.getAbstractFileByPath(resolveMarkdownPath(file, meta.imagePath));
      if (oldImage instanceof TFile) {
        await this.writeBinaryPath(imagePath, await this.vault.readBinary(oldImage));
      }
    }
    return next;
  }

  async readInkData(file: TFile, meta: InkBlockMeta, config: ResolvedInkConfig): Promise<InkData> {
    const dataPath = meta.dataPath ? resolveMarkdownPath(file, meta.dataPath) : getInkAssetVaultPath(file, meta.id, "ink.json");
    const dataFile = this.vault.getAbstractFileByPath(dataPath);
    if (dataFile instanceof TFile) {
      try {
        return JSON.parse(await this.vault.read(dataFile)) as InkData;
      } catch {
        return createEmptyInkData(meta, config);
      }
    }
    return createEmptyInkData(meta, config);
  }

  async writeInkData(file: TFile, meta: InkBlockMeta, data: InkData): Promise<void> {
    await this.ensureAssetFolder(file);
    const path = meta.dataPath ? resolveMarkdownPath(file, meta.dataPath) : getInkAssetVaultPath(file, meta.id, "ink.json");
    await this.writeJsonPath(path, data);
  }

  async writePng(file: TFile, meta: InkBlockMeta, dataUrl: string): Promise<void> {
    await this.ensureAssetFolder(file);
    const path = meta.imagePath ? resolveMarkdownPath(file, meta.imagePath) : getInkAssetVaultPath(file, meta.id, "png");
    const bytes = dataUrlToArrayBuffer(dataUrl);
    const existing = this.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.vault.modifyBinary(existing, bytes);
    } else {
      await this.vault.createBinary(path, bytes);
    }
  }

  async updateBlockInNote(file: TFile, oldMeta: InkBlockMeta, newMeta: InkBlockMeta): Promise<void> {
    const content = await this.vault.read(file);
    const next = replaceInkBlockById(content, oldMeta.id, stringifyInkBlock(newMeta));
    if (next !== content) {
      await this.vault.modify(file, next);
    }
  }

  private async ensureAssetFolder(file: TFile): Promise<void> {
    await this.ensureFolderPath(getInkAssetRootDirectory(file));
    await this.ensureFolderPath(getInkAssetVaultPath(file, "_", "png").replace(/\/_[^/]+\.png$/, ""));
    await this.ensureFolderPath(getInkAssetVaultPath(file, "_", "ink.json").replace(/\/_[^/]+\.ink\.json$/, ""));
  }

  private async ensureFolderPath(dir: string): Promise<void> {
    const parts = normalizePath(dir).split("/");
    let current = "";
    for (const part of parts) {
      current = normalizePath(current ? `${current}/${part}` : part);
      if (!this.vault.getAbstractFileByPath(current)) await this.vault.createFolder(current);
    }
  }

  private async writeJsonPath(path: string, data: unknown): Promise<void> {
    const content = `${JSON.stringify(data, null, 2)}\n`;
    const existing = this.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.vault.modify(existing, content);
    } else {
      await this.vault.create(path, content);
    }
  }

  private async writeBinaryPath(path: string, data: ArrayBuffer): Promise<void> {
    const existing = this.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.vault.modifyBinary(existing, data);
    } else {
      await this.vault.createBinary(path, data);
    }
  }
}

export function withDefaultAssetPaths(file: TFile, meta: InkBlockMeta): InkBlockMeta & { imagePath: string; dataPath: string } {
  return {
    ...meta,
    imagePath: isLegacyAssetPath(meta.imagePath) ? getInkAssetMarkdownPath(file, meta.id, "png") : meta.imagePath ?? getInkAssetMarkdownPath(file, meta.id, "png"),
    dataPath: isLegacyAssetPath(meta.dataPath) ? getInkAssetMarkdownPath(file, meta.id, "ink.json") : meta.dataPath ?? getInkAssetMarkdownPath(file, meta.id, "ink.json")
  };
}

function isLegacyAssetPath(path: string | undefined): boolean {
  return !!path && /^\.?\/?assets\/ink\//.test(path);
}

export function createEmptyInkData(meta: InkBlockMeta, config: ResolvedInkConfig): InkData {
  return {
    version: "0.1.0",
    id: meta.id,
    class: config.className,
    width: config.width,
    height: config.height,
    background: config.background,
    strokes: []
  };
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
