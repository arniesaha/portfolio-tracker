export default function Select({ label, options, error, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 cursor-pointer ${
          error ? 'border-danger-500' : 'border-secondary-300 dark:border-secondary-600'
        }`}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{error}</p>}
    </div>
  );
}
