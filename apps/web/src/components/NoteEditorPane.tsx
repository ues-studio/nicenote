import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { formatDistanceToNow } from 'date-fns'
import { Download, FileText, Plus } from 'lucide-react'

import type { EditorLabels } from '@nicenote/editor'
import { NicenoteEditor } from '@nicenote/editor'

import { useMinuteTicker } from '../hooks/useMinuteTicker'
import { WEB_ICON_SM_CLASS } from '../lib/class-names'
import { getDateLocale } from '../lib/date-locale'
import { downloadBlob, exportNoteAsMarkdown } from '../lib/export'
import { useNoteStore } from '../store/useNoteStore'

import { TagInput } from './TagInput'

interface NoteEditorPaneProps {
  inert?: boolean
  isMobile: boolean
}

export function NoteEditorPane({ inert, isMobile }: NoteEditorPaneProps) {
  const { t, i18n } = useTranslation()
  useMinuteTicker()
  const selectedNoteId = useNoteStore((s) => s.selectedNoteId)
  const selectNote = useNoteStore((s) => s.selectNote)

  // 暂无数据源，当前笔记始终为 null
  const currentNote = null as null | {
    id: string
    title: string
    content: string | null
    updatedAt: string
  }

  const editorLabels: EditorLabels = useMemo(
    () => ({
      toolbar: {
        undo: t('toolbar.undo'),
        redo: t('toolbar.redo'),
        heading: t('toolbar.heading'),
        heading1: t('toolbar.heading1'),
        heading2: t('toolbar.heading2'),
        heading3: t('toolbar.heading3'),
        list: t('toolbar.list'),
        bulletList: t('toolbar.bulletList'),
        orderedList: t('toolbar.orderedList'),
        bold: t('toolbar.bold'),
        italic: t('toolbar.italic'),
        strike: t('toolbar.strike'),
        code: t('toolbar.code'),
        blockquote: t('toolbar.blockquote'),
        link: t('toolbar.link'),
        sourceMode: t('toolbar.sourceMode'),
        cancel: t('toolbar.cancel'),
        apply: t('toolbar.apply'),
      },
      content: {
        editorPlaceholder: t('editorContent.editorPlaceholder'),
        sourcePlaceholder: t('editorContent.sourcePlaceholder'),
        sourceLabel: t('editorContent.sourceLabel'),
      },
      translateValidationError: (key) => t(key),
    }),
    [t]
  )

  const dateLocale = useMemo(() => getDateLocale(i18n.language), [i18n.language])

  const updatedAtLabel = useMemo(() => {
    if (!currentNote?.updatedAt) return null
    const time = formatDistanceToNow(new Date(currentNote.updatedAt), {
      addSuffix: true,
      locale: dateLocale,
    })
    return t('editor.updated', { time })
  }, [currentNote?.updatedAt, dateLocale, t])

  const handleTitleChange = useCallback((_e: React.ChangeEvent<HTMLInputElement>) => {}, [])
  const handleContentChange = useCallback((_content: string) => {}, [])

  // 避免未使用变量的警告
  void selectedNoteId
  void selectNote

  return (
    <main className="flex min-w-0 flex-1 flex-col" {...(inert ? { inert: true } : {})}>
      {currentNote ? (
        <>
          <div className="px-8 pt-12 pb-4">
            <input
              type="text"
              className="w-full border-none text-4xl font-bold ring-0 outline-none placeholder:text-muted-foreground/30"
              placeholder={t('editor.noteTitle')}
              aria-label={t('editor.noteTitleLabel')}
              value={currentNote.title}
              onChange={handleTitleChange}
            />
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{updatedAtLabel}</span>
              <button
                onClick={() => {
                  const blob = exportNoteAsMarkdown(
                    currentNote as Parameters<typeof exportNoteAsMarkdown>[0]
                  )
                  const filename = `${currentNote.title || 'Untitled'}.md`
                  downloadBlob(blob, filename)
                }}
                aria-label={t('export.exportNote')}
                className="ml-auto rounded p-1 text-muted-foreground/50 transition-colors hover:text-foreground"
                title={t('export.exportNote')}
              >
                <Download className={WEB_ICON_SM_CLASS} />
              </button>
            </div>
            <div className="mt-3">
              <TagInput noteId={currentNote.id} noteTags={[]} />
            </div>
          </div>
          <div className="flex-1 overflow-hidden px-8 pb-8">
            <NicenoteEditor
              key={currentNote.id}
              value={currentNote.content ?? ''}
              onChange={handleContentChange}
              labels={editorLabels}
              isMobile={isMobile}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-8 w-8 opacity-20" />
          </div>
          <p className="text-lg font-medium">{t('editor.selectNote')}</p>
          <p className="text-sm opacity-70">{t('editor.selectNoteHint')}</p>
          <button
            onClick={() => {}}
            aria-label={t('editor.createNewNoteLabel')}
            className="mt-6 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className={WEB_ICON_SM_CLASS} />
            {t('editor.createNewNote')}
          </button>
        </div>
      )}
    </main>
  )
}
