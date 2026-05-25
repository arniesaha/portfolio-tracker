import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionsAPI, holdingsAPI } from '../services/api';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import ImportModal from '../components/import/ImportModal';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';

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

    const accountLots = new Map();
    const symbolTransactions = transactions
      .filter(t => t.symbol === selectedSymbol && ['TRADE', 'CORPORATE_ACTION'].includes(t.transaction_category))
      .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    symbolTransactions.forEach(txn => {
      const accountKey = `${txn.account_type || ''}:${txn.account_id || ''}`;
      const current = accountLots.get(accountKey) || { shares: 0, cost: 0 };
      const qty = parseFloat(txn.quantity);
      const price = parseFloat(txn.price_per_share);

      if (!Number.isFinite(qty)) return;

      if (txn.transaction_type === 'BUY') {
        if (!Number.isFinite(price)) return;
        current.shares += qty;
        current.cost += qty * price;
      } else if (txn.transaction_type === 'SELL' && current.shares > 0) {
        if (!Number.isFinite(price)) return;
        const sellQty = Math.min(qty, current.shares);
        const costPerShare = current.cost / current.shares;
        current.shares -= sellQty;
        current.cost -= sellQty * costPerShare;
      } else if (txn.transaction_type === 'SPLIT') {
        current.shares += qty;
      }

      accountLots.set(accountKey, current);
    });

    const totalShares = [...accountLots.values()].reduce((sum, lot) => sum + lot.shares, 0);
    const totalCost = [...accountLots.values()].reduce((sum, lot) => sum + lot.cost, 0);

    return {
      shares: totalShares,
      avgCost: totalShares > 0 ? totalCost / totalShares : 0,
      totalCost
    };
  }, [transactions, selectedSymbol]);

  // Get current holding from database. Symbols can exist in multiple accounts
  // (for example XEQT in TFSA/FHSA/non-registered), so aggregate the same
  // symbol scope used by the transaction-side calculation.
  const currentHolding = useMemo(() => {
    if (!holdings || selectedSymbol === 'ALL') return null;
    const symbolHoldings = holdings.filter(h => h.symbol === selectedSymbol);
    if (symbolHoldings.length === 0) return null;

    const totals = symbolHoldings.reduce((acc, holding) => {
      const quantity = parseFloat(holding.quantity);
      const avgCost = parseFloat(holding.avg_purchase_price);

      if (Number.isFinite(quantity) && Number.isFinite(avgCost)) {
        acc.quantity += quantity;
        acc.totalCost += quantity * avgCost;
      }

      return acc;
    }, { quantity: 0, totalCost: 0 });

    return {
      quantity: totals.quantity,
      avg_purchase_price: totals.quantity > 0 ? totals.totalCost / totals.quantity : 0,
      totalCost: totals.totalCost,
      accountCount: symbolHoldings.length,
    };
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
    <div className="container-app py-5 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase text-teal-700 dark:text-teal-300 mb-2">Activity ledger</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-secondary-950 dark:text-secondary-100">Transactions</h1>
          <p className="text-secondary-500 dark:text-secondary-400 mt-1">Audit trades, contributions, and position events.</p>
        </div>

        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors cursor-pointer dark:bg-teal-400 dark:text-secondary-950 dark:hover:bg-teal-300 shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Import CSV
        </button>
      </div>

      {/* Symbol filter — horizontally scrollable pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide -mx-1 px-1">
        <button
          onClick={() => setSelectedSymbol('ALL')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            selectedSymbol === 'ALL'
              ? 'bg-secondary-950 text-white border-secondary-950 dark:bg-white dark:text-secondary-950 dark:border-white'
              : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50 dark:bg-secondary-900 dark:text-secondary-300 dark:border-secondary-800 dark:hover:bg-secondary-800'
          }`}
        >
          All ({transactions?.length || 0})
        </button>
        {symbols.filter(s => s).map(symbol => {
          const count = transactions.filter(t => t.symbol === symbol).length;
          const isActive = selectedSymbol === symbol;
          return (
            <button
              key={symbol}
              onClick={() => setSelectedSymbol(symbol)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                isActive
                  ? 'bg-secondary-950 text-white border-secondary-950 dark:bg-white dark:text-secondary-950 dark:border-white'
                  : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50 dark:bg-secondary-900 dark:text-secondary-300 dark:border-secondary-800 dark:hover:bg-secondary-800'
              }`}
            >
              {symbol} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Holdings Comparison Card */}
      {selectedSymbol !== 'ALL' && calculatedHolding && (
        <Card className="mb-5" padding="none">
          <div className="p-5">
            <h3 className="text-lg font-semibold text-secondary-950 dark:text-secondary-100 mb-4">
              {selectedSymbol} - Holdings Verification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calculated from Transactions */}
              <div className="md:border-r border-secondary-200 dark:border-secondary-700 md:pr-6">
                <h4 className="text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase mb-3">
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
                <h4 className="text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase mb-3">
                  Current Holdings (Database)
                </h4>
                {currentHolding ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary-600 dark:text-secondary-400">Total Shares:</span>
                    <span className="font-semibold text-secondary-900 dark:text-secondary-100">{currentHolding.quantity.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Avg Cost:</span>
                    <span className="font-semibold text-secondary-900 dark:text-secondary-100">${currentHolding.avg_purchase_price.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Total Cost:</span>
                    <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                        ${currentHolding.totalCost.toFixed(2)}
                      </span>
                    </div>
                    {currentHolding.accountCount > 1 && (
                      <div className="text-xs text-secondary-500 dark:text-secondary-400">
                        Aggregated across {currentHolding.accountCount} accounts
                      </div>
                    )}

                    {/* Match indicator */}
                    <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      {Math.abs(calculatedHolding.shares - currentHolding.quantity) < 0.01 ? (
                        <div className="flex items-center text-teal-700 dark:text-teal-300">
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

      <Card padding="none">
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-800">
              <thead className="bg-[#f9faf7] dark:bg-secondary-900">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Symbol
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Quantity
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Total Value
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#10161d] divide-y divide-secondary-100 dark:divide-secondary-800">
                {sortedTransactions.map((transaction) => {
                  const quantity = parseFloat(transaction.quantity);
                  const price = parseFloat(transaction.price_per_share);
                  const amount = parseFloat(transaction.amount);
                  const isTrade = transaction.transaction_category === 'TRADE';
                  const isCorporateAction = transaction.transaction_category === 'CORPORATE_ACTION';
                  const isPositionEvent = isTrade || isCorporateAction;
                  const totalValue = isTrade && Number.isFinite(quantity) && Number.isFinite(price)
                    ? quantity * price
                    : amount;
                  const isBuy = transaction.transaction_type === 'BUY';
                  const isSell = transaction.transaction_type === 'SELL';
                  const isSplit = transaction.transaction_type === 'SPLIT';
                  const typeClass = isBuy
                    ? 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300'
                    : isSell
                      ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/50 dark:text-danger-300'
                      : isSplit
                        ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300'
                        : 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300';

                  return (
                    <tr key={transaction.id} className="hover:bg-[#f8faf5] dark:hover:bg-secondary-800/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-bold text-secondary-900 dark:text-secondary-100">{transaction.symbol || '-'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${typeClass}`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-secondary-900 dark:text-secondary-100 tabular-nums">
                        {isPositionEvent ? formatNumber(transaction.quantity, 2) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-secondary-900 dark:text-secondary-100 tabular-nums">
                        {isTrade ? formatCurrency(transaction.price_per_share, transaction.currency || 'CAD') : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right text-secondary-900 dark:text-secondary-100 tabular-nums">
                        {formatCurrency(totalValue, transaction.currency || 'CAD')}
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
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <div className="p-4">
            <div className="text-[11px] font-semibold uppercase text-secondary-500 dark:text-secondary-400">
              {selectedSymbol === 'ALL' ? 'Total Buys' : `${selectedSymbol} Buys`}
            </div>
            <div className="text-2xl font-semibold text-teal-700 dark:text-teal-300 mt-1 tabular-nums">
              {sortedTransactions.filter(t => t.transaction_type === 'BUY').length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-[11px] font-semibold uppercase text-secondary-500 dark:text-secondary-400">
              {selectedSymbol === 'ALL' ? 'Total Sells' : `${selectedSymbol} Sells`}
            </div>
            <div className="text-2xl font-semibold text-danger-600 dark:text-danger-400 mt-1 tabular-nums">
              {sortedTransactions.filter(t => t.transaction_type === 'SELL').length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-[11px] font-semibold uppercase text-secondary-500 dark:text-secondary-400">
              {selectedSymbol === 'ALL' ? 'Total Transactions' : `${selectedSymbol} Transactions`}
            </div>
            <div className="text-2xl font-semibold text-secondary-950 dark:text-secondary-100 mt-1 tabular-nums">
              {sortedTransactions.length}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
