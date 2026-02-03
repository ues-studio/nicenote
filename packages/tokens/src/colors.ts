/**
 * Design Tokens — Colors
 *
 * 单源真相：所有颜色定义在这里
 * - Web 端通过 generate-scss.ts 生成 _variables.scss
 * - React Native 端直接 import 使用
 *
 * 命名规则:
 *   - 基础色用数字梯度: 50(最浅) → 900(最深)
 *   - 语义色用用途命名: primary, secondary, error 等
 *   - 状态色附加后缀: hover, active, focus, disabled
 */

// ============================================================
// 基础色板 (Base Colors)
// 数字梯度，不直接使用，供语义色引用
// ============================================================

const gray = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
} as const

const blue = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
} as const

const green = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#10B981',
  600: '#059669',
  700: '#047857',
  800: '#065F46',
  900: '#064E3B',
} as const

const red = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#EF4444',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  900: '#7F1D1D',
} as const

const yellow = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
} as const

const purple = {
  50: '#F5F3FF',
  100: '#EDE9FE',
  200: '#DDD6FE',
  300: '#C4B5FD',
  400: '#A78BFA',
  500: '#8B5CF6',
  600: '#7C3AED',
  700: '#6D28D9',
  800: '#5B21B6',
  900: '#4C1D95',
} as const

// ============================================================
// 语义色 (Semantic Colors)
// 这是实际在组件里使用的颜色
// ============================================================

export const colors = {
  // --- 主色 ---
  primary: blue[600],
  primaryHover: blue[700],
  primaryActive: blue[800],
  primaryFocus: blue[500],
  primaryDisabled: blue[300],
  primaryText: blue[700], // 用于文本链接等场景
  primaryBg: blue[50], // 用于背景高亮等场景

  // --- 副色 ---
  secondary: purple[600],
  secondaryHover: purple[700],
  secondaryActive: purple[800],
  secondaryDisabled: purple[300],
  secondaryText: purple[700],
  secondaryBg: purple[50],

  // --- 背景 ---
  bgBase: '#FFFFFF', // 页面基础背景
  bgMuted: gray[50], // 次级背景（卡片、侧栏等）
  bgHover: gray[200], // 悬停背景
  bgActive: gray[100], // 激活背景
  bgOverlay: 'rgba(0, 0, 0, 0.5)', // 弹层遮罩

  // --- 文本 ---
  textPrimary: gray[900], // 主文本
  textSecondary: gray[600], // 次文本
  textTertiary: gray[400], // 占位符等
  textDisabled: gray[300], // 禁用状态文本
  textInverse: '#FFFFFF', // 深色背景上的文本
  textLink: blue[600], // 链接文本
  textLinkHover: blue[700],

  // --- 边框 ---
  border: gray[200], // 默认边框
  borderHover: gray[300], // 悬停边框
  borderFocus: blue[500], // 聚焦边框
  borderDisabled: gray[100], // 禁用边框

  // --- 状态色: Error ---
  error: red[500],
  errorHover: red[600],
  errorText: red[700],
  errorBg: red[50],
  errorBorder: red[300],

  // --- 状态色: Success ---
  success: green[500],
  successHover: green[600],
  successText: green[700],
  successBg: green[50],
  successBorder: green[300],

  // --- 状态色: Warning ---
  warning: yellow[500],
  warningHover: yellow[600],
  warningText: yellow[700],
  warningBg: yellow[50],
  warningBorder: yellow[300],

  // --- 状态色: Info ---
  info: blue[500],
  infoHover: blue[600],
  infoText: blue[700],
  infoBg: blue[50],
  infoBorder: blue[300],
} as const

// ============================================================
// Dark Mode Colors
// ============================================================

export const darkColors = {
  // --- 主色 (保持一致) ---
  primary: blue[500],
  primaryHover: blue[400],
  primaryActive: blue[300],
  primaryFocus: blue[600],
  primaryDisabled: blue[800],
  primaryText: gray[700],
  primaryBg: '#172554',

  // --- 副色 ---
  secondary: purple[500],
  secondaryHover: purple[400],
  secondaryActive: purple[300],
  secondaryDisabled: purple[800],
  secondaryText: purple[400],
  secondaryBg: '#2e1065',

  // --- 背景 ---
  bgBase: gray[900], // 页面基础背景
  bgMuted: gray[800], // 次级背景
  bgActive: gray[700], // 激活背景
  bgHover: gray[700], // 悬停背景
  bgOverlay: 'rgba(0, 0, 0, 0.7)', // 弹层遮罩

  // --- 文本 ---
  textPrimary: gray[50], // 主文本
  textSecondary: gray[400], // 次文本
  textTertiary: gray[500], // 占位符等
  textDisabled: gray[600], // 禁用状态文本
  textInverse: gray[900], // 浅色背景上的文本
  textLink: blue[400], // 链接文本
  textLinkHover: blue[300],

  // --- 边框 ---
  border: gray[700], // 默认边框
  borderHover: gray[600], // 悬停边框
  borderFocus: blue[500], // 聚焦边框
  borderDisabled: gray[800], // 禁用边框

  // --- 状态色: Error ---
  error: red[500],
  errorHover: red[400],
  errorText: red[400],
  errorBg: '#450a0a',
  errorBorder: red[800],

  // --- 状态色: Success ---
  success: green[500],
  successHover: green[400],
  successText: green[400],
  successBg: '#052e16',
  successBorder: green[800],

  // --- 状态色: Warning ---
  warning: yellow[500],
  warningHover: yellow[400],
  warningText: yellow[400],
  warningBg: '#422006',
  warningBorder: yellow[800],

  // --- 状态色: Info ---
  info: blue[500],
  infoHover: blue[400],
  infoText: blue[400],
  infoBg: '#172554',
  infoBorder: blue[800],
} as const

export type Colors = typeof colors
export type ColorKey = keyof Colors
