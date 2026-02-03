import { forwardRef, useMemo } from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'ghost' | 'white' | 'gray' | 'green' | 'default'
  size?: 'default' | 'small'
  appearance?: 'default' | 'subdued' | 'emphasized'
  trimText?: boolean
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      variant,
      size = 'default',
      appearance = 'default',
      trimText = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const badgeClasses = useMemo(() => {
      const variantClasses: Record<string, string> = {
        default: 'bg-primary/10 text-primary',
        gray: 'bg-muted text-muted-foreground',
        green: 'bg-green-500/10 text-green-600',
        white: 'bg-white text-black border border-border',
        ghost: 'bg-transparent text-muted-foreground',
      }

      const appearanceClasses: Record<string, string> = {
        subdued: 'opacity-80',
        emphasized: 'font-bold shadow-sm',
      }

      return cn(
        'tiptap-badge inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
        variantClasses[variant || 'default'],
        appearanceClasses[appearance || 'default'],
        size === 'small' && 'px-1.5 py-0 text-[10px]',
        trimText && 'truncate max-w-[100px]',
        className
      )
    }, [variant, appearance, size, trimText, className])

    return (
      <div
        ref={ref}
        className={badgeClasses}
        data-style={variant}
        data-size={size}
        data-appearance={appearance}
        data-text-trim={trimText ? 'on' : 'off'}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge
