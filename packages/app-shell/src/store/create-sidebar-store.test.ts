import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSidebarStore } from './create-sidebar-store'

// localStorage mock
const storage = new Map<string, string>()
beforeEach(() => {
  storage.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createSidebarStore', () => {
  it('初始化时默认打开、宽度 320', () => {
    const store = createSidebarStore({ storageKeyPrefix: 'test' })
    const state = store.getState()
    expect(state.isOpen).toBe(true)
    expect(state.width).toBe(320)
    expect(state.isResizing).toBe(false)
  })

  it('从 localStorage 恢复折叠状态', () => {
    storage.set('test-sidebar-open', 'false')
    const store = createSidebarStore({ storageKeyPrefix: 'test' })
    expect(store.getState().isOpen).toBe(false)
  })

  it('从 localStorage 恢复宽度', () => {
    storage.set('test-sidebar-width', '400')
    const store = createSidebarStore({ storageKeyPrefix: 'test' })
    expect(store.getState().width).toBe(400)
  })

  it('忽略超出范围的持久化宽度', () => {
    storage.set('test-sidebar-width', '9999')
    const store = createSidebarStore({ storageKeyPrefix: 'test' })
    expect(store.getState().width).toBe(320)
  })

  it('忽略低于最小值的持久化宽度', () => {
    storage.set('test-sidebar-width', '100')
    const store = createSidebarStore({ storageKeyPrefix: 'test' })
    expect(store.getState().width).toBe(320)
  })

  it('toggle() 切换状态并持久化', () => {
    const store = createSidebarStore({ storageKeyPrefix: 'test' })
    store.getState().toggle()
    expect(store.getState().isOpen).toBe(false)
    expect(storage.get('test-sidebar-open')).toBe('false')

    store.getState().toggle()
    expect(store.getState().isOpen).toBe(true)
    expect(storage.get('test-sidebar-open')).toBe('true')
  })

  it('open() / close() 持久化状态', () => {
    const store = createSidebarStore({ storageKeyPrefix: 'test' })
    store.getState().close()
    expect(store.getState().isOpen).toBe(false)
    expect(storage.get('test-sidebar-open')).toBe('false')

    store.getState().open()
    expect(store.getState().isOpen).toBe(true)
    expect(storage.get('test-sidebar-open')).toBe('true')
  })

  it('setWidth() 夹紧到有效范围并持久化', () => {
    const store = createSidebarStore({ storageKeyPrefix: 'test' })

    store.getState().setWidth(100)
    expect(store.getState().width).toBe(260)
    expect(storage.get('test-sidebar-width')).toBe('260')

    store.getState().setWidth(999)
    expect(store.getState().width).toBe(560)
    expect(storage.get('test-sidebar-width')).toBe('560')

    store.getState().setWidth(350)
    expect(store.getState().width).toBe(350)
    expect(storage.get('test-sidebar-width')).toBe('350')
  })

  it('startResize / stopResize 更新状态', () => {
    const store = createSidebarStore({ storageKeyPrefix: 'test' })
    store.getState().startResize()
    expect(store.getState().isResizing).toBe(true)

    store.getState().stopResize()
    expect(store.getState().isResizing).toBe(false)
  })

  it('localStorage 异常时静默降级', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('SecurityError')
      },
    })

    const store = createSidebarStore({ storageKeyPrefix: 'test' })
    expect(store.getState().isOpen).toBe(true)
    expect(store.getState().width).toBe(320)

    // 操作不应抛出
    store.getState().toggle()
    store.getState().setWidth(400)
  })
})
