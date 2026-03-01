# NiceNote Desktop — 实施方案 (Wails3)

---

## 1. 架构总览与核心策略

基于 Wails3 构建桌面端：Go 承载所有系统交互与数据层，系统原生 WebView 渲染现有 React 前端，通过 Wails3 自动生成的 TypeScript Binding 实现前后端类型安全的 IPC 通信。

相较于 React Native 方案，Wails3 的核心优势在于：

- **编辑器直接运行**：Tiptap 运行在系统 WebView 中，无需 WebView Bridge 中间层。
- **数据库零痛点**：Go 直接操作 SQLite，无需原生模块编译。
- **单二进制分发**：前端资源嵌入 Go 二进制，无额外 runtime 依赖。
- **无构建地狱**：告别 MSVC / Windows SDK / Podfile 版本对齐问题。

### 1.1 核心技术选型

| 领域           | 选型                                           | 说明                                                                         |
| -------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| **基础框架**   | **Wails3** (alpha)                             | Go 后端 + 系统原生 WebView；macOS 用 WebKit，Windows 用 WebView2。           |
| **后端语言**   | **Go 1.23+**                                   | 处理所有 I/O、SQLite、系统托盘、全局快捷键、窗口管理。                       |
| **持久化存储** | **modernc.org/sqlite** + **Goose** + **sqlc**  | 纯 Go SQLite（无 CGO）；Goose 管理 migration；sqlc 生成类型安全查询代码。    |
| **前端**       | **React 19** + **Vite 7** + **TailwindCSS v4** | 复用现有 `apps/web` 共享包（editor、ui、tokens、shared）。                   |
| **IPC**        | **Wails3 Binding**                             | Go 方法自动生成 TypeScript 类型；前端直接 `await App.CreateNote(...)` 调用。 |
| **状态管理**   | **Zustand v5**                                 | 前端状态管理，Action 层调用 Wails Binding 替代原有 HTTP API。                |
| **编辑器**     | **Tiptap v3**（复用 `packages/editor`）        | 直接在 WebView 渲染，无需 Bridge 包装。                                      |
| **系统功能**   | Go 标准库 + Wails3 Plugin System               | 系统托盘、全局快捷键、原生菜单、文件对话框均由 Go 实现。                     |

---

## 2. 工程结构设计 (Monorepo)

```text
nicenote/
├── apps/
│   ├── desktop/                      # Wails3 桌面端工程（Go + React）
│   │   ├── main.go                   # Wails3 入口：创建 App 实例、注册插件
│   │   ├── app.go                    # App struct：暴露给前端的 Binding 方法
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── services/                 # Go 业务逻辑层
│   │   │   ├── note.go               # 笔记 CRUD
│   │   │   ├── folder.go             # 文件夹管理
│   │   │   ├── tag.go                # 标签管理
│   │   │   └── search.go             # FTS5 全文搜索
│   │   ├── db/                       # 数据访问层
│   │   │   ├── db.go                 # DB 初始化（WAL、PRAGMA）
│   │   │   ├── migrations/           # .sql migration 文件（Goose 格式）
│   │   │   └── queries/              # sqlc 查询文件与生成代码
│   │   ├── frontend/                 # React 前端子项目
│   │   │   ├── src/
│   │   │   │   ├── bindings/         # Wails3 自动生成的 TS Binding（勿手改）
│   │   │   │   ├── store/            # Zustand Store（Action 调用 Binding）
│   │   │   │   ├── components/       # 桌面专属组件（TitleBar、Sidebar 等）
│   │   │   │   ├── hooks/            # 前端 Hook
│   │   │   │   └── App.tsx
│   │   │   ├── package.json          # 依赖声明（复用 workspace 包）
│   │   │   └── vite.config.ts        # Wails3 dev server 集成配置
│   │   └── build/                    # Wails3 构建资源
│   │       ├── darwin/               # macOS 图标、Info.plist
│   │       └── windows/              # Windows 图标、版本信息
│   └── web/                          # 现有 Web 端（不受影响）
├── packages/
│   ├── editor/                       # [复用] Tiptap v3 编辑器组件
│   ├── ui/                           # [复用] Radix UI 组件库
│   ├── tokens/                       # [复用] 设计变量
│   └── shared/                       # [复用] 工具函数、Zod Schema、类型定义
```

