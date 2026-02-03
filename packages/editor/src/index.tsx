// Wrapper for SimpleEditor to support Nicenote's interface
import { EditorContent, EditorContext, useEditor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'

// Copy the same extensions configuration from SimpleEditor
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TableOfContents } from '@tiptap/extension-table-of-contents'
import { TextAlign } from '@tiptap/extension-text-align'
import { Typography } from '@tiptap/extension-typography'
import { Selection } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { all, createLowlight } from 'lowlight'

import { HorizontalRule } from '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension'
import { ImageUploadNode } from '@/components/tiptap-node/image-upload-node/image-upload-node-extension'
import { handleImageUpload, MAX_FILE_SIZE } from '@/lib/tiptap-utils'

// UI Components from SimpleEditor
import { CodeBlockComponent } from '@/components/tiptap-node/code-block-node/code-block'
import { Button, cn, Spacer, Toolbar, ToolbarGroup, ToolbarSeparator } from '@nicenote/ui'
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button'
import { CodeBlockButton } from '@/components/tiptap-ui/code-block-button'
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu'
import { ImageUploadButton } from '@/components/tiptap-ui/image-upload-button'
import { LinkButton, LinkContent, LinkPopover } from '@/components/tiptap-ui/link-popover'
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu'
import { MarkButton } from '@/components/tiptap-ui/mark-button'
import { SourceModeButton } from '@/components/tiptap-ui/source-mode-button'
import { ToC } from '@/components/tiptap-ui/table-of-contents'
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button'
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button'
import { useCursorVisibility } from '@/hooks/use-cursor-visibility'
import { useIsBreakpoint, useWindowSize } from '@nicenote/ui'
import { ArrowLeft, Link } from 'lucide-react'

import '@/styles/editor-styles.css'

interface EditorProps {
  initialContent?: string
  onChange?: (content: string) => void
  isSourceMode?: boolean
  onSourceModeChange?: (isSourceMode: boolean) => void
}

const lowlight = createLowlight(all)

const MainToolbarContent = ({
  onLinkClick,
  isMobile,
  isSourceMode,
  onToggleSourceMode,
}: {
  onLinkClick: () => void
  isMobile: boolean
  isSourceMode: boolean
  onToggleSourceMode: () => void
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu types={['bulletList', 'orderedList', 'taskList']} portal={isMobile} />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        <MarkButton type="highlight" />
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <SourceModeButton isActive={isSourceMode} onToggle={onToggleSourceMode} />
      </ToolbarGroup>

      <Spacer />
    </>
  )
}

const MobileToolbarContent = ({ onBack }: { onBack: () => void }) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeft className={cn('tiptap-button-icon', 'w-4 h-4 flex-shrink-0')} />
        <Link className={cn('tiptap-button-icon', 'w-4 h-4 flex-shrink-0')} />
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    <LinkContent />
  </>
)

export function Editor({
  initialContent = '',
  onChange,
  isSourceMode: externalIsSourceMode,
  onSourceModeChange,
}: EditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<'main' | 'link'>('main')
  const [internalIsSourceMode, setInternalIsSourceMode] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const isInitializing = useRef(true)
  const lastContent = useRef<string | null>(null)

  // Use external state if provided, otherwise use internal state
  const isSourceMode =
    externalIsSourceMode !== undefined ? externalIsSourceMode : internalIsSourceMode
  const setIsSourceMode = onSourceModeChange || setInternalIsSourceMode

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        'aria-label': 'Main content area, start typing to enter text.',
        class: 'simple-editor',
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent)
        },
      }).configure({ lowlight }),
      HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: 'image/*',
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error: Error) => console.error('Upload failed:', error),
      }),
      TableOfContents,
      Placeholder.configure({
        placeholder: '输入 " / " 快速插入内容',
      }),
      // Markdown MUST be the last extension
      Markdown,
    ],
    onCreate: () => {
      isInitializing.current = false
    },
    // Don't set content here - let useEffect handle it after editor is ready
    onUpdate: ({ editor }) => {
      // Only trigger onChange if not initializing (user is actually editing)
      if (!isInitializing.current) {
        const markdown = editor.getMarkdown()
        onChange?.(markdown)
        lastContent.current = markdown
      }
    },
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  // Update editor content when initialContent changes (switching notes)
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentContent = editor.getMarkdown()
      // Only update if content actually changed to avoid unnecessary rerenders
      if (currentContent !== initialContent && lastContent.current !== initialContent) {
        // Set initializing flag to prevent onChange from firing
        isInitializing.current = true
        // Use setContent with contentType: 'markdown' to parse Markdown format
        editor.commands.setContent(initialContent, { contentType: 'markdown' })
        lastContent.current = initialContent
        // Clear initializing flag after content is set
        isInitializing.current = false
      }
    }
  }, [editor, initialContent])

  useEffect(() => {
    if (!isMobile && mobileView !== 'main') {
      setMobileView('main')
    }
  }, [isMobile, mobileView])

  const handleToggleSourceMode = () => {
    setIsSourceMode(!isSourceMode)
  }

  return (
    <div className={cn('simple-editor-wrapper editor-wrapper w-full h-full overflow-auto')}>
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          className="sticky top-0 z-10"
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === 'main' ? (
            <MainToolbarContent
              onLinkClick={() => setMobileView('link')}
              isMobile={isMobile}
              isSourceMode={isSourceMode}
              onToggleSourceMode={handleToggleSourceMode}
            />
          ) : (
            <MobileToolbarContent onBack={() => setMobileView('main')} />
          )}
        </Toolbar>

        {isSourceMode ? (
          <div className="simple-editor-content max-w-[820px] w-full mx-auto h-full flex flex-col">
            <textarea
              className="source-code-editor flex-1 w-full p-12 pb-[30vh] font-mono text-sm leading-relaxed bg-transparent border-none outline-none resize-none"
              value={editor?.getMarkdown() || ''}
              onChange={(e) => {
                if (editor) {
                  isInitializing.current = true
                  editor.commands.setContent(e.target.value, { contentType: 'markdown' })
                  lastContent.current = e.target.value
                  isInitializing.current = false
                }
              }}
              onBlur={() => {
                // Trigger onChange when losing focus
                if (editor && onChange) {
                  const markdown = editor.getMarkdown()
                  onChange(markdown)
                }
              }}
              placeholder="Enter Markdown source code..."
              spellCheck={false}
            />
          </div>
        ) : (
          <EditorContent
            editor={editor}
            role="presentation"
            className={cn(
              'simple-editor-content max-w-[820px] w-full mx-auto h-full flex flex-col',
              'prose prose-sm sm:prose-base dark:prose-invert max-w-none'
            )}
          />
        )}

        <ToC editor={editor} />
      </EditorContext.Provider>
    </div>
  )
}
