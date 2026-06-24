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
  if (backgroundUrl) {
    await drawBackground(ctx, backgroundUrl, width, height);
  }
  renderStrokes(ctx, data.strokes, 1);
  ctx.restore();
  return canvas.toDataURL("image/png");
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
