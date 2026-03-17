import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createToastStore } from './create-toast-store'

describe('createToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('初始状态为空列表', () => {
    const store = createToastStore()
    expect(store.getState().toasts).toEqual([])
  })

  it('addToast 添加消息并返回 id', () => {
    const store = createToastStore()
    const id = store.getState().addToast('你好')
    expect(typeof id).toBe('string')
    expect(store.getState().toasts).toHaveLength(1)
    expect(store.getState().toasts[0]).toEqual({ id, message: '你好' })
  })

  it('默认 5 秒后自动移除', () => {
    const store = createToastStore()
    store.getState().addToast('临时消息')

    expect(store.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(4999)
    expect(store.getState().toasts).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(store.getState().toasts).toHaveLength(0)
  })

  it('自定义 duration', () => {
    const store = createToastStore()
    store.getState().addToast('快速消息', { duration: 1000 })

    vi.advanceTimersByTime(999)
    expect(store.getState().toasts).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(store.getState().toasts).toHaveLength(0)
  })

  it('removeToast 手动移除并清理定时器', () => {
    const store = createToastStore()
    const id = store.getState().addToast('手动移除')

    store.getState().removeToast(id)
    expect(store.getState().toasts).toHaveLength(0)

    // 定时器触发后不应报错或重复移除
    vi.advanceTimersByTime(5000)
    expect(store.getState().toasts).toHaveLength(0)
  })

  it('removeToast 对不存在的 id 静默忽略', () => {
    const store = createToastStore()
    store.getState().addToast('保留')
    store.getState().removeToast('不存在的id')
    expect(store.getState().toasts).toHaveLength(1)
  })

  it('支持 action 选项', () => {
    const store = createToastStore()
    const action = { label: '撤销', onClick: vi.fn() }
    store.getState().addToast('操作完成', { action })

    expect(store.getState().toasts[0].action).toEqual(action)
  })

  it('多条消息按添加顺序排列', () => {
    const store = createToastStore()
    const id1 = store.getState().addToast('第一条')
    const id2 = store.getState().addToast('第二条')
    const id3 = store.getState().addToast('第三条')

    const messages = store.getState().toasts.map((t) => t.id)
    expect(messages).toEqual([id1, id2, id3])
  })

  it('各条消息独立计时', () => {
    const store = createToastStore()
    store.getState().addToast('先到期', { duration: 1000 })
    store.getState().addToast('后到期', { duration: 3000 })

    vi.advanceTimersByTime(1000)
    expect(store.getState().toasts).toHaveLength(1)
    expect(store.getState().toasts[0].message).toBe('后到期')

    vi.advanceTimersByTime(2000)
    expect(store.getState().toasts).toHaveLength(0)
  })
})