> **前端为何独立在 `frontend/` 子目录？**
> Wails3 CLI 要求前端资源位于单独目录，由 Vite 构建后嵌入 Go 二进制。`frontend/` 通过 `workspace:*` 协议引用 monorepo 内的共享包，与 `apps/web` 共享 editor、ui、tokens 等，不重复实现业务组件。

---

## 3. 关键业务实现方案

### 3.1 IPC 通信模型（Wails Binding）

Wails3 的核心机制：Go 方法自动映射为前端可调用的异步函数。

**Go 侧（app.go）**：

```go
type App struct {
    noteService   *services.NoteService
    folderService *services.FolderService
}

// CreateNote 方法自动生成对应的 TS Binding
func (a *App) CreateNote(input shared.NoteCreateInput) (shared.NoteSelect, error) {
    return a.noteService.Create(input)
}

func (a *App) SearchNotes(query string) ([]shared.NoteListItem, error) {
    return a.noteService.Search(query)
}
```

**前端侧（自动生成 bindings/app.ts）**：

```typescript
// Wails3 自动生成，类型与 Go 结构体完全对应
export const CreateNote = (input: NoteCreateInput): Promise<NoteSelect> =>
  wails.Call('App.CreateNote', input)
```

**Zustand Store（store/useNoteStore.ts）**：

```typescript
import { CreateNote, SearchNotes } from '../bindings/app'

const useNoteStore = create<NoteState>((set) => ({
  createNote: async (input) => {
    const note = await CreateNote(input)
    set((s) => ({ notes: [note, ...s.notes] }))
  },
}))
```

### 3.2 本地数据库（Go + SQLite）

- **驱动**：`modernc.org/sqlite`（纯 Go，无 CGO，跨平台零配置编译）
- **Migration**：Goose 在应用冷启动时自动执行 `db/migrations/` 下的增量 SQL 文件
- **查询**：sqlc 从 `db/queries/*.sql` 生成类型安全的 Go 代码，无 ORM 运行时开销
- **性能**：启动时执行 `PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON;`
- **FTS5**：`modernc.org/sqlite` 默认编译 FTS5，直接创建虚拟表实现全文检索，无需额外编译参数

**数据库路径**：

```go
// macOS: ~/Library/Application Support/NiceNote/nicenote.db
// Windows: %APPDATA%\NiceNote\nicenote.db
func dbPath() string {
    dir, _ := os.UserConfigDir()
    return filepath.Join(dir, "NiceNote", "nicenote.db")
}
```

### 3.3 编辑器集成

Tiptap 直接在系统 WebView 中运行，**无需任何 Bridge 层**。与 React Native 方案的根本区别：

- `packages/editor` 中的 Tiptap 组件直接作为 React 组件引入 `frontend/src/`
- 内容以 Markdown 格式存储，通过 Zustand + Wails Binding 防抖写入 SQLite
- 主题切换：监听 Wails3 的系统主题事件（`events.On("theme:changed", ...)`），更新 `<html>` class

### 3.4 桌面专属系统功能（Go 实现）

| 功能             | 实现方式                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| **系统托盘**     | Wails3 内置 `systray` Plugin；注册图标与菜单项，点击菜单触发前端事件           |
| **全局快捷键**   | Wails3 `globalshortcuts` Plugin；`Cmd+Shift+N` / `Ctrl+Shift+N` 唤起快速笔记窗 |
| **自定义标题栏** | Wails3 设置 `Frameless: true`，前端实现拖拽区（`--wails-draggable: drag`）     |
| **原生菜单**     | Go 侧创建 `menu.Menu` 结构体并注册，支持 macOS 应用菜单栏和 Windows 系统菜单   |
| **文件对话框**   | `runtime.OpenFileDialog` / `runtime.SaveFileDialog`（Wails3 内置）             |
| **多窗口**       | Wails3 Multi-Window 支持；快速笔记为独立浮动小窗，主窗口为全功能编辑界面       |

---

## 4. 实施阶段拆解 (Roadmap)

### Phase 1：基础设施搭建

