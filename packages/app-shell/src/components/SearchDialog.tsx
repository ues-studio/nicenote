import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { FileText } from 'lucide-react'

import { HighlightSnippet, SearchDialog as SearchDialogBase } from '@nicenote/ui'

import { useAppShell } from '../context'
import type { AppSearchResult } from '../types'

interface SearchDialogProps {
  open: boolean
  onClose: () => void
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const { t } = useTranslation()
  const { searchNotes, selectNote } = useAppShell()

  const handleSearch = useCallback((query: string) => searchNotes(query), [searchNotes])

  const handleSelect = useCallback(
    (result: AppSearchResult) => {
      selectNote(result.id)
    },
    [selectNote]
  )

  const labels = useMemo(
    () => ({
      title: t('search.title'),
      placeholder: t('search.placeholder'),
      clear: t('search.clear'),
      searching: t('search.searching'),
      noResults: t('search.noResults'),
      hint: t('search.hint'),
    }),
    [t]
  )

  const renderResult = useCallback(
    (result: AppSearchResult, { query, isSelected }: { query: string; isSelected: boolean }) => (
      <>
        <FileText
          className={`mt-0.5 size-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {result.title || t('sidebar.untitled')}
          </div>
          {result.snippet && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              <HighlightSnippet text={result.snippet} query={query} />
            </p>
          )}
        </div>
      </>
    ),
    [t]
  )

  return (
    <SearchDialogBase<AppSearchResult>
      open={open}
      onClose={onClose}
      onSearch={handleSearch}
      getResultKey={(r) => r.id}
      onSelect={handleSelect}
      renderResult={renderResult}
      labels={labels}
    />
  )
}
