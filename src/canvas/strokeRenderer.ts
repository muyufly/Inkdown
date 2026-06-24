import { InkStroke } from "../types/ink";

export function renderStrokes(ctx: CanvasRenderingContext2D, strokes: InkStroke[], scale = 1): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * scale;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x * scale, stroke.points[0].y * scale);
    for (const point of stroke.points.slice(1)) {
      ctx.lineTo(point.x * scale, point.y * scale);
    }
    if (stroke.points.length === 1) {
      const point = stroke.points[0];
      ctx.lineTo(point.x * scale + 0.1, point.y * scale + 0.1);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function findStrokeNearPoint(strokes: InkStroke[], x: number, y: number, radius: number): number {
  for (let i = strokes.length - 1; i >= 0; i -= 1) {
    const stroke = strokes[i];
    for (const point of stroke.points) {
      const dx = point.x - x;
      const dy = point.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= radius + stroke.width) {
        return i;
      }
    }
  }
  return -1;
}
