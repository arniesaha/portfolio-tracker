import { Link, useLocation } from 'react-router-dom';

// Navigation icons
const DashboardIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const HoldingsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 2v4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 2v4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18" cy="18" r="3" />
    <path d="M18 16v4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 18h4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TransactionsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 11l4-4-4-4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 7H9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 21l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 17h12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InsightsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', shortLabel: 'Home', icon: DashboardIcon },
    { path: '/holdings', label: 'Holdings', shortLabel: 'Holdings', icon: HoldingsIcon },
    { path: '/transactions', label: 'Transactions', shortLabel: 'Activity', icon: TransactionsIcon },
    { path: '/news', label: 'Insights', shortLabel: 'Insights', icon: InsightsIcon },
  ];

  return (
    <nav className="bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 sticky top-0 z-30 transition-colors duration-200">
      <div className="container-app">
        {/* Horizontal scrollable tabs - always visible */}
        <div className="flex items-center overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-2 px-4 py-3 sm:py-4 font-medium text-sm whitespace-nowrap
                  border-b-2 transition-all duration-200 flex-shrink-0
                  ${isActive
                    ? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:border-secondary-600'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                {/* Show short label on mobile, full label on desktop */}
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
