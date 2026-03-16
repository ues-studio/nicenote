import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { Loader2, Search, X } from 'lucide-react'

import { cn } from '../../lib/utils'

export interface SearchDialogLabels {
  /** 对话框 aria-label */
  title: string
  /** 输入框 placeholder */
  placeholder: string
  /** 清除按钮 aria-label */
  clear: string
  /** 搜索中提示 */
  searching: string
  /** 无结果提示 */
  noResults: string
  /** 空查询提示 */
  hint: string
}

export interface SearchDialogProps<T> {
  open: boolean
  onClose: () => void
  labels: SearchDialogLabels
  /** 执行搜索，返回结果列表（支持同步和异步） */
  onSearch: (query: string) => T[] | Promise<T[]>
  /** 获取结果项的唯一 key */
  getResultKey: (result: T) => string
  /** 选中结果回调 */
  onSelect: (result: T) => void
  /** 渲染单个搜索结果项 */
  renderResult: (result: T, opts: { query: string; isSelected: boolean }) => ReactNode
  /** 搜索防抖延迟（默认 300ms） */
  debounceMs?: number
  /** 底部状态栏内容 */
  renderFooter?: (resultCount: number) => ReactNode
  /** 额外的对话框 className */
  dialogClassName?: string
  /** backdrop className 覆盖 */
  backdropClassName?: string
}

export function SearchDialog<T>(props: SearchDialogProps<T>) {
  if (!props.open) return null
  return <SearchDialogInner {...props} />
}

function SearchDialogInner<T>({
  onClose,
  labels,
  onSearch,
  getResultKey,
  onSelect,
  renderResult,
  debounceMs = 300,
  renderFooter,
  dialogClassName,
  backdropClassName,
}: SearchDialogProps<T>) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 自动聚焦输入框
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  // 防抖触发搜索
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await Promise.resolve(onSearch(query))
        setResults(res)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, debounceMs)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, onSearch, debounceMs])

  // 搜索结果变化时重置选中索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  const safeIndex = results.length > 0 ? Math.min(selectedIndex, results.length - 1) : 0

  const handleSelect = useCallback(
    (result: T) => {
      onSelect(result)
      onClose()
    },
    [onSelect, onClose]
  )

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % results.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
          break
        case 'Enter':
          e.preventDefault()
          if (results[safeIndex]) {
            handleSelect(results[safeIndex])
          }
          break
      }
    },
    [results, safeIndex, handleSelect]
  )

  // Escape 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const hasQuery = query.trim().length > 0
  const hasResults = results.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-28">
      {/* 遮罩层 */}
      <div
        className={cn('fixed inset-0 bg-black/40 backdrop-blur-sm', backdropClassName)}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 对话框主体 */}
      <div
        role="dialog"
        aria-label={labels.title}
        aria-modal="true"
        className={cn(
          'relative w-full max-w-xl rounded-2xl border border-border bg-background shadow-2xl',
          dialogClassName
        )}
        onKeyDown={handleKeyDown}
      >
        {/* 搜索输入框 */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          {isSearching ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="size-4 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder={labels.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center gap-2">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={labels.clear}
              >
                <X className="size-3.5" />
              </button>
            )}
            <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground/60">
              ESC
            </kbd>
          </div>
        </div>

        {/* 搜索结果区 */}
        <div className="max-h-96 overflow-y-auto p-2">
          {/* 空查询提示 */}
          {!hasQuery && (
            <div className="py-10 text-center text-sm text-muted-foreground/60">{labels.hint}</div>
          )}

          {/* 搜索中 */}
          {isSearching && hasQuery && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              {labels.searching}
            </div>
          )}

          {/* 无结果 */}
          {!isSearching && hasQuery && !hasResults && (
            <div className="py-10 text-center text-sm text-muted-foreground/60">
              {labels.noResults}
            </div>
          )}

          {/* 结果列表 */}
          {hasResults &&
            results.map((result, index) => (
              <button
                key={getResultKey(result)}
                onClick={() => handleSelect(result)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                  index === safeIndex ? 'bg-accent' : 'hover:bg-accent/50'
                )}
              >
                {renderResult(result, { query, isSelected: index === safeIndex })}
              </button>
            ))}
        </div>

        {/* 底部状态栏 */}
        {hasResults && renderFooter && (
          <div className="border-t border-border px-4 py-2">{renderFooter(results.length)}</div>
        )}
      </div>
    </div>
  )
}
