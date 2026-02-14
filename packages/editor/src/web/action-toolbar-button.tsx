import type { ReactNode } from 'react'

import { Button } from '@nicenote/ui'

export function ActionToolbarButton({
  id,
  label,
  shortcut,
  isMobile,
  active,
  disabled,
  onClick,
  icon,
}: {
  id: string
  label: string
  shortcut?: string
  isMobile: boolean
  active: boolean
  disabled: boolean
  onClick: () => void
  icon: ReactNode
}) {
  return (
    <Button
      key={id}
      type="button"
      onClick={onClick}
      aria-label={label}
      data-style="ghost"
      data-active-state={active ? 'on' : 'off'}
      disabled={disabled}
      showTooltip={!isMobile}
      {...(!isMobile ? { tooltip: label } : {})}
      {...(shortcut ? { shortcutKeys: shortcut } : {})}
    >
      {icon}
    </Button>
  )
}
