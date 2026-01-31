import { useEffect, useState } from "react"
import { Editor } from "@tiptap/react"

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
      const headings = (editor.storage as any).tableOfContents?.content || []
      setItems(headings)
    }

    // Initial update
    updateItems()

    // Listen to editor updates
    editor.on("update", updateItems)
    editor.on("selectionUpdate", updateItems)

    return () => {
      editor.off("update", updateItems)
      editor.off("selectionUpdate", updateItems)
    }
  }, [editor])

  const handleClick = (id: string) => {
    if (!editor) {
      return
    }

    const element = document.querySelector(`[data-toc-id="${id}"]`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="toc">
      <h2 className="toc-title">Table of Contents</h2>
      <ul className="toc-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`toc-item toc-item-level-${item.level} ${
              item.isActive ? "is-active" : ""
            }`}
            data-level={item.level}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                handleClick(item.id)
              }}
              className="toc-link"
            >
              {item.textContent}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
