# Nicenote 项目优化方案

基于 [code_review.md](file:///Users/afu/Dev/nicenote/.docs/code_review.md) 的 5 项建议，制定分阶段、可独立交付的优化方案。每个阶段可单独落地，互不阻塞。

---

## Phase 1：后端统一错误处理（低风险，高收益）

> 消除 `routes.ts` 中重复的 locale + JSON 错误响应样板代码

### 涉及文件

#### [NEW] [app-error.ts](file:///Users/afu/Dev/nicenote/apps/api/src/app-error.ts)

创建自定义错误类：

```typescript
import type { StatusCode } from 'hono/utils/http-status'
import type { ApiMessageKey } from './i18n'

export class AppError extends Error {
  constructor(
    public readonly messageKey: ApiMessageKey,
    public readonly status: StatusCode = 500
  ) {
    super(messageKey)
  }
}
```

#### [MODIFY] [routes.ts](file:///Users/afu/Dev/nicenote/apps/api/src/routes.ts)

将手写的 `if (!result) { ... return c.json(...) }` 替换为 `throw new AppError('notFound', 404)`，每处约减 3 行。

```diff
-if (!result) {
-  const locale = resolveLocale(c.req.header('accept-language'))
-  return c.json({ error: t('notFound', locale) }, 404)
-}
+if (!result) throw new AppError('notFound', 404)
```

#### [MODIFY] [index.ts](file:///Users/afu/Dev/nicenote/apps/api/src/index.ts)

增强 `app.onError` 以识别 `AppError`：

```diff
 app.onError((err, c) => {
+  const locale = resolveLocale(c.req.header('accept-language'))
+  if (err instanceof AppError) {
+    return c.json({ error: t(err.messageKey, locale) }, err.status)
+  }
   console.error(err)
-  const locale = resolveLocale(c.req.header('accept-language'))
   return c.json({ error: t('internalServerError', locale) }, 500)
 })
```

#### [MODIFY] [i18n.ts](file:///Users/afu/Dev/nicenote/apps/api/src/i18n.ts)

扩展 `ApiMessageKey` 联合类型，为未来新增的业务错误（如 `'validationError'`）预留入口。当前无需立即修改，但接口设计已留好扩展口。

### 验证计划

- 运行现有测试：`pnpm --filter api test`
  - [routes.test.ts](file:///Users/afu/Dev/nicenote/apps/api/src/routes.test.ts) 已覆盖 404 场景，重构后应全部通过
  - [index.test.ts](file:///Users/afu/Dev/nicenote/apps/api/src/index.test.ts) 覆盖 CORS 逻辑，应不受影响
- 新增测试：在 `routes.test.ts` 中增加用例验证 `AppError` 被全局中间件正确捕获并返回带 i18n 的 JSON

---

## Phase 2：内存限流替换为平台级限流（低风险）

> 移除无效的内存 Map 限流中间件，改用 Cloudflare 平台方案

### 涉及文件

#### [MODIFY] [index.ts](file:///Users/afu/Dev/nicenote/apps/api/src/index.ts)

- 删除整个 `rateLimitMap` 中间件（约 35 行）
- 删除 CORS 配置中的 `X-RateLimit-*` 暴露头
- 在代码注释中说明限流改为 Cloudflare WAF Rate Limiting Rules

#### [NEW] [.docs/rate-limiting.md](file:///Users/afu/Dev/nicenote/.docs/rate-limiting.md)

创建运维文档，记录 Cloudflare Dashboard 的限流规则配置步骤：

- 路径：`Security → WAF → Rate Limiting Rules`
- 推荐规则：同一 IP 在 60s 内超过 60 次请求 → Challenge / Block
- 覆盖路径：`/notes*`

### 验证计划

- 运行现有测试：`pnpm --filter api test`
  - `index.test.ts` 中无限流相关测试，删除代码不影响现有用例
- 手动验证：本地 `pnpm --filter api dev`，确认 `/health` 和 `/notes` 端点正常响应且无 `X-RateLimit-*` 头

---

## Phase 3：编辑器 Snapshot 性能优化（中等风险）

> 减少光标/选区变化引起的不必要重渲染

### 涉及文件

#### [MODIFY] [editor-shell.tsx](file:///Users/afu/Dev/nicenote/packages/editor/src/web/editor-shell.tsx)

将 `snapshot` 状态从组件顶层 `useState` 下沉到一个独立的 Zustand micro-store 或 React Context，使只有 `MinimalToolbar` 订阅并消费 snapshot：

```diff
-const [snapshot, setSnapshot] = useState<NoteEditorStateSnapshot>(
-  createEmptyEditorStateSnapshot()
-)
+// snapshot 改为 useRef + 仅在 Toolbar 内订阅
+const snapshotRef = useRef<NoteEditorStateSnapshot>(createEmptyEditorStateSnapshot())
```

具体策略有两个可选方案：

| 方案                            | 实现方式                                                                                     | 优点                           | 缺点           |
| ------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------ | -------------- |
| **A: useRef + forceUpdate**     | `snapshotRef.current = ...`，Toolbar 组件内自行 `useSyncExternalStore` 订阅                  | 零依赖，最小改动               | 需手动管理订阅 |
| **B: 独立 Zustand micro-store** | 创建 `createEditorSnapshotStore()`，在 `onUpdate/onSelectionUpdate` 中 `store.setState(...)` | Toolbar 通过 selector 精准订阅 | 新增一个 store |

> [!IMPORTANT]
> 推荐 **方案 B（Zustand micro-store）**，与项目已有模式一致，且 selector 可以做到字段级精准订阅。

### 验证计划

- 运行 editor 包测试：`pnpm --filter @nicenote/editor test`
- 手动验证：在浏览器中打开 DevTools → React Profiler，连续打字和移动光标时观察 `NicenoteEditorContent` 是否不再因 snapshot 变更而重渲染

---

## Phase 4：Tokens 开发热更新 Vite Plugin（低风险）

> 修改 tokens 后自动重新生成 CSS，无需重启 dev server

### 涉及文件

#### [NEW] [vite-plugin-tokens.ts](file:///Users/afu/Dev/nicenote/apps/web/plugins/vite-plugin-tokens.ts)

创建一个简单的 Vite Plugin：

```typescript
import { execSync } from 'node:child_process'
import type { Plugin } from 'vite'

export function tokensHotReload(): Plugin {
  return {
    name: 'nicenote:tokens-hot-reload',
    configureServer(server) {
      server.watcher.add('../../packages/tokens/src')
      server.watcher.on('change', (path) => {
        if (path.includes('packages/tokens/src')) {
          execSync('pnpm --filter @nicenote/tokens build && tsx scripts/generate-css.ts', {
            cwd: server.config.root,
            stdio: 'inherit',
          })
        }
      })
    },
  }
}
```

#### [MODIFY] [vite.config.ts](file:///Users/afu/Dev/nicenote/apps/web/vite.config.ts)

注册新 plugin：

```diff
+import { tokensHotReload } from './plugins/vite-plugin-tokens'

 return {
-  plugins: [react(), tailwindcss()],
+  plugins: [react(), tailwindcss(), tokensHotReload()],
```

### 验证计划

- 启动 dev server：`pnpm --filter web dev`
- 修改 `packages/tokens/src` 下任意 token 值
- 观察终端是否自动执行 `generate-css.ts`，浏览器是否自动热更新样式

---

## Phase 5：状态管理重构（高复杂度，高收益）

> 引入 `@tanstack/react-query`，将 `useNoteStore` 中的服务端状态逻辑迁出

### 涉及文件

#### [MODIFY] [package.json](file:///Users/afu/Dev/nicenote/apps/web/package.json)

新增依赖：`@tanstack/react-query`

#### [NEW] [useNotesQuery.ts](file:///Users/afu/Dev/nicenote/apps/web/src/hooks/useNotesQuery.ts)

使用 `useInfiniteQuery` 封装笔记列表获取和分页：

- Query Key: `['notes']`
- 自动管理 `isFetching`, `hasMore`, `fetchNextPage`
- 替代 `useNoteStore` 中的 `fetchNotes`, `fetchMoreNotes`

#### [NEW] [useNoteDetail.ts](file:///Users/afu/Dev/nicenote/apps/web/src/hooks/useNoteDetail.ts)

使用 `useQuery` + `enabled` 封装单条笔记详情加载：

- Query Key: `['notes', id]`
- 自动处理 abort（React Query 内置），替代手动 `AbortController` + sequence
- 替代 `useNoteStore` 中的 `selectNote`

#### [NEW] [useNoteMutations.ts](file:///Users/afu/Dev/nicenote/apps/web/src/hooks/useNoteMutations.ts)

使用 `useMutation` + `onMutate` / `onError` / `onSettled` 封装 CRUD 操作：

- 乐观更新通过 `queryClient.setQueryData` 实现
- 失败回滚通过 `onError` 中 `queryClient.setQueryData(context.previousData)` 实现
- 替代 `useNoteStore` 中的 `createNote`, `saveNote`, `deleteNote`, `removeNoteOptimistic`, `restoreNote`

#### [MODIFY] [useNoteStore.ts](file:///Users/afu/Dev/nicenote/apps/web/src/store/useNoteStore.ts)

大幅瘦身，仅保留纯客户端状态：

```typescript
interface NoteStore {
  selectedNoteId: string | null
  selectNote: (id: string | null) => void
}
```

> 从约 270 行 → 约 20 行

#### [MODIFY] [main.tsx](file:///Users/afu/Dev/nicenote/apps/web/src/main.tsx)

包裹 `QueryClientProvider`

#### [MODIFY] [App.tsx](file:///Users/afu/Dev/nicenote/apps/web/src/App.tsx)

迁移到使用新的 hooks

### 验证计划

- 运行 API 测试确保后端不受影响：`pnpm --filter api test`
- 运行 Web 测试（如有）：`pnpm --filter web test`
- 手动验证（需要请用户协助）：
  1. 启动 `pnpm dev`
  2. 创建、编辑、删除笔记，验证 CRUD 正常
  3. 在 Network 面板中观察笔记列表接口是否有自动缓存/去重
  4. 快速连续切换笔记，验证无竞态数据残留

---

## 实施优先级与风险矩阵

| 阶段                   | 优先级 | 风险 | 预估工时 | 依赖                      |
| ---------------------- | ------ | ---- | -------- | ------------------------- |
| Phase 1: 统一错误处理  | 🔴 高  | 低   | 1h       | 无                        |
| Phase 2: 限流替换      | 🟡 中  | 低   | 0.5h     | 无                        |
| Phase 3: 编辑器性能    | 🟡 中  | 中   | 2h       | 无                        |
| Phase 4: Tokens 热更新 | 🟢 低  | 低   | 0.5h     | 无                        |
| Phase 5: 状态管理重构  | 🔴 高  | 高   | 4-6h     | 无（但建议 Phase 1 之后） |

> [!TIP]
> 建议按 **Phase 1 → 2 → 4 → 3 → 5** 的顺序执行：先做确定性高、改动小的基础设施优化，最后攻克最大的状态管理重构。
