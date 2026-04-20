export default function LeaderboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
