import { describe, expect, it } from 'vitest'

import { formatShortcutKey, isMac, MAC_SYMBOLS, parseShortcutKeys } from './platform'

describe('isMac', () => {
  it('返回 false 当 navigator 未定义时', () => {
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      configurable: true,
    })
    expect(isMac()).toBe(false)
    Object.defineProperty(globalThis, 'navigator', {
      value: original,
      configurable: true,
    })
  })

  it('通过 userAgentData.platform 检测 macOS', () => {
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgentData: { platform: 'macOS' }, platform: 'Win32' },
      configurable: true,
    })
    expect(isMac()).toBe(true)
    Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true })
  })

  it('回退到 navigator.platform 检测 macOS', () => {
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: { platform: 'MacIntel' },
      configurable: true,
    })
    expect(isMac()).toBe(true)
    Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true })
  })

  it('非 Mac 平台返回 false', () => {
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: { platform: 'Win32' },
      configurable: true,
    })
    expect(isMac()).toBe(false)
    Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true })
  })
})

describe('formatShortcutKey', () => {
  it('Mac 上将修饰键转为符号', () => {
    expect(formatShortcutKey('mod', true)).toBe('⌘')
    expect(formatShortcutKey('command', true)).toBe('⌘')
    expect(formatShortcutKey('ctrl', true)).toBe('⌃')
    expect(formatShortcutKey('alt', true)).toBe('⌥')
    expect(formatShortcutKey('shift', true)).toBe('⇧')
  })

  it('Mac 上未知键默认大写', () => {
    expect(formatShortcutKey('k', true)).toBe('K')
    expect(formatShortcutKey('enter', true)).toBe('⏎')
  })

  it('Mac 上 capitalize=false 保持原样', () => {
    expect(formatShortcutKey('k', true, false)).toBe('k')
  })

  it('非 Mac 上首字母大写', () => {
    expect(formatShortcutKey('ctrl', false)).toBe('Ctrl')
    expect(formatShortcutKey('shift', false)).toBe('Shift')
    expect(formatShortcutKey('k', false)).toBe('K')
  })

  it('非 Mac 上 capitalize=false 保持原样', () => {
    expect(formatShortcutKey('ctrl', false, false)).toBe('ctrl')
  })
})

describe('parseShortcutKeys', () => {
  it('未定义时返回空数组', () => {
    expect(parseShortcutKeys({ shortcutKeys: undefined })).toEqual([])
  })

  it('空字符串返回空数组', () => {
    expect(parseShortcutKeys({ shortcutKeys: '' })).toEqual([])
  })

  it('按 + 分隔并格式化各键', () => {
    // 模拟非 Mac 环境
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: { platform: 'Win32' },
      configurable: true,
    })

    const result = parseShortcutKeys({ shortcutKeys: 'ctrl+shift+k' })
    expect(result).toEqual(['Ctrl', 'Shift', 'K'])

    Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true })
  })

  it('支持自定义分隔符', () => {
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: { platform: 'Win32' },
      configurable: true,
    })

    const result = parseShortcutKeys({ shortcutKeys: 'ctrl-k', delimiter: '-' })
    expect(result).toEqual(['Ctrl', 'K'])

    Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true })
  })

  it('去除键名两侧空白', () => {
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: { platform: 'Win32' },
      configurable: true,
    })

    const result = parseShortcutKeys({ shortcutKeys: ' ctrl + k ' })
    expect(result).toEqual(['Ctrl', 'K'])

    Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true })
  })
})

describe('MAC_SYMBOLS', () => {
  it('包含所有预期的修饰键映射', () => {
    expect(MAC_SYMBOLS.mod).toBe('⌘')
    expect(MAC_SYMBOLS.alt).toBe('⌥')
    expect(MAC_SYMBOLS.shift).toBe('⇧')
    expect(MAC_SYMBOLS.escape).toBe('⎋')
    expect(MAC_SYMBOLS.enter).toBe('⏎')
  })
})
