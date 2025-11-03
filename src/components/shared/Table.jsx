"use client";
import { useState, useEffect, memo, useCallback } from 'react';

const Table = memo(function Table({ columns, data, onRowClick, actions, className = '' }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let timeoutId;
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 640);
      }, 100);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timeoutId);
    };
  }, []);
  
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] overflow-hidden">
      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3 p-3">
        {data.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="p-4 bg-[var(--color-muted)] rounded-2xl mb-4">
                <svg className="w-12 h-12 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-[var(--color-text-secondary)] font-medium">No data available</p>
            </div>
          </div>
        ) : (
          data.map((row, index) => (
            <div
              key={index}
              onClick={() => onRowClick && onRowClick(row)}
              className={`
                premium-card p-4 space-y-2
                ${onRowClick ? 'cursor-pointer' : ''}
                transition-all duration-200
              `}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between items-start gap-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase min-w-[100px]">
                    {col.label}:
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)] text-right flex-1">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] || 'N/A')}
                  </span>
                </div>
              ))}
              {actions && (
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Actions:</span>
                  <div className="flex items-center gap-2 ml-auto">
                    {actions(row)}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <table className={`hidden sm:table w-full border-collapse ${className}`}>
        <thead>
          <tr className="bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] border-b-2 border-[var(--color-border)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide"
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="p-4 bg-[var(--color-muted)] rounded-2xl mb-4">
                    <svg className="w-12 h-12 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-[var(--color-text-secondary)] font-medium">No data available</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                onClick={() => onRowClick && onRowClick(row)}
                className={`
                  border-b border-[var(--color-border)]
                  ${onRowClick ? 'cursor-pointer hover:bg-gradient-to-r hover:from-[var(--color-muted)] hover:to-[var(--color-surface)]' : ''}
                  transition-all duration-200
                  ${index % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-muted)]/30'}
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-[var(--color-text-primary)]">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

Table.displayName = 'Table';

export default Table;

