import { useState } from 'react';
import { useCreateHolding, useAccountTypes } from '../../hooks/useHoldings';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { COUNTRIES, EXCHANGES, CURRENCIES } from '../../utils/constants';

export default function AddHoldingForm({ onSuccess, onCancel }) {
  const createHolding = useCreateHolding();
  const { data: accountTypesData } = useAccountTypes();
  const accountTypes = accountTypesData?.account_types || [];

  const [formData, setFormData] = useState({
    symbol: '',
    company_name: '',
    exchange: '',
    country: '',
    quantity: '',
    avg_purchase_price: '',
    currency: 'CAD',
    account_type: '',
    first_purchase_date: '',
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-set country based on exchange
    if (name === 'exchange') {
      const exchange = EXCHANGES.find(ex => ex.value === value);
      if (exchange) {
        setFormData(prev => ({ ...prev, country: exchange.country }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createHolding.mutateAsync(formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating holding:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Symbol/Ticker *"
        name="symbol"
        value={formData.symbol}
        onChange={handleChange}
        placeholder="e.g., AAPL, SHOP.TO, RELIANCE.NS"
        required
      />

      <Input
        label="Company Name"
        name="company_name"
        value={formData.company_name}
        onChange={handleChange}
        placeholder="e.g., Apple Inc."
      />

      <Select
        label="Exchange *"
        name="exchange"
        value={formData.exchange}
        onChange={handleChange}
        options={EXCHANGES}
        required
      />

      <Select
        label="Country *"
        name="country"
        value={formData.country}
        onChange={handleChange}
        options={COUNTRIES}
        required
      />

      <Input
        label="Quantity *"
        name="quantity"
        type="number"
        step="0.0001"
        value={formData.quantity}
        onChange={handleChange}
        required
      />

      <Input
        label="Average Purchase Price *"
        name="avg_purchase_price"
        type="number"
        step="0.01"
        value={formData.avg_purchase_price}
        onChange={handleChange}
        required
      />

      <Select
        label="Currency *"
        name="currency"
        value={formData.currency}
        onChange={handleChange}
        options={CURRENCIES}
        required
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          Account Type
        </label>
        <select
          name="account_type"
          value={formData.account_type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 cursor-pointer"
        >
          <option value="">-- Select Account (Optional) --</option>
          {accountTypes.map((type) => (
            <option key={type.code} value={type.code}>
              {type.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
          TFSA, RRSP, FHSA, or Non-Registered account
        </p>
      </div>

      <Input
        label="First Purchase Date"
        name="first_purchase_date"
        type="date"
        value={formData.first_purchase_date}
        onChange={handleChange}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
        />
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createHolding.isPending}>
          {createHolding.isPending ? 'Adding...' : 'Add Holding'}
        </Button>
      </div>

      {createHolding.isError && (
        <p className="mt-2 text-sm text-danger-600 dark:text-danger-400">
          {createHolding.error?.response?.data?.detail || 'Failed to add holding'}
        </p>
      )}
    </form>
  );
}
