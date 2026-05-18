'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', className }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 px-4 pb-8 overflow-y-auto"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'w-full bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden',
              SIZES[size],
              className
            )}
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-start justify-between px-6 py-4 border-b border-[#e5e5e5]">
                <div>
                  {title && <h2 className="text-[14px] font-semibold text-[#111] tracking-tight">{title}</h2>}
                  {subtitle && <p className="text-[11px] text-[#aaa] mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="text-[#aaa] hover:text-[#111] hover:bg-[#f2f2f2] p-1 rounded-lg transition-colors ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e5e5e5] bg-[#fafafa]">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
