## 制定计划
我想通过cursor进行vibe coding，使用react +zustand + + typescript + tailwind css + hono + cloudflare，搭建一个前后端分离的notes taking app，应用名叫nicenote，编辑器使用tiptap，使用monorepo管理代码，请帮我制定vibe coding的计划，以及每个步骤的提示词

## 阶段 1: Monorepo 初始化与基础设施
你需要扮演一位资深的全栈架构师。我要做一个名为 "NiceNote" 的笔记应用。
请按照以下要求初始化一个 Monorepo 项目：

1. 使用 pnpm workspace 管理。
2. 包含两个主要目录：
   - `apps/api`: 使用 Hono 框架，配置为 Cloudflare Workers 环境。
   - `apps/web`: 使用 Vite + React + TypeScript。
3. 在 `apps/web` 中配置 Tailwind CSS。
4. 确保根目录有 package.json 能够同时运行前后端。

请一步步告诉我需要运行的终端命令，或者直接帮我生成相关配置文件。

## 阶段 2: 后端核心 & 数据库设计 (Drizzle + D1)
现在我们来处理 `apps/api`。
我需要使用 Cloudflare D1 作为数据库，Drizzle ORM 来管理 Schema。

1. 请帮我安装 drizzle-orm, drizzle-kit 等必要依赖。
2. 创建一个 `schema.ts`，定义 `notes` 表：
   - id: text (primary key, use nanoid or uuid)
   - title: text (default "Untitled")
   - content: text (storage for Tiptap JSON)
   - created_at: integer (timestamp)
   - updated_at: integer (timestamp)
3. 在 Hono 中编写 4 个 API 路由：
   - GET /notes (获取列表)
   - GET /notes/:id (获取详情)
   - POST /notes (创建新笔记)
   - PATCH /notes/:id (自动保存/更新)
   - DELETE /notes/:id
4. 请确保导出 API 的类型定义 (AppType)，以便前端使用 Hono RPC。

## 阶段 3: 前端基础 UI 与 Zustand 状态管理
转到 `apps/web`。我们将使用 shadcn/ui 风格的设计（你可以直接生成类似的 Tailwind 代码，无需安装完整库）。

1. 布局设计：
   - 左侧：Sidebar，显示笔记列表（支持搜索，底部有新建按钮）。
   - 右侧：Main，笔记编辑区域。
2. 状态管理 (Zustand)：
   - 安装 `zustand`。
   - 创建 `useNoteStore`。
   - 需要包含状态：`notes` (列表), `currentNote` (当前选中), `isLoading`。
   - 需要包含动作：`fetchNotes`, `createNote`, `selectNote`, `updateNoteLocal` (乐观更新)。
3. API Client：
   - 使用 `hono/client` 和从 `apps/api` 导入的 `AppType` 创建一个类型安全的 RPC 客户端。
   - 将 RPC 客户端集成到 Zustand 的动作中。

## 阶段 4: 集成 Tiptap 编辑器
现在在 `apps/web` 中集成 Tiptap 编辑器。

1. 安装 `@tiptap/react`, `@tiptap/starter-kit` 以及必要的扩展（如 Placeholder, Typography）。
2. 创建一个 `Editor` 组件：
   - 接收 `content` (JSON) 和 `onChange` 回调。
   - 如果内容为空，显示 Placeholder "Start writing..."。
   - 使用 Tailwind class (`prose prose-slate`) 美化编辑器样式，使其看起来像 Notion，去除默认的 outline。
3. 实现防抖保存 (Debounce Save)：
   - 当用户打字时，只更新 Zustand 的本地状态。
   - 使用 `useDebounce` 或在 Zustand 中实现逻辑，在停止打字 1 秒后调用 API 保存到后端。

## 阶段 5: 交互优化 (Vibe Polish)
让我们给 NiceNote 增加一些 Vibe。

1. Tiptap 增强：
   - 添加 `@tiptap/extension-floating-menu` 和 `@tiptap/extension-bubble-menu`。
   - 当选中文字时，显示 Bubble Menu（加粗、斜体、删除线）。
   - 在新行开始时，显示 Floating Menu（快速插入标题、列表）。
2. UI 细节：
   - 在 Sidebar 中，当前选中的笔记要有明显的背景高亮。
   - 添加 Loading 骨架屏 (Skeleton) 当数据正在加载时。
   - 给笔记列表添加按 update_at 排序的逻辑（最近修改的在最上面）。

## 阶段 6: 部署准备 (Cloudflare)
应用已经开发完成，现在准备部署到 Cloudflare。

1. 请检查根目录的 package.json，帮我编写一个 `deploy` script，能够同时构建 web 和 api。
2. 对于 `apps/web`，配置为 Cloudflare Pages 部署。
3. 对于 `apps/api`，配置为 Cloudflare Workers 部署。
4. 告诉我如何处理 CORS 问题，确保前端 Pages 能访问后端 Workers。