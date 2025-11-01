"use client";

export default function Table({ columns, data, onRowClick, actions, className = '' }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] overflow-hidden">
      <table className={`w-full border-collapse min-w-[600px] sm:min-w-0 ${className}`}>
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
}

