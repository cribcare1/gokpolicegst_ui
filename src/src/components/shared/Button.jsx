"use client";

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white hover:shadow-xl hover:scale-105 premium-button',
    secondary: 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-lg hover:scale-105',
    ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-muted)] hover:scale-105',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-xl hover:scale-105 premium-button',
    success: 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-xl hover:scale-105 premium-button',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs sm:text-sm',
    md: 'px-3 sm:px-4 py-2 text-sm sm:text-base',
    lg: 'px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]} ${sizes[size]}
        rounded-xl font-semibold
        transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
        shadow-md
        flex items-center justify-center
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

