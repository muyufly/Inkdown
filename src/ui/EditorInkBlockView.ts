import { App, TFile } from "obsidian";
import { EditorView } from "@codemirror/view";
import { InkCanvas } from "../canvas/InkCanvas";
import { applyStageBackground } from "../canvas/backgroundRenderer";
import { exportInkPng } from "../canvas/pngExporter";
import { ClassConfigLoader } from "../config/classConfigLoader";
import { parseInkBlock } from "../parser/parseInkBlock";
import { InkFileManager, withDefaultAssetPaths } from "../storage/inkFileManager";
import { InkBlockMeta, InkData, ResolvedInkConfig } from "../types/ink";
import { InkToolbar } from "./InkToolbar";
import { lineCountToCssHeight, normalizeLineCount } from "../utils/units";

export interface EditorInkBlockViewOptions {
  app: App;
  editorView: EditorView;
  file: TFile;
  source: string;
  from: number;
  to: number;
  configLoader: ClassConfigLoader;
  fileManager: InkFileManager;
  onLayoutChange?: () => void;
}

export class EditorInkBlockView {
  readonly el: HTMLElement;
  private meta: InkBlockMeta;
  private config: ResolvedInkConfig;
  private stage: HTMLElement;
  private canvas: InkCanvas | null = null;
  private data: InkData | null = null;
  private backgroundUrl: string | null = null;

  constructor(private readonly options: EditorInkBlockViewOptions) {
    const parsed = parseInkBlock(options.source);
    if (!parsed) throw new Error("Invalid Inkdown editor block.");
    this.meta = withDefaultAssetPaths(options.file, parsed);
    this.config = options.configLoader.resolve(this.meta);

    this.el = document.createElement("div");
    this.el.className = "inkdown-block inkdown-editor-block";
    this.el.style.width = this.config.width;

    const header = document.createElement("div");
    header.className = "inkdown-header";
    const title = document.createElement("span");
    title.className = "inkdown-title";
    title.textContent = `${this.config.className} - ${this.meta.id}`;
    const hint = document.createElement("span");
    hint.className = "inkdown-mode-hint";
    hint.textContent = "Editing";
    header.append(title, hint);
    this.el.appendChild(header);

    this.stage = document.createElement("div");
    this.stage.className = "inkdown-stage";
    this.stage.style.height = lineCountToCssHeight(this.config.height);
    this.el.appendChild(this.stage);

    void this.init();
  }

  destroy(): void {
    this.canvas?.destroy();
  }

  private async init(): Promise<void> {
    this.backgroundUrl = await this.options.configLoader.getBackgroundDataUrl(this.config.background);
    applyStageBackground(this.stage, this.backgroundUrl, this.config.background);
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
      onHeightChange: (height) => this.setHeight(height),
      onSave: () => void this.save()
    });
    this.el.insertBefore(toolbar.el, this.stage);
    this.notifyLayoutChange();
  }

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

  private setHeight(value: string): void {
    const height = normalizeLineCount(value);
    if (!height) return;
    this.meta = { ...this.meta, height };
    this.config = this.options.configLoader.resolve(this.meta);
    this.stage.style.height = lineCountToCssHeight(this.config.height);
    if (this.data) this.data.height = this.config.height;
    requestAnimationFrame(() => {
      this.canvas?.resize();
      this.notifyLayoutChange();
    });
  }

  private notifyLayoutChange(): void {
    this.options.onLayoutChange?.();
  }
}
