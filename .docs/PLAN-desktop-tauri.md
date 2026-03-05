# NiceNote Desktop — Wails3 → Tauri v2 迁移方案

---

## 1. 迁移动机

| 问题                  | 说明                                                                             |
| --------------------- | -------------------------------------------------------------------------------- |
| **Wails3 处于 alpha** | API 不稳定，`v3.0.0-alpha.74` 多处已知 Bug（Windows 窗口边框、IPC 数字 ID 脆弱） |
| **IPC 绑定维护成本**  | 当前通过 `Call.ByID(数字常量)` 调用，Go 函数签名变更后数字 ID 会变，需手动同步   |
| **Go 运行时体积**     | Go 二进制 + WebView2 Bootstrapper 导致安装包偏大                                 |
| **Tauri v2 已稳定**   | Tauri v2（2024 Q4 发布）进入 stable，社区活跃，文档完善，插件生态成熟            |
| **Rust 安全性**       | Rust 内存安全特性比 Go 更适合系统级文件 I/O 与并发监听                           |

**迁移目标**：删除 `apps/desktop/` 下所有 Wails3/Go 代码，以 Tauri v2（Rust 后端）完整重建，前端 React 组件和 Zustand store 逻辑最大程度复用。

---

## 2. 删除清单（Wails3 遗留）

执行迁移前，删除以下内容：

```
apps/desktop/
  main.go
  app.go
  types.go
  go.mod
  go.sum
  services/           # 全部 Go 服务层
  db/                 # Go SQLite 初始化
  build/              # Wails3 构建资源（图标在 Tauri 中重新配置）
  .task/              # Taskfile 缓存
  Taskfile.yml        # Wails3 构建任务（替换为 Tauri CLI 命令）
  bin/                # 已编译的测试二进制
  frontend/src/bindings/    # Wails3 自动生成的 JS bindings
  frontend/src/hooks/useWailsEvents.ts   # Wails 事件钩子（替换为 Tauri 版）
  frontend/package.json 中的 @wailsio/runtime 依赖
```

保留：

```
apps/desktop/frontend/src/
  App.tsx
  main.tsx
  index.css
  generated-tokens.css
  store/useDesktopStore.ts   # 保留 state 定义，仅替换 IPC 调用
  components/                # 全部 React 组件无需改动
  scripts/generate-css.ts    # CSS token 生成脚本
```

---

## 3. 新工程结构

```
apps/desktop/
├── src-tauri/                    # Tauri Rust 后端（cargo workspace member）
│   ├── Cargo.toml
│   ├── tauri.conf.json           # Tauri 应用配置（窗口、权限、更新）
│   ├── capabilities/
│   │   └── default.json          # 前端权限声明
│   ├── icons/                    # 应用图标（各平台格式）
│   └── src/
│       ├── main.rs               # Tauri 入口
│       ├── lib.rs                # 注册 commands + plugins + state
│       ├── commands/
│       │   ├── mod.rs
│       │   ├── folder.rs         # open_folder_dialog, get_folder_tree
│       │   ├── note.rs           # list_notes, get_note_content, save_note, create_note...
│       │   ├── search.rs         # search_notes
│       │   ├── cache.rs          # recent_folders, settings, tag_colors, favorites
│       │   └── watcher.rs        # watch_folder（集成 notify crate）
│       ├── services/
│       │   ├── frontmatter.rs    # YAML frontmatter 解析/写入
│       │   ├── note_io.rs        # 文件读写、原子保存
│       │   └── search_engine.rs  # 全文搜索（走目录扫描，无 FTS5 依赖）
│       └── db/
│           ├── mod.rs            # rusqlite 初始化（WAL + PRAGMA）
│           └── cache.rs          # recent_folders / settings / tag_colors / favorites 表
├── frontend/                     # React 前端（保持现有结构）
│   ├── src/
│   │   ├── bindings/
│   │   │   └── tauri.ts          # 替换原 nicenote_desktop.ts，用 invoke 封装
│   │   ├── hooks/
│   │   │   └── useTauriEvents.ts # 替换 useWailsEvents.ts
│   │   ├── store/
│   │   │   └── useDesktopStore.ts # 仅替换 import 源，其余不变
│   │   ├── components/            # 无需修改
│   │   └── App.tsx                # 替换 useWailsEvents → useTauriEvents
│   ├── package.json
│   └── vite.config.ts
└── package.json                   # monorepo workspace 入口（可选）
```

---

## 4. Go → Rust 服务层映射

### 4.1 依赖对照

