'use client'

import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Card = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-background border border-border rounded-xl shadow-sm overflow-hidden',
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-4 py-3 border-b border-border bg-muted/30', className)}
        {...props}
      />
    )
  }
)
CardHeader.displayName = 'CardHeader'

const CardBody = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('p-2', className)} {...props} />
  }
)
CardBody.displayName = 'CardBody'

const CardItemGroup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    orientation?: 'horizontal' | 'vertical'
  }
>(({ className, orientation = 'vertical', ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-orientation={orientation}
      className={cn(
        'flex gap-1',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
        className
      )}
      {...props}
    />
  )
})
CardItemGroup.displayName = 'CardItemGroup'

const CardGroupLabel = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'pt-3 px-2 pb-1 text-xs font-semibold capitalize text-muted-foreground',
          className
        )}
        {...props}
      />
    )
  }
)
CardGroupLabel.displayName = 'CardGroupLabel'

const CardFooter = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
  }
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardBody, CardItemGroup, CardGroupLabel }
