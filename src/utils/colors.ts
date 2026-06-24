export function parseColorList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const colors = value
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);
  return colors.length > 0 ? colors : undefined;
}

export function isColorListToken(value: string): boolean {
  return value.includes(",");
}
