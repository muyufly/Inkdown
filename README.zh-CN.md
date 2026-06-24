# Inkdown

Inkdown 是一个 Obsidian 插件，用来在 Markdown 笔记中插入可编辑的手写块。

它不是白板应用，也不是 Excalidraw 克隆。当前 MVP 不做 OCR、AI 识别、云同步、协作、复杂图形工具或无限画布。Inkdown 优先保证一个稳定的核心闭环：

```text
/ink 快捷输入 -> Markdown ink 块 -> 手写画布 -> 保存 .ink.json -> 导出 .png -> 重新打开继续编辑
```

[English README](README.md)

## 当前状态

Inkdown 仍处于 MVP 开发阶段。核心流程已经可用，但还没有提交到 Obsidian 社区插件市场。

## 功能

- 使用 `/ink` 快捷语法插入手写块。
- 使用标准 Markdown fenced code block 保存 ink 块。
- 在 Live Preview 和阅读模式中渲染为可交互手写区域。
- 使用原生 Canvas 和 pointer events 绘制。
- 支持笔颜色选择。
- 支持橡皮擦，MVP 行为是删除整条 stroke。
- 支持撤销和重做。
- 保存可编辑笔迹数据为 `.ink.json`。
- 导出预览图为 `.png`。
- 每篇笔记的 ink 资产按文章名独立存放。
- 支持导出 Markdown + PNG 资源包，便于 AI 阅读。
- 支持从 `.inkdown/classes.json` 加载 class 配置。

## 暂不实现

- OCR
- AI 总结或讲解
- LaTeX 识别
- 无限画布
- 图形库
- 协作
- 云同步
- 完整移动端优化
- 复杂套索变换

## 开发安装

1. 将本仓库克隆或复制到 Obsidian vault 的插件目录：

   ```text
   <vault>/.obsidian/plugins/inkdown
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 构建插件：

   ```bash
   npm run build
   ```

4. 在 Obsidian 中启用第三方插件，然后启用 `Inkdown`。

开发时可以运行：

```bash
npm run dev
```

修改后需要在 Obsidian 中重新加载插件。

## 使用方式

在 Obsidian 笔记中输入下面的快捷语法，然后按 Enter：

```md
/ink
/ink m
/ink m 10
/ink g 9
/ink d 6 100% black #fff,#f00,#0ff
```

别名：

```text
m -> SysMath
g -> SysGraph
q -> SysQuick
d -> SysDark
```

当前版本中，数字高度表示“行数”。例如：

```md
/ink m 10
```

会生成 `height: 10` 的手写块。

## Markdown 语法

Inkdown 使用普通 fenced code block 保存手写块：

````md
```ink
class: SysMath
id: ink-20260623-001
height: 10
@image: ./inkdown-My-Note/png/ink-20260623-001.png
@data: ./inkdown-My-Note/data/ink-20260623-001.ink.json
```
````

这样即使插件不可用，Markdown 中仍然保留图片路径和可编辑数据路径。

`@image` 指向 PNG 预览图，`@data` 指向可编辑笔迹数据。

## 文件管理

Inkdown 不再把所有资源堆到全局 `assets/ink` 目录，而是按笔记名在当前笔记旁边创建独立目录：

```text
My Note.md
inkdown-My-Note/
  data/
    ink-20260623-001.ink.json
  png/
    ink-20260623-001.png
```

这样每篇笔记和它的手写资源更容易移动、备份和导出。

## AI 阅读导出

在命令面板中运行：

```text
Inkdown: Export current note as AI bundle
```

插件会在当前笔记旁边生成：

```text
inkdown-export-My-Note/
  My Note.md
  png/
    ink-20260623-001.png
```

导出的 Markdown 会把 Inkdown 的 PNG 引用改成导出包内的 `./png/...`，适合直接发给 AI 模型或其他 Markdown 阅读器。

## Class 配置

启动时，Inkdown 会在 vault 根目录创建：

```text
.inkdown/classes.json
.inkdown/backgrounds/
```

默认 class 包括：

- `SysDefault`
- `SysMath`
- `SysGraph`
- `SysQuick`
- `SysDark`

配置优先级：

```text
inline options > user class config > system class config > default config
```

## 命令

- `Inkdown: Insert default ink block`
- `Inkdown: Insert math ink block`
- `Inkdown: Insert graph ink block`
- `Inkdown: Insert quick ink block`
- `Inkdown: Export current note as AI bundle`

## 开发

运行测试：

```bash
npm test
```

构建：

```bash
npm run build
```

项目结构：

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

## 关于 Live Preview

Inkdown 使用 Obsidian 的 Markdown code block post processor 渲染 `ink` 块。

开发过程中曾尝试用 CodeMirror widget 替换整段源码，但这会导致光标、回车和 Obsidian 原生区块编辑按钮出现冲突。因此当前版本不再接管整段 CodeMirror range。

如果需要编辑原始 ink block Markdown，请切换到 Obsidian 的源码模式。

## 许可证

MIT
