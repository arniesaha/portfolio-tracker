import { createContext, useContext, useState, useCallback } from 'react';

// Icons
const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Toast Context
const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (title, message) => addToast({ type: 'success', title, message }),
    error: (title, message) => addToast({ type: 'error', title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    info: (title, message) => addToast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast Container
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}

// Individual Toast
function Toast({ type, title, message, onClose }) {
  const variants = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      icon: <CheckCircleIcon />,
      iconColor: 'text-success-600',
      titleColor: 'text-success-800',
      messageColor: 'text-success-700',
    },
    error: {
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      icon: <XCircleIcon />,
      iconColor: 'text-danger-600',
      titleColor: 'text-danger-800',
      messageColor: 'text-danger-700',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      icon: <ExclamationIcon />,
      iconColor: 'text-warning-600',
      titleColor: 'text-warning-800',
      messageColor: 'text-warning-700',
    },
    info: {
      bg: 'bg-accent-50',
      border: 'border-accent-200',
      icon: <InfoIcon />,
      iconColor: 'text-accent-600',
      titleColor: 'text-accent-800',
      messageColor: 'text-accent-700',
    },
  };

  const variant = variants[type] || variants.info;

  return (
    <div
      className={`
        ${variant.bg} ${variant.border} border rounded-xl p-4 shadow-lg
        animate-slide-up flex items-start gap-3
      `}
      role="alert"
    >
      <div className={`flex-shrink-0 ${variant.iconColor}`}>
        {variant.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`font-semibold ${variant.titleColor}`}>{title}</p>
        )}
        {message && (
          <p className={`text-sm ${variant.messageColor} ${title ? 'mt-1' : ''}`}>
            {message}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className={`flex-shrink-0 p-1 rounded hover:bg-black/5 ${variant.iconColor} transition-colors`}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export default Toast;
