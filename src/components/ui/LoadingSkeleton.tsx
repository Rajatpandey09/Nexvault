'use client';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'text' | 'stat';
  count?: number;
}

export default function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count });

  if (type === 'card') {
    return (
      <>
        {skeletons.map((_, i) => (
          <div key={i} className="card">
            <div className="skeleton h-12 w-12 rounded-xl mb-4" />
            <div className="skeleton-text mb-2" />
            <div className="skeleton h-8 w-1/2" />
          </div>
        ))}
      </>
    );
  }

  if (type === 'list') {
    return (
      <>
        {skeletons.map((_, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className="skeleton h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <div className="skeleton-text w-3/4 mb-2" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (type === 'stat') {
    return (
      <>
        {skeletons.map((_, i) => (
          <div key={i} className="stat-card group">
            <div className="skeleton h-12 w-12 rounded-xl mb-4" />
            <div className="skeleton h-3 w-20 mb-2" />
            <div className="skeleton h-8 w-16" />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {skeletons.map((_, i) => (
        <div key={i} className="skeleton-text mb-2" />
      ))}
    </>
  );
}
