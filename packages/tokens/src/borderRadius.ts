/**
 * Design Tokens — Border Radius
 */

// ============================================================
// Base Scale
// ============================================================

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  xxxl: 24,
  full: 9999,
} as const

// ============================================================
// Semantic Aliases
// ============================================================

export const borderRadiusScale = {
  // --- 小型组件 ---
  badge: borderRadius.sm, // 标签、角标
  tag: borderRadius.md, // 标签页
  input: borderRadius.lg, // 输入框
  button: borderRadius.lg, // 按钮
  buttonPill: borderRadius.full, // Pill 按钮

  // --- 中型组件 ---
  card: borderRadius.xl, // 卡片
  dropdown: borderRadius.lg, // 下拉菜单
  tooltip: borderRadius.md, // 提示气泡
  popover: borderRadius.xl, // 弹出卡片

  // --- 大型组件 ---
  modal: borderRadius.xxl, // 弹窗
  drawer: borderRadius.xxxl, // 抽屉面板

  // --- 头像 ---
  avatarSm: borderRadius.md, // 小头像
  avatarMd: borderRadius.lg, // 中头像
  avatarLg: borderRadius.full, // 大头像（圆形）
} as const

export type BorderRadius = typeof borderRadius
export type BorderRadiusKey = keyof BorderRadius
export type BorderRadiusScale = typeof borderRadiusScale
export type BorderRadiusScaleKey = keyof BorderRadiusScale
