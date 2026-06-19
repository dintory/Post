import { cn } from '@/utils/cn'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden',
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-zinc-400 font-medium">
          {fallback?.charAt(0).toUpperCase() || '?'}
        </span>
      )}
    </div>
  )
}