| Go（当前）                     | Rust（目标）                  | 说明                          |
| ------------------------------ | ----------------------------- | ----------------------------- |
| `modernc.org/sqlite`           | `rusqlite` (bundled feature)  | 纯静态链接 SQLite，无系统依赖 |
| `gopkg.in/yaml.v3`             | `serde_yaml`                  | YAML frontmatter 序列化       |
| `github.com/fsnotify/fsnotify` | `notify` crate                | 文件系统事件监听              |
| `github.com/wailsapp/wails/v3` | `tauri` v2                    | 框架本体                      |
| 标准库 `os`, `filepath`        | 标准库 `std::fs`, `std::path` | 文件操作                      |

### 4.2 Cargo.toml 关键依赖

```toml
[dependencies]
tauri = { version = "2", features = ["protocol-asset"] }
tauri-plugin-dialog = "2"
tauri-plugin-shell = "2"
tauri-plugin-fs = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
serde_yaml = "0.9"
rusqlite = { version = "0.32", features = ["bundled"] }
notify = "6"
tokio = { version = "1", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }
walkdir = "2"
anyhow = "1"

[build-dependencies]
tauri-build = { version = "2", features = [] }
```

### 4.3 frontmatter 解析（`services/frontmatter.rs`）

对应 `services/frontmatter.go`，解析 `---\n...\n---\n正文` 格式：

```rust
// 与 Go 实现完全等效
pub struct Frontmatter {
    pub title: Option<String>,
    pub tags: Vec<String>,
    pub created_at: Option<String>,
}

pub fn parse(raw: &str) -> (Frontmatter, String) { ... }
pub fn write(fm: &Frontmatter, body: &str) -> String { ... }
```

### 4.4 笔记 I/O（`services/note_io.rs`）

对应 `services/note.go`：

- `list_notes(folder_path)` → `walkdir` 递归扫描 `.md` 文件，解析 frontmatter 返回元信息
- `get_note_content(path)` → 读取文件，分离 frontmatter 和正文
- `save_note(path, content, tags)` → 原子写入（先写临时文件，再 `rename`）
- `create_note(folder_path)` → 生成唯一文件名，写入空 frontmatter
- `rename_note(old_path, new_title)` → 重命名文件并更新 frontmatter title
- `delete_note(path)` → 移入 `.trash/` 子目录

### 4.5 搜索（`services/search_engine.rs`）

对应 `services/search.go`，**不使用 FTS5**（SQLite 仅作缓存，不存笔记内容），改为：

- 遍历目录 `.md` 文件，读取并匹配标题 + 正文（大小写不敏感）
- 返回命中片段（上下文 80 字符）
- 对于大型 vault（>5000 文件）可后续引入 `tantivy` 索引，Phase 1 暂用扫描方式

### 4.6 缓存 DB（`db/cache.rs`）

对应 `services/cache.go` + `db/db.go`，使用 `rusqlite`：

- 表：`recent_folders`, `settings`, `tag_colors`, `favorites`
- 启动时执行内联 migration SQL（无需 Goose）
- DB 路径：`tauri::path::app_data_dir()` → `NiceNote/cache.db`

### 4.7 文件监听（`commands/watcher.rs`）

对应 `services/watcher.go`，使用 `notify` crate + Tauri 事件：

```rust
// Tauri command：启动监听
#[tauri::command]
async fn watch_folder(
    app: tauri::AppHandle,
    folder_path: String,
    state: tauri::State<'_, WatcherState>,
) -> Result<(), String> { ... }

// 事件名称保持不变，前端无需改动
app.emit("file:created", payload)?;
app.emit("file:modified", payload)?;
app.emit("file:deleted", payload)?;
```

---

## 5. IPC 层替换

### 5.1 前端 binding 文件替换

**删除** `frontend/src/bindings/nicenote_desktop.ts`（Wails3 Call.ByID 风格）

**新建** `frontend/src/bindings/tauri.ts`：

