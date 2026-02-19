/**
 * Design Tokens — Border Radius
 */

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const

export type BorderRadius = typeof borderRadius
export type BorderRadiusKey = keyof BorderRadius
