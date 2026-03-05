# NiceNote 架构审查与优化方案

> 审查时间：2026-03-06
> 审查范围：全仓库（web / desktop / mobile / packages）

---

## 一、架构现状评估

### 已验证基线

- `pnpm typecheck` 通过
- `pnpm test` 通过
- `pnpm lint:cycles` 无循环依赖（覆盖已纳入脚本的包）

### 优点

| 维度             | 说明                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Monorepo 结构    | `packages/` 按能力边界拆包，`apps/` 按平台隔离，依赖方向单向                                   |
| 跨平台策略       | Web + Mobile + Desktop 三端共享 `editor`/`ui`/`tokens`/`shared`                                |
| Design Tokens    | `packages/tokens` → CSS variables，Web/Desktop 消费同一产物（`index.css`）                     |
| TypeScript 基线  | `tsconfig.base.json` strict 模式，约束较强                                                     |
| Desktop 后端分层 | `commands / services / db` 边界清晰（`src-tauri/src/lib.rs`）                                  |
| Desktop IPC 封装 | `AppService` 统一封装所有 `invoke` 调用，前端不直接使用裸 IPC                                  |
| Desktop 数据模型 | 文件系统（`.md`）为数据源，SQLite 仅作缓存，无 vendor lock-in                                  |
| Rust 细节        | WAL + NORMAL synchronous，debounced 文件监听，UTF-8 字符边界对齐的摘要截取                     |
| Native DB        | FTS5 虚拟表 + trigger 自动同步，migration runner 完整（`packages/database/src/migrations.ts`） |

### 缺点与风险

| 优先级  | 问题                                                                                                  | 位置                                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 🔴 安全 | `dangerouslySetInnerHTML` 渲染未转义的搜索 snippet，存在 XSS 风险                                     | `apps/web/src/components/SearchDialog.tsx:156`<br>`apps/desktop/frontend/src/components/SearchDialog.tsx:283` |
| 🔴 功能 | `file:created` 事件后端从不发出（`notify-debouncer-mini` 无法区分创建与修改），外部新建文件无法被发现 | `apps/desktop/src-tauri/src/commands/watcher.rs:41`                                                           |
| 🔴 工程 | `vitest.workspace.ts` 引用不存在的 `apps/api`，CI 静默跳过或报错                                      | `vitest.workspace.ts:3`                                                                                       |
| 🟠 架构 | 跨端数据模型分叉：Web 用 localStorage，Desktop 用文件系统，Mobile 仍为骨架                            | `apps/web/src/store/useNoteStore.ts`                                                                          |
| 🟠 架构 | 共享契约 `NoteContractService` 等只定义类型、无实现，是死代码                                         | `packages/shared/src/index.ts`                                                                                |
| 🟠 架构 | Desktop store 是 469 行上帝对象，职责混合                                                             | `apps/desktop/frontend/src/store/useDesktopStore.ts`                                                          |
| 🟠 性能 | 全量搜索无索引：Desktop 每次 WalkDir 遍历全部 `.md`，Web 线性扫描全部 notes                           | `services/search_engine.rs:28`<br>`apps/web/src/store/useNoteStore.ts:60`                                     |
| 🟠 性能 | 每次保存后调用 `loadNotes()` 全量刷新列表                                                             | `useDesktopStore.ts:223`                                                                                      |
| 🟡 工程 | Tiptap 版本分叉：`packages/editor` 用 v3，`packages/editor-bridge` 仍用 v2                            | `packages/editor/package.json`<br>`packages/editor-bridge/package.json`                                       |
| 🟡 工程 | `generate-css.ts` 完全相同的两份脚本                                                                  | `apps/web/scripts/generate-css.ts`<br>`apps/desktop/frontend/scripts/generate-css.ts`                         |
| 🟡 工程 | CI path filter 未覆盖 desktop/mobile/store/database 的 typecheck                                      | `.github/workflows/ci-cd.yml`                                                                                 |
| 🟡 工程 | Wails 遗留调用/注释残留于 desktop 前端                                                                | `apps/desktop/frontend/src/components/NoteList.tsx`                                                           |
| 🟡 工程 | 未完成模块进入主干：`op-sqlite.ts` adapter 未实现，`ui-native/tokens.ts` 映射未完成                   | `packages/database/src/op-sqlite.ts`<br>`packages/ui-native/src/tokens.ts`                                    |
| 🟡 逻辑 | Settings 双存储（SQLite + localStorage），两源可能不同步                                              | `useDesktopStore.ts:346`                                                                                      |
| 🟡 逻辑 | Rename race condition：debounce 闭包捕获旧 `activeNote.path`                                          | `useDesktopStore.ts:243`                                                                                      |
| 🟡 UX   | 所有 async action 错误仅 `console.error`，无用户可见错误状态                                          | 全 store                                                                                                      |