```typescript
import { invoke } from '@tauri-apps/api/core'

// 类型定义完全复用（无需改动）
export type { NoteFile, NoteContent, FolderNode, SearchResult, Settings }

// IPC 方法：用可读字符串命令名替代数字 ID
export const AppService = {
  OpenFolderDialog: (): Promise<string> => invoke('open_folder_dialog'),

  GetRecentFolders: (): Promise<string[]> => invoke('get_recent_folders'),

  AddRecentFolder: (path: string): Promise<void> => invoke('add_recent_folder', { path }),

  RevealInExplorer: (path: string): Promise<void> => invoke('reveal_in_explorer', { path }),

  ListNotes: (folderPath: string): Promise<NoteFile[]> => invoke('list_notes', { folderPath }),

  GetNoteContent: (path: string): Promise<NoteContent> => invoke('get_note_content', { path }),

  SaveNote: (path: string, content: string, tags: string[]): Promise<void> =>
    invoke('save_note', { path, content, tags }),

  CreateNote: (folderPath: string): Promise<NoteFile> => invoke('create_note', { folderPath }),

  RenameNote: (oldPath: string, newTitle: string): Promise<NoteFile> =>
    invoke('rename_note', { oldPath, newTitle }),

  DeleteNote: (path: string): Promise<void> => invoke('delete_note', { path }),

  SearchNotes: (folderPath: string, query: string): Promise<SearchResult[]> =>
    invoke('search_notes', { folderPath, query }),

  GetFolderTree: (rootPath: string): Promise<FolderNode> => invoke('get_folder_tree', { rootPath }),

  WatchFolder: (folderPath: string): Promise<void> => invoke('watch_folder', { folderPath }),

  GetSettings: (): Promise<Settings> => invoke('get_settings'),

  SaveSettings: (settings: Settings): Promise<void> => invoke('save_settings', { settings }),

  GetTagColors: (): Promise<Record<string, string>> => invoke('get_tag_colors'),

  SetTagColor: (tag: string, color: string): Promise<void> =>
    invoke('set_tag_color', { tag, color }),

  GetFavorites: (): Promise<string[]> => invoke('get_favorites'),

  ToggleFavorite: (path: string): Promise<void> => invoke('toggle_favorite', { path }),
}
```

**Store 中只需改一行 import**（其余 useDesktopStore.ts 完全不变）：

```typescript
// 旧：import { AppService } from '../bindings/nicenote_desktop'
// 新：
import { AppService } from '../bindings/tauri'
```

### 5.2 Wails 事件 → Tauri 事件

**删除** `frontend/src/hooks/useWailsEvents.ts`

**新建** `frontend/src/hooks/useTauriEvents.ts`：

```typescript
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useDesktopStore } from '../store/useDesktopStore'

export function useTauriEvents() {
  const { handleFileCreated, handleFileModified, handleFileDeleted } = useDesktopStore()

  useEffect(() => {
    const unlisteners = Promise.all([
      listen<{ path: string }>('file:created', (e) => handleFileCreated(e.payload.path)),
      listen<{ path: string }>('file:modified', (e) => handleFileModified(e.payload.path)),
      listen<{ path: string }>('file:deleted', (e) => handleFileDeleted(e.payload.path)),
    ])
    return () => {
      unlisteners.then((fns) => fns.forEach((fn) => fn()))
    }
  }, [handleFileCreated, handleFileModified, handleFileDeleted])
}
```

**App.tsx 只改一行**：

```typescript
// 旧：import { useWailsEvents } from './hooks/useWailsEvents'
// 新：
import { useTauriEvents } from './hooks/useTauriEvents'
// useWailsEvents() → useTauriEvents()
```

### 5.3 前端 package.json 依赖变更

```diff
- "@wailsio/runtime": "3.0.0-alpha.79",
+ "@tauri-apps/api": "^2.0.0",
+ "@tauri-apps/plugin-dialog": "^2.0.0",
+ "@tauri-apps/plugin-shell": "^2.0.0",
```

---

## 6. Tauri 配置文件

### `src-tauri/tauri.conf.json`（关键字段）

```json
{
  "productName": "NiceNote",
  "version": "0.1.0",
  "identifier": "com.nicenote.app",
  "build": {
    "frontendDist": "../frontend/dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "pnpm --filter @nicenote/desktop dev:frontend",
    "beforeBuildCommand": "pnpm --filter @nicenote/desktop build:frontend"
  },
  "app": {
    "windows": [
      {
        "title": "NiceNote",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"]
  }
}
```

### `src-tauri/capabilities/default.json`

```json
{
  "identifier": "default",
  "description": "Default capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    "shell:default",
    "fs:default",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:allow-read-dir",
    "fs:allow-rename",
    "fs:allow-remove"
  ]
}
```

---

## 7. 开发命令变更

| 操作          | 旧（Wails3）                                                                 | 新（Tauri v2）                                                              |
| ------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 安装 CLI      | `go install github.com/wailsapp/wails/v3/cmd/wails3@latest`                  | `cargo install tauri-cli --version "^2.0"` 或 `pnpm add -g @tauri-apps/cli` |
| 开发模式      | `cd apps/desktop && FRONTEND_DEVSERVER_URL=http://localhost:5173 wails3 dev` | `cd apps/desktop && cargo tauri dev`                                        |
| 生产构建      | `wails3 build --platform windows/amd64`                                      | `cargo tauri build`                                                         |
| 生成图标      | `wails3 generate icons`                                                      | `cargo tauri icon build/appicon.png`                                        |
| monorepo 入口 | `pnpm --filter desktop dev`                                                  | `pnpm --filter @nicenote/desktop tauri:dev`                                 |

