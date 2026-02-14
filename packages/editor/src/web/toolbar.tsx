import { Fragment, type ReactNode } from 'react'

import type { Editor } from '@tiptap/react'
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  type LucideIcon,
  MessageSquareQuote,
  Redo2,
  RotateCcw,
  Strikethrough,
  Text,
} from 'lucide-react'

import { Separator, Toolbar, ToolbarGroup } from '@nicenote/ui'

import { isNoteCommandId, type NoteCommandId, runNoteCommand } from '../core/commands'
import type { NoteEditorStateSnapshot } from '../core/state'
import {
  HEADING_MENU_ITEMS,
  LIST_MENU_ITEMS,
  NOTE_TOOLBAR_GROUPS,
  type NoteToolbarItem,
} from '../preset-note/toolbar-config'

import { ActionToolbarButton } from './action-toolbar-button'
import { CommandDropdownMenu } from './command-dropdown-menu'
import { LinkToolbarButton } from './link-toolbar-button'

interface MinimalToolbarProps {
  editor: Editor | null
  snapshot: NoteEditorStateSnapshot
  isSourceMode: boolean
  isMobile: boolean
  onToggleSourceMode: () => void
}

interface ToolbarItemRenderState {
  active: boolean
  disabled: boolean
  onClick: () => void
  icon: ReactNode
}

type ActionToolbarItem = NoteToolbarItem & {
  id: NoteCommandId | 'sourceMode'
}

const COMMAND_ICON_MAP: Record<NoteCommandId, LucideIcon> = {
  undo: RotateCcw,
  redo: Redo2,
  bold: Bold,
  italic: Italic,
  strike: Strikethrough,
  code: Code,
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
  bulletList: List,
  orderedList: ListOrdered,
  blockquote: MessageSquareQuote,
}

const COMMAND_ACTIVE_SELECTOR: Partial<
  Record<NoteCommandId, (snapshot: NoteEditorStateSnapshot) => boolean>
> = {
  bold: (snapshot) => snapshot.marks.bold,
  italic: (snapshot) => snapshot.marks.italic,
  strike: (snapshot) => snapshot.marks.strike,
  code: (snapshot) => snapshot.marks.code,
  heading1: (snapshot) => snapshot.nodes.heading1,
  heading2: (snapshot) => snapshot.nodes.heading2,
  heading3: (snapshot) => snapshot.nodes.heading3,
  bulletList: (snapshot) => snapshot.nodes.bulletList,
  orderedList: (snapshot) => snapshot.nodes.orderedList,
  blockquote: (snapshot) => snapshot.nodes.blockquote,
}

const COMMAND_DISABLED_SELECTOR: Partial<
  Record<NoteCommandId, (snapshot: NoteEditorStateSnapshot) => boolean>
> = {
  undo: (snapshot) => !snapshot.canUndo,
  redo: (snapshot) => !snapshot.canRedo,
}

function assertNever(value: string): never {
  throw new Error(`Unhandled toolbar item id: ${value}`)
}

function getHeadingMenuIcon(snapshot: NoteEditorStateSnapshot): ReactNode {
  if (snapshot.nodes.heading3) return <Heading3 className="nn-editor-toolbar-icon" />
  if (snapshot.nodes.heading2) return <Heading2 className="nn-editor-toolbar-icon" />
  return <Heading1 className="nn-editor-toolbar-icon" />
}

function getListMenuIcon(snapshot: NoteEditorStateSnapshot): ReactNode {
  if (snapshot.nodes.orderedList) return <ListOrdered className="nn-editor-toolbar-icon" />
  return <List className="nn-editor-toolbar-icon" />
}

function getCommandItemIcon(commandId: NoteCommandId): ReactNode {
  const Icon = COMMAND_ICON_MAP[commandId]
  return <Icon className="nn-editor-toolbar-icon" />
}

function getSourceModeIcon(): ReactNode {
  return <Text className="nn-editor-toolbar-icon" />
}

function getCommandRenderState(
  commandId: NoteCommandId,
  editor: Editor,
  snapshot: NoteEditorStateSnapshot
): Pick<ToolbarItemRenderState, 'active' | 'disabled' | 'onClick'> {
  const isActive = COMMAND_ACTIVE_SELECTOR[commandId]?.(snapshot) ?? false
  const isDisabled = COMMAND_DISABLED_SELECTOR[commandId]?.(snapshot) ?? false

  return {
    active: isActive,
    disabled: isDisabled,
    onClick: () => {
      runNoteCommand(editor, commandId)
    },
  }
}

function isHeadingMenuActive(snapshot: NoteEditorStateSnapshot): boolean {
  return snapshot.nodes.heading1 || snapshot.nodes.heading2 || snapshot.nodes.heading3
}

function isListMenuActive(snapshot: NoteEditorStateSnapshot): boolean {
  return snapshot.nodes.bulletList || snapshot.nodes.orderedList
}

function getHeadingMenuLabel(snapshot: NoteEditorStateSnapshot): string {
  if (snapshot.nodes.heading3) return '标题3'
  if (snapshot.nodes.heading2) return '标题2'
  if (snapshot.nodes.heading1) return '标题1'
  return '标题'
}

