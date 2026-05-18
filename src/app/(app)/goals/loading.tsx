export default function GoalsLoading() {
  return (
    <div className="p-6 max-w-5xl page-enter">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="skeleton-title mb-2" />
          <div className="skeleton-text w-48" />
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      {/* Weightage bar */}
      <div className="skeleton-card mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="skeleton-text w-32" />
          <div className="skeleton-text w-16" />
        </div>
        <div className="skeleton h-1.5 w-full rounded-full" />
      </div>

      {/* Filter buttons */}
      <div className="flex gap-1.5 mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-7 w-20 rounded-lg" />
        ))}
      </div>

      {/* Goal cards */}
      <div className="space-y-2.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-card">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full skeleton mt-2" />
              <div className="flex-1">
                <div className="skeleton-title mb-2" />
                <div className="skeleton-text w-2/3 mb-3" />
                <div className="flex items-center gap-3">
                  <div className="skeleton h-1 flex-1 max-w-xs rounded-full" />
                  <div className="skeleton-text w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
