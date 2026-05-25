export const formatCurrency = (value, currency = 'CAD') => {
  if (value === null || value === undefined) return '-';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(numValue)) return '-';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

export const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(numValue)) return '-';

  return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`;
};

export const formatDate = (date) => {
  if (!date) return '-';

  const dateValue = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00`)
    : new Date(date);

  return dateValue.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined) return '-';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(numValue)) return '-';

  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
