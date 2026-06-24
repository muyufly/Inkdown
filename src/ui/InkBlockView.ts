import { App, TFile } from "obsidian";
import { InkCanvas } from "../canvas/InkCanvas";
import { applyStageBackground } from "../canvas/backgroundRenderer";
import { exportInkPng } from "../canvas/pngExporter";
import { ClassConfigLoader } from "../config/classConfigLoader";
import { parseInkBlock, stringifyInkBlock } from "../parser/parseInkBlock";
import { InkFileManager } from "../storage/inkFileManager";
import { resolveMarkdownPath } from "../storage/assetPath";
import { InkBlockMeta, InkData, ResolvedInkConfig } from "../types/ink";
import { InkToolbar } from "./InkToolbar";
import { lineCountToCssHeight, normalizeLineCount } from "../utils/units";

export interface InkBlockViewOptions {
  app: App;
  file: TFile;
  source: string;
  configLoader: ClassConfigLoader;
  fileManager: InkFileManager;
  autoEdit?: boolean;
  className?: string;
  onLayoutChange?: () => void;
  ensureMarkdownPaths?: boolean;
}

export class InkBlockView {
  readonly el: HTMLElement;
  private meta: InkBlockMeta;
  private config: ResolvedInkConfig;
  private stage: HTMLElement;
  private data: InkData | null = null;
  private canvas: InkCanvas | null = null;
  private backgroundUrl: string | null = null;

  constructor(private readonly options: InkBlockViewOptions) {
    const parsed = parseInkBlock(options.source);
    if (!parsed) throw new Error("Invalid Inkdown block.");
    this.meta = parsed;
    this.config = options.configLoader.resolve(this.meta);

    this.el = document.createElement("div");
    this.el.className = "inkdown-block";
    if (options.className) this.el.classList.add(options.className);
    this.el.style.width = this.config.width;

    const header = document.createElement("div");
    header.className = "inkdown-header";
    const title = document.createElement("span");
    title.className = "inkdown-title";
    title.textContent = `${this.config.className} - ${this.meta.id}`;
    const hint = document.createElement("span");
    hint.className = "inkdown-mode-hint";
    hint.textContent = options.autoEdit ? "Editing" : "Click to edit";
    header.append(title, hint);
    this.el.appendChild(header);

    this.stage = document.createElement("div");
    this.stage.className = "inkdown-stage";
    this.stage.style.height = lineCountToCssHeight(this.config.height);
    this.stage.addEventListener("click", this.onStageClick);
    this.el.appendChild(this.stage);

    void this.init();
  }

  private async init(): Promise<void> {
    this.meta = await this.options.fileManager.ensureInkFiles(this.options.file, this.meta, this.config);
    this.config = this.options.configLoader.resolve(this.meta);
    this.stage.style.height = lineCountToCssHeight(this.config.height);
    this.backgroundUrl = await this.options.configLoader.getBackgroundDataUrl(this.config.background);
    applyStageBackground(this.stage, this.backgroundUrl, this.config.background);
    this.data = await this.options.fileManager.readInkData(this.options.file, this.meta, this.config);
    if (this.options.autoEdit) {
      await this.edit();
    } else {
      this.renderPreview();
    }
    if (this.options.ensureMarkdownPaths !== false) {
      await this.ensureMarkdownHasPaths();
    }
    this.notifyLayoutChange();
  }

  private renderPreview(): void {
    this.stage.replaceChildren();
    const imageFile = this.meta.imagePath
      ? this.options.app.vault.getAbstractFileByPath(resolveMarkdownPath(this.options.file, this.meta.imagePath))
      : null;
    if (imageFile instanceof TFile) {
      const image = document.createElement("img");
      image.className = "inkdown-preview";
      image.alt = this.meta.id;
      image.src = this.options.app.vault.getResourcePath(imageFile);
      this.stage.appendChild(image);
    } else {
      const empty = document.createElement("div");
      empty.className = "inkdown-empty";
      empty.textContent = "Click to write";
      this.stage.appendChild(empty);
    }
  }

  private async edit(): Promise<void> {
    if (this.canvas) return;
    this.stage.replaceChildren();
    this.stage.removeEventListener("click", this.onStageClick);
    this.data = await this.options.fileManager.readInkData(this.options.file, this.meta, this.config);
    this.data.height = this.config.height;
    this.data.width = this.config.width;
    this.data.background = this.config.background;

    this.canvas = new InkCanvas({
      container: this.stage,
      data: this.data,
      config: this.config
    });
    const toolbar = new InkToolbar({
      config: this.config,
      canvas: this.canvas,
      height: this.config.height,
      onHeightChange: (height) => void this.setHeight(height),
      onSave: () => void this.save()
    });
    this.el.insertBefore(toolbar.el, this.stage);
    this.notifyLayoutChange();
  }

  private onStageClick = (): void => {
    void this.edit();
  };

  private async save(): Promise<void> {
    if (!this.data) return;
    this.data.height = this.config.height;
    this.data.width = this.config.width;
    this.data.background = this.config.background;
    await this.options.fileManager.writeInkData(this.options.file, this.meta, this.data);
    const rect = this.stage.getBoundingClientRect();
    const png = await exportInkPng(this.data, rect.width, rect.height, this.backgroundUrl);
    if (png) await this.options.fileManager.writePng(this.options.file, this.meta, png);
    await this.options.fileManager.updateBlockInNote(this.options.file, this.meta, this.meta);
  }

  private async setHeight(value: string): Promise<void> {
    const height = normalizeLineCount(value);
    if (!height) return;
    this.meta = { ...this.meta, height };
    this.config = this.options.configLoader.resolve(this.meta);
    this.stage.style.height = lineCountToCssHeight(this.config.height);
    if (this.data) this.data.height = this.config.height;
    this.canvas?.resize();
    this.notifyLayoutChange();
    await this.options.fileManager.updateBlockInNote(this.options.file, this.meta, this.meta);
  }

  private async ensureMarkdownHasPaths(): Promise<void> {
    const block = stringifyInkBlock(this.meta);
    if (this.options.source.trim() !== block.trim()) {
      await this.options.fileManager.updateBlockInNote(this.options.file, parseInkBlock(this.options.source) ?? this.meta, this.meta);
    }
  }

  destroy(): void {
    this.canvas?.destroy();
  }

  private notifyLayoutChange(): void {
    this.options.onLayoutChange?.();
  }
}
