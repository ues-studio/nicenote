# Nicenote 项目深度扫描报告

---

## CRITICAL — 数据丢失风险

### 1. 自动保存管道存在静默数据丢失 bug

**位置**: `apps/web/src/hooks/useDebouncedNoteSave.ts:63-74`

当一个 save 请求正在进行时（`pending.saving = true`），新的编辑内容会积累到 `pending.updates` 中。但 save 完成后，代码在第 64 行将 `updates` 清空为 `{}`，然后在第 70 行检查 `Object.keys(current.updates).length === 0` 后删除 entry — 在 save 期间积累的新更新会被静默丢弃，`debouncedSave` 不会被重新触发。高频编辑 + 网络延迟时会丢数据。

### 2. cleanup effect 依赖数组错误导致频繁 flush

**位置**: `apps/web/src/hooks/useDebouncedNoteSave.ts:128`

`useEffect` 的依赖是 `[saveNote]`，但 `saveNote` 在每次 `App` 渲染时都会生成新引用，导致 cleanup 不断重新执行、频繁 flush pending saves。应改为 `[]`。

---

## HIGH — 安全 / 核心功能问题

### 3. CORS 返回空字符串而非 `null`

**位置**: `apps/api/src/index.ts:24`

不允许的 origin 返回 `''`，部分浏览器可能接受为通配符等价。应返回 `null`。

### 4. CI 从不运行测试

**位置**: `.github/workflows/ci-cd.yml:13-41`

`quality` job 只跑 lint/typecheck/build，无 `pnpm test`。monorepo 中存在 vitest 测试文件但从未在 CI 中执行。

### 5. CI 无 PR 触发

**位置**: `.github/workflows/ci-cd.yml:3-11`

只在 push to main 时运行，无法在合并前拦截问题。应添加 `pull_request` 触发器。

### 6. CI 部署前不跑数据库迁移

**位置**: `.github/workflows/ci-cd.yml` deploy-api job

`deploy-api` 只执行 `wrangler deploy`，从不运行 `db:migrate:prod`。schema 变更后代码和数据库会不同步。

### 7. 无 React Error Boundary

**位置**: `apps/web/src/main.tsx`

Tiptap/ProseMirror 渲染异常会导致整个 app 白屏，无任何用户反馈。应在 `<App />` 外层包裹 Error Boundary。

### 8. `updated_at` 列无索引

**位置**: `apps/api/src/db/schema.ts`

列表查询按 `updatedAt` 排序 + 游标分页，但该列无索引，随数据增长将全表扫描。

### 9. 嵌套交互元素

**位置**: `apps/web/src/components/NotesSidebar.tsx:56-76`

`<button>` 内嵌套 `div[role=button]`，违反 HTML 规范，破坏键盘导航和屏幕阅读器。

### 10. `focus:ring-0` 移除焦点指示器

**位置**: `NoteEditorPane.tsx:54`, `NotesSidebar.tsx:143,161`, `ThemeToggle.tsx:13`

多处交互元素无键盘焦点可见性，WCAG 2.4.7 违规。

### 11. 暗色模式 `primaryText` 对比度不足

**位置**: `packages/tokens/src/colors.ts:152`, `apps/web/src/index.css:163`

暗色模式 `primaryText` 为 `gray[700]` (`#374151`)，在深色背景 (`#111827`) 上对比度极低。

### 12. 暗色模式 `muted === background`

**位置**: `packages/tokens/src/colors.ts:163-164`, `apps/web/src/index.css:181`

`--color-muted` 和 `--color-background` 在暗色模式下完全相同 (`#111827`)，骨架屏加载动画不可见。

### 13. Toolbar 拦截 Tab 键造成焦点陷阱

**位置**: `packages/ui/src/components/toolbar/toolbar.tsx:63-68`

违反 WAI-ARIA toolbar 模式（Tab 应移出工具栏，箭头键在内部导航），键盘用户无法 Tab 离开工具栏。

### 14. `packages/ui` 类型/代码 exports 不一致

**位置**: `packages/ui/package.json:19-24`

`types` 指向 `dist/index.d.ts`（需构建），但 `import`/`default` 指向 `src/index.ts`。fresh clone 时 TS 找不到类型。

### 15. `dev` 脚本不预构建 tokens

**位置**: `apps/web/package.json`

`build` 脚本会先构建 tokens，但 `dev` 脚本只是 `vite`。cold start 时 `pnpm dev` 会因 `packages/tokens/dist/` 不存在而失败。

### 16. CORS 测试断言错误

**位置**: `apps/api/src/index.test.ts:15`

