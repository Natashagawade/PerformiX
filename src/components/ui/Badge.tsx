import { cn } from '@/lib/utils'

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'black'

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const VARIANTS: Record<Variant, string> = {
  neutral: 'bg-[#f2f2f2] text-[#444] border-[#e5e5e5]',
  success: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  warning: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]',
  danger: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
  black: 'bg-[#111] text-white border-[#111]',
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
      VARIANTS[variant],
      className
    )}>
      {children}
    </span>
  )
}
