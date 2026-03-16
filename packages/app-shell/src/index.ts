// Context
export type { AppShellContextValue } from './context'
export { AppShellContext, useAppShell } from './context'

// Types
export type {
  AppNoteDetail,
  AppNoteItem,
  AppSearchResult,
  AppTagInfo,
  NavItemConfig,
  NoteListItemSlots,
  NoteTagActions,
  SidebarState,
  Toast,
  ToastAction,
  ToastOptions,
} from './types'

// Components
export { EditorErrorBoundary, ErrorBoundary } from './components/ErrorBoundary'
export { NoteEditorPane } from './components/NoteEditorPane'
export { NotesSidebar } from './components/NotesSidebar'
export { SearchDialog } from './components/SearchDialog'
export { SettingsDropdown } from './components/SettingsDropdown'
export { ShortcutsHelpModal } from './components/ShortcutsHelpModal'
export { TagInput } from './components/TagInput'
export { Toasts } from './components/Toasts'

// Hooks
export type { GlobalShortcutActions } from './hooks/useGlobalShortcuts'
export { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
export { useMinuteTicker } from './hooks/useMinuteTicker'

// i18n
export { initI18n } from './i18n'
export { default as i18n } from './i18n'

// Lib
export {
  ICON_BUTTON_CLASS,
  ICON_MD_CLASS,
  ICON_SM_CLASS,
  ROW_WITH_ICON_CLASS,
} from './lib/class-names'
export { getDateLocale } from './lib/date-locale'
export type { ShortcutDefinition } from './lib/shortcuts'
export { formatShortcut, matchesShortcut, MOD_KEY_LABEL, SHORTCUTS } from './lib/shortcuts'
