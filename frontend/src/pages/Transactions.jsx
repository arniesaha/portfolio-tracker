import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionsAPI, holdingsAPI } from '../services/api';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import ImportModal from '../components/import/ImportModal';

export default function Transactions() {
  const [selectedSymbol, setSelectedSymbol] = useState('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data: transactions, isLoading, isError } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await transactionsAPI.getAll();
      return response.data;
    },
  });

  const { data: holdings } = useQuery({
    queryKey: ['holdings'],
    queryFn: async () => {
      const response = await holdingsAPI.getAll();
      return response.data;
    },
  });

  // Get unique symbols from transactions
  const symbols = useMemo(() => {
    if (!transactions) return [];
    const uniqueSymbols = [...new Set(transactions.map(t => t.symbol))].sort();
    return uniqueSymbols;
  }, [transactions]);

  // Calculate holdings from filtered transactions
  const calculatedHolding = useMemo(() => {
    if (!transactions || selectedSymbol === 'ALL') return null;

    const symbolTransactions = transactions
      .filter(t => t.symbol === selectedSymbol)
      .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    let totalShares = 0;
    let totalCost = 0;

    symbolTransactions.forEach(txn => {
      const qty = parseFloat(txn.quantity);
      const price = parseFloat(txn.price_per_share);

      if (txn.transaction_type === 'BUY') {
        totalShares += qty;
        totalCost += qty * price;
      } else if (txn.transaction_type === 'SELL') {
        if (totalShares > 0) {
          const costPerShare = totalCost / totalShares;
          totalShares -= qty;
          totalCost -= qty * costPerShare;
        }
      }
    });

    return {
      shares: totalShares,
      avgCost: totalShares > 0 ? totalCost / totalShares : 0,
      totalCost
    };
  }, [transactions, selectedSymbol]);

  // Get current holding from database
  const currentHolding = useMemo(() => {
    if (!holdings || selectedSymbol === 'ALL') return null;
    return holdings.find(h => h.symbol === selectedSymbol);
  }, [holdings, selectedSymbol]);

  if (isLoading) {
    return (
      <div className="container-app py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-app py-8">
        <ErrorMessage message="Failed to load transactions" />
      </div>
    );
  }

  // Filter and sort transactions
  const filteredTransactions = selectedSymbol === 'ALL'
    ? transactions
    : transactions.filter(t => t.symbol === selectedSymbol);

  const sortedTransactions = [...(filteredTransactions || [])].sort((a, b) =>
    new Date(b.transaction_date) - new Date(a.transaction_date)
  );

  return (
    <div className="container-app py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">Transactions</h1>
          <p className="text-secondary-500 dark:text-secondary-400 mt-1">View and manage your transaction history</p>
        </div>

        {/* Filter and Import */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="symbol-filter" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Filter:
            </label>
            <select
              id="symbol-filter"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 cursor-pointer"
            >
              <option value="ALL">All Symbols ({transactions?.length || 0})</option>
              {symbols.map(symbol => {
                const count = transactions.filter(t => t.symbol === symbol).length;
                return (
                  <option key={symbol} value={symbol}>
                    {symbol} ({count})
                  </option>
                );
              })}
            </select>
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import CSV
          </button>
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Holdings Comparison Card */}
      {selectedSymbol !== 'ALL' && calculatedHolding && (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
              {selectedSymbol} - Holdings Verification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calculated from Transactions */}
              <div className="md:border-r border-secondary-200 dark:border-secondary-700 md:pr-6">
                <h4 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase mb-3">
                  Calculated from Transactions
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Total Shares:</span>
                    <span className="font-semibold text-secondary-900 dark:text-secondary-100">{calculatedHolding.shares.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Avg Cost:</span>
                    <span className="font-semibold text-secondary-900 dark:text-secondary-100">${calculatedHolding.avgCost.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Total Cost:</span>
                    <span className="font-semibold text-secondary-900 dark:text-secondary-100">${calculatedHolding.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Current Holdings in Database */}
              <div>
                <h4 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase mb-3">
                  Current Holdings (Database)
                </h4>
                {currentHolding ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary-600 dark:text-secondary-400">Total Shares:</span>
                      <span className="font-semibold text-secondary-900 dark:text-secondary-100">{parseFloat(currentHolding.quantity).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600 dark:text-secondary-400">Avg Cost:</span>
                      <span className="font-semibold text-secondary-900 dark:text-secondary-100">${parseFloat(currentHolding.avg_purchase_price).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600 dark:text-secondary-400">Total Cost:</span>
                      <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                        ${(parseFloat(currentHolding.quantity) * parseFloat(currentHolding.avg_purchase_price)).toFixed(2)}
                      </span>
                    </div>

                    {/* Match indicator */}
                    <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      {Math.abs(calculatedHolding.shares - parseFloat(currentHolding.quantity)) < 0.01 ? (
                        <div className="flex items-center text-success-600 dark:text-success-400">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          <span className="font-medium">Holdings Match!</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-warning-600 dark:text-warning-400">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          <span className="font-medium">Discrepancy Detected</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-secondary-500 dark:text-secondary-400 italic">
                    No current holding found in database
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
              <thead className="bg-secondary-50 dark:bg-secondary-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-100 dark:divide-secondary-800">
                {sortedTransactions.map((transaction) => {
                  const totalValue = parseFloat(transaction.quantity) * parseFloat(transaction.price_per_share);
                  const isBuy = transaction.transaction_type === 'BUY';

                  return (
                    <tr key={transaction.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                        {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-bold text-secondary-900 dark:text-secondary-100">{transaction.symbol}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isBuy
                            ? 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300'
                            : 'bg-danger-100 text-danger-700 dark:bg-danger-900/50 dark:text-danger-300'
                        }`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-secondary-900 dark:text-secondary-100 tabular-nums">
                        {parseFloat(transaction.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-secondary-900 dark:text-secondary-100 tabular-nums">
                        ${parseFloat(transaction.price_per_share).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right text-secondary-900 dark:text-secondary-100 tabular-nums">
                        ${totalValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-500 dark:text-secondary-400 max-w-xs truncate">
                        {transaction.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
              {selectedSymbol === 'ALL' ? 'Total Buys' : `${selectedSymbol} Buys`}
            </div>
            <div className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1 tabular-nums">
              {sortedTransactions.filter(t => t.transaction_type === 'BUY').length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
              {selectedSymbol === 'ALL' ? 'Total Sells' : `${selectedSymbol} Sells`}
            </div>
            <div className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1 tabular-nums">
              {sortedTransactions.filter(t => t.transaction_type === 'SELL').length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
              {selectedSymbol === 'ALL' ? 'Total Transactions' : `${selectedSymbol} Transactions`}
            </div>
            <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mt-1 tabular-nums">
              {sortedTransactions.length}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
