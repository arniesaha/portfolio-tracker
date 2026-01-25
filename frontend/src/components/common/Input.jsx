import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    required,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const hasIcon = !!Icon;

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-1.5">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {hasIcon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-secondary-400" />
          </div>
        )}
        <input
          ref={ref}
          {...props}
          className={`
            w-full px-4 py-2.5 bg-white border rounded-lg
            text-secondary-900 placeholder-secondary-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500/20
            ${error
              ? 'border-danger-500 focus:border-danger-500'
              : 'border-secondary-300 focus:border-primary-500'
            }
            ${hasIcon && iconPosition === 'left' ? 'pl-10' : ''}
            ${hasIcon && iconPosition === 'right' ? 'pr-10' : ''}
            ${className}
          `}
        />
        {hasIcon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-secondary-400" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-secondary-500">{hint}</p>
      )}
    </div>
  );
});

export default Input;

// Select component
export const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    required,
    options = [],
    placeholder = 'Select an option',
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-1.5">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          {...props}
          className={`
            w-full px-4 py-2.5 bg-white border rounded-lg
            text-secondary-900 appearance-none
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500/20
            ${error
              ? 'border-danger-500 focus:border-danger-500'
              : 'border-secondary-300 focus:border-primary-500'
            }
            pr-10
            ${className}
          `}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-secondary-500">{hint}</p>
      )}
    </div>
  );
});

// Textarea component
export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    hint,
    required,
    className = '',
    containerClassName = '',
    rows = 3,
    ...props
  },
  ref
) {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-1.5">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        {...props}
        className={`
          w-full px-4 py-2.5 bg-white border rounded-lg
          text-secondary-900 placeholder-secondary-400
          transition-all duration-200 resize-y
          focus:outline-none focus:ring-2 focus:ring-primary-500/20
          ${error
            ? 'border-danger-500 focus:border-danger-500'
            : 'border-secondary-300 focus:border-primary-500'
          }
          ${className}
        `}
      />
      {error && (
        <p className="mt-1.5 text-sm text-danger-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-secondary-500">{hint}</p>
      )}
    </div>
  );
});
