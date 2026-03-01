import { cn } from '../../lib/utils'

function Input({ className, type, ref, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'tiptap-input flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-muted-foreground focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export { Input }
