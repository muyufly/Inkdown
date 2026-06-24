import { normalizePath, TFile, TFolder, Vault } from "obsidian";
import { DEFAULT_BACKGROUNDS, DEFAULT_CLASS_CONFIG } from "./defaultClasses";
import { InkClassConfigFile } from "../types/classConfig";
import { InkBlockMeta, ResolvedInkConfig } from "../types/ink";
import { resolveAlias, resolveInkConfig } from "./resolveInkConfig";

const CONFIG_DIR = ".inkdown";
const CONFIG_PATH = `${CONFIG_DIR}/classes.json`;
const BACKGROUND_DIR = `${CONFIG_DIR}/backgrounds`;

export class ClassConfigLoader {
  private config: InkClassConfigFile = DEFAULT_CLASS_CONFIG;

  constructor(private readonly vault: Vault) {}

  async load(): Promise<InkClassConfigFile> {
    await this.ensureDefaults();
    const file = this.vault.getAbstractFileByPath(CONFIG_PATH);
    if (file instanceof TFile) {
      try {
        this.config = normalizeClassConfig(JSON.parse(await this.vault.read(file)) as Partial<InkClassConfigFile>);
      } catch {
        this.config = DEFAULT_CLASS_CONFIG;
      }
    }
    return this.config;
  }

  getConfig(): InkClassConfigFile {
    return this.config;
  }

  resolveAlias(value: string | undefined): string {
    return resolveAlias(this.config, value);
  }

  resolve(meta: InkBlockMeta): ResolvedInkConfig {
    return resolveInkConfig(this.config, meta);
  }

  getBackgroundVaultPath(background: string): string | null {
    if (background.startsWith("./")) {
      return normalizePath(`${CONFIG_DIR}/${background.slice(2)}`);
    }
    if (background.startsWith(`${CONFIG_DIR}/`)) {
      return normalizePath(background);
    }
    if (background.endsWith(".svg") && !background.includes("/")) {
      return normalizePath(`${BACKGROUND_DIR}/${background}`);
    }
    return null;
  }

  async getBackgroundDataUrl(background: string): Promise<string | null> {
    const path = this.getBackgroundVaultPath(background);
    if (!path) return background.startsWith("#") ? null : background;
    const file = this.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return null;
    const svg = await this.vault.read(file);
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  private async ensureDefaults(): Promise<void> {
    const hasConfigDir = await ensureFolder(this.vault, CONFIG_DIR);
    const hasBackgroundDir = hasConfigDir ? await ensureFolder(this.vault, BACKGROUND_DIR) : false;

    if (hasConfigDir && !this.vault.getAbstractFileByPath(CONFIG_PATH)) {
      await safeCreateText(this.vault, CONFIG_PATH, `${JSON.stringify(DEFAULT_CLASS_CONFIG, null, 2)}\n`);
    }

    if (!hasBackgroundDir) return;
    for (const [name, content] of Object.entries(DEFAULT_BACKGROUNDS)) {
      const path = `${BACKGROUND_DIR}/${name}`;
      if (!this.vault.getAbstractFileByPath(path)) {
        await safeCreateText(this.vault, path, content);
      }
    }
  }
}

function normalizeClassConfig(config: Partial<InkClassConfigFile>): InkClassConfigFile {
  return {
    classes: {
      ...DEFAULT_CLASS_CONFIG.classes,
      ...(config.classes ?? {})
    }
  };
}

async function ensureFolder(vault: Vault, path: string): Promise<boolean> {
  const normalized = normalizePath(path);
  const existing = vault.getAbstractFileByPath(normalized);
  if (existing instanceof TFolder) return true;
  if (existing) {
    console.warn(`Inkdown expected ${normalized} to be a folder, but another file exists there.`);
    return false;
  }
  try {
    await vault.createFolder(normalized);
    return true;
  } catch (error) {
    const afterCreate = vault.getAbstractFileByPath(normalized);
    if (afterCreate instanceof TFolder) return true;
    console.warn(`Inkdown could not create folder ${normalized}.`, error);
    return false;
  }
}

async function safeCreateText(vault: Vault, path: string, content: string): Promise<void> {
  try {
    await vault.create(path, content);
  } catch (error) {
    if (!vault.getAbstractFileByPath(path)) {
      console.warn(`Inkdown could not create ${path}.`, error);
    }
  }
}