### package.json scripts（前端）

```json
{
  "scripts": {
    "dev:frontend": "pnpm --filter @nicenote/tokens build && tsx scripts/generate-css.ts && vite",
    "build:frontend": "pnpm --filter @nicenote/tokens build && tsx scripts/generate-css.ts && tsc --noEmit && vite build",
    "generate:css": "pnpm --filter @nicenote/tokens build && tsx scripts/generate-css.ts",
    "tauri:dev": "cargo tauri dev",
    "tauri:build": "cargo tauri build"
  }
}
```

---

## 8. 实施阶段

### Phase 0：清理（0.5天）

1. 删除 `apps/desktop/` 下所有 Go 文件和 Wails3 构建产物（见第 2 节清单）
2. 更新 `pnpm-workspace.yaml`，确保 `apps/desktop/frontend` 条目正确
3. 更新 `CLAUDE.md` 和 `memory/MEMORY.md` 中 desktop 相关描述

### Phase 1：Tauri 脚手架 + 基础 IPC（1天）

1. 在 `apps/desktop/src-tauri/` 初始化 Tauri v2 项目（`cargo tauri init`）
2. 实现 `db/` 模块：rusqlite 初始化 + 4张缓存表 migration
3. 实现 `commands/cache.rs`：recent_folders, settings, tag_colors, favorites 的 CRUD
4. 前端替换 binding 文件（`tauri.ts`），更新 `useDesktopStore.ts` 的 import
5. **验证节点**：`cargo tauri dev` 启动，前端能调用 `get_settings`、`get_recent_folders`

### Phase 2：文件系统核心（1.5天）

1. 实现 `services/frontmatter.rs`（对应 Go `frontmatter.go`，含单元测试）
2. 实现 `services/note_io.rs`（list, read, save, create, rename, delete）
3. 实现 `commands/note.rs` 注册所有笔记 commands
4. 实现 `commands/folder.rs`（folder_dialog, folder_tree, reveal_in_explorer）
5. **验证节点**：前端能打开文件夹、加载笔记列表、创建/保存/删除笔记

### Phase 3：搜索 + 文件监听（1天）

1. 实现 `services/search_engine.rs`（目录扫描式全文搜索）
2. 实现 `commands/watcher.rs`（notify crate + Tauri emit）
3. 新建 `frontend/src/hooks/useTauriEvents.ts`，更新 `App.tsx`
4. **验证节点**：Cmd+K 搜索可用，外部修改 .md 文件后前端自动刷新

### Phase 4：打磨与构建（0.5天）

1. `cargo tauri icon` 生成各平台图标资源
2. 配置 `tauri.conf.json` bundle 选项（installer、updater 预留）
3. 测试 Windows（amd64）和 macOS（arm64）双平台构建
4. 更新 `CLAUDE.md` 命令文档

---

## 9. 潜在风险与应对

| 风险                                      | 概率/影响 | 应对                                                                                     |
| ----------------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| **Rust 学习曲线**                         | 中/低     | 业务逻辑简单（文件 I/O + SQLite），无复杂 async 链；参考 tauri-apps/tauri 官方示例       |
| **frontmatter 解析兼容性**                | 低/中     | 有现成 Go 测试用例作为参照，用相同测试数据验证 Rust 实现                                 |
| **notify crate 在 Windows 上的 debounce** | 中/低     | 使用 `notify-debouncer-mini` 包装，避免写操作重复触发                                    |
| **Tauri capabilities 权限配置繁琐**       | 低/低     | 直接参考 tauri-apps 官方 template，逐条开启需要的权限即可                                |
| **monorepo 中 Cargo workspace 集成**      | 低/低     | `apps/desktop/src-tauri/` 作为独立 Cargo workspace，不与其他 Rust 项目共享，避免依赖冲突 |

---

## 10. 不变的内容（复用清单）

以下内容**完全不需要修改**，可直接复用：

- `frontend/src/components/` — 所有 React UI 组件
- `frontend/src/store/useDesktopStore.ts` — 全部 state 和 action 逻辑（仅改 import 路径）
- `frontend/src/App.tsx` — 仅改一行 hook 名称
- `frontend/scripts/generate-css.ts` — CSS token 生成
- `frontend/vite.config.ts` — Vite 配置（微调 devServer port 即可）
- `packages/editor`, `packages/ui`, `packages/tokens`, `packages/shared` — 完全复用
- 设计 token 和主题系统
