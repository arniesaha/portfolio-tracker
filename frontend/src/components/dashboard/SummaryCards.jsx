import { formatCurrency, formatPercent } from '../../utils/formatters';
import { SkeletonCard } from '../common/LoadingSpinner';

// Icons for each stat card
const WalletIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1 10h22" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BankIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 6l7-3 7 3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 10v11" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 10v11" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 14v3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 14v3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 14v3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrendUpIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 6l-9.5 9.5-5-5L1 18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 6h6v6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <path d="M16 2v4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 2v4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);

function StatCard({ title, value, subtitle, trend, icon: Icon, iconBgColor, iconColor }) {
  const isPositive = trend === undefined || trend >= 0;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-secondary-100 p-5 sm:p-6 transition-all duration-200 hover:shadow-soft-lg hover:border-secondary-200 relative">
      {Icon && (
        <div className={`absolute top-4 right-4 ${iconBgColor} ${iconColor} p-2.5 rounded-xl`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-secondary-500 pr-12">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-secondary-900 mt-2 tabular-nums">
          {value}
        </p>
        {subtitle !== undefined && (
          <div className="flex items-center gap-1.5 mt-2">
            {trend !== undefined && (
              <span className={`flex items-center ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
                {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
              </span>
            )}
            <p className={`text-sm font-medium ${
              trend !== undefined
                ? isPositive ? 'text-success-600' : 'text-danger-600'
                : 'text-secondary-500'
            }`}>
              {subtitle}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SummaryCards({ summary, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const cards = [
    {
      title: 'Total Portfolio Value',
      value: formatCurrency(summary.total_value_cad, 'CAD'),
      subtitle: `${summary.holdings_count} holding${summary.holdings_count !== 1 ? 's' : ''}`,
      icon: WalletIcon,
      iconBgColor: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      title: 'Total Cost Basis',
      value: formatCurrency(summary.total_cost_cad, 'CAD'),
      subtitle: 'Total invested',
      icon: BankIcon,
      iconBgColor: 'bg-secondary-100',
      iconColor: 'text-secondary-600',
    },
    {
      title: 'Unrealized Gain/Loss',
      value: formatCurrency(summary.unrealized_gain_cad, 'CAD'),
      subtitle: formatPercent(summary.unrealized_gain_pct),
      trend: summary.unrealized_gain_pct,
      icon: TrendUpIcon,
      iconBgColor: summary.unrealized_gain_pct >= 0 ? 'bg-success-100' : 'bg-danger-100',
      iconColor: summary.unrealized_gain_pct >= 0 ? 'text-success-600' : 'text-danger-600',
    },
    {
      title: "Today's Change",
      value: formatCurrency(summary.today_change_cad, 'CAD'),
      subtitle: formatPercent(summary.today_change_pct),
      trend: summary.today_change_pct,
      icon: CalendarIcon,
      iconBgColor: summary.today_change_pct >= 0 ? 'bg-success-100' : 'bg-danger-100',
      iconColor: summary.today_change_pct >= 0 ? 'text-success-600' : 'text-danger-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
}
