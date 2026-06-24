import { editorInfoField, Editor, MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { parseInkShortcut } from "../parser/parseInkShortcut";
import { stringifyInkBlock } from "../parser/parseInkBlock";
import { withDefaultAssetPaths } from "../storage/inkFileManager";
import { isTFileLike } from "./fileLike";
import { exportAiBundle } from "../export/exportAiBundle";

export function registerInkCommands(plugin: Plugin): void {
  addInsertCommand(plugin, "insert-default-ink-block", "Insert default ink block", "/ink");
  addInsertCommand(plugin, "insert-math-ink-block", "Insert math ink block", "/ink m");
  addInsertCommand(plugin, "insert-graph-ink-block", "Insert graph ink block", "/ink g");
  addInsertCommand(plugin, "insert-quick-ink-block", "Insert quick ink block", "/ink q");
  plugin.addCommand({
    id: "export-ai-bundle",
    name: "Export current note as AI bundle",
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) return false;
      if (!checking) void exportAiBundle(plugin.app.vault, file);
      return true;
    }
  });
  registerShortcutFallback(plugin);
}

export function createInkShortcutExtension() {
  return Prec.highest(
    keymap.of([
      {
        key: "Enter",
        run: (view) => replaceShortcutLine(view, "\n\n")
      },
      {
        key: "Space",
        run: (view) => replaceShortcutLine(view, "\n", true)
      }
    ])
  );
}

function addInsertCommand(plugin: Plugin, id: string, name: string, shortcut: string): void {
  plugin.addCommand({
    id,
    name,
    editorCallback: (editor, ctx) => {
      insertBlock(editor, shortcut, ctx.file);
    }
  });
}

function insertBlock(editor: Editor, shortcut: string, file: TFile | null): void {
  const meta = parseInkShortcut(shortcut);
  if (!meta) {
    new Notice("Inkdown could not parse shortcut.");
    return;
  }
  editor.replaceSelection(`${stringifyInkBlock(file ? withDefaultAssetPaths(file, meta) : meta)}\n`);
}

function registerShortcutFallback(plugin: Plugin): void {
  let replacing = false;
  plugin.registerEvent(
    plugin.app.workspace.on("editor-change", (editor, info) => {
      if (replacing || editor.somethingSelected()) return;
      const cursor = editor.getCursor();
      if (cursor.line <= 0 || cursor.ch !== 0) return;
      const currentLine = editor.getLine(cursor.line);
      if (currentLine.trim() !== "") return;
      const candidates = [cursor.line - 1];

      for (const lineNumber of candidates) {
        const lineText = editor.getLine(lineNumber);
        const meta = parseInkShortcut(lineText);
        if (!meta) continue;

        const block = stringifyInkBlock(info.file ? withDefaultAssetPaths(info.file, meta) : meta);
        replacing = true;
        try {
          editor.replaceRange(
            `${block}\n`,
            { line: lineNumber, ch: 0 },
            { line: cursor.line, ch: 0 },
            "inkdown-shortcut"
          );
          editor.setCursor({
            line: lineNumber + block.split("\n").length,
            ch: 0
          });
        } finally {
          replacing = false;
        }
        return;
      }
    })
  );
}

function replaceShortcutLine(view: EditorView, suffix: string, requireTrailingSpace = false): boolean {
  const selection = view.state.selection.main;
  if (!selection.empty) return false;
  const line = view.state.doc.lineAt(selection.head);
  if (requireTrailingSpace && !/\s$/.test(line.text)) return false;
  const text = line.text.trim();
  const meta = parseInkShortcut(text);
  if (!meta) return false;
  const file = view.state.field(editorInfoField, false)?.file;
  const block = stringifyInkBlock(isTFileLike(file) ? withDefaultAssetPaths(file, meta) : meta);
  view.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: `${block}${suffix}`
    },
    selection: { anchor: line.from + block.length + suffix.length }
  });
  return true;
}

export function getActiveMarkdownView(plugin: Plugin): MarkdownView | null {
  return plugin.app.workspace.getActiveViewOfType(MarkdownView);
}
