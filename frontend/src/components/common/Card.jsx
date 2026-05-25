export default function Card({
  children,
  className = '',
  padding = 'default',
  hover = false,
  onClick,
  ...props
}) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`
        bg-white dark:bg-[#10161d] rounded-lg shadow-none border border-secondary-200/80 dark:border-secondary-800
        ${paddingStyles[padding]}
        ${hover ? 'transition-all duration-200 hover:bg-[#fbfcf9] dark:hover:bg-[#141b23] hover:border-secondary-300 dark:hover:border-secondary-700 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

// Card with header section
export function CardWithHeader({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}) {
  return (
    <div className={`bg-white dark:bg-[#10161d] rounded-lg shadow-none border border-secondary-200/80 dark:border-secondary-800 ${className}`}>
      <div className="px-5 py-4 border-b border-secondary-200/80 dark:border-secondary-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">{title}</h3>
          {subtitle && <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className={`p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

// Stat Card for dashboard
export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconBgColor = 'bg-primary-100 dark:bg-primary-900/50',
  iconColor = 'text-primary-600 dark:text-primary-400',
}) {
  const isPositive = trend === undefined || trend >= 0;

  return (
    <div className="bg-white dark:bg-[#10161d] rounded-lg shadow-none border border-secondary-200/80 dark:border-secondary-800 p-5 transition-all duration-200 hover:bg-[#fbfcf9] dark:hover:bg-[#141b23] hover:border-secondary-300 dark:hover:border-secondary-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100 mt-2 tabular-nums">
            {value}
          </p>
          {subtitle !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend !== undefined && (
                <span className={`flex items-center ${isPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                  {isPositive ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                </span>
              )}
              <p className={`text-sm font-medium ${
                trend !== undefined
                  ? isPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                  : 'text-secondary-500 dark:text-secondary-400'
              }`}>
                {subtitle}
              </p>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${iconBgColor} ${iconColor} p-2.5 rounded-lg`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State Card
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-2xl flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-secondary-400 dark:text-secondary-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">{title}</h3>
      {description && (
        <p className="text-secondary-500 dark:text-secondary-400 max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
