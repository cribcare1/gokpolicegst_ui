"use client";
import { useEffect, memo, useCallback } from 'react';
import { X } from 'lucide-react';

const Modal = memo(function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-2',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`
          relative bg-[var(--color-surface)] rounded-xl sm:rounded-2xl shadow-2xl
          w-full ${sizeClasses[size]}
          max-h-[95vh] sm:max-h-[90vh] overflow-y-auto
          border border-[var(--color-border)]
          animate-fade-in
          mx-2 sm:mx-0
        `}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-muted)]">
            <h2 className="text-lg sm:text-2xl font-bold gradient-text truncate flex-1 pr-2">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-muted)] rounded-xl transition-all duration-200 hover:scale-110 hover:rotate-90"
              aria-label="Close"
            >
              <X size={22} className="text-[var(--color-text-secondary)]" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

export default Modal;

