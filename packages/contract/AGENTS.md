# @nicenote/contract Agent Guide

本文件用于约束在 `packages/contract` 目录内工作的 AI/开发代理行为。

## 1) 包定位

- 该包是 **API 契约层**，为 `apps/api` 与 `apps/web` 提供共享的：
  - Zod schema（请求/响应/参数）
  - Hono 路由注册函数
  - `AppType`（端到端类型推导入口）
- 该包不包含数据库访问、业务持久化、UI 逻辑。

## 2) 当前文件结构

- `src/schemas.ts`
  - 定义 `noteSelectSchema`、`noteInsertSchema`、`noteCreateSchema`、`noteUpdateSchema`、`noteIdParamSchema`
  - 导出 `NoteSelect`、`NoteInsert`、`NoteCreateInput`、`NoteUpdateInput`
- `src/routes.ts`
  - 定义 `NoteContractService` 与 `NoteContractFactory`
  - 通过 `registerNoteRoutes()` 注册 `/notes` CRUD 路由与参数校验
  - 通过内部 `_createContractAppForType()` 推导 `AppType`
- `src/index.ts`
  - 统一导出 routes 与 schemas 的类型和运行时符号

## 3) 必须遵守的修改原则

1. **契约优先**：先改 schema，再改 route 处理与导出。
2. **类型对齐**：`Note*Input` 类型必须由 Zod schema `infer` 得到，不手写重复类型。
3. **严格校验**：对象 schema 保持 `.strict()`，避免静默接收未知字段。
4. **兼容性意识**：任何字段改名/删除都是破坏性变更，需同步评估 `apps/api` 与 `apps/web`。
5. **最小改动**：仅改与契约相关代码，不引入业务逻辑或基础设施代码。

## 4) 路由契约约定

- 已定义端点（由 `registerNoteRoutes` 提供）：
  - `GET /notes`
  - `GET /notes/:id`
  - `POST /notes`
  - `PATCH /notes/:id`
  - `DELETE /notes/:id`
- `:id` 参数必须通过 `noteIdParamSchema` 校验。
- `POST` 使用 `noteCreateSchema`，`PATCH` 使用 `noteUpdateSchema`。
- 查询结果与写入结果均需通过 `noteSelectSchema` 解析后返回。

## 5) 导出规范

- 新增任何 schema/type/contract API 时，必须同时：
  1. 在定义文件中导出
  2. 在 `src/index.ts` 聚合导出
- 保持现有公共入口：`package.json` 的 `exports["."] -> ./src/index.ts`。

## 6) 不要做的事

- 不要修改 `dist/` 产物（由构建生成）。
- 不要在此包添加数据库、fetch、环境变量读取等运行时副作用逻辑。
- 不要把 `apps/api` 的 service 实现细节耦合进 contract。

## 7) 本地验证清单

在仓库根目录执行：

```bash
pnpm --filter @nicenote/contract typecheck
pnpm --filter @nicenote/contract lint
pnpm --filter @nicenote/contract build
```

若修改涉及端到端类型，建议额外执行：

```bash
pnpm --filter api typecheck
pnpm --filter web typecheck
```

## 8) 变更自检（提交前）

- 是否更新了 `src/index.ts` 聚合导出？
- 是否保持 schema 与 route validator 一致？
- 是否避免了破坏性字段变更（若有是否已记录）？
- 是否未引入与契约无关的实现逻辑？
