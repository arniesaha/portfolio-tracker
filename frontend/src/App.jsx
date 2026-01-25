import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/common/Toast';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import Dashboard from './pages/Dashboard';
import Holdings from './pages/Holdings';
import Transactions from './pages/Transactions';
import News from './pages/News';
import { useRefreshPrices, usePortfolioSummary } from './hooks/usePortfolio';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Wrapper component to pass refresh functionality to Header
function AppContent() {
  const refreshPrices = useRefreshPrices();
  const { data: summary } = usePortfolioSummary();

  const handleRefresh = async () => {
    await refreshPrices.mutateAsync();
  };

  return (
    <div className="min-h-screen bg-secondary-50">
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
