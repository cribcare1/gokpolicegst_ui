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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`
          relative bg-[var(--color-surface)] rounded-xl sm:rounded-2xl shadow-2xl
          w-full ${sizeClasses[size]}
          max-h-[95vh] sm:max-h-[90vh]
          border border-[var(--color-border)]
          animate-fade-in
          mx-2 sm:mx-0
          touch-manipulation
          flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-muted)] flex-shrink-0 sticky top-0 z-10">
            <h2 className="text-lg sm:text-2xl font-bold gradient-text truncate flex-1 pr-2">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 hover:rotate-90 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={22} className="text-white" />
            </button>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

export default Modal;

