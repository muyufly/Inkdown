# Inkdown

Inkdown is an Obsidian plugin for inline handwritten ink blocks inside Markdown notes.

It is intentionally small: it is not a whiteboard, not an Excalidraw clone, and does not include OCR, AI recognition, cloud sync, collaboration, or complex shape tools. The goal is a reliable note-taking loop:

```text
/ink shortcut -> Markdown ink block -> handwritten canvas -> .ink.json data -> .png preview -> reopen and edit
```

## Current Status

Inkdown is an MVP under active development. The core flow works, but the plugin is not yet packaged for the Obsidian community plugin store.

## Features

- Insert handwritten blocks with `/ink` shortcuts.
- Render `ink` fenced code blocks as interactive handwritten areas in Live Preview and Reading mode.
- Draw with pointer events on an HTML canvas.
- Pen color selection.
- Eraser that removes whole strokes.
- Undo and redo.
- Save editable stroke data as `.ink.json`.
- Export preview images as `.png`.
- Store each note's ink assets beside that note.
- Export a Markdown + PNG bundle for AI reading.
- Load configurable ink classes from `.inkdown/classes.json`.

## Not In Scope Yet

- OCR
- AI explanation or summary
- LaTeX recognition
- Infinite canvas
- Shape tools
- Collaboration
- Cloud sync
- Full mobile optimization
- Complex lasso or transform tools

## Installation For Development

1. Clone or copy this repository into an Obsidian vault plugin folder:

   ```text
   <vault>/.obsidian/plugins/inkdown
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the plugin:

   ```bash
   npm run build
   ```

4. In Obsidian, enable community plugins and enable `Inkdown`.

During development you can run:

```bash
npm run dev
```

Then reload the plugin in Obsidian after changes.

## Usage

In an Obsidian note, type one of these shortcuts and press Enter:

```md
/ink
/ink m
/ink m 10
/ink g 9
/ink d 6 100% black #fff,#f00,#0ff
```

Aliases:

```text
m -> SysMath
g -> SysGraph
q -> SysQuick
d -> SysDark
```

The numeric height is a line count. For example:

```md
/ink m 10
```

creates a block with `height: 10`.

## Markdown Syntax

Inkdown stores blocks as normal fenced Markdown code blocks:

````md
```ink
class: SysMath
id: ink-20260623-001
height: 10
@image: ./inkdown-My-Note/png/ink-20260623-001.png
@data: ./inkdown-My-Note/data/ink-20260623-001.ink.json
```
````

This keeps notes readable even when the plugin is disabled. The `@image` path points to a PNG preview, and `@data` points to editable stroke data.

## Asset Layout

Inkdown stores assets next to the note, grouped by article name:

```text
My Note.md
inkdown-My-Note/
  data/
    ink-20260623-001.ink.json
  png/
    ink-20260623-001.png
```

This avoids putting all ink assets into a global `assets/ink` folder and makes each note easier to move or export.

## AI Reading Export

Use the command palette:

```text
Inkdown: Export current note as AI bundle
```

It creates a folder next to the current note:

```text
inkdown-export-My-Note/
  My Note.md
  png/
    ink-20260623-001.png
```

The exported Markdown rewrites ink PNG references to `./png/...`, making the note and images easy to pass to an AI model or another Markdown reader.

## Class Configuration

On startup, Inkdown creates:

```text
.inkdown/classes.json
.inkdown/backgrounds/
```

The default classes include:

- `SysDefault`
- `SysMath`
- `SysGraph`
- `SysQuick`
- `SysDark`

Inline options override user class config, which overrides system class config, which overrides defaults:

```text
inline options > user class config > system class config > default config
```

## Commands

- `Inkdown: Insert default ink block`
- `Inkdown: Insert math ink block`
- `Inkdown: Insert graph ink block`
- `Inkdown: Insert quick ink block`
- `Inkdown: Export current note as AI bundle`

## Development

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

Project structure:

```text
src/
  canvas/
  config/
  export/
  obsidian/
  parser/
  storage/
  types/
  ui/
  utils/
tests/
```

## Notes On Live Preview

Inkdown uses Obsidian's Markdown code block post processor for rendering ink blocks. It avoids replacing entire CodeMirror ranges with custom widgets because that caused cursor, Enter-key, and block-editing conflicts during development.

To edit raw ink block Markdown, switch to Obsidian's Source mode.

## License

MIT
