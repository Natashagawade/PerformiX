import type { Metadata } from 'next'
import '@/styles/globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: { default: 'PerformiX', template: '%s — PerformiX' },
  description: 'Enterprise Goal Management Platform — Set, track, and achieve organizational goals with clarity.',
  keywords: ['goal management', 'OKR', 'performance', 'enterprise', 'HR'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '10px', fontSize: '13px' },
          }}
        />
      </body>
    </html>
  )
}
