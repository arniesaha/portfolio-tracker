import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

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

const NewsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 14h-8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 18h-5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 6h8v4h-8V6Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MenuIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: DashboardIcon },
    { path: '/holdings', label: 'Holdings', icon: HoldingsIcon },
    { path: '/transactions', label: 'Transactions', icon: TransactionsIcon },
    { path: '/news', label: 'News & Insights', icon: NewsIcon },
  ];

  const NavLink = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <Link
        to={item.path}
        onClick={() => mobile && setMobileMenuOpen(false)}
        className={`
          flex items-center gap-2 font-medium transition-all duration-200
          ${mobile
            ? `w-full px-4 py-3 rounded-lg ${isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
              }`
            : `py-4 px-3 border-b-2 text-sm ${isActive
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`
          }
        `}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-secondary-200 sticky top-0 z-30">
      <div className="container-app">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </div>

        {/* Mobile Navigation Header */}
        <div className="md:hidden flex items-center justify-between py-3">
          <span className="text-sm font-medium text-secondary-700">
            {navItems.find(item => item.path === location.pathname)?.label || 'Menu'}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <CloseIcon className="w-5 h-5" />
            ) : (
              <MenuIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-slide-down">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink key={item.path} item={item} mobile />
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
