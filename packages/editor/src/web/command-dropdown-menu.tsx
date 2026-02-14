import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nicenote/ui'

import type { NoteToolbarItem } from '../preset-note/toolbar-config'

const DROPDOWN_ITEM_CLASS =
  'flex w-full min-w-40 items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm outline-none cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground'

export interface CommandDropdownOptionRenderState {
  key: string
  label: string
  shortcut?: string
  disabled: boolean
  active: boolean
  icon: ReactNode
  onSelect: () => void
}

export function CommandDropdownMenu({
  triggerLabel,
  triggerIcon,
  triggerActive,
  triggerDisabled,
  isMobile,
  options,
  resolveOption,
}: {
  triggerLabel: string
  triggerIcon: ReactNode
  triggerActive: boolean
  triggerDisabled: boolean
  isMobile: boolean
  options: readonly NoteToolbarItem[]
  resolveOption: (option: NoteToolbarItem) => CommandDropdownOptionRenderState | null
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          aria-label={triggerLabel}
          data-style="ghost"
          data-active-state={triggerActive ? 'on' : 'off'}
          disabled={triggerDisabled}
          showTooltip={false}
          title={!isMobile ? triggerLabel : undefined}
        >
          {triggerIcon}
          <ChevronDown className="nn-editor-toolbar-icon opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent portal sideOffset={6} className="z-70 p-1">
        {options.map((option) => {
          const resolvedOption = resolveOption(option)
          if (!resolvedOption) {
            return null
          }

          return (
            <DropdownMenuItem
              key={resolvedOption.key}
              disabled={resolvedOption.disabled}
              onSelect={resolvedOption.onSelect}
              className={cn(
                DROPDOWN_ITEM_CLASS,
                resolvedOption.active && 'bg-accent text-accent-foreground'
              )}
            >
              <span className="flex items-center gap-2">
                {resolvedOption.icon}
                <span>{resolvedOption.label}</span>
              </span>
              {resolvedOption.shortcut ? (
                <span className="text-meta text-muted-foreground">{resolvedOption.shortcut}</span>
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
