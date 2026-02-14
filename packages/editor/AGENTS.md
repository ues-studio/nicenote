# @nicenote/editor Agent Guide

本文件用于约束在 `packages/editor` 目录内工作的 AI/开发代理行为。

## 1) 包定位

- 该包是 **富文本编辑器 UI 与行为层**，对外提供 `NicenoteEditor` React 组件。
- 编辑器内部基于 Tiptap，数据交换格式以 **Markdown 字符串** 为准。
- 该包不负责：笔记持久化、网络请求、业务状态管理（由 `apps/web` 的 store 与 API 处理）。

## 2) 当前文件结构（关键）

- `src/index.ts`
  - 对外导出 `NicenoteEditor` 与 `NicenoteEditorProps`。
- `src/web/editor-shell.tsx`
  - 编辑器主容器，负责：
    - 受控/非受控 `isSourceMode`
    - `value` 与编辑器内容同步
    - `onChange(markdown)` 回调
    - 键盘快捷键切换源码模式
- `src/web/editor-content.tsx`
  - 视图切换：富文本 (`EditorContent`) / 源码 (`textarea`)。
- `src/web/toolbar.tsx`
  - 工具栏装配层：组合 heading/list 下拉、链接按钮、动作按钮。
- `src/web/command-dropdown-menu.tsx`
  - 命令下拉菜单 UI（通过 `resolveOption` 注入命令状态与行为）。
- `src/web/link-toolbar-button.tsx`
  - 链接按钮交互：Popover 表单输入、校验提示、设置/清除链接。
- `src/web/action-toolbar-button.tsx`
  - 普通动作按钮（命令项与 source mode）的通用渲染。
- `src/core/serialization.ts`
  - Markdown 读写与变更判断：`readEditorMarkdown` / `writeEditorMarkdown` / `hasEditorMarkdownChanged`。
- `src/core/state.ts`
  - 工具栏状态快照（undo/redo、marks、nodes）。
- `src/core/commands.ts`
  - 统一命令 ID 与执行逻辑，含链接设置/清除。
- `src/core/link.ts`
  - 链接输入校验逻辑（格式、长度、协议约束）。
- `src/preset-note/*`
  - 注记场景 preset：行为策略、最小扩展、快捷键、工具栏配置。
- `src/styles/editor.css`
  - 编辑器样式与 token 映射。

## 3) 必须遵守的修改原则

1. **Markdown 单一事实来源**：对外值始终是 markdown，避免引入第二套主数据格式。
2. **行为策略集中**：默认行为改动优先落在 `preset-note/behavior-policy.ts`，不要散落 magic number / magic string。
3. **命令统一入口**：新增工具栏动作应先扩展 `core/commands.ts` 和 `NoteCommandId`，再接入 UI。
4. **链接交互独立**：链接输入与校验收敛在 `web/link-toolbar-button.tsx` + `core/link.ts`，不要回退到 `window.prompt`。
5. **类型先行**：保持严格类型，不绕过 `strict`（禁止 `any`、禁止弱化公共 props 类型）。
6. **最小改动**：仅修改 editor 包职责内代码，不把 `apps/web` 业务逻辑耦合进来。

## 4) 扩展与工具栏约定

- `createMinimalExtensions()` 当前约束：
  - `StarterKit`（heading level: 1/2/3）
  - `TextAlign`（heading/paragraph）
  - `Typography`
  - `Placeholder`
  - `Markdown`（必须在扩展数组末尾）
- 新增扩展时：
  - 先评估是否属于“note 最小能力”，避免引入重型或与场景无关扩展。
  - 若新增命令，需同步：
    - `NOTE_COMMAND_IDS`
    - `NOTE_COMMAND_HANDLERS`
    - `state.ts` 中 active/disabled 判定所需状态
    - `preset-note/toolbar-config.ts` 按需配置展示

## 4.1) 链接输入约定

- 链接输入必须使用非阻塞 UI（当前实现为 Popover 表单），禁止 `window.prompt`。
- 链接校验统一走 `core/link.ts#getLinkValidationError()`。
- 当前允许协议：`http` / `https` / `mailto` / `tel`。
- 输入非法时在 UI 内给出错误提示，不执行 `setLinkHref()`。

## 5) Source Mode 约定

- 切换快捷键由 `isToggleSourceModeShortcut()` 定义（当前为 `Mod+Shift+M`）。
- Source Mode 的开关能力受 `NOTE_BEHAVIOR_POLICY.sourceModeEnabled` 控制。
- 源码编辑提交发生在 `textarea` blur（`onSourceBlur`），不要悄悄改成高频实时写回，除非需求明确。

## 6) 样式与主题约定

- 优先使用全局 `--color-*` / `--font-*` token 变量，不新增硬编码主题色。
- 保持 `editor.css` 中 `nn-editor-*` class 命名空间，避免污染宿主页面样式。
- 对外样式入口通过 `package.json` exports：
  - `./styles/editor.css`

## 7) 导出与兼容性

- 新增公开 API 时必须：
  1. 在实现文件导出
  2. 在 `src/index.ts` 聚合导出
  3. 保持与现有 `NicenoteEditorProps` 兼容（新增可选字段优先）
- 破坏性改动（props 删除/重命名、命令语义改变）需明确记录影响面（至少覆盖 `apps/web` 使用方）。

## 8) 不要做的事

- 不要在该包内引入网络请求、localStorage 持久化、后端契约逻辑。
- 不要直接修改 `dist/` 产物。
- 不要在未评估快捷键冲突前新增全局级组合键。
- 不要跳过 `normalizeMarkdownContent()` 这类输入收敛逻辑直接写入未知内容。

## 9) 本地验证清单

在仓库根目录执行：

```bash
pnpm --filter @nicenote/editor lint
pnpm --filter @nicenote/editor build
```

若变更影响 web 集成，建议额外执行：

```bash
pnpm --filter web build
```

## 10) 变更自检（提交前）

- 是否保持 markdown 读写链路一致（value -> editor -> onChange）？
- 是否同步更新了命令定义、工具栏配置、状态快照映射？
- 是否新增/改动了公共导出并在 `src/index.ts` 聚合？
- 是否遵守了全局样式 token 与 `nn-editor-*` class 命名空间约束？

## 11) 跨包联动注意事项（apps/web）

- 当前 web 集成点在 `apps/web/src/components/NoteEditorPane.tsx`：
  - 以 `value={currentNote.content}` 传入 markdown。
  - 以 `onChange(newContent)` 回写到 `updateNoteLocal()` 与 `scheduleSave()`。
- `scheduleSave()` 来自 `apps/web/src/hooks/useDebouncedNoteSave.ts`，默认 1 秒防抖。
  - 若 editor 改变 `onChange` 触发频率或语义，会直接影响保存压力与合并策略。
- web 侧样式依赖在 `apps/web/scripts/generate-css.ts` 中固定导入：
  - `@import '@nicenote/editor/styles/editor.css';`
  - 若调整样式导出路径，必须同步更新该脚本与构建链路。
- 目前 web 未使用 `isSourceMode` / `onSourceModeChange` 受控模式。
  - 若要调整 source mode 相关默认行为，请评估对非受控场景的兼容性。
