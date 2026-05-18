export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-6xl page-enter">
      {/* Cycle banner skeleton */}
      <div className="skeleton-card mb-5 flex items-center gap-3 !p-3">
        <div className="w-2 h-2 rounded-full skeleton" />
        <div className="skeleton-text flex-1 max-w-[200px]" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-text w-24 mb-3" />
            <div className="skeleton h-6 w-16 mb-2" />
            <div className="skeleton-text w-20" />
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="skeleton-card">
          <div className="skeleton-text w-32 mb-4" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full skeleton" />
              <div className="flex-1">
                <div className="skeleton-text mb-1.5" />
                <div className="skeleton-text w-2/3" />
              </div>
              <div className="skeleton h-4 w-16 rounded-full" />
            </div>
          ))}
        </div>
        <div className="skeleton-card">
          <div className="skeleton-text w-28 mb-4" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 mb-4">
              <div className="skeleton-avatar !w-6 !h-6" />
              <div className="flex-1">
                <div className="skeleton-text mb-1.5" />
                <div className="skeleton-text w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
