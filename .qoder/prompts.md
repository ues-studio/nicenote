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
现在在 `apps/web` 中集成 Tiptap 编辑器，但我希望这是一个 **Markdown 优先** 的编辑器。

1. 安装依赖：
   - 安装 `@tiptap/react`, `@tiptap/starter-kit`。
   - 重点：安装 `tiptap-markdown` 库，我们需要用它来将编辑器内容转换为 Markdown 字符串。

2. 创建 `Editor` 组件：
   - 接收 props: `initialContent` (string 类型，Markdown 格式) 和 `onChange` (function)。
   - 配置 Tiptap：
     - 使用 `StarterKit`。
     - 注册 `Markdown` 扩展 (来自 tiptap-markdown)。
   - **关键逻辑**：
     - 初始化时：将传入的 Markdown 字符串渲染为富文本。
     - `onUpdate` 时：使用 `editor.storage.markdown.getMarkdown()` 获取当前的 Markdown 字符串，而不是 JSON。

3. 样式与体验：
   - 使用 Tailwind 的 `@tailwindcss/typography` 插件。
   - 给编辑器容器添加 `prose prose-slate max-w-none` 类名，让 Markdown 渲染出的样式更美观（类似 Notion）。
   - 去除默认的聚焦边框 (`outline-none`)。
   - 确保 Markdown 快捷键可用（例如输入 `# ` 变标题，`> ` 变引用，`- ` 变列表）。

4. 集成到状态管理：
   - 修改 Zustand 的 `updateNote` 逻辑，确保传递给后端的是 Markdown 字符串。
   - 包含防抖 (Debounce) 逻辑：用户打字时不立即请求 API，停止输入 500ms-1s 后再触发保存。

## 阶段 5: 交互优化 (Vibe Polish)
让我们给 NiceNote 增加一些针对 Markdown 优化的 Vibe。

1. Markdown 专属扩展增强：
   - 安装并配置 `@tiptap/extension-task-list` 和 `@tiptap/extension-task-item`，实现 `- [ ]` 任务列表的交互体验。
   - 安装 `lowlight` (common) 和 `@tiptap/extension-code-block-lowlight`，实现代码块的语法高亮（Syntax Highlighting）。
   - 确保这些扩展的内容能正确被 `tiptap-markdown` 序列化和反序列化。

2. 交互菜单 (Menu)：
   - 添加 `@tiptap/extension-bubble-menu`。
   - 当选中文字时，显示气泡菜单（提供 Bold, Italic, Code, Link 按钮）。
   - *可选*：添加 `@tiptap/extension-floating-menu`，在空行左侧显示“+”号，用于快速插入标题、代码块或任务列表。

3. UI 细节打磨：
   - **Sidebar**：当前选中的笔记要有明显的背景高亮 (Active State)。
   - **Loading**：添加骨架屏 (Skeleton) 效果，当笔记列表或详情正在加载时显示。
   - **排序**：在 Sidebar 中，确保笔记按 `updated_at` 倒序排列（最近编辑的在最上面）。
   - **日期格式化**：使用 `date-fns` 将时间戳格式化为友好格式 (如 "Just now", "2 hours ago")。

## 阶段 6: 部署准备 (Cloudflare)
应用已经开发完成，现在准备部署到 Cloudflare。

1. 请检查根目录的 package.json，帮我编写一个 `deploy` script，能够同时构建 web 和 api。
2. 对于 `apps/web`，配置为 Cloudflare Pages 部署。
3. 对于 `apps/api`，配置为 Cloudflare Workers 部署。
4. 告诉我如何处理 CORS 问题，确保前端 Pages 能访问后端 Workers。