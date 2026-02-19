/**
 * platform.ts — 平台检测 & 快捷键格式化
 *
 * 跨端通用：Web / React Native / Desktop (Electron/Tauri)
 */

export const MAC_SYMBOLS: Record<string, string> = {
  mod: '⌘',
  command: '⌘',
  meta: '⌘',
  ctrl: '⌃',
  control: '⌃',
  alt: '⌥',
  option: '⌥',
  shift: '⇧',
  backspace: 'Del',
  delete: '⌦',
  enter: '⏎',
  escape: '⎋',
  capslock: '⇪',
} as const

/** 判断当前平台是否为 macOS */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  const platform =
    (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform ??
    navigator.platform
  return platform.toLowerCase().includes('mac')
}

/** 格式化单个快捷键（Mac 显示符号，非 Mac 显示文本） */
export const formatShortcutKey = (key: string, mac: boolean, capitalize: boolean = true) => {
  if (mac) {
    const lowerKey = key.toLowerCase()
    return MAC_SYMBOLS[lowerKey] || (capitalize ? key.toUpperCase() : key)
  }

  return capitalize ? key.charAt(0).toUpperCase() + key.slice(1) : key
}

/** 解析快捷键字符串为格式化后的符号数组 */
export const parseShortcutKeys = (props: {
  shortcutKeys: string | undefined
  delimiter?: string
  capitalize?: boolean
}) => {
  const { shortcutKeys, delimiter = '+', capitalize = true } = props

  if (!shortcutKeys) return []

  return shortcutKeys
    .split(delimiter)
    .map((key) => key.trim())
    .map((key) => formatShortcutKey(key, isMac(), capitalize))
}
