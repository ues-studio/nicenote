import { useEffect } from 'react'

import { listen } from '@tauri-apps/api/event'

import { useDesktopStore } from '../store/useDesktopStore'

// 监听 Tauri 后端发出的文件系统变更事件，驱动前端状态更新
export function useTauriEvents() {
  const handleFileCreated = useDesktopStore((s) => s.handleFileCreated)
  const handleFileModified = useDesktopStore((s) => s.handleFileModified)
  const handleFileDeleted = useDesktopStore((s) => s.handleFileDeleted)

  useEffect(() => {
    const unlisteners = Promise.all([
      listen<{ path: string }>('file:created', (e) => handleFileCreated(e.payload.path)),
      listen<{ path: string }>('file:modified', (e) => handleFileModified(e.payload.path)),
      listen<{ path: string }>('file:deleted', (e) => handleFileDeleted(e.payload.path)),
    ])

    return () => {
      unlisteners
        .then((fns) => fns.forEach((fn) => fn()))
        .catch((err) => console.error('清理 Tauri 事件监听器失败:', err))
    }
  }, [handleFileCreated, handleFileModified, handleFileDeleted])
}
