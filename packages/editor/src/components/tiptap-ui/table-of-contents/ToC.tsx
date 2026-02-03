import { useEffect, useState } from 'react'
import { Editor } from '@tiptap/react'
import { cn } from '@nicenote/ui'

interface ToCItem {
  id: string
  textContent: string
  level: number
  isActive: boolean
}

interface ToCProps {
  editor: Editor | null
}

export function ToC({ editor }: ToCProps) {
  const [items, setItems] = useState<ToCItem[]>([])

  useEffect(() => {
    if (!editor) {
      return
    }

    const updateItems = () => {
      const headings =
        (editor.storage as { tableOfContents?: { content: ToCItem[] } }).tableOfContents?.content ||
        []
      setItems(headings)
    }

    // Initial update
    updateItems()

    // Listen to editor updates
    editor.on('update', updateItems)
    editor.on('selectionUpdate', updateItems)

    return () => {
      editor.off('update', updateItems)
      editor.off('selectionUpdate', updateItems)
    }
  }, [editor])

  const handleClick = (id: string) => {
    if (!editor) {
      return
    }

    const element = document.querySelector(`[data-toc-id="${id}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed top-20 right-10 w-72 max-h-[calc(100vh-120px)] overflow-y-auto p-5 bg-background border border-border rounded-lg shadow-md z-10 hidden xl:block',
        'toc'
      )}
    >
      <h2
        className={cn(
          'm-0 mb-4 text-base font-semibold text-foreground leading-tight',
          'toc-title'
        )}
      >
        Table of Contents
      </h2>
      <ul className={cn('m-0 p-0 list-none', 'toc-list')}>
        {items.map((item) => (
          <li
            key={item.id}
            data-level={item.level}
            className={cn(
              'm-0 mb-1 p-0 leading-relaxed',
              item.level === 2 && 'pl-4',
              item.level === 3 && 'pl-8',
              item.level === 4 && 'pl-12',
              item.level === 5 && 'pl-16',
              item.level === 6 && 'pl-20',
              item.isActive && 'is-active',
              `toc-item toc-item-level-${item.level}`
            )}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                handleClick(item.id)
              }}
              className={cn(
                'block p-1 px-2 text-muted-foreground no-underline rounded-md transition-all cursor-pointer text-sm hover:text-foreground hover:bg-muted',
                item.isActive && 'text-primary font-medium',
                'toc-link'
              )}
            >
              {item.textContent}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