测试断言 `access-control-allow-origin` 为 `*`，但实际 CORS 配置为白名单模式。测试掩盖了真实行为。

---

## MEDIUM — 性能 / 可靠性 / DX 问题

### 17. Store 无 error 状态

**位置**: `apps/web/src/store/useNoteStore.ts`

网络失败时 `notes` 为空，`isLoading` 为 false，UI 显示 "No notes found" 而非错误提示。应增加 `error` 字段。

### 18. `isLoading` 被 fetch 和 create 共用

**位置**: `useNoteStore.ts:81,104`

单一 `isLoading` flag 同时服务于 `fetchNotes` 和 `createNote`，两者互相干扰，状态可能不正确。

### 19. `updateNoteLocal` 两次 `new Date()` 造成时间偏差

**位置**: `useNoteStore.ts:111,115`

同一笔记在 `notes[]` 和 `currentNote` 的 `updatedAt` 因两次独立调用 `new Date().toISOString()` 而产生毫秒级偏差，可能导致排序不一致。

### 20. `onError` 吞掉堆栈信息

**位置**: `apps/api/src/index.ts:34`

仅 `console.error(err.message)`，丢失 stack trace。应改为 `console.error(err)` 或 `console.error(err.stack)`。

### 21. `remove` 做两次查询

**位置**: `apps/api/src/services/note-service.ts:74-78`

先 SELECT 判断存在再 DELETE，存在 TOCTOU 竞态且双倍延迟。应改为 `DELETE ... RETURNING id` 单次查询。

### 22. 列表接口返回完整 `content`

**位置**: `apps/api/src/services/note-service.ts:34`

`db.select()` 无参数获取所有列。sidebar 只需 id/title/updatedAt，大量 content 字段浪费带宽和内存。

### 23. 无 Zod `max()` 约束

**位置**: `packages/shared/src/schemas.ts`

`title` 和 `content` 字段无长度限制，客户端可发送任意大 payload。

### 24. 无速率限制

**位置**: `apps/api/src/index.ts`

所有端点无请求频率限制，存在资源耗尽/成本放大攻击风险。

### 25. `filteredNotes` 在每次本地编辑时重新排序

**位置**: `apps/web/src/components/NotesSidebar.tsx:126-135`

`notes` 在每次 `updateNoteLocal` 后生成新引用，触发 `useMemo` 重新计算 sort + filter。每次按键都会排序整个列表。

### 26. 无 lazy loading

**位置**: `apps/web/src/App.tsx`

Tiptap 编辑器（含 ProseMirror）始终加载。应使用 `React.lazy` + `Suspense` 延迟加载 `NoteEditorPane`。

### 27. Toast `setTimeout` 未在手动关闭时清除

**位置**: `apps/web/src/store/useToastStore.ts:22-24`

手动关闭 toast 后 5s 定时器仍会触发，尝试移除已不存在的 toast。

### 28. `useTheme` 在两个组件中独立调用

**位置**: `apps/web/src/components/ThemeToggle.tsx:7`, `apps/web/src/App.tsx:12`

两个独立 hook 实例各自管理 DOM 突变和 localStorage，状态不共享。应统一为 Zustand store 或 Context。

### 29. 移动端 sidebar 不阻止下层交互

**位置**: `apps/web/src/App.tsx:32`, `NotesSidebar.tsx:149`

sidebar overlay 打开时，底层编辑器仍可交互。应添加 `inert`、`aria-hidden` 或 pointer-events 阻止。

### 30. 无保存状态指示器

**位置**: `apps/web/src/hooks/useDebouncedNoteSave.ts`

用户无法得知内容是否已保存。应在 UI 中显示 "Saving..." / "Saved" 状态。

### 31. 删除无撤销

**位置**: `apps/web/src/components/NotesSidebar.tsx`

确认后立即永久删除，无 undo toast 或 grace period。结合自动保存机制，误操作风险高。

### 32. tsconfig 不统一

**位置**: `packages/editor/tsconfig.json`, `packages/shared/tsconfig.json`, `packages/ui/tsconfig.json`

三个 packages 不继承 `tsconfig.base.json`，`target` 在 ES2020/ES2022/ES2023/ESNext 间不一致，存在配置漂移风险。

### 33. `packages/tokens` 缺少 `composite: true`

**位置**: `packages/tokens/tsconfig.json`

导致 `tsc -b` 从 root 构建时无法正确追踪 tokens 项目。

### 34. `@types/node@24` vs CI 运行 Node 20

**位置**: `apps/api/package.json`, `apps/web/package.json`, `.github/workflows/ci-cd.yml:28`

