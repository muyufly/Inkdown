import { App, MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from "obsidian";
import { ClassConfigLoader } from "../config/classConfigLoader";
import { InkFileManager } from "../storage/inkFileManager";
import { InkBlockView } from "../ui/InkBlockView";
import { isTFileLike } from "./fileLike";

export interface InkPostProcessorDeps {
  app: App;
  configLoader: ClassConfigLoader;
  fileManager: InkFileManager;
}

export function renderInkCodeBlock(
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  deps: InkPostProcessorDeps
): void {
  if (isPlainSourceMode(el)) {
    renderSourceFallback(source, el);
    return;
  }

  const file = deps.app.vault.getAbstractFileByPath(ctx.sourcePath);
  if (!isTFileLike(file)) return;
  el.classList.add("inkdown-codeblock-host");

  try {
    const view = new InkBlockView({
      app: deps.app,
      file,
      source: `\`\`\`ink\n${source.trim()}\n\`\`\``,
      configLoader: deps.configLoader,
      fileManager: deps.fileManager
    });
    ctx.addChild(new InkBlockRenderChild(view.el, view));
    el.replaceChildren(view.el);
    hideNativeEditButton(el);
  } catch (error) {
    const pre = document.createElement("pre");
    pre.textContent = source;
    el.replaceChildren(pre);
    console.error("Inkdown render failed", error);
  }
}

function isPlainSourceMode(el: HTMLElement): boolean {
  const sourceView = el.closest(".markdown-source-view");
  return !!sourceView && !sourceView.classList.contains("is-live-preview");
}

function renderSourceFallback(source: string, el: HTMLElement): void {
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = `\`\`\`ink\n${source.trim()}\n\`\`\``;
  pre.appendChild(code);
  el.replaceChildren(pre);
}

function hideNativeEditButton(el: HTMLElement): void {
  requestAnimationFrame(() => {
    hideNativeEditButtonsNear(el);
  });
  el.addEventListener("mouseenter", () => hideNativeEditButtonsNear(el));
}

function hideNativeEditButtonsNear(el: HTMLElement): void {
  for (const candidate of findNearbyNativeEditButtons(el)) {
    candidate.classList.add("inkdown-hidden-native-edit");
    candidate.setAttribute("aria-hidden", "true");
    candidate.tabIndex = -1;
  }
}

function findNearbyNativeEditButtons(el: HTMLElement): HTMLElement[] {
  const hostRect = el.getBoundingClientRect();
  const searchRoot = el.parentElement?.parentElement ?? el.parentElement ?? el;
  const candidates = Array.from(searchRoot.querySelectorAll<HTMLElement>("button, .edit-block-button"));
  return candidates.filter((candidate) => {
    if (candidate.closest(".inkdown-block")) return false;
    if (!isNativeEditButton(candidate)) return false;
    return rectTouchesInkBlock(candidate.getBoundingClientRect(), hostRect);
  });
}

function rectTouchesInkBlock(candidate: DOMRect, host: DOMRect): boolean {
  const horizontal = candidate.right >= host.left - 8 && candidate.left <= host.right + 8;
  const vertical = candidate.bottom >= host.top - 24 && candidate.top <= host.bottom + 8;
  return horizontal && vertical;
}

function isNativeEditButton(el: HTMLElement): boolean {
  if (el.classList.contains("edit-block-button")) return true;
  const text = (el.textContent ?? "").trim();
  const label = `${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("title") ?? ""}`;
  return text === "</>" || label.includes("Edit");
}

class InkBlockRenderChild extends MarkdownRenderChild {
  constructor(
    containerEl: HTMLElement,
    private readonly view: InkBlockView
  ) {
    super(containerEl);
  }

  onunload(): void {
    this.view.destroy();
  }
}
