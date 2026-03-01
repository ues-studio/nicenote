import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FileUp, Upload, X } from 'lucide-react'

import { WEB_ICON_SM_CLASS } from '../lib/class-names'
import { type ParsedNote, parseMarkdownFile } from '../lib/import'
import { useNoteStore } from '../store/useNoteStore'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  if (!open) return null
  return <ImportDialogInner onClose={onClose} />
}

function ImportDialogInner({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [files, setFiles] = useState<ParsedNote[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const mdFiles = Array.from(fileList).filter(
      (f) => f.name.endsWith('.md') || f.name.endsWith('.markdown')
    )
    const parsed = await Promise.all(mdFiles.map(parseMarkdownFile))
    setFiles((prev) => [...prev, ...parsed])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      void processFiles(e.dataTransfer.files)
    },
    [processFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        void processFiles(e.target.files)
      }
    },
    [processFiles]
  )

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const importNotes = useNoteStore((s) => s.importNotes)

  const handleImportAll = useCallback(async () => {
    setImporting(true)
    try {
      importNotes(files)
      onClose()
    } finally {
      setImporting(false)
    }
  }, [files, importNotes, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label={t('import.title')}
        className="relative w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('import.title')}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className={WEB_ICON_SM_CLASS} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('import.dropzone')}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">{t('import.acceptedFormats')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 max-h-48 space-y-1 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent/50"
              >
                <FileUp className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{file.title}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {files.length > 0 && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setFiles([])}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              {t('import.clearAll')}
            </button>
            <button
              onClick={() => void handleImportAll()}
              disabled={importing}
              className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {importing ? t('import.importing') : t('import.importCount', { count: files.length })}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
