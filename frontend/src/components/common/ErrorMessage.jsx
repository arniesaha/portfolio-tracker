const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function ErrorMessage({
  message,
  title = 'Error',
  onRetry,
  variant = 'error',
  className = '',
}) {
  const variants = {
    error: {
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      icon: 'text-danger-500',
      title: 'text-danger-800',
      message: 'text-danger-700',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      icon: 'text-warning-500',
      title: 'text-warning-800',
      message: 'text-warning-700',
    },
    info: {
      bg: 'bg-accent-50',
      border: 'border-accent-200',
      icon: 'text-accent-500',
      title: 'text-accent-800',
      message: 'text-accent-700',
    },
  };

  const style = variants[variant] || variants.error;

  return (
    <div className={`${style.bg} ${style.border} border rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${style.icon}`}>
          <AlertIcon />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${style.title}`}>{title}</h3>
          <p className={`mt-1 text-sm ${style.message}`}>
            {message || 'Something went wrong. Please try again.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${style.title} hover:underline`}
            >
              <RefreshIcon />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Full page error state
export function PageError({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this page.',
  onRetry,
}) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-danger-100 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-secondary-900 mb-2">{title}</h2>
      <p className="text-secondary-500 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshIcon />
          Try again
        </button>
      )}
    </div>
  );
}
