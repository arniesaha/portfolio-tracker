import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ToastProvider } from './components/common/Toast';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import Dashboard from './pages/Dashboard';
import Holdings from './pages/Holdings';
import Transactions from './pages/Transactions';
import News from './pages/News';
import { useRefreshPrices, usePortfolioSummary, useAppStatus } from './hooks/usePortfolio';
import { useEffect, useRef } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Loading overlay component
function LoadingOverlay({ status }) {
  return (
    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center">
          {/* Animated loader */}
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-primary-100 rounded-full" />
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-secondary-900 mb-2">
            Loading Portfolio Data
          </h2>

          <p className="text-secondary-600 mb-4">
            {status?.loading_message || 'Connecting to market data...'}
          </p>

          {/* Holdings count indicator */}
          {status?.holdings_count > 0 && (
            <div className="flex items-center gap-2 text-sm text-secondary-500 mb-2">
              <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Fetching prices for {status.holdings_count} holdings...</span>
            </div>
          )}

          {/* Indeterminate progress bar */}
          <div className="w-full mt-2">
            <div className="w-full bg-secondary-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 rounded-full animate-pulse w-full" />
            </div>
          </div>

          <p className="text-sm text-secondary-400 mt-4">
            This may take a moment on first load...
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrapper component to pass refresh functionality to Header
function AppContent() {
  const queryClient = useQueryClient();
  const refreshPrices = useRefreshPrices();
  const { data: summary, refetch: refetchSummary } = usePortfolioSummary();
  const { data: status } = useAppStatus();
  const wasLoadingRef = useRef(true);

  // Auto-refresh data when loading completes
  useEffect(() => {
    if (wasLoadingRef.current && status?.ready) {
      // Loading just completed, invalidate all queries to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      wasLoadingRef.current = false;
    } else if (status?.is_loading) {
      wasLoadingRef.current = true;
    }
  }, [status?.ready, status?.is_loading, queryClient]);

  const handleRefresh = async () => {
    await refreshPrices.mutateAsync();
  };

  // Show loading overlay while backend is loading initial data
  const showLoadingOverlay = status?.is_loading && !status?.ready;

  return (
    <div className="min-h-screen bg-secondary-50">
      {showLoadingOverlay && <LoadingOverlay status={status} />}
      <Header
        onRefresh={summary?.holdings_count > 0 ? handleRefresh : null}
        isRefreshing={refreshPrices.isPending}
        lastUpdated={summary?.last_updated}
      />
      <Navigation />
      <main className="pb-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/news" element={<News />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
