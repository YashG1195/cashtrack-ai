export default function DashboardLoading() {
  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 p-6 sm:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-lg"></div>
          <div className="h-4 w-96 bg-neutral-200 dark:bg-neutral-800 rounded-lg"></div>
        </div>
        <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
              <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
            </div>
            <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg"></div>
            <div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-800/50 h-[400px]">
          <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-6"></div>
          <div className="h-[300px] w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-800/50 h-[400px]">
          <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                  <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
