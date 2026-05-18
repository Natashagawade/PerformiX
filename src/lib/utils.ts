import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateProgress(achieved: number, target: number, uom: string): number {
  if (uom === 'ZERO_BASED') return achieved === 0 ? 100 : 0
  if (target === 0) return 0
  return Math.min(100, Math.round((achieved / target) * 100))
}

export function getProgressColor(pct: number): string {
  if (pct >= 80) return '#16a34a'
  if (pct >= 50) return '#111111'
  if (pct >= 30) return '#b45309'
  return '#dc2626'
}

export function getProgressBarClass(pct: number): string {
  if (pct >= 80) return 'bg-[#16a34a]'
  if (pct >= 50) return 'bg-[#111111]'
  if (pct >= 30) return 'bg-[#b45309]'
  return 'bg-[#dc2626]'
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.round(diff / 60000)
  const hrs = Math.round(diff / 3600000)
  const days = Math.round(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'APPROVED': return 'success'
    case 'PENDING': return 'warning'
    case 'REJECTED': return 'danger'
    case 'RETURNED': return 'warning'
    case 'DRAFT': return 'neutral'
    default: return 'neutral'
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Draft', PENDING: 'Pending', APPROVED: 'Approved',
    REJECTED: 'Rejected', RETURNED: 'Returned', NOT_STARTED: 'Not started',
    ON_TRACK: 'On track', AT_RISK: 'At risk', COMPLETED: 'Completed',
  }
  return labels[status] || status
}

export function getUoMLabel(uom: string): string {
  const labels: Record<string, string> = {
    NUMERIC: 'Numeric', PERCENTAGE: 'Percentage', TIMELINE: 'Timeline', ZERO_BASED: 'Zero-based'
  }
  return labels[uom] || uom
}

export function formatTarget(target: number, uom: string): string {
  if (uom === 'PERCENTAGE') return `${target}%`
  if (uom === 'TIMELINE') return `${target}%`
  return `${target}`
}

export function validateWeightage(goals: { weightage: number }[], newWeight: number, excludeId?: string): { valid: boolean; total: number; message: string } {
  const total = goals.reduce((a, g) => a + g.weightage, 0)
  const projected = total + newWeight
  if (newWeight < 10) return { valid: false, total: projected, message: 'Minimum weightage is 10%' }
  if (projected > 100) return { valid: false, total: projected, message: `Total would exceed 100% (current: ${total}%)` }
  return { valid: true, total: projected, message: `Valid · total will be ${projected}%` }
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (typeof window === 'undefined') return
  const headers = Object.keys(data[0] || {})
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${filename}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export const THRUST_AREAS = [
  'Revenue Growth', 'Customer Success', 'Product Delivery',
  'Efficiency', 'Development', 'Innovation', 'People & Culture',
  'Compliance & Risk', 'Technology', 'Market Expansion',
]

export const QUARTER_WINDOWS: Record<string, { label: string; open: number; close: number }> = {
  GOAL_SETTING: { label: 'Goal Setting', open: 5, close: 5 },
  Q1: { label: 'Q1 Check-in', open: 7, close: 7 },
  Q2: { label: 'Q2 Check-in', open: 10, close: 10 },
  Q3: { label: 'Q3 Check-in', open: 1, close: 1 },
  Q4: { label: 'Q4 Check-in', open: 3, close: 4 },
}
