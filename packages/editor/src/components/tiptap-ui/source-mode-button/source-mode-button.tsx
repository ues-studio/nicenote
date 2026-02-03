'use client'

import { Button } from '@nicenote/ui'
import { FileCode } from 'lucide-react'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { cn } from '@/lib/tiptap-utils'
import type { Editor } from '@tiptap/react'

export interface SourceModeButtonConfig {
  /**
   * The Tiptap editor instance
   */
  editor?: Editor | null
  /**
   * Whether source mode is active
   */
  isActive?: boolean
  /**
   * Callback when toggle button is clicked
   */
  onToggle?: () => void
}

/**
 * Button component for toggling between WYSIWYG and source code mode
 */
export function SourceModeButton({
  editor: providedEditor,
  isActive = false,
  onToggle,
}: SourceModeButtonConfig) {
  const { editor } = useTiptapEditor(providedEditor)

  if (!editor) return null

  return (
    <Button
      data-style="ghost"
      data-active-state={isActive ? 'on' : 'off'}
      onClick={onToggle}
      aria-label={isActive ? 'Switch to WYSIWYG mode' : 'Switch to source code mode'}
      title={isActive ? 'WYSIWYG Mode' : 'Source Code Mode'}
    >
      <FileCode className={cn('w-4 h-4 shrink-0', 'tiptap-button-icon')} />
    </Button>
  )
}
