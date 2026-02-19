/**
 * Design Tokens — Shadows
 *
 * 收敛到最小可维护层级：
 *   - none: 无阴影
 *   - sm: 轻微悬浮
 *   - md: 默认浮层
 *   - lg: 强浮层
 */

export const shadowWeb = {
  none: 'none',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
} as const

export type ShadowWeb = typeof shadowWeb
export type ShadowWebKey = keyof ShadowWeb
