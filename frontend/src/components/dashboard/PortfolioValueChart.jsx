/**
 * Portfolio Value Chart Component
 *
 * Displays a line chart showing portfolio value over time with:
 * - Portfolio value trend line
 * - Cost basis comparison
 * - Gain/loss shaded area
 * - Time period selector (7D, 30D, 90D, 1Y, ALL)
 */
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { usePortfolioHistory } from '../../hooks/usePortfolioHistory';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';

const TIME_PERIODS = [
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: 3650 }, // ~10 years
];

export default function PortfolioValueChart() {
  const [selectedPeriod, setSelectedPeriod] = useState(30); // Default to 30 days
  const { data: historyData, isLoading, isError } = usePortfolioHistory(selectedPeriod);

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center items-center h-80">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="text-center py-8 text-red-600">
          Failed to load portfolio history
        </div>
      </Card>
    );
  }

  if (!historyData || historyData.snapshots.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center h-80 text-gray-500">
          <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium mb-2">No Portfolio History Available</p>
          <p className="text-sm text-gray-400">Portfolio snapshots will be created automatically</p>
          <p className="text-sm text-gray-400">Check back tomorrow to see your performance chart</p>
        </div>
      </Card>
    );
  }

  // Transform data for the chart
  const chartData = historyData.snapshots.map(snapshot => ({
    date: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    fullDate: snapshot.snapshot_date,
    value: parseFloat(snapshot.total_value_cad),
    cost: parseFloat(snapshot.total_cost_cad),
    gain: parseFloat(snapshot.unrealized_gain_cad),
  }));

  // Add current value as the last data point if we have snapshots
  if (historyData.current_value && chartData.length > 0) {
    const lastSnapshot = historyData.snapshots[historyData.snapshots.length - 1];
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    chartData.push({
      date: today,
      fullDate: new Date().toISOString().split('T')[0],
      value: parseFloat(historyData.current_value),
      cost: parseFloat(lastSnapshot.total_cost_cad),
      gain: parseFloat(historyData.current_value) - parseFloat(lastSnapshot.total_cost_cad),
    });
  }

  // Calculate value change
  const valueChange = parseFloat(historyData.value_change) || 0;
  const valueChangePct = parseFloat(historyData.value_change_pct) || 0;
  const isPositive = valueChange >= 0;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{data.fullDate}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-600">Portfolio Value:</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(data.value)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-600">Cost Basis:</span>
              <span className="text-sm font-semibold text-gray-600">{formatCurrency(data.cost)}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-gray-200">
              <span className="text-sm text-gray-600">Gain/Loss:</span>
              <span className={`text-sm font-semibold ${data.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.gain)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      {/* Header with title and period selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Value Over Time</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{formatCurrency(valueChange)}
            </span>
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              ({isPositive ? '+' : ''}{valueChangePct.toFixed(2)}%)
            </span>
            <span className="text-sm text-gray-500">
              {selectedPeriod === 3650 ? 'All time' : `Last ${selectedPeriod} days`}
            </span>
          </div>
        </div>

        {/* Time period selector */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {TIME_PERIODS.map(period => (
            <button
              key={period.label}
              onClick={() => setSelectedPeriod(period.days)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                selectedPeriod === period.days
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tickLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tickLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            domain={['dataMin - 1000', 'dataMax + 1000']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
            iconType="line"
          />

          {/* Cost basis line */}
          <Line
            type="monotone"
            dataKey="cost"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Cost Basis"
            activeDot={{ r: 4 }}
          />

          {/* Portfolio value area */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorValue)"
            name="Portfolio Value"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase">Start Date</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {new Date(historyData.start_date).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Days Tracked</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{historyData.total_days}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Current Value</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {formatCurrency(historyData.current_value)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Period Change</p>
          <p className={`text-sm font-semibold mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{valueChangePct.toFixed(2)}%
          </p>
        </div>
      </div>
    </Card>
  );
}
