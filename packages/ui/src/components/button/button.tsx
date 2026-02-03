import { forwardRef, Fragment, useMemo } from 'react'

// --- Tiptap UI Primitive ---
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'

// --- Lib ---
import { cn, parseShortcutKeys } from '../../lib/utils'

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
    const buttonClasses = useMemo(() => {
      const size = props['data-size'] || 'default'
      const variant = props['data-style'] || 'default'
      const active = props['data-active-state'] === 'on' || props['data-state'] === 'open'

      return cn(
        'flex items-center justify-center text-sm font-medium h-8 min-w-8 border-none p-2 gap-1 rounded-lg transition-all',
        'focus:outline-none focus-visible:outline-none',
        size === 'large' && 'text-[0.9375rem] h-[38px] min-w-[38px] p-[10px]',
        size === 'small' && 'text-xs h-6 min-w-6 p-[5px] rounded-md',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground',
        variant === 'ghost' && 'bg-transparent',
        active && 'bg-active text-accent-foreground',
        'hover:bg-hover',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )
    }, [props, className])

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

export const ButtonGroup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    orientation?: 'horizontal' | 'vertical'
  }
>(({ className, children, orientation = 'vertical', ...props }, ref) => {
  const groupClasses = useMemo(() => {
    const orientationValue = orientation || 'vertical'
    return cn(
      'flex gap-px',
      orientationValue === 'vertical' ? 'flex-col' : 'flex-row',
      'tiptap-button-group',
      className
    )
  }, [orientation, className])

  return (
    <div ref={ref} className={groupClasses} data-orientation={orientation} role="group" {...props}>
      {children}
    </div>
  )
})
ButtonGroup.displayName = 'ButtonGroup'

export default Button
