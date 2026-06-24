let sequence = 0;

export function createInkId(date = new Date()): string {
  sequence += 1;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `ink-${yyyy}${mm}${dd}-${hh}${min}${ss}-${String(sequence).padStart(3, "0")}`;
}

export function createStrokeId(): string {
  return `stroke-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}
