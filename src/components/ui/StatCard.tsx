import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  subColor?: 'green' | 'red' | 'amber' | 'muted'
  icon?: LucideIcon
  className?: string
}

const SUB_COLORS = {
  green: 'text-[#16a34a]',
  red: 'text-[#dc2626]',
  amber: 'text-[#b45309]',
  muted: 'text-[#aaa]',
}

export function StatCard({ label, value, sub, subColor = 'muted', icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn('bg-white border border-[#e5e5e5] rounded-xl p-4', className)}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider">{label}</div>
        {Icon && <Icon className="w-3.5 h-3.5 text-[#ddd]" />}
      </div>
      <div className="text-[22px] font-semibold text-[#111] tracking-tight leading-none mb-1.5">
        {value}
      </div>
      {sub && (
        <div className={cn('text-[11px]', SUB_COLORS[subColor])}>{sub}</div>
      )}
    </div>
  )
}
