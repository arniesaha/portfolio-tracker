import { useEffect, useRef } from 'react';

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showClose = true,
  footer,
  icon: Icon,
}) {
  const modalRef = useRef(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-secondary-900/50 dark:bg-secondary-950/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal positioning */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal panel */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className={`
            relative bg-white dark:bg-secondary-900 rounded-2xl shadow-xl w-full ${sizes[size]}
            max-h-[90vh] overflow-hidden animate-scale-in
          `}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-secondary-100 dark:border-secondary-800">
            {Icon && (
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">{subtitle}</p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 dark:text-secondary-500 dark:hover:text-secondary-300 dark:hover:bg-secondary-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-secondary-100 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-800/50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Confirmation Modal variant
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const variants = {
    danger: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-danger-100 dark:bg-danger-900/50',
      iconColor: 'text-danger-600 dark:text-danger-400',
      buttonClass: 'bg-danger-600 hover:bg-danger-700 focus:ring-danger-500',
    },
    warning: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-warning-100 dark:bg-warning-900/50',
      iconColor: 'text-warning-600 dark:text-warning-400',
      buttonClass: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500',
    },
    info: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-accent-100 dark:bg-accent-900/50',
      iconColor: 'text-accent-600 dark:text-accent-400',
      buttonClass: 'bg-accent-600 hover:bg-accent-700 focus:ring-accent-500',
    },
  };

  const currentVariant = variants[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="text-center">
        <div className={`mx-auto w-12 h-12 ${currentVariant.iconBg} rounded-full flex items-center justify-center ${currentVariant.iconColor} mb-4`}>
          {currentVariant.icon}
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">{title}</h3>
        <p className="text-secondary-500 dark:text-secondary-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 rounded-lg font-medium hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer ${currentVariant.buttonClass}`}
          >
            {loading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
