import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  src?: string
  className?: string
}

const SIZES = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-[12px]',
  lg: 'w-12 h-12 text-[14px]',
}

export function Avatar({ name, size = 'sm', src, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover border border-[#e5e5e5]', SIZES[size], className)}
      />
    )
  }
  return (
    <div className={cn(
      'rounded-full bg-[#f2f2f2] border border-[#e5e5e5] flex items-center justify-center font-semibold text-[#444] flex-shrink-0',
      SIZES[size],
      className
    )}>
      {getInitials(name)}
    </div>
  )
}
