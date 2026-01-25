import { formatCurrency } from '../../utils/formatters';
import { SkeletonTable } from '../common/LoadingSpinner';

// Country badge colors
const COUNTRY_STYLES = {
  CA: 'bg-red-100 text-red-700',
  US: 'bg-blue-100 text-blue-700',
  IN: 'bg-orange-100 text-orange-700',
};

const COUNTRY_NAMES = {
  CA: 'Canada',
  US: 'USA',
  IN: 'India',
};

export default function TopHoldings({ holdings, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-secondary-100">
        <div className="px-6 py-4 border-b border-secondary-100">
          <h3 className="text-lg font-semibold text-secondary-900">Top Holdings</h3>
          <p className="text-sm text-secondary-500 mt-0.5">Your largest positions by value</p>
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-secondary-100 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Holdings</h3>
        <div className="flex items-center justify-center py-12 text-secondary-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm">No holdings data available</p>
          </div>
        </div>
      </div>
    );
  }

  const topHoldings = holdings.slice(0, 10);
  const maxPercentage = Math.max(...topHoldings.map(h => h.percentage));

  return (
    <div className="bg-white rounded-xl shadow-soft border border-secondary-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary-100">
        <h3 className="text-lg font-semibold text-secondary-900">Top Holdings</h3>
        <p className="text-sm text-secondary-500 mt-0.5">Your largest positions by value</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-secondary-50 border-b border-secondary-100">
              <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                Value (CAD)
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider w-48">
                Weight
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100">
            {topHoldings.map((holding, index) => (
              <tr
                key={holding.symbol}
                className="hover:bg-secondary-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 text-xs font-medium">
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-semibold text-secondary-900">{holding.symbol}</div>
                    <div className="text-xs text-secondary-500 truncate max-w-[200px]">
                      {holding.company_name || holding.exchange}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COUNTRY_STYLES[holding.country] || 'bg-secondary-100 text-secondary-700'}`}>
                    {COUNTRY_NAMES[holding.country] || holding.country}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-secondary-900 tabular-nums">
                  {parseFloat(holding.quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-secondary-900 tabular-nums">
                  {holding.current_price ? formatCurrency(holding.current_price, holding.currency) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-secondary-900 tabular-nums">
                  {formatCurrency(holding.market_value, 'CAD')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-24 h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                        style={{ width: `${(holding.percentage / maxPercentage) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-secondary-700 w-12 text-right tabular-nums">
                      {holding.percentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
