import { EmptyState } from '../components/common/Card';
import LoadingSpinner, { SkeletonCard, SkeletonChart } from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SummaryCards from '../components/dashboard/SummaryCards';
import AllocationCharts from '../components/dashboard/AllocationCharts';
import TopHoldings from '../components/dashboard/TopHoldings';
import PortfolioValueChart from '../components/dashboard/PortfolioValueChart';
import { usePortfolioSummary, useAllocation, usePerformance, useRefreshPrices } from '../hooks/usePortfolio';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

// Icons
const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = usePortfolioSummary();
  const { data: allocation, isLoading: allocationLoading } = useAllocation();
  const { data: performance, isLoading: performanceLoading } = usePerformance();
  const refreshPrices = useRefreshPrices();

  if (summaryLoading) {
    return (
      <div className="container-app py-8">
        <div className="mb-8">
          <div className="h-8 bg-secondary-200 rounded w-48 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonChart />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="container-app py-8">
        <ErrorMessage message="Failed to load portfolio data. Please check if the backend is running." />
      </div>
    );
  }

  const hasHoldings = summary && summary.holdings_count > 0;

  return (
    <div className="container-app py-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-500 mt-1">Overview of your investment portfolio</p>
      </div>

      {!hasHoldings ? (
        <div className="bg-white rounded-xl shadow-soft border border-secondary-100">
          <EmptyState
            icon={ChartIcon}
            title="Welcome to Portfolio Tracker"
            description="Start tracking your investments by adding your first holding. We support stocks from Canadian, US, and Indian markets."
            action={
              <Link to="/holdings">
                <Button icon={PlusIcon}>Add Your First Holding</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Summary Cards */}
          <section>
            <SummaryCards summary={summary} isLoading={summaryLoading} />
          </section>

          {/* Portfolio Value Chart */}
          <section>
            <PortfolioValueChart />
          </section>

          {/* Allocation Charts */}
          <section>
            <AllocationCharts allocation={allocation} isLoading={allocationLoading} />
          </section>

          {/* Top Holdings Table */}
          <section>
            <TopHoldings holdings={allocation?.top_holdings} isLoading={allocationLoading} />
          </section>
        </div>
      )}
    </div>
  );
}
