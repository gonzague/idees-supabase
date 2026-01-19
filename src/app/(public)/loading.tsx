export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
