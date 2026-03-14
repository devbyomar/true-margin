export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-64 rounded-lg bg-muted/40" />
        <div className="mt-2 h-4 w-48 rounded bg-muted/30" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted/40" />
              <div className="h-4 w-24 rounded bg-muted/30" />
            </div>
            <div className="mt-4 h-8 w-16 rounded bg-muted/40" />
            <div className="mt-2 h-3 w-32 rounded bg-muted/20" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border bg-white shadow-card">
        <div className="border-b px-6 py-4">
          <div className="h-5 w-32 rounded bg-muted/40" />
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="h-4 w-40 rounded bg-muted/30" />
              <div className="h-4 w-24 rounded bg-muted/20" />
              <div className="ml-auto h-4 w-16 rounded bg-muted/30" />
              <div className="h-4 w-16 rounded bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JobDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 rounded bg-muted/40" />
        <div className="h-6 w-48 rounded bg-muted/40" />
      </div>

      {/* Margin gauge */}
      <div className="flex justify-center py-8">
        <div className="h-32 w-32 rounded-full bg-muted/30" />
      </div>

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-4">
            <div className="h-3 w-20 rounded bg-muted/30" />
            <div className="mt-2 h-6 w-24 rounded bg-muted/40" />
          </div>
        ))}
      </div>

      {/* Cost feed */}
      <div className="rounded-xl border bg-white shadow-card">
        <div className="border-b px-6 py-4">
          <div className="h-5 w-24 rounded bg-muted/40" />
        </div>
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="h-8 w-8 rounded-lg bg-muted/30" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-muted/30" />
                <div className="mt-1 h-3 w-20 rounded bg-muted/20" />
              </div>
              <div className="h-4 w-16 rounded bg-muted/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JobsListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 rounded bg-muted/40" />
        <div className="h-10 w-28 rounded-lg bg-muted/30" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-5 w-40 rounded bg-muted/30" />
                <div className="mt-2 h-3 w-28 rounded bg-muted/20" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-16 rounded-full bg-muted/30" />
                <div className="h-4 w-12 rounded bg-muted/20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-40 rounded bg-muted/40" />
        <div className="mt-2 h-4 w-64 rounded bg-muted/20" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border bg-white p-4">
            <div className="h-5 w-5 rounded bg-muted/30" />
            <div className="flex-1">
              <div className="h-4 w-28 rounded bg-muted/30" />
              <div className="mt-2 h-9 w-full rounded bg-muted/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
