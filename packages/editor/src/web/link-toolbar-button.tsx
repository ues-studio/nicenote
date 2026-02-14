import { useEffect, useState } from 'react'

import type { Editor } from '@tiptap/react'
import { Link2, Link2Off } from 'lucide-react'

import { Button, Input, Popover, PopoverContent, PopoverTrigger } from '@nicenote/ui'

import { clearLink, setLinkHref } from '../core/commands'
import { getLinkValidationError } from '../core/link'
import type { NoteEditorStateSnapshot } from '../core/state'

function getLinkIcon(linkActive: boolean) {
  const LinkIcon = linkActive ? Link2Off : Link2
  return <LinkIcon className="nn-editor-toolbar-icon" />
}

export function LinkToolbarButton({
  editor,
  snapshot,
  isSourceMode,
  isMobile,
  label,
  shortcut,
}: {
  editor: Editor | null
  snapshot: NoteEditorStateSnapshot
  isSourceMode: boolean
  isMobile: boolean
  label: string
  shortcut?: string
}) {
  const [open, setOpen] = useState(false)
  const [hrefInput, setHrefInput] = useState('https://')
  const linkActive = snapshot.marks.link
  const disabled = !editor || isSourceMode
  const validationError = getLinkValidationError(hrefInput)

  useEffect(() => {
    if (!open || !editor) return
    const currentHref = editor.getAttributes('link').href
    setHrefInput(typeof currentHref === 'string' && currentHref.trim() ? currentHref : 'https://')
  }, [open, editor])

  if (linkActive) {
    return (
      <Button
        type="button"
        aria-label={label}
        data-style="ghost"
        data-active-state="on"
        disabled={disabled}
        onClick={() => {
          clearLink(editor)
        }}
        showTooltip={!isMobile}
        {...(!isMobile ? { tooltip: label } : {})}
        {...(shortcut ? { shortcutKeys: shortcut } : {})}
      >
        {getLinkIcon(true)}
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          aria-label={label}
          data-style="ghost"
          data-active-state="off"
          disabled={disabled}
          showTooltip={!isMobile}
          {...(!isMobile ? { tooltip: label } : {})}
          {...(shortcut ? { shortcutKeys: shortcut } : {})}
        >
          {getLinkIcon(false)}
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={8} align="start" className="z-70 w-80 space-y-3 p-3">
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!editor || validationError) return
            setLinkHref(editor, hrefInput.trim())
            setOpen(false)
          }}
        >
          <Input
            type="url"
            value={hrefInput}
            onChange={(event) => {
              setHrefInput(event.target.value)
            }}
            placeholder="https://example.com"
            autoFocus
            aria-invalid={validationError ? 'true' : 'false'}
          />
          <div className="min-h-5 text-xs text-destructive" aria-live="polite">
            {validationError ?? ''}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              data-style="ghost"
              showTooltip={false}
              onClick={() => {
                setOpen(false)
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              data-style="primary"
              showTooltip={false}
              disabled={Boolean(validationError)}
            >
              应用
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