---

## 二、目标架构

### 核心思路：以 `@nicenote/domain` 收敛三端

```
┌─────────────────────────────────────────────────────────────────────┐
│                       @nicenote/domain  (NEW)                        │
│  interface NoteRepository  interface SearchIndex  interface Settings  │
│  UseCase: CreateNote  LoadNotes  SaveNote  Search  ...               │
└──────────────────┬──────────────────────────────────────────────────┘
                   │ implements
       ┌───────────┼───────────────┬──────────────┐
       ▼           ▼               ▼              ▼
  LocalStorage  FileSystem      SQLite(Mobile)  (Future: Cloud)
  Adapter(Web)  Adapter(Desktop) Adapter        Adapter
```

### 包职责重划分

```
packages/
  domain/        ← NEW：Repository 接口 + UseCase（纯 TS，无 IO）
  shared/        ← 保留：工具函数 + Zod schema（清理废弃 ContractService）
  editor/        ← 保留（已 Tiptap v3）
  editor-bridge/ ← 升级至 Tiptap v3，与 editor 对齐
  ui/            ← 保留
  ui-native/     ← 保留（补完 tokens 映射）
  tokens/        ← 保留（generate-css 脚本迁入此包）
  database/      ← 保留（native SQLite adapter 实现 domain Repository）
  store/         ← 重构为实现 domain Repository 的 native adapter

apps/
  web/           ← LocalStorageNoteRepository 实现 + domain UseCase
  desktop/       ← TauriNoteRepository（IPC → Rust）+ store 切片化
  mobile/        ← SQLiteNoteRepository（@nicenote/store）+ domain UseCase
```

---

## 三、优化方案（分阶段）

### Phase 1 — 安全与质量门禁（优先，无破坏性）

#### 1.1 修复 XSS：搜索高亮改为安全渲染

**改动：**

- Rust `search_engine.rs`：返回 `match_start: usize` + `match_len: usize`，不再生成 HTML `<mark>` 标签
- Web `useNoteStore.ts` `searchNotes`：同样只返回 `matchStart: number`
- 两端 `SearchDialog.tsx`：删除 `dangerouslySetInnerHTML`，改用 `<HighlightText>` 组件纯 React 渲染高亮

```ts
// packages/shared/src/highlight.tsx（新增）
export function HighlightText({ text, matchStart, matchLen }: HighlightProps) {
  if (matchStart < 0 || matchLen === 0) return <span>{text}</span>
  return (
    <>
      {text.slice(0, matchStart)}
      <mark>{text.slice(matchStart, matchStart + matchLen)}</mark>
      {text.slice(matchStart + matchLen)}
    </>
  )
}
```

#### 1.2 修复 file:created 事件

**改动：** 用完整 `notify` crate 替换 `notify-debouncer-mini`，手动实现 debounce，区分 `EventKind::Create` / `Modify` / `Remove`：

```rust
// watcher.rs 改用 notify::RecommendedWatcher + channel + tokio debounce
// 按 EventKind 分别 emit "file:created" / "file:modified" / "file:deleted"
```

#### 1.3 清理 vitest workspace 幽灵引用

```ts
// vitest.workspace.ts
export default defineWorkspace(['packages/editor', 'packages/shared', 'apps/web'])
// 删除不存在的 'apps/api'
```

#### 1.4 扩大 CI typecheck 覆盖

```yaml
# ci-cd.yml 新增步骤
- run: pnpm --filter @nicenote/store typecheck
- run: pnpm --filter @nicenote/database typecheck
- run: pnpm --filter @nicenote/ui-native typecheck
- run: cd apps/desktop && cargo check # Rust 静态检查
```

---

### Phase 2 — 跨端数据收敛（核心架构改造）

#### 2.1 引入 `@nicenote/domain` 包

