# Nicenote 技术债务与优化方向审计（2026-02-14）

## 审计范围
- Monorepo 全量结构（apps/api, apps/web, packages/*）
- 配置与基础设施（TypeScript / ESLint / Turbo / CI Workflows）
- API / Web / Editor / Contract / Shared 各层代码结构
- 构建链路、类型一致性、可维护性与可扩展性

---

## 结论摘要
当前项目架构总体清晰（contract 驱动类型共享、editor 分层较好），但存在几个高优先级问题：
1. **零测试覆盖**（无 test framework、无测试脚本、无测试文件）
2. **CI 缺少质量门禁**（部署前无 lint/typecheck/test）
3. **`@nicenote/shared` 整包未被业务消费（约 1884 行）**
4. **类型定义重复且不一致**（Note 在 contract/store/shared 三处定义）
5. **部分 UI/主题与编辑器实现存在可维护性与一致性问题**

---

## 优先级分级

### P0（立即处理）

#### 1) 测试体系缺失
- 现状：没有 `*.test.*` / `*.spec.*`（业务代码范围内）
- 风险：重构与上线缺少安全网，回归风险高
- 建议：
  - 引入 Vitest（优先）
  - 首批覆盖：
    - `packages/editor/src/core/*`（commands/serialization/state）
    - `packages/contract/src/*`（schema 与 route 约束）
    - `apps/web/src/store/useNoteStore.ts`
    - `apps/api/src/services/note-service.ts`

#### 2) CI 质量门禁缺失
- 现状：`deploy-api.yml`、`deploy-web.yml` 直接部署，未前置 lint/typecheck/test
- 风险：不合格代码可进入生产
- 建议：
  - 新增 PR workflow：`pnpm lint` + `tsc --noEmit` + `pnpm build` + `pnpm test`
  - 部署 workflow 增加前置校验
  - 细化触发路径，避免 `packages/**` 过宽触发

#### 3) `@nicenote/shared` 整包疑似死代码
- 现状：业务代码几乎不引用该包，体量约 `1884` 行
- 风险：维护成本和认知负担上升，且存在重复能力（request/debounce/storage/validators）
- 建议：
  - 方案 A：整包下线（推荐）
  - 方案 B：只保留被明确消费的最小子集

---

### P1（短期优化）

#### 4) Note 类型重复定义且不一致
- 现状：
  - contract：`NoteSelect`（时间字段 string）
  - store：本地 `Note`（string）
  - shared：`Note`（Date）
- 风险：类型漂移与序列化问题
- 建议：
  - 统一由 contract 输出类型作为单一真相源
  - store 改为直接复用 contract 类型
  - 删除 shared 中冲突类型
- 执行策略（激进，无兼容层）：
  - 一次性移除 store 本地 `Note` 定义，`apps/web` 全量改用 `@nicenote/contract` 类型
  - 删除 `packages/shared/src/types.ts` 及其在 `shared` 入口的类型导出
  - 以 `lint + build + tsc --noEmit` 作为合入门禁，失败即回退本批改动

#### 5) 编辑器链接输入使用 `window.prompt`
- 状态：✅ 已完成（2026-02-14）
- 已实施：
  - 链接输入改为非阻塞 Popover 表单：`packages/editor/src/web/link-toolbar-button.tsx`
  - 链接校验下沉到 core：`packages/editor/src/core/link.ts`
  - 工具栏组件已收敛拆分：`packages/editor/src/web/toolbar.tsx`、`packages/editor/src/web/command-dropdown-menu.tsx`、`packages/editor/src/web/action-toolbar-button.tsx`
- 结果：移除阻塞式输入，提升可测试性与可扩展性（协议/格式校验集中管理）

#### 6) 主题/样式一致性问题
- 状态：✅ 已完成（2026-02-14）
- 已实施：
  - 调整 token：`primaryHover` 与 `secondaryHover` 改为独立层级色值，恢复 hover 反馈（无兼容层）
  - editor 代码块：`pre` 配色移除硬编码，直接改为全局 `--color-active` / `--color-foreground`
  - editor token 收敛：删除 `packages/editor/src/styles/tokens.css` 中间映射层，`editor.css` 直接依赖全局 `--color-*` / `--font-*` 变量
- 结果：hover 交互可感知；editor 浅/深色主题一致；主题色来源收敛且无重复覆盖

---

### P2（中期治理）

#### 7) Token 与样式生成链路重复来源
- 状态：✅ 已完成（2026-02-14）
- 已实施：
  - 删除 `packages/editor/src/styles/tokens.css` 中间映射层，editor 样式直接依赖全局 `--color-*` / `--font-*`
  - `apps/web/tailwind.config.ts` 移除 colors 直连 token 的重复映射，仅保留必要配置
  - border radius 扩展改为引用 CSS 变量（`--radius-sm`），避免与 token 数值双写
- 结果：主题数值单一来源收敛到 `packages/tokens` + `generate-css.ts`，降低配置漂移风险

#### 8) Schema 语义可加强
- 状态：✅ 已完成（2026-02-14）
- 已实施：
  - `noteUpdateSchema` 改为独立定义：`title/content` 可选，但强制至少一个字段存在
  - `createdAt/updatedAt` 从 `z.string()` 收敛为 datetime 约束（ISO8601 with offset）
  - API `update` 写入逻辑收敛为仅更新传入字段 + `updatedAt`，去除 `...body` 扩散
- 结果：update 语义与校验一致，时间字段约束明确，减少空更新/脏写入风险

#### 9) 交互与布局增强点
- sidebar resize 无 touch/pointer 完整支持
- `useMinuteTicker` 在多组件重复创建 interval
- 建议：
  - resize 改 PointerEvent
  - ticker 改全局单例

---

## 发现的低风险问题（可顺手修复）
- `apps/web/index.html` 仍为 Vite 默认 title/favicon
- `THEME_KEY` 在 `useTheme.ts` 与 `index.html` 重复定义
- editor 包存在空目录（`webview-bridge/`, `scripts/`）
- editor 命令集合与 toolbar 暴露不完全一致（部分命令定义未露出）

---

## 建议执行路线

### Phase 1（1-2 天）
- 建立测试基线（Vitest + 首批关键模块）
- 新增 PR 质量门禁 workflow
- 部署前置 lint/typecheck/test
- 处理 `@nicenote/shared`（下线或瘦身）

### Phase 2（1 天）
- 统一 Note 类型来源（contract）
- 替换 editor link prompt 方案
- 修复主题/样式硬编码与 hover token

### Phase 3（1-2 天）
- 收敛 token 生成链路为单一真相源
- schema 语义增强与校验升级
- 交互细节（pointer resize、全局 ticker）

---

## 验收标准（DoD）
- CI 在 PR 即阻断 lint/typecheck/test 失败
- 至少覆盖 editor core + note store + note service 的关键测试
- Web/API 部署触发路径精确化
- 业务 Note 类型仅保留 contract 一份定义
- editor/theme 样式不再含硬编码主题色

---

## 备注
本报告作为当前基线，后续可按 Phase 拆分为独立 issue/里程碑，并在每个阶段结束后更新本文件。