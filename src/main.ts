import { Plugin } from "obsidian";
import { ClassConfigLoader } from "./config/classConfigLoader";
import { InkFileManager } from "./storage/inkFileManager";
import { renderInkCodeBlock } from "./obsidian/markdownPostProcessor";
import { createInkShortcutExtension, registerInkCommands } from "./obsidian/commands";

export default class InkdownPlugin extends Plugin {
  private configLoader!: ClassConfigLoader;
  private fileManager!: InkFileManager;

  async onload(): Promise<void> {
    this.configLoader = new ClassConfigLoader(this.app.vault);
    await this.configLoader.load();
    this.fileManager = new InkFileManager(this.app.vault);

    registerInkCommands(this);
    this.registerEditorExtension([
      createInkShortcutExtension()
    ]);
    const rendererDeps = {
      app: this.app,
      configLoader: this.configLoader,
      fileManager: this.fileManager
    };
    this.registerMarkdownCodeBlockProcessor("ink", (source, el, ctx) =>
      renderInkCodeBlock(source, el, ctx, rendererDeps)
    );
  }
}
