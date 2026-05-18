export default function PageLoading() {
  return (
    <div className="p-6 max-w-5xl page-enter">
      <div className="mb-5">
        <div className="skeleton-title mb-2" />
        <div className="skeleton-text w-48" />
      </div>
      <div className="skeleton-card">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton-avatar" />
              <div className="flex-1">
                <div className="skeleton-text mb-1.5" />
                <div className="skeleton-text w-2/3" />
              </div>
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
