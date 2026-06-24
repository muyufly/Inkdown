import { strict as assert } from "node:assert";
import { findInkBlocks, parseInkBlock, stringifyInkBlock } from "../src/parser/parseInkBlock";
import { parseInkShortcut } from "../src/parser/parseInkShortcut";
import { lineCountToCssHeight, normalizeCssSize, normalizeLineCount } from "../src/utils/units";
import { getInkAssetDirectory, getInkAssetMarkdownPath, getInkAssetVaultPath } from "../src/storage/assetPath";
import { resolveAlias, resolveInkConfig } from "../src/config/resolveInkConfig";
import { DEFAULT_CLASS_CONFIG } from "../src/config/defaultClasses";
import { findInkBlockRanges, nonEmptySelectionTouchesRange, selectionInteractsWithRange } from "../src/obsidian/inkBlockRanges";
import { replaceInkBlockById } from "../src/storage/replaceInkBlock";
import type { TFile } from "obsidian";

function testParseInkBlock(): void {
  const meta = parseInkBlock(`\`\`\`ink
class: SysMath
id: test
height: 10
@image: ./assets/ink/test.png
@data: ./assets/ink/test.ink.json
\`\`\``);
  assert.equal(meta?.id, "test");
  assert.equal(meta?.className, "SysMath");
  assert.equal(meta?.height, "10");
  assert.equal(meta?.imagePath, "./assets/ink/test.png");
  assert.equal(meta?.dataPath, "./assets/ink/test.ink.json");

  const blocks = findInkBlocks(`# Title

\`\`\`ink
class: SysMath
id: test
height: 10
@image: ./assets/ink/test.png
@data: ./assets/ink/test.ink.json
\`\`\`

Text below`);
  assert.equal(blocks.length, 1);
  assert.equal(parseInkBlock(blocks[0])?.id, "test");

  assert.equal(findInkBlocks("普通文字 inkdown 不应该被识别").length, 0);

  const rendered = stringifyInkBlock({
    id: "ink-height",
    className: "SysDefault",
    height: "3",
    imagePath: "./assets/ink/ink-height.png",
    dataPath: "./assets/ink/ink-height.ink.json"
  });
  assert.match(rendered, /height: 3\n@image: \.\/assets\/ink\/ink-height\.png\n@data: \.\/assets\/ink\/ink-height\.ink\.json\n```/);
  assert.equal(rendered.includes("@line"), false);
}

function testParseInkShortcut(): void {
  const meta = parseInkShortcut("/ink m 600", () => "ink-test");
  assert.equal(meta?.id, "ink-test");
  assert.equal(meta?.className, "SysMath");
  assert.equal(meta?.height, "40");
  assert.equal(meta?.imagePath, undefined);
  assert.equal(meta?.dataPath, undefined);

  const dark = parseInkShortcut("/ink d 300 100% black #fff,#f00,#0ff", () => "ink-dark");
  assert.equal(dark?.className, "SysDark");
  assert.equal(dark?.height, "40");
  assert.equal(dark?.width, "100%");
  assert.equal(dark?.background, "./backgrounds/black.svg");
  assert.deepEqual(dark?.colors, ["#fff", "#f00", "#0ff"]);
}

function testUnits(): void {
  assert.equal(normalizeCssSize("600"), "600px");
  assert.equal(normalizeCssSize("100%"), "100%");
  assert.equal(normalizeLineCount("10"), "10");
  assert.equal(normalizeLineCount("600px"), "13");
  assert.equal(normalizeLineCount("600"), "40");
  assert.equal(lineCountToCssHeight("10"), "480px");
}

function testAssetPaths(): void {
  const file = { path: "Notes/Math/Test Note.md", name: "Test Note.md", basename: "Test Note" } as TFile;
  assert.equal(getInkAssetDirectory(file), "Notes/Math/inkdown-Test-Note");
  assert.equal(getInkAssetVaultPath(file, "ink-test", "png"), "Notes/Math/inkdown-Test-Note/png/ink-test.png");
  assert.equal(getInkAssetVaultPath(file, "ink-test", "ink.json"), "Notes/Math/inkdown-Test-Note/data/ink-test.ink.json");
  assert.equal(getInkAssetMarkdownPath(file, "ink-test", "ink.json"), "./inkdown-Test-Note/data/ink-test.ink.json");
}

function testConfigMerge(): void {
  const resolved = resolveInkConfig(DEFAULT_CLASS_CONFIG, {
    id: "ink-test",
    className: "m",
    height: "600",
    colors: ["#123456"]
  });
  assert.equal(resolved.className, "SysMath");
  assert.equal(resolved.height, "40");
  assert.equal(resolved.width, "100%");
  assert.equal(resolved.defaultColor, "#123456");

  assert.equal(resolveAlias({ classes: {} }, "m"), "SysMath");
}

function testEditorRanges(): void {
  const doc = `1111

\`\`\`ink
class: SysMath
id: ink-test
height: 2
@image: ./assets/ink/ink-test.png
@data: ./assets/ink/ink-test.ink.json
\`\`\`

after`;
  const ranges = findInkBlockRanges(doc);
  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].source.includes("@line"), false);
  assert.equal(doc.slice(ranges[0].from, ranges[0].to).startsWith("```ink"), true);
}

