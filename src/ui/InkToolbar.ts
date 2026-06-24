import { InkCanvas } from "../canvas/InkCanvas";
import { ResolvedInkConfig } from "../types/ink";

export interface InkToolbarOptions {
  config: ResolvedInkConfig;
  canvas: InkCanvas;
  onSave: () => void;
  height?: string;
  onHeightChange?: (height: string) => void;
}

export class InkToolbar {
  readonly el: HTMLElement;
  private colorButtons: HTMLButtonElement[] = [];
  private eraserButton: HTMLButtonElement;

  constructor(private readonly options: InkToolbarOptions) {
    this.el = document.createElement("div");
    this.el.className = "inkdown-toolbar";

    for (const color of options.config.colors) {
      const button = document.createElement("button");
      button.className = "inkdown-color-button";
      button.type = "button";
      button.title = color;
      button.style.backgroundColor = color;
      button.addEventListener("click", () => {
        options.canvas.setColor(color);
        this.setActiveColor(button);
        this.eraserButton.classList.remove("is-active");
      });
      this.colorButtons.push(button);
      this.el.appendChild(button);
    }

    this.eraserButton = this.addButton("Eraser", "Erase", () => {
      options.canvas.setTool("eraser");
      this.eraserButton.classList.add("is-active");
      this.colorButtons.forEach((button) => button.classList.remove("is-active"));
    });
    if (options.height && options.onHeightChange) {
      this.el.appendChild(this.createHeightControl(options.height, options.onHeightChange));
    }
    this.addButton("Undo", "Undo", () => options.canvas.undo());
    this.addButton("Redo", "Redo", () => options.canvas.redo());
    this.addButton("Save", "Save", () => options.onSave());
    this.colorButtons[0]?.classList.add("is-active");
  }

  private createHeightControl(value: string, onChange: (height: string) => void): HTMLElement {
    const control = document.createElement("label");
    control.className = "inkdown-height-control";
    control.textContent = "height";
    const input = document.createElement("input");
    input.className = "inkdown-height-input";
    input.type = "number";
    input.min = "1";
    input.max = "40";
    input.step = "1";
    input.value = value;
    input.addEventListener("click", (event) => event.stopPropagation());
    input.addEventListener("change", () => onChange(input.value));
    control.appendChild(input);
    return control;
  }

  private addButton(label: string, title: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "inkdown-tool-button";
    button.type = "button";
    button.textContent = label;
    button.title = title;
    button.addEventListener("click", onClick);
    this.el.appendChild(button);
    return button;
  }

  private setActiveColor(active: HTMLButtonElement): void {
    this.colorButtons.forEach((button) => button.classList.toggle("is-active", button === active));
  }
}
