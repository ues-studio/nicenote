# Tokens 包 (@nicenote/tokens) 详细说明

## 概述
Tokens 包是项目的统一设计令牌系统，包含颜色、间距、字体等设计属性的定义，支持主题系统的动态切换。

## 技术栈
- **语言**: TypeScript
- **构建**: 纯 TypeScript，无额外依赖
- **生成工具**: 通过 scripts/generate-theme.ts 生成 CSS 变量

## 目录结构
```
packages/tokens/
├── src/
│   ├── colors.ts          # 颜色令牌定义
│   ├── spacing.ts         # 间距令牌定义
│   ├── typography.ts      # 字体排版令牌定义
│   ├── borders.ts         # 边框令牌定义
│   ├── effects.ts         # 效果令牌定义 (阴影等)
│   ├── animation.ts       # 动画令牌定义
│   ├── breakpoints.ts     # 响应断点定义
│   └── index.ts           # 所有令牌的导出入口
├── package.json
└── tsconfig.json
```

## 颜色系统
- **基础色板**: 包含蓝、紫、绿、黄、红、灰等多种颜色的 50-900 色阶
- **语义颜色**: 定义了 primary, secondary, success, error, warning, info 等语义颜色
- **背景色**: 包括基础背景、次级背景、悬停背景等
- **文本色**: 主文本、次文本、禁用文本等语义文本颜色
- **边框色**: 默认边框、悬停边框、聚焦边框等
- **状态色**: 错误、成功、警告、信息等状态相关颜色

## 间距系统
- **基础梯度**: 基于 4px 基础单位的间距梯度 (0, 0.5, 1, 1.5, 2...96)
- **语义别名**: none, hairline, xs, sm, md, lg, xl, xxl, xxxl 等语义间距名称
- **应用场景**: 适用于内外边距、元素间隔、布局间距等各种场景

## 主题支持
- **明暗模式**: 支持动态切换明暗主题
- **CSS 变量生成**: 通过 generate-theme.ts 脚本自动生成 CSS 变量
- **一致性**: 确保整个应用中的视觉元素保持一致性

## 生成脚本
- **generate-theme.ts**: 位于 apps/web/scripts/ 目录
- **功能**: 从 tokens 包的定义生成对应的 CSS 变量文件
- **集成**: 与构建流程集成，在构建时自动生成最新主题

## 使用方式
- 直接导入颜色、间距等常量在组件中使用
- 通过 CSS 变量在样式中应用主题颜色
- 支持动态主题切换

## 开发命令
- `pnpm build` - 构建包
- `pnpm lint` - 运行 ESLint 检查

## 特殊说明
- 设计令牌遵循设计系统原则，具有良好的扩展性
- 颜色命名采用语义化方式，便于理解和使用
- 与 @nicenote/ui 和 @nicenote/editor 包紧密集成
- 支持主题定制和品牌化
- 遵循无障碍设计标准，确保足够的对比度