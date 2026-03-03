import { useEffect } from 'react'

import { useDesktopStore } from '../store/useDesktopStore'

// ============================================================
// 文件变化事件数据结构（与 Go 端约定一致）
// ============================================================

interface FileEventData {
  path: string
}

// ============================================================
// useWailsEvents：注册 Wails 文件监听事件
//
// 事件由 Go 端的 fsnotify watcher 触发，经 Wails 事件系统
// 传递到前端。支持三种事件：
//   file:created  - 新文件创建
//   file:modified - 文件内容修改
//   file:deleted  - 文件删除
// ============================================================

export function useWailsEvents() {
  const { handleFileCreated, handleFileModified, handleFileDeleted } = useDesktopStore((s) => ({
    handleFileCreated: s.handleFileCreated,
    handleFileModified: s.handleFileModified,
    handleFileDeleted: s.handleFileDeleted,
  }))

  useEffect(() => {
    // 尝试加载 Wails3 运行时事件模块
    // 在非 Wails 环境（开发浏览器）中优雅降级
    let cleanupFns: Array<() => void> = []

    async function registerEvents() {
      try {
        // Wails3 通过动态 import 提供运行时
        const { Events } = await import('@wailsio/runtime')

        const offCreated = Events.On('file:created', (data: unknown) => {
          const event = data as FileEventData
          if (event?.path) {
            handleFileCreated(event.path)
          }
        })

        const offModified = Events.On('file:modified', (data: unknown) => {
          const event = data as FileEventData
          if (event?.path) {
            handleFileModified(event.path)
          }
        })

        const offDeleted = Events.On('file:deleted', (data: unknown) => {
          const event = data as FileEventData
          if (event?.path) {
            handleFileDeleted(event.path)
          }
        })

        cleanupFns = [offCreated, offModified, offDeleted]
      } catch {
        // Wails 运行时不可用（浏览器开发模式），静默忽略
        // 开发时可通过 useWailsEventsMock() 模拟事件
        console.debug('[WailsEvents] 运行时不可用，文件监听已禁用')
      }
    }

    registerEvents()

    return () => {
      // 组件卸载时注销所有事件监听
      for (const cleanup of cleanupFns) {
        cleanup()
      }
    }
  }, [handleFileCreated, handleFileModified, handleFileDeleted])
}

// ============================================================
// 开发模式用的事件模拟器（方便在浏览器中测试）
//
// 使用方式：在控制台调用
//   window.__simulateFileEvent('file:created', '/path/to/note.md')
//   window.__simulateFileEvent('file:modified', '/path/to/note.md')
//   window.__simulateFileEvent('file:deleted', '/path/to/note.md')
// ============================================================

if (typeof window !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__simulateFileEvent = (
    event: 'file:created' | 'file:modified' | 'file:deleted',
    path: string
  ) => {
    const store = useDesktopStore.getState()
    switch (event) {
      case 'file:created':
        store.handleFileCreated(path)
        break
      case 'file:modified':
        store.handleFileModified(path)
        break
      case 'file:deleted':
        store.handleFileDeleted(path)
        break
    }
    console.debug(`[WailsEvents 模拟] ${event}:`, path)
  }
}
