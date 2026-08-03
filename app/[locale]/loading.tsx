export default function Loading() {
  return (
    <main className="min-h-screen bg-orech-paper">
      {/* Skeleton hero */}
      <div className="pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 text-center">
          <div className="mx-auto mb-8 h-8 w-64 animate-pulse rounded-full bg-orech-slate" />
          <div className="mx-auto mb-4 h-14 w-full max-w-3xl animate-pulse rounded-xl bg-orech-slate" />
          <div className="mx-auto mb-4 h-14 w-full max-w-2xl animate-pulse rounded-xl bg-orech-slate" />
          <div className="mx-auto mt-8 h-5 w-96 animate-pulse rounded bg-orech-slate" />
          <div className="mt-12 flex justify-center gap-4">
            <div className="h-12 w-48 animate-pulse rounded-lg bg-orech-bronze/20" />
            <div className="h-12 w-48 animate-pulse rounded-lg bg-orech-slate" />
          </div>
        </div>
      </div>

      {/* Skeleton cards */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-20">
        <div className="mb-16">
          <div className="h-10 w-72 animate-pulse rounded bg-orech-slate mb-4" />
          <div className="h-5 w-full max-w-xl animate-pulse rounded bg-orech-slate" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-orech-slate/50 border border-orech-line" />
          ))}
        </div>
      </div>
    </main>
  );
}