function testReplaceInkBlockById(): void {
  const first = stringifyInkBlock({
    id: "ink-first",
    className: "SysDefault",
    height: "2",
    imagePath: "./assets/ink/ink-first.png",
    dataPath: "./assets/ink/ink-first.ink.json"
  });
  const second = stringifyInkBlock({
    id: "ink-second",
    className: "SysDefault",
    height: "2",
    imagePath: "./assets/ink/ink-second.png",
    dataPath: "./assets/ink/ink-second.ink.json"
  });
  const replacement = stringifyInkBlock({
    id: "ink-second",
    className: "SysDefault",
    height: "4",
    imagePath: "./assets/ink/ink-second.png",
    dataPath: "./assets/ink/ink-second.ink.json"
  });
  const content = `before\n\n${first}\n\nbetween\n\n${second}\n\nafter`;
  const next = replaceInkBlockById(content, "ink-second", replacement);
  assert.equal(parseInkBlock(findInkBlocks(next)[0])?.id, "ink-first");
  assert.equal(parseInkBlock(findInkBlocks(next)[1])?.height, "4");
  assert.equal(next.includes("before"), true);
  assert.equal(next.includes("between"), true);
  assert.equal(next.includes("after"), true);
}

function testSelectionTouchesRange(): void {
  const cursorInside = {
    state: {
      selection: {
        ranges: [{ from: 10, to: 10, head: 10, anchor: 10, empty: true }]
      }
    }
  };
  const selectedInside = {
    state: {
      selection: {
        ranges: [{ from: 8, to: 12, head: 12, anchor: 8, empty: false }]
      }
    }
  };
  const cursorOutside = {
    state: {
      selection: {
        ranges: [{ from: 16, to: 16, head: 16, anchor: 16, empty: true }]
      }
    }
  };
  assert.equal(nonEmptySelectionTouchesRange(cursorInside.state.selection.ranges, 5, 15), false);
  assert.equal(nonEmptySelectionTouchesRange(selectedInside.state.selection.ranges, 5, 15), true);
  assert.equal(selectionInteractsWithRange(cursorInside.state.selection.ranges, 5, 15), true);
  assert.equal(selectionInteractsWithRange(cursorOutside.state.selection.ranges, 5, 15), false);
  assert.equal(selectionInteractsWithRange(selectedInside.state.selection.ranges, 5, 15), true);
}

testParseInkBlock();
testParseInkShortcut();
testUnits();
testAssetPaths();
testConfigMerge();
testEditorRanges();
testReplaceInkBlockById();
testSelectionTouchesRange();

console.log("Inkdown tests passed.");
