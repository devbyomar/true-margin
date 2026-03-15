function Bone({ className }: { className?: string }) {
  return <div className={`animate-shimmer rounded-lg bg-muted/40 ${className ?? ""}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div>
        <Bone className="h-8 w-64" />
        <Bone className="mt-2 h-4 w-48" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-6 shadow-card">
            <div className="flex items-center gap-3">
              <Bone className="h-10 w-10 rounded-lg" />
              <Bone className="h-4 w-24" />
            </div>
            <Bone className="mt-4 h-8 w-16" />
            <Bone className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border bg-white shadow-card">
        <div className="border-b px-6 py-4">
          <Bone className="h-5 w-32" />
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4" style={{ animationDelay: `${i * 80}ms` }}>
              <Bone className="h-4 w-40" />
              <Bone className="h-4 w-24" />
              <Bone className="ml-auto h-4 w-16" />
              <Bone className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JobDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bone className="h-5 w-5" />
        <Bone className="h-6 w-48" />
      </div>

      {/* Margin gauge */}
      <div className="flex justify-center py-8">
        <Bone className="h-32 w-32 rounded-full" />
      </div>

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-4">
            <Bone className="h-3 w-20" />
            <Bone className="mt-2 h-6 w-24" />
          </div>
        ))}
      </div>

      {/* Cost feed */}
      <div className="rounded-xl border bg-white shadow-card">
        <div className="border-b px-6 py-4">
          <Bone className="h-5 w-24" />
        </div>
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <Bone className="h-8 w-8 rounded-lg" />
              <div className="flex-1">
                <Bone className="h-4 w-32" />
                <Bone className="mt-1 h-3 w-20" />
              </div>
              <Bone className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JobsListSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Bone className="h-8 w-24" />
        <Bone className="h-10 w-28 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-5 shadow-card" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <Bone className="h-5 w-40" />
                <Bone className="mt-2 h-3 w-28" />
              </div>
              <div className="flex items-center gap-4">
                <Bone className="h-6 w-16 rounded-full" />
                <Bone className="h-4 w-12" />
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
    <div className="space-y-8">
      <div>
        <Bone className="h-7 w-40" />
        <Bone className="mt-2 h-4 w-64" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border bg-white p-4">
            <Bone className="h-5 w-5" />
            <div className="flex-1">
              <Bone className="h-4 w-28" />
              <Bone className="mt-2 h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
