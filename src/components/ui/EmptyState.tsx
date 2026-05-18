import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-[#f2f2f2] flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-[#ddd]" />
        </div>
      )}
      <p className="text-[13px] font-medium text-[#aaa]">{title}</p>
      {description && <p className="text-[12px] text-[#ccc] mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
