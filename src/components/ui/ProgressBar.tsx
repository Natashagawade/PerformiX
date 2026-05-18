import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number          // 0–100
  height?: number        // px
  showLabel?: boolean
  className?: string
}

function getColorClass(pct: number) {
  if (pct >= 80) return 'bg-[#16a34a]'
  if (pct >= 50) return 'bg-[#111111]'
  if (pct >= 30) return 'bg-[#b45309]'
  return 'bg-[#dc2626]'
}

export function ProgressBar({ value, height = 4, showLabel = false, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="flex-1 rounded-full overflow-hidden bg-[#f2f2f2]"
        style={{ height }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-700', getColorClass(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] text-[#aaa] w-9 text-right flex-shrink-0">{clamped}%</span>
      )}
    </div>
  )
}