1. 初始化 Wails3 项目结构，配置 `apps/desktop/go.mod` 与 `frontend/package.json`（接入 monorepo workspace）。
2. 打通 DB 层：Goose migration 自动执行 + sqlc 代码生成脚本接入 Turbo pipeline。
3. 实现最简 `App` struct，暴露 `GetNotes`、`CreateNote`、`UpdateNote`、`DeleteNote` 四个 Binding，前端 Store 调通。
4. **验证节点**：Wails3 dev 模式下，前端能增删改查笔记并持久化至本地 SQLite。

### Phase 2：编辑器与核心界面

1. 将 `packages/editor` 接入 `frontend/`，实现完整的 Tiptap 富文本编辑体验。
2. 实现防抖保存：编辑器内容变更 → Zustand Action → `UpdateNote` Binding → SQLite。
3. 搭建主界面布局：左侧笔记列表（虚拟滚动）+ 右侧编辑器 + 顶部工具栏。
4. 适配深浅双色主题，监听系统主题事件并持久化用户选择。
5. **验证节点**：macOS 和 Windows 均能完整创建、编辑（富文本 + Markdown）、自动保存笔记，重启后数据恢复。

### Phase 3：桌面特性注入

1. 自定义无边框标题栏（含拖拽区、窗口控制按钮）。
2. 系统托盘注册，支持从托盘直接新建笔记或显示/隐藏主窗口。
3. 全局快捷键唤起快速笔记浮动小窗（独立 Wails 窗口实例）。
4. FTS5 全文搜索弹窗（`Cmd+K` / `Ctrl+K`），Go 侧实现高亮片段提取。
5. 文件夹树与标签筛选（侧边栏）。
6. 导入（.md 文件拖拽）/ 导出（系统 Save Dialog）。

### Phase 4：构建发版与稳定性

1. GitHub Actions 配置：
   - macOS runner：`wails3 build --platform darwin/amd64,darwin/arm64` + `codesign` + `notarytool`
   - Windows runner：`wails3 build --platform windows/amd64` + Windows Authenticode 签名
2. 冷启动性能优化目标 `< 1.5s`（Go 二进制启动极快，主要优化点在 WebView 初始化与前端 bundle 体积）。
3. 自动更新：集成 `wails3-update` 或自定义检查 GitHub Releases。

---

## 5. 关键开发命令

```bash
# 安装 Wails3 CLI（Go 工具链）
go install github.com/wailsapp/wails/v3/cmd/wails3@latest

# 开发模式（Go 后端热重载 + Vite 前端热重载）
cd apps/desktop && wails3 dev

# 生成 Wails Binding（Go 结构体 → TypeScript 类型）
wails3 generate bindings

# 生成 sqlc 查询代码
sqlc generate -f db/sqlc.yaml

# 执行数据库 migration（开发时手动触发，生产由应用启动自动执行）
goose -dir db/migrations sqlite ./nicenote.db up

# 生产构建（输出至 build/bin/）
wails3 build --platform darwin/arm64
wails3 build --platform windows/amd64

# Turbo 集成（从 monorepo 根目录）
pnpm --filter desktop dev
pnpm --filter desktop build
```

---

## 6. 潜在风险与应对措施

| 风险点                                     | 概率/影响 | 应对方案                                                                                                                               |
| ------------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Wails3 仍处于 alpha 阶段，API 可能变动** | 高 / 中   | 锁定具体 commit hash，关注 Wails3 Changelog，封装 Binding 调用层以隔离 API 变更影响。                                                  |
| **Windows WebView2 未预装（旧系统）**      | 中 / 高   | Wails3 支持嵌入 WebView2 Bootstrapper；或在安装包中捆绑 WebView2 Runtime 离线安装包。                                                  |
| **WebKit 版本差异（macOS 跨版本）**        | 低 / 中   | 指定最低 macOS 版本（12.0+，WebKit 稳定期）；Tiptap 避免依赖实验性 CSS/JS API。                                                        |
| **sqlc 与 modernc/sqlite 方言差异**        | 低 / 低   | 配置 sqlc 使用 `sqlite` 方言；生成后运行 integration test 覆盖关键查询路径。                                                           |
| **Monorepo 包在 Go module 内引用**         | 中 / 中   | Go 代码（services、db）不引用 TypeScript 包；仅 `apps/desktop/frontend/` 通过 pnpm workspace 协议引用共享包，Go 与 TS 边界清晰不交叉。 |
