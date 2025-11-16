// Extract the improved code section with all enhancements
// This shows the improved version of the delete button and related logic

// 1. Constants for better maintainability
const DELETE_BUTTON_CONFIG = {
  MESSAGES: {
    DISABLED: 'Cannot delete: Invoices exist for this HSN/SSC',
    ENABLED: 'Delete HSN record',
    CONFIRMATION: 'Are you sure you want to delete this HSN record? This action cannot be undone.'
  },
  STYLES: {
    ENABLED: 'p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-red-600 dark:text-red-400 cursor-pointer',
    DISABLED: 'p-2.5 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
  }
};

// 2. Helper function to determine button state
const getDeleteButtonState = (row) => {
  if (!row) {
    return {
      isDisabled: true,
      message: DELETE_BUTTON_CONFIG.MESSAGES.DISABLED,
      className: DELETE_BUTTON_CONFIG.STYLES.DISABLED
    };
  }
  
  const hasInvoices = !row.isEditable;
  const isDeletable = !hasInvoices;
  
  return {
    isDisabled: !isDeletable,
    message: isDeletable 
      ? DELETE_BUTTON_CONFIG.MESSAGES.ENABLED
      : DELETE_BUTTON_CONFIG.MESSAGES.DISABLED,
    className: isDeletable 
      ? DELETE_BUTTON_CONFIG.STYLES.ENABLED
      : DELETE_BUTTON_CONFIG.STYLES.DISABLED,
    hasInvoices,
    originalData: row
  };
};

// 3. Improved delete handler with better error handling
const createDeleteHandler = (row, fetchData, fetchBills) => {
  return async (e) => {
    e.stopPropagation();
    
    const buttonState = getDeleteButtonState(row);
    
    // Prevent action if button is disabled
    if (buttonState.isDisabled) {
      return;
    }
    
    // Enhanced confirmation dialog with more details
    const confirmationMessage = `${DELETE_BUTTON_CONFIG.MESSAGES.CONFIRMATION}\n\nHSN Code: ${row.hsnCode}\nGSTIN: ${row.gstinNumber}`;
    
    if (!confirm(confirmationMessage)) {
      return;
    }
    
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.HSN_DELETE}${row.id}`,
        {},
        { timeout: 5000 } // Add timeout for better UX
      );
      
      if (response?.status === 'success') {
        toast.success('HSN record deleted successfully');
        fetchData();
        fetchBills(); // Refresh bills to update invoice status
      } else {
        const errorMessage = response?.message || 'Failed to delete HSN record';
        toast.error(errorMessage);
        console.error('Delete operation failed:', response);
      }
    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timeout. Please try again.'
        : 'Network error occurred. Please check your connection.';
      
      toast.error(errorMessage);
      console.error('Delete operation error:', error);
    }
  };
};

// 4. Improved table actions with the enhanced delete button
const tableActions = (row) => {
  const buttonState = getDeleteButtonState(row);
  const handleDelete = createDeleteHandler(row, fetchData, fetchBills);
  
  return (
    <>
      {/* History button - unchanged for brevity */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleViewHistory(row);
        }}
        className="p-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-purple-600 dark:text-purple-400"
        aria-label="View Tax Change History"
        title="View Tax Change History"
      >
        <History size={18} />
      </button>
      
      {/* Edit button - unchanged for brevity */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
        className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-blue-600 dark:text-blue-400"
        aria-label="Edit HSN Record"
        title="Edit HSN Record"
      >
        <Edit size={18} />
      </button>
      
      {/* IMPROVED DELETE BUTTON */}
      <button
        onClick={handleDelete}
        disabled={buttonState.isDisabled}
        className={buttonState.className}
        aria-label={`Delete HSN record${buttonState.hasInvoices ? ': Invoices exist' : ''}`}
        title={buttonState.message}
        // Enhanced accessibility attributes
        type="button"
        role="button"
        aria-describedby={buttonState.hasInvoices ? 'hsn-delete-disabled-reason' : undefined}
        data-testid="hsn-delete-button"
        data-hsn-code={row.hsnCode}
        data-gstin={row.gstinNumber}
      >
        <Trash2 size={18} />
        {/* Screen reader only text for better accessibility */}
        <span className="sr-only">
          {buttonState.hasInvoices ? 'Delete disabled: Invoices exist' : 'Delete record'}
        </span>
      </button>
      
      {/* Hidden element for screen readers to explain why delete is disabled */}
      {buttonState.hasInvoices && (
        <div 
          id="hsn-delete-disabled-reason"
          className="sr-only"
          role="status"
          aria-live="polite"
        >
          Cannot delete this HSN record because invoices already exist for it.
        </div>
      )}
    </>
  );
};

// 5. Performance optimization using React.memo for expensive components
const MemoizedDeleteButton = React.memo(({ row, onDelete, isDeleting }) => {
  const buttonState = getDeleteButtonState(row);
  
  return (
    <button
      onClick={onDelete}
      disabled={buttonState.isDisabled || isDeleting}
      className={buttonState.className}
      aria-label={`${isDeleting ? 'Deleting...' : 'Delete'} HSN record`}
      title={buttonState.message}
      type="button"
      data-testid="hsn-delete-button"
    >
      {isDeleting ? (
        <div className="animate-spin">
          {/* Loading spinner */}
        </div>
      ) : (
        <Trash2 size={18} />
      )}
    </button>
  );
});

// 6. Custom hook for delete operation state management
const useDeleteHSN = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  const deleteRecord = useCallback(async (row) => {
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.HSN_DELETE}${row.id}`,
        {}
      );
      
      if (response?.status === 'success') {
        toast.success('HSN record deleted successfully');
        return { success: true };
      } else {
        const errorMessage = response?.message || 'Failed to delete record';
        setDeleteError(errorMessage);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Network error occurred';
      setDeleteError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  }, []);
  
  return { deleteRecord, isDeleting, deleteError };
};