```ts
// packages/domain/src/note-repository.ts
export interface NoteRepository {
  list(query: NoteListQuery): Promise<NoteListResult>
  get(id: string): Promise<NoteSelect | null>
  create(input: NoteCreateInput): Promise<NoteSelect>
  update(id: string, input: NoteUpdateInput): Promise<NoteSelect>
  delete(id: string): Promise<void>
  search(query: NoteSearchQuery): Promise<NoteSearchResult[]>
}

// packages/domain/src/use-cases/save-note.ts
export function createSaveNoteUseCase(repo: NoteRepository) {
  return async (id: string, input: NoteUpdateInput) => {
    // 验证、title 截断等业务规则
    return repo.update(id, input)
  }
}
```

#### 2.2 各端 Adapter 实现

| 端          | Repository 实现                                  | 存储介质                                |
| ----------- | ------------------------------------------------ | --------------------------------------- |
| **Web**     | `LocalStorageNoteRepository`                     | localStorage（短期）→ IndexedDB（中期） |
| **Desktop** | `TauriNoteRepository`（调用 `AppService` IPC）   | 文件系统 `.md` + Rust 后端              |
| **Mobile**  | `SQLiteNoteRepository`（`@nicenote/store` 重构） | op-sqlite FTS5                          |

#### 2.3 清理 shared 废弃契约

删除 `NoteContractService`、`FolderContractService`、`TagContractService`，其语义由 `@nicenote/domain` 的 Repository 接口承接。

---

### Phase 3 — 技术债清理

#### 3.1 合并重复 generate-css.ts

将脚本迁入 `packages/tokens/scripts/generate-css.ts`，作为 tokens 包 build 步骤的一部分，两个 app 直接消费产物，删除各自的副本。

#### 3.2 Tiptap 版本统一至 v3

升级 `packages/editor-bridge` 的 Tiptap 依赖至 v3，对齐 `packages/editor`，消除双版本并行。

#### 3.3 Desktop store 切片化

将 `useDesktopStore.ts`（469 行）拆分为：

```
apps/desktop/frontend/src/store/
  slices/
    noteSlice.ts      # notes, activeNote, isLoading + CRUD
    searchSlice.ts    # searchOpen, query, results, isSearching
    settingsSlice.ts  # settings, tagColors, theme/lang 应用
    folderSlice.ts    # currentFolder, recentFolders, openFolder
    watcherSlice.ts   # handleFileCreated/Modified/Deleted
  index.ts            # combine + export selectors
```

#### 3.4 清理 Wails 遗留

审查 `apps/desktop/frontend/src/` 所有文件，删除 `Call.ByID`、旧 binding import、Wails 相关注释。

#### 3.5 补完或删除未完成模块骨架

- `packages/database/src/op-sqlite.ts`：补完 SQLite adapter 或删除空文件
- `packages/ui-native/src/tokens.ts`：补完 RN 侧 design token 映射或删除

#### 3.6 搜索加内存索引（Desktop）

在 `file:created/modified/deleted` 事件触发时增量更新内存中的搜索索引（`HashMap<PathBuf, IndexEntry>`），搜索时查索引而非每次 WalkDir，显著改善大量笔记时的搜索性能。

---

## 四、执行优先级矩阵

```
              低成本                         高成本
          ┌─────────────────────────┬─────────────────────────┐
高收益    │ 1.1 XSS 修复             │ 2.1 domain 包引入        │
          │ 1.2 file:created 修复    │ 2.2 各端 adapter 统一    │
          │ 1.3 vitest 清理          │ 3.2 Tiptap v3 统一       │
          ├─────────────────────────┼─────────────────────────┤
低收益    │ 1.4 CI 覆盖扩大          │ （暂缓）                  │
          │ 3.3 store 切片化         │                         │
          │ 3.1 generate-css 合并    │                         │
          │ 3.4 Wails 清理           │                         │
          │ 3.5 骨架清理             │                         │
          │ 3.6 搜索内存索引         │                         │
          └─────────────────────────┴─────────────────────────┘
```

**建议执行顺序：**

1. **Phase 1**（1-2 天）：安全与质量门禁，全部可独立完成，无破坏性
2. **Phase 3.3/3.4**（1 天）：store 切片化 + Wails 遗留清理
3. **Phase 2**（1-2 周，分批）：domain 包 → Web adapter → Mobile adapter
4. **Phase 3.1/3.2/3.5/3.6**（按需）：工程化收尾