function getListMenuLabel(snapshot: NoteEditorStateSnapshot): string {
  if (snapshot.nodes.orderedList) return '有序列表'
  if (snapshot.nodes.bulletList) return '无序列表'
  return '列表'
}

function resolveCommandDropdownOption(
  option: NoteToolbarItem,
  editor: Editor | null,
  snapshot: NoteEditorStateSnapshot
) {
  if (!isNoteCommandId(option.id) || !editor) {
    return null
  }

  const commandId: NoteCommandId = option.id
  const OptionIcon = COMMAND_ICON_MAP[commandId]
  const active = COMMAND_ACTIVE_SELECTOR[commandId]?.(snapshot) ?? false
  const disabled = COMMAND_DISABLED_SELECTOR[commandId]?.(snapshot) ?? false

  return {
    key: commandId,
    label: option.label,
    disabled,
    active,
    icon: <OptionIcon className="nn-editor-toolbar-icon" />,
    onSelect: () => {
      runNoteCommand(editor, commandId)
    },
    ...(option.shortcut ? { shortcut: option.shortcut } : {}),
  }
}

function getToolbarItemRenderState(
  item: ActionToolbarItem,
  options: {
    editor: Editor | null
    snapshot: NoteEditorStateSnapshot
    isSourceMode: boolean
    onToggleSourceMode: () => void
  }
): ToolbarItemRenderState {
  const { editor, snapshot, isSourceMode, onToggleSourceMode } = options

  if (item.id === 'sourceMode') {
    return {
      active: isSourceMode,
      disabled: !editor,
      onClick: onToggleSourceMode,
      icon: getSourceModeIcon(),
    }
  }

  if (!editor || isSourceMode) {
    return {
      active: false,
      disabled: true,
      onClick: () => undefined,
      icon: getCommandItemIcon(item.id),
    }
  }

  const { active, disabled, onClick } = getCommandRenderState(item.id, editor, snapshot)

  return {
    active,
    disabled,
    onClick,
    icon: getCommandItemIcon(item.id),
  }
}

export function MinimalToolbar({
  editor,
  snapshot,
  isSourceMode,
  isMobile,
  onToggleSourceMode,
}: MinimalToolbarProps) {
  return (
    <Toolbar variant="floating" className="nn-editor-toolbar">
      {NOTE_TOOLBAR_GROUPS.map((group, groupIndex) => (
        <Fragment key={groupIndex}>
          <ToolbarGroup>
            {group.map((item) => {
              switch (item.id) {
                case 'headingMenu':
                  return (
                    <CommandDropdownMenu
                      key={item.id}
                      triggerLabel={getHeadingMenuLabel(snapshot)}
                      triggerIcon={getHeadingMenuIcon(snapshot)}
                      triggerActive={isHeadingMenuActive(snapshot)}
                      triggerDisabled={!editor || isSourceMode}
                      isMobile={isMobile}
                      options={HEADING_MENU_ITEMS}
                      resolveOption={(option) =>
                        resolveCommandDropdownOption(option, editor, snapshot)
                      }
                    />
                  )
                case 'listMenu':
                  return (
                    <CommandDropdownMenu
                      key={item.id}
                      triggerLabel={getListMenuLabel(snapshot)}
                      triggerIcon={getListMenuIcon(snapshot)}
                      triggerActive={isListMenuActive(snapshot)}
                      triggerDisabled={!editor || isSourceMode}
                      isMobile={isMobile}
                      options={LIST_MENU_ITEMS}
                      resolveOption={(option) =>
                        resolveCommandDropdownOption(option, editor, snapshot)
                      }
                    />
                  )
                case 'link':
                  return (
                    <LinkToolbarButton
                      key={item.id}
                      editor={editor}
                      snapshot={snapshot}
                      isSourceMode={isSourceMode}
                      isMobile={isMobile}
                      label={item.label}
                      {...(item.shortcut ? { shortcut: item.shortcut } : {})}
                    />
                  )
                default: {
                  const isActionItem = item.id === 'sourceMode' || isNoteCommandId(item.id)

                  if (!isActionItem) {
                    return assertNever(item.id)
                  }

                  const { active, disabled, onClick, icon } = getToolbarItemRenderState(
                    item as ActionToolbarItem,
                    {
                      editor,
                      snapshot,
                      isSourceMode,
                      onToggleSourceMode,
                    }
                  )

                  return (
                    <ActionToolbarButton
                      id={item.id}
                      label={item.label}
                      isMobile={isMobile}
                      active={active}
                      disabled={disabled}
                      onClick={onClick}
                      icon={icon}
                      {...(item.shortcut ? { shortcut: item.shortcut } : {})}
                    />
                  )
                }
              }
            })}
          </ToolbarGroup>
          {groupIndex < NOTE_TOOLBAR_GROUPS.length - 1 ? <Separator /> : null}
        </Fragment>
      ))}
    </Toolbar>
  )
}
