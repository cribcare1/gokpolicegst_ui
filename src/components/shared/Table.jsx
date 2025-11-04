"use client";
import { useState, useEffect, memo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Table = memo(function Table({ columns, data, onRowClick, actions, className = '', itemsPerPage = 10 }) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);
  
  return (
    <>
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
            paginatedData.map((row, index) => (
              <div
                key={startIndex + index}
                onClick={() => onRowClick && onRowClick(row)}
                className={`
                  premium-card p-4 space-y-2 touch-manipulation
                  ${onRowClick ? 'cursor-pointer active:scale-[0.98]' : ''}
                  transition-all duration-200
                `}
              >
                {columns.map((col) => (
                  <div key={col.key} className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-2">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                      {col.label}:
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)] text-right flex-1 break-words">
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] || 'N/A')}
                    </span>
                  </div>
                ))}
                {actions && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Actions:</span>
                    <div className="flex items-center gap-2 ml-0 sm:ml-auto">
                      {actions(row)}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <table className={`hidden sm:table w-full border-collapse border border-[var(--color-border)] ${className}`}>
          <thead>
            <tr className="bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide border border-[var(--color-border)]"
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide border border-[var(--color-border)]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-16 text-center border border-[var(--color-border)]">
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
              paginatedData.map((row, index) => (
                <tr
                  key={startIndex + index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-gradient-to-r hover:from-[var(--color-muted)] hover:to-[var(--color-surface)]' : ''}
                    transition-all duration-200
                    ${(startIndex + index) % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-muted)]/30'}
                  `}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] border border-[var(--color-border)]">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-3 sm:px-6 py-3 sm:py-4 border border-[var(--color-border)]">
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

      {/* Pagination - Below Table */}
      {data.length > itemsPerPage && (
        <>
          {/* Desktop Pagination */}
          <div className="hidden sm:flex items-center justify-between px-4 sm:px-6 py-4 mt-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="text-sm text-[var(--color-text-secondary)]">
              Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${currentPage === 1 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-[var(--color-muted)] hover:scale-105 active:scale-95'
                  }
                `}
                aria-label="Previous page"
              >
                <ChevronLeft size={20} className="text-[var(--color-text-primary)]" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return page === 1 || 
                           page === totalPages || 
                           (page >= currentPage - 1 && page <= currentPage + 1);
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsisBefore && (
                          <span className="px-2 text-[var(--color-text-secondary)]">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`
                            min-w-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                            ${currentPage === page
                              ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-md'
                              : 'bg-[var(--color-muted)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] hover:scale-105 active:scale-95'
                            }
                          `}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${currentPage === totalPages 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-[var(--color-muted)] hover:scale-105 active:scale-95'
                  }
                `}
                aria-label="Next page"
              >
                <ChevronRight size={20} className="text-[var(--color-text-primary)]" />
              </button>
            </div>
          </div>

          {/* Mobile Pagination */}
          <div className="block sm:hidden flex items-center justify-between px-4 py-3 mt-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`
                p-2 rounded-lg transition-all duration-200
                ${currentPage === 1 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-[var(--color-muted)] active:scale-95'
                }
              `}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} className="text-[var(--color-text-primary)]" />
            </button>
            
            <span className="text-sm text-[var(--color-text-secondary)]">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`
                p-2 rounded-lg transition-all duration-200
                ${currentPage === totalPages 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-[var(--color-muted)] active:scale-95'
                }
              `}
              aria-label="Next page"
            >
              <ChevronRight size={18} className="text-[var(--color-text-primary)]" />
            </button>
          </div>
        </>
      )}
    </>
  );
});

Table.displayName = 'Table';

export default Table;

