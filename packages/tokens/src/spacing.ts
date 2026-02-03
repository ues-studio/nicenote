/**
 * Design Tokens — Spacing
 *
 * 基于 4px 基础单位的间距梯度
 * 命名规则: 数字值 = 实际 px 值 ÷ 4
 *   例如: spacing[4] = 16px, spacing[6] = 24px
 *
 * 语义别名方便快速查找常用值
 */

// ============================================================
// 基础梯度 (Base Scale)
// ============================================================

export const spacing = {
  0: 0,
  0.5: 2, // 0.5 * 4
  1: 4, // 1 * 4
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  18: 72,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
} as const

// ============================================================
// 语义别名 (Semantic Aliases)
// 快速查找常用场景对应的值
// ============================================================

export const spacingScale = {
  none: spacing[0],
  hairline: spacing[0.5], // 极小间隙，如分割线两侧
  xs: spacing[1], // 4px  — 紧密元素内部
  sm: spacing[2], // 8px  — 组件内部小间距
  md: spacing[4], // 16px — 默认间距
  lg: spacing[6], // 24px — 组件之间
  xl: spacing[8], // 32px — 区块之间
  xxl: spacing[12], // 48px — 页面级别大间距
  xxxl: spacing[16], // 64px — 页面分区之间
} as const

export type Spacing = typeof spacing
export type SpacingKey = keyof Spacing
export type SpacingScale = typeof spacingScale
export type SpacingScaleKey = keyof SpacingScale