类型可能包含 Node 24 API，CI 用 Node 20 运行，类型和运行时不匹配。

### 35. GitHub Actions 未 pin 到 SHA

**位置**: `.github/workflows/ci-cd.yml`

使用 `@v4` 浮动 tag 而非 commit SHA，存在供应链攻击风险。

### 36. `VITE_API_URL` 未设置时不报错

**位置**: `.github/workflows/ci-cd.yml:95`

`vars.VITE_API_URL` 未配置时构建产物会静默请求空 URL，前端功能全部失效。

### 37. `/health` 路由不存在但 logger 跳过它

**位置**: `apps/api/src/index.ts:11-13`

logger 中间件跳过 `/health` 路径，但该路由从未注册。死代码。

### 38. 编辑器 source mode `<textarea>` 无 `aria-label`

**位置**: `packages/editor/src/web/editor-content.tsx:21`

无 `id`、无 `aria-label`、无 `<label>` 元素。`placeholder` 不是 label 的替代品。

### 39. `dist/` 中有已删除组件的残留声明文件

**位置**: `packages/ui/dist/`

Badge、Card、Spacer 等已从源码中删除，但 `dist/` 中的 `.d.ts` 仍然存在，可能导致消费者引入已删除的类型。

---

## LOW — 代码质量 / 小优化

### 40. handler 缺 `useCallback`

**位置**: `apps/web/src/components/NoteEditorPane.tsx:28-38`

`handleTitleChange` 和 `handleContentChange` 每次渲染重新创建，传入 Tiptap 编辑器组件可能导致不必要重渲染。

### 41. `formatDistanceToNow` 每次按键重新计算

**位置**: `apps/web/src/components/NoteEditorPane.tsx:62`

编辑器每次按键触发 `currentNote` 引用变化，timestamp 字符串被不必要地重新计算。应包裹 `useMemo`。

### 42. `hono` 应为 web 的 `devDependency`

**位置**: `apps/web/package.json:11`

Vite 构建时打包所有依赖，`hono` 作为 runtime dependency 无意义。

### 43. `lucide-react` / `@floating-ui/react` 应为 `peerDependency`

**位置**: `packages/editor/package.json`, `packages/ui/package.json`

作为 `dependency` 可能导致 bundle 中出现重复代码。

### 44. `eslint-plugin-tailwindcss` pin 到 beta 版本

**位置**: `package.json:13`

`4.0.0-beta.0` 是 beta 版，可能有 breaking changes 或对 TailwindCSS v4 支持不完善。

### 45. `borderRadius` tokens 缺少 md/lg/xl

**位置**: `packages/tokens/src/borderRadius.ts`

仅有 `xs` (4) 和 `sm` (8)，但 UI 组件使用 `rounded-lg`/`rounded-md`/`rounded-xl`，未受 token 系统管控。

### 46. 暗色模式无 shadow tokens

**位置**: `packages/tokens/src/shadows.ts`

shadow 值使用 `rgba(0,0,0,0.1)` 固定值，暗色模式下阴影几乎不可见。应提供 dark 变体。

### 47. CLAUDE.md 记录了不存在的 shared 工具函数

**位置**: `CLAUDE.md`, `packages/shared/src/index.ts`

文档提到 `toCamelCase`、`sleep`、`deepClone`、storage adapters、request wrapper 等，但源码中不存在。

### 48. `TooltipTrigger` fallback `<button>` 缺 `type="button"`

**位置**: `packages/ui/src/components/tooltip/tooltip.tsx:182`

在 `<form>` 内会默认为 `type="submit"`，可能意外提交表单。

### 49. Turborepo `test` 和 `deploy` task 缺 `cache: false`

**位置**: `turbo.json`

`test` 可能被错误缓存导致跳过测试，`deploy` 可能被缓存导致跳过部署。

### 50. `wrangler.jsonc` 硬编码 D1 database UUID

**位置**: `apps/api/wrangler.jsonc:10`

生产 D1 数据库 UUID 提交到代码仓库，虽非凭证但不符合最佳实践。

---

## 建议优先级

1. **立即修复**: #1-2 (数据丢失 bug), #3 (CORS), #7 (Error Boundary)
2. **尽快处理**: #4-6 (CI 完善), #8 (数据库索引), #11-12 (暗色模式可见性), #14-15 (DX cold start)
3. **迭代优化**: #17-18 (store 错误/loading 状态), #22 (列表 API 瘦身), #26 (lazy loading), #30-31 (保存状态 + 删除撤销)
4. **技术债清理**: tsconfig 统一、依赖分类修正、a11y 改善、tokens 补全
