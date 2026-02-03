/**
 * Design Tokens — Typography
 *
 * 包含字体族、字号、行高、字重、字间距
 * 底部提供语义化的预组合 textStyle，方便直接套用到组件
 */

// ============================================================
// 字体族 (Font Family)
// ============================================================

export const fontFamily = {
  sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'].join(
    ', '
  ),
  mono: ["'JetBrains Mono'", "'Fira Code'", "'Consolas'", 'monospace'].join(', '),
  serif: ['Georgia', "'Times New Roman'", 'serif'].join(', '),
} as const

// ============================================================
// 字号 (Font Size) + 对应行高 (Line Height)
// 行高和字号绑定在一起，保证垂直节奏一致
// ============================================================

export const fontSize = {
  xs: { size: 12, lineHeight: 16 },
  sm: { size: 14, lineHeight: 20 },
  base: { size: 16, lineHeight: 24 }, // 默认正文
  md: { size: 18, lineHeight: 28 },
  lg: { size: 20, lineHeight: 28 },
  xl: { size: 24, lineHeight: 32 },
  xxl: { size: 30, lineHeight: 36 },
  xxxl: { size: 36, lineHeight: 40 },
  h4xl: { size: 48, lineHeight: 52 },
  h5xl: { size: 60, lineHeight: 64 },
} as const

// ============================================================
// 字重 (Font Weight)
// ============================================================

export const fontWeight = {
  thin: 100,
  extraLight: 200,
  light: 300,
  regular: 400, // 默认正文
  medium: 500, // 略有强调
  semiBold: 600, // 小标题
  bold: 700, // 标题
  extraBold: 800,
  black: 900,
} as const

// ============================================================
// 字间距 (Letter Spacing)
// ============================================================

export const letterSpacing = {
  tight: -0.025, // em，用于大标题收紧
  normal: 0,
  wide: 0.025, // 用于小写字母强调
  wider: 0.05,
  widest: 0.1, // 用于全大写字母
} as const

// ============================================================
// 语义化文本样式 (Semantic Text Styles)
// 预组合好的常用场景，直接套用即可
// Web 端可直接展开为 CSS，RN 端直接作为 style 对象使用
// ============================================================

export const textStyle = {
  // --- 标题组 ---
  h1: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.h5xl.size,
    lineHeight: fontSize.h5xl.lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.h4xl.size,
    lineHeight: fontSize.h4xl.lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xxxl.size,
    lineHeight: fontSize.xxxl.lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  h4: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xxl.size,
    lineHeight: fontSize.xxl.lineHeight,
    fontWeight: fontWeight.semiBold,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xl.size,
    lineHeight: fontSize.xl.lineHeight,
    fontWeight: fontWeight.semiBold,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.lg.size,
    lineHeight: fontSize.lg.lineHeight,
    fontWeight: fontWeight.semiBold,
    letterSpacing: letterSpacing.normal,
  },

  // --- 正文组 ---
  bodyLg: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md.size,
    lineHeight: fontSize.md.lineHeight,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.base.size,
    lineHeight: fontSize.base.lineHeight,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodySm: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },

  // --- 辅助组 ---
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xs.size,
    lineHeight: fontSize.xs.lineHeight,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.wide,
  },
  label: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },
  overline: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xs.size,
    lineHeight: fontSize.xs.lineHeight,
    fontWeight: fontWeight.semiBold,
    letterSpacing: letterSpacing.widest,
  },
  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.md.lineHeight,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
} as const

export type FontFamily = typeof fontFamily
export type FontSize = typeof fontSize
export type FontWeight = typeof fontWeight
export type TextStyle = typeof textStyle
export type TextStyleKey = keyof TextStyle
