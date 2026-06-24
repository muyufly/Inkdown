import { InkBlockMeta } from "../types/ink";
import { parseColorList } from "../utils/colors";

export function parseInkBlock(markdown: string): InkBlockMeta | null {
  const lines = markdown.trim().split(/\r?\n/);
  const firstLine = lines[0] ?? "";
  let attrs: Record<string, string>;
  if (/^```ink\s*$/i.test(firstLine)) {
    attrs = parseYamlishAttributes(lines);
  } else {
    return null;
  }
  const imageLine = lines.find((line) => line.trim().startsWith("@image:"));
  const dataLine = lines.find((line) => line.trim().startsWith("@data:"));
  const id = attrs.id;
  if (!id) return null;

  return {
    id,
    className: attrs.class,
    height: attrs.height,
    width: attrs.width,
    background: attrs.background,
    colors: parseColorList(attrs.colors),
    imagePath: imageLine?.replace(/^\s*@image:\s*/, "").trim(),
    dataPath: dataLine?.replace(/^\s*@data:\s*/, "").trim()
  };
}

export function findInkBlocks(markdown: string): string[] {
  return markdown.match(/```ink\s*\n[\s\S]*?\n```/gi) ?? [];
}

export function stringifyInkBlock(meta: InkBlockMeta): string {
  return [
    "```ink",
    `class: ${meta.className ?? "SysDefault"}`,
    `id: ${meta.id}`,
    `height: ${meta.height ?? "4"}`,
    ...(meta.width ? [`width: ${meta.width}`] : []),
    ...(meta.background ? [`background: ${meta.background}`] : []),
    ...(meta.colors?.length ? [`colors: ${meta.colors.join(",")}`] : []),
    `@image: ${meta.imagePath ?? `./inkdown-note/png/${meta.id}.png`}`,
    `@data: ${meta.dataPath ?? `./inkdown-note/data/${meta.id}.ink.json`}`,
    "```"
  ].join("\n");
}

export function parseInkCodeBlock(source: string): InkBlockMeta | null {
  return parseInkBlock(`\`\`\`ink\n${source.trim()}\n\`\`\``);
}

function parseYamlishAttributes(lines: string[]): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z][\w-]*)\s*:\s*(.+?)\s*$/);
    if (match) attrs[match[1]] = match[2];
  }
  if (attrs.className && !attrs.class) attrs.class = attrs.className;
  return attrs;
}
