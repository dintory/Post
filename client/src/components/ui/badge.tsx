import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'success' | 'info' | 'warning' | 'error'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800 text-zinc-300',
  success: 'bg-emerald-500/20 text-emerald-400',
  info: 'bg-blue-500/20 text-blue-400',
  warning: 'bg-amber-500/20 text-amber-400',
  error: 'bg-rose-500/20 text-rose-400',
}

export function Badge({ children, variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
