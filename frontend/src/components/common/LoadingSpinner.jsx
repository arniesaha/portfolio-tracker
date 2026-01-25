export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="relative">
        <div className={`${sizes[size]} rounded-full border-4 border-secondary-200`}></div>
        <div className={`${sizes[size]} rounded-full border-4 border-primary-600 border-t-transparent animate-spin absolute top-0 left-0`}></div>
      </div>
    </div>
  );
}

// Skeleton loaders for different content types
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-soft border border-secondary-100 p-6 animate-pulse">
      <div className="h-4 bg-secondary-200 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-secondary-200 rounded w-2/3 mb-2"></div>
      <div className="h-4 bg-secondary-200 rounded w-1/4"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="bg-white rounded-xl shadow-soft border border-secondary-100 overflow-hidden animate-pulse">
      <div className="bg-secondary-50 px-6 py-4 border-b border-secondary-100">
        <div className="flex gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-secondary-200 rounded w-20"></div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-secondary-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex gap-8">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="h-4 bg-secondary-200 rounded w-20"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl shadow-soft border border-secondary-100 p-6 animate-pulse">
      <div className="h-6 bg-secondary-200 rounded w-1/4 mb-6"></div>
      <div className="h-64 bg-secondary-100 rounded-lg flex items-end justify-around px-4 pb-4 gap-2">
        {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
          <div
            key={i}
            className="bg-secondary-200 rounded-t w-8"
            style={{ height: `${height}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

// Full page loading state
export function PageLoader() {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-secondary-500 font-medium">Loading...</p>
    </div>
  );
}

// Inline loading state
export function InlineLoader({ text = 'Loading...' }) {
  return (
    <div className="flex items-center gap-2 text-secondary-500">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-sm">{text}</span>
    </div>
  );
}
