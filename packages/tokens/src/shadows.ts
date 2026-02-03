/**
 * Design Tokens — Shadows
 *
 * Web 和 React Native 的阴影定义方式不同：
 *   - Web: box-shadow 字符串
 *   - RN:  elevation + shadowColor/shadowOffset/shadowOpacity/shadowRadius
 *
 * 所以这里分开导出两组，语义别名层统一映射
 */

// ============================================================
// Web — box-shadow
// ============================================================

export const shadowWeb = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  xxl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)', // 内阴影，用于凹陷效果
} as const

// ============================================================
// React Native — elevation + shadow 属性
// iOS 用 shadow* 属性，Android 用 elevation
// 这里两组都写，组件里同时应用即可兼容双平台
// ============================================================

export const shadowNative = {
  none: {
    elevation: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  xs: {
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sm: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  md: {
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  lg: {
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  xl: {
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  xxl: {
    elevation: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
} as const

// ============================================================
// 语义别名 (Semantic Aliases)
// 按组件层级映射阴影强度
// ============================================================

export const shadowScale = {
  // --- 平面元素 ---
  subtle: 'xs', // 悬停状态的微妙提升
  default: 'sm', // 卡片默认状态

  // --- 浮动元素 ---
  dropdown: 'md', // 下拉菜单
  popover: 'md', // 弹出卡片
  card: 'sm', // 卡片
  cardHover: 'md', // 卡片悬停

  // --- 弹层 ---
  modal: 'xl', // 弹窗
  drawer: 'lg', // 抽屉面板
  tooltip: 'sm', // 提示气泡
} as const

export type ShadowWeb = typeof shadowWeb
export type ShadowWebKey = keyof ShadowWeb
export type ShadowNative = typeof shadowNative
export type ShadowNativeKey = keyof ShadowNative
export type ShadowScale = typeof shadowScale
export type ShadowScaleKey = keyof ShadowScale
