import { forwardRef, Fragment, useMemo } from 'react'

import { parseShortcutKeys } from '../../lib/platform'
import { cn } from '../../lib/utils'
// --- Tiptap UI Primitive ---
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'

// SCSS files are now replaced by Tailwind classes

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  showTooltip?: boolean
  tooltip?: React.ReactNode
  shortcutKeys?: string
  'data-size'?: 'default' | 'small' | 'large'
  'data-style'?: 'default' | 'primary' | 'ghost'
  'data-active-state'?: 'on' | 'off'
  'data-state'?: 'open' | 'closed'
}

export const ShortcutDisplay: React.FC<{ shortcuts: string[] }> = ({ shortcuts }) => {
  if (shortcuts.length === 0) return null

  return (
    <div>
      {shortcuts.map((key, index) => (
        <Fragment key={index}>
          {index > 0 && <kbd>+</kbd>}
          <kbd>{key}</kbd>
        </Fragment>
      ))}
    </div>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      tooltip,
      showTooltip = true,
      shortcutKeys,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const shortcuts = useMemo<string[]>(() => parseShortcutKeys({ shortcutKeys }), [shortcutKeys])

    // --- Tailwind Migration Standard Classes ---
    const dataSize = props['data-size']
    const dataStyle = props['data-style']
    const dataActiveState = props['data-active-state']
    const dataState = props['data-state']

    const buttonClasses = useMemo(() => {
      const size = dataSize || 'default'
      const variant = dataStyle || 'default'
      const active = dataActiveState === 'on' || dataState === 'open'

      return cn(
        'flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border-none p-2 text-sm font-medium transition-all',
        'focus:outline-none focus-visible:outline-none',
        size === 'large' && 'h-9.5 min-w-9.5 p-2.5 text-button',
        size === 'small' && 'h-6 min-w-6 rounded-md p-1.25 text-xs',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground',
        variant === 'ghost' && 'bg-transparent',
        active && 'bg-active text-accent-foreground',
        'hover:bg-hover',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )
    }, [dataSize, dataStyle, dataActiveState, dataState, className])

    if (!tooltip || !showTooltip) {
      return (
        <button className={buttonClasses} ref={ref} aria-label={ariaLabel} {...props}>
          {children}
        </button>
      )
    }

    return (
      <Tooltip delay={200}>
        <TooltipTrigger className={buttonClasses} ref={ref} aria-label={ariaLabel} {...props}>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          {tooltip}
          <ShortcutDisplay shortcuts={shortcuts} />
        </TooltipContent>
      </Tooltip>
    )
  }
)

Button.displayName = 'Button'
