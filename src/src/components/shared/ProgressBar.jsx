"use client";
import { useEffect, useState } from 'react';

export default function ProgressBar({ 
  value = 0, 
  max = 100, 
  showLabel = true,
  label = null,
  variant = 'primary',
  size = 'md',
  animated = true,
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (animated) {
      // Animate progress value smoothly
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  const percentage = Math.min(Math.max((displayValue / max) * 100, 0), 100);

  const variants = {
    primary: 'bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-primary)]',
    success: 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500',
    warning: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500',
    error: 'bg-gradient-to-r from-red-500 via-red-600 to-red-500',
    info: 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
            {label || `${Math.round(percentage)}%`}
          </span>
          {showLabel && !label && (
            <span className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              {displayValue} / {max}
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${sizes[size]} bg-[var(--color-muted)] rounded-full overflow-hidden shadow-inner`}>
        <div
          className={`${variants[variant]} ${sizes[size]} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
}

// Loading Progress Bar Component (Now with Spinner)
export function LoadingProgressBar({ 
  message = 'Loading...',
  variant = 'primary',
  className = ''
}) {
  const variantColors = {
    primary: 'border-[var(--color-primary)]',
    success: 'border-green-500',
    warning: 'border-amber-500',
    error: 'border-red-500',
    info: 'border-blue-500',
  };

  const bgColors = {
    primary: 'bg-[var(--color-primary)]',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center space-y-4 py-8 ${className}`}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div className={`w-16 h-16 border-4 ${variantColors[variant] || variantColors.primary} border-t-transparent rounded-full animate-spin`}></div>
        {/* Inner pulsing dot */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 ${bgColors[variant] || bgColors.primary} rounded-full animate-pulse`}></div>
      </div>
      {message && (
        <p className="text-sm sm:text-base font-medium text-center text-[var(--color-text-secondary)] animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

// Indeterminate Progress Bar (Now with Spinner - for unknown duration tasks)
export function IndeterminateProgressBar({ 
  message = 'Processing...',
  variant = 'primary',
  className = ''
}) {
  const variantColors = {
    primary: 'border-[var(--color-primary)]',
    success: 'border-green-500',
    warning: 'border-amber-500',
    error: 'border-red-500',
    info: 'border-blue-500',
  };

  const bgColors = {
    primary: 'bg-[var(--color-primary)]',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center space-y-3 py-6 ${className}`}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 border-[3px] ${variantColors[variant] || variantColors.primary} border-t-transparent rounded-full animate-spin`} style={{ animationDuration: '0.8s' }}></div>
        {/* Inner pulsing dot */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 ${bgColors[variant] || bgColors.primary} rounded-full animate-pulse`}></div>
      </div>
      {message && (
        <p className="text-sm sm:text-base font-medium text-center text-[var(--color-text-secondary)]">
          {message}
        </p>
      )}
    </div>
  );
}

