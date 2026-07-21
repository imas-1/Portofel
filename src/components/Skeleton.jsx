export function SkeletonRow({ height = 62 }) {
  return <div className="skeleton-block" style={{ height, borderRadius: 14, marginBottom: 8 }} />;
}

export function SkeletonCard({ height = 100 }) {
  return <div className="skeleton-block" style={{ height, borderRadius: 16, marginBottom: 10 }} />;
}

export default function SkeletonList({ rows = 4, rowHeight = 62 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} height={rowHeight} />
      ))}
    </div>
  );
}
