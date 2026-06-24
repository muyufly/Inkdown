import { editorInfoField, editorLivePreviewField, TFile, type App } from "obsidian";
import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from "@codemirror/view";
import { ClassConfigLoader } from "../config/classConfigLoader";
import { InkFileManager } from "../storage/inkFileManager";
import { parseInkBlock } from "../parser/parseInkBlock";
import { lineCountToCssHeight, parsePixelSize } from "../utils/units";
import { EditorInkBlockView } from "../ui/EditorInkBlockView";
import { findInkBlockRanges, nonEmptySelectionTouchesRange } from "./inkBlockRanges";
import { isTFileLike } from "./fileLike";

export interface InkLivePreviewDeps {
  app: App;
  configLoader: ClassConfigLoader;
  fileManager: InkFileManager;
}

export function createInkLivePreviewExtension(deps: InkLivePreviewDeps): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private observer: MutationObserver | null = null;
      private refreshQueued = false;

      constructor(private readonly view: EditorView) {
        this.observeModeChanges();
        this.decorations = this.build();
      }

      update(update: ViewUpdate): void {
        this.decorations = this.build();
      }

      private build(): DecorationSet {
        if (this.isSourceMode()) return Decoration.none;
        const file = this.view.state.field(editorInfoField, false)?.file;
        if (!isTFileLike(file)) return Decoration.none;
        return buildDecorations(this.view, file, deps);
      }

      private observeModeChanges(): void {
        const sourceView = this.view.dom.closest(".markdown-source-view");
        if (!sourceView) return;
        this.observer = new MutationObserver(() => this.queueRefresh());
        this.observer.observe(sourceView, {
          attributes: true,
          attributeFilter: ["class"]
        });
      }

      private queueRefresh(): void {
        if (this.refreshQueued) return;
        this.refreshQueued = true;
        requestAnimationFrame(() => {
          this.refreshQueued = false;
          this.decorations = this.build();
          this.view.dispatch({});
        });
      }

      private isSourceMode(): boolean {
        const sourceView = this.view.dom.closest(".markdown-source-view");
        if (sourceView) return !sourceView.classList.contains("is-live-preview");
        return this.view.state.field(editorLivePreviewField, false) === false;
      }

      destroy(): void {
        this.observer?.disconnect();
      }
    },
    {
      decorations: (plugin) => plugin.decorations
    }
  );
}

function buildDecorations(view: EditorView, file: TFile, deps: InkLivePreviewDeps): DecorationSet {
  const doc = view.state.doc.toString();
  const builder = new RangeSetBuilder<Decoration>();
  for (const range of findInkBlockRanges(doc)) {
    const from = view.state.doc.lineAt(range.from).from;
    const to = view.state.doc.lineAt(Math.max(range.from, range.to - 1)).to;
    const rangeSource = view.state.doc.sliceString(from, to);
    if (selectionTouchesRange(view, from, to)) continue;

    builder.add(
      from,
      to,
      Decoration.replace({
        block: true,
        inclusive: false,
        inclusiveStart: false,
        inclusiveEnd: false,
        widget: new InkBlockWidget(deps, file, rangeSource, from, to)
      })
    );
  }

  return builder.finish();
}

export function selectionTouchesRange(view: Pick<EditorView, "state">, from: number, to: number): boolean {
  return nonEmptySelectionTouchesRange(view.state.selection.ranges, from, to);
}


class InkBlockWidget extends WidgetType {
  private blockView: EditorInkBlockView | null = null;

  constructor(
    private readonly deps: InkLivePreviewDeps,
    private readonly file: TFile,
    private readonly source: string,
    private readonly from: number,
    private readonly to: number
  ) {
    super();
  }

  eq(other: WidgetType): boolean {
    return (
      other instanceof InkBlockWidget &&
      other.file.path === this.file.path &&
      other.source === this.source &&
      other.from === this.from &&
      other.to === this.to
    );
  }

  toDOM(editorView: EditorView): HTMLElement {
    this.blockView = new EditorInkBlockView({
      app: this.deps.app,
      editorView,
      file: this.file,
      source: this.source,
      from: this.from,
      to: this.to,
      configLoader: this.deps.configLoader,
      fileManager: this.deps.fileManager,
      onLayoutChange: () => requestAnimationFrame(() => editorView.requestMeasure())
    });
    requestAnimationFrame(() => editorView.requestMeasure());
    return this.blockView.el;
  }

  get estimatedHeight(): number {
    const meta = parseInkBlock(this.source);
    const config = this.deps.configLoader.resolve(meta ?? { id: "unknown" });
    return parsePixelSize(lineCountToCssHeight(config.height), 240) + 82;
  }

  ignoreEvent(): boolean {
    return true;
  }

  destroy(): void {
    this.blockView?.destroy();
    this.blockView = null;
  }
}
