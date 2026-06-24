import { InkData, InkStroke, ResolvedInkConfig } from "../types/ink";
import { createStrokeId } from "../utils/id";
import { findStrokeNearPoint, renderStrokes } from "./strokeRenderer";

type Tool = "pen" | "eraser";

export interface InkCanvasOptions {
  container: HTMLElement;
  data: InkData;
  config: ResolvedInkConfig;
  onChange?: (data: InkData) => void;
}

export class InkCanvas {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tool: Tool = "pen";
  private color: string;
  private strokeWidth: number;
  private currentStroke: InkStroke | null = null;
  private redoStack: InkStroke[] = [];
  private drawingPointerId: number | null = null;

  constructor(private readonly options: InkCanvasOptions) {
    this.color = options.config.defaultColor;
    this.strokeWidth = options.config.defaultStrokeWidth;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "inkdown-canvas";
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to create Inkdown canvas context.");
    this.ctx = ctx;
    options.container.appendChild(this.canvas);
    this.bind();
    this.resize();
    requestAnimationFrame(() => this.resize());
  }

  setTool(tool: Tool): void {
    this.tool = tool;
  }

  setColor(color: string): void {
    this.color = color;
    this.tool = "pen";
  }

  setStrokeWidth(width: number): void {
    this.strokeWidth = width;
  }

  undo(): void {
    const stroke = this.options.data.strokes.pop();
    if (stroke) {
      this.redoStack.push(stroke);
      this.changed();
    }
  }

  redo(): void {
    const stroke = this.redoStack.pop();
    if (stroke) {
      this.options.data.strokes.push(stroke);
      this.changed();
    }
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.render();
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.canvas.remove();
  }

  private bind(): void {
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("resize", this.onResize);
  }

  private onResize = (): void => this.resize();

  private onPointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.drawingPointerId = event.pointerId;
    const point = this.getPoint(event);
    if (this.tool === "eraser") {
      this.eraseAt(point.x, point.y);
      return;
    }
    this.currentStroke = {
      id: createStrokeId(),
      tool: "pen",
      color: this.color,
      width: this.strokeWidth,
      points: [point]
    };
    this.options.data.strokes.push(this.currentStroke);
    this.redoStack = [];
    this.changed();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.drawingPointerId) return;
    event.preventDefault();
    const point = this.getPoint(event);
    if (this.tool === "eraser") {
      this.eraseAt(point.x, point.y);
      return;
    }
    if (!this.currentStroke) return;
    this.currentStroke.points.push(point);
    this.changed();
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.drawingPointerId) return;
    event.preventDefault();
    this.currentStroke = null;
    this.drawingPointerId = null;
  };

  private eraseAt(x: number, y: number): void {
    const index = findStrokeNearPoint(this.options.data.strokes, x, y, 12);
    if (index >= 0) {
      const [stroke] = this.options.data.strokes.splice(index, 1);
      this.redoStack.push(stroke);
      this.changed();
    }
  }

  private getPoint(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: event.pressure || 0.5,
      time: Date.now()
    };
  }

  private changed(): void {
    this.render();
    this.options.onChange?.(this.options.data);
  }

  private render(): void {
    const ratio = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    renderStrokes(this.ctx, this.options.data.strokes, ratio);
  }
}
