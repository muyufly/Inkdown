import { InkData } from "../types/ink";
import { renderStrokes } from "./strokeRenderer";

export async function exportInkPng(
  data: InkData,
  width: number,
  height: number,
  backgroundUrl: string | null
): Promise<string> {
  const canvas = document.createElement("canvas");
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.save();
  ctx.scale(ratio, ratio);
  ctx.fillStyle = data.background === "black" ? "#101014" : "#ffffff";
  ctx.fillRect(0, 0, width, height);
  if (!drawSystemBackground(ctx, data.background, width, height) && backgroundUrl) {
    await drawBackground(ctx, backgroundUrl, width, height);
  }
  renderStrokes(ctx, data.strokes, 1);
  ctx.restore();
  return canvas.toDataURL("image/png");
}

function drawSystemBackground(ctx: CanvasRenderingContext2D, background: string, width: number, height: number): boolean {
  const name = background.split("/").pop()?.toLowerCase();
  if (name === "black.svg" || background === "black") {
    ctx.fillStyle = "#101014";
    ctx.fillRect(0, 0, width, height);
    return true;
  }
  if (name === "grid.svg") {
    drawGrid(ctx, width, height, 32, "#d8d8d8");
    return true;
  }
  if (name === "axis.svg") {
    drawGrid(ctx, width, height, 64, "#ececec");
    drawAxisGrid(ctx, width, height, 64, "#cfd7e6");
    return true;
  }
  if (name === "line.svg") {
    ctx.strokeStyle = "#d8e0f0";
    ctx.lineWidth = 1.5;
    for (let y = 28; y <= height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    return true;
  }
  return false;
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, step: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawAxisGrid(ctx: CanvasRenderingContext2D, width: number, height: number, step: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (let x = step / 2; x <= width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = step / 2; y <= height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, backgroundUrl: string, width: number, height: number): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const pattern = ctx.createPattern(image, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
      resolve();
    };
    image.onerror = () => resolve();
    image.src = backgroundUrl;
  });
}
