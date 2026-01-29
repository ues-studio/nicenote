import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEffect } from 'react'

const lowlight = createLowlight(common)

interface EditorProps {
  initialContent: string
  onChange: (markdown: string) => void
}

export default function Editor({ initialContent, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px] py-4',
      },
    },
    onUpdate: ({ editor }) => {
      const storage = editor.storage as any
      if (storage.markdown) {
        const markdown = storage.markdown.getMarkdown()
        onChange(markdown)
      }
    },
  })

  useEffect(() => {
    if (editor) {
      const storage = editor.storage as any
      if (storage.markdown) {
        const currentMarkdown = storage.markdown.getMarkdown()
        if (initialContent !== currentMarkdown) {
          editor.commands.setContent(initialContent)
        }
      }
    }
  }, [initialContent, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="w-full h-full overflow-y-auto custom-editor">
      <EditorContent editor={editor} />
    </div>
  )
}
