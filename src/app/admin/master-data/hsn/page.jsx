"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { validateGSTIN, validateHSN, validateGSTRate, validateName } from '@/lib/gstUtils';
import { Plus, Edit, Trash2, Search, History } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';
import { useGstinList } from '@/hooks/useGstinList';

// Constants for better maintainability and performance
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

// Utility functions for date and data formatting
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    // Handle different date formats
    let date;
    if (typeof dateString === 'number') {
      // Handle timestamp (milliseconds or seconds)
      date = new Date(dateString > 1000000000000 ? dateString : dateString * 1000);
    } else if (typeof dateString === 'string') {
      const trimmed = dateString.trim();
      
      // Check if it's already in ISO format
      if (trimmed.includes('T')) {
        date = new Date(trimmed);
      } else if (trimmed.match(/^\d+$/)) {
        // Handle string numbers (timestamps)
        const num = parseInt(trimmed, 10);
        date = new Date(num > 1000000000000 ? num : num * 1000);
      } else if (trimmed.match(/^\d{2}-\d{2}-\d{4}$/)) {
        // Handle DD-MM-YYYY format (e.g., "16-11-2025")
        const [day, month, year] = trimmed.split('-');
        date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      } else if (trimmed.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // Handle DD/MM/YYYY format
        const [day, month, year] = trimmed.split('/');
        date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      } else if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Handle YYYY-MM-DD format
        date = new Date(trimmed + 'T00:00:00');
      } else {
        // Try to parse as-is
        date = new Date(trimmed);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'N/A';
    }
    
    // Format as date only (DD/MM/YYYY) for history table
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'N/A';
  }
};

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

const formatTaxRate = (rate) => {
  if (rate === null || rate === undefined || rate === '') return 'N/A';
  return `${rate}%`;
};

// Reusable history row component for better separation of concerns
const HistoryRow = React.memo(({ history }) => {
  const { id, totalGst, igst, cgst, sgst, effectiveFrom, effectiveTo } = history;
  
  return (
    <tr className="hover:bg-[var(--color-surface)] transition-colors duration-200">
      <td className="border border-[var(--color-border)] p-2 text-sm font-medium">
        {formatTaxRate(totalGst)}
      </td>
      <td className="border border-[var(--color-border)] p-2 text-sm">
        {formatTaxRate(igst)}
      </td>
      <td className="border border-[var(--color-border)] p-2 text-sm">
        {formatTaxRate(cgst)}
      </td>
      <td className="border border-[var(--color-border)] p-2 text-sm">
        {formatTaxRate(sgst)}
      </td>
      <td className="border border-[var(--color-border)] p-2 text-sm">
        {effectiveFrom ? formatDate(effectiveFrom) : 'N/A'}
      </td>
      <td className="border border-[var(--color-border)] p-2 text-sm">
        {effectiveTo ? formatDate(effectiveTo) : 'Current'}
      </td>
    </tr>
  );
});

HistoryRow.displayName = 'HistoryRow';

export default function HSNRecordsPage() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [gstinList, setGstinList] = useState([]);
  const [bills, setBills] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [selectedHsnForHistory, setSelectedHsnForHistory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const { gstinList: gstinListHook } = useGstinList();

  // Check if invoices exist for this HSN
  const hasInvoicesForHSN = useCallback((hsnId, gstinNumber, hsnCode) => {
    if (!bills || bills.length === 0) return false;
    
    return bills.some(bill => {
      // Normalize GSTIN for comparison
      const billGstin = bill.gstinNumber || bill.gstNumber || '';
      const normalizedGstin = gstinNumber?.toUpperCase() || '';
      const normalizedBillGstin = billGstin.toUpperCase();
      
      // Check if GSTIN matches
      if (normalizedBillGstin !== normalizedGstin) {
        return false;
      }
      
      // Check if bill has line items with this HSN
      if (bill.lineItems && Array.isArray(bill.lineItems)) {
        return bill.lineItems.some(item => {
          const itemHsn = String(item.hsnNumber || item.hsnCode || '').trim();
          const normalizedHsn = String(hsnCode || '').trim();
          return itemHsn === normalizedHsn;
        });
      }
      
      // Fallback: check if bill has hsnNumber field directly
      const billHsn = String(bill.hsnNumber || bill.hsnCode || '').trim();
      const normalizedHsn = String(hsnCode || '').trim();
      return billHsn === normalizedHsn;
    });
  }, [bills]);

  // Helper function to determine button state - similar to PAN Master logic
  const getDeleteButtonState = useCallback((row) => {
    if (!row) {
      return {
        isDisabled: true,
        message: DELETE_BUTTON_CONFIG.MESSAGES.DISABLED,
        className: DELETE_BUTTON_CONFIG.STYLES.DISABLED,
        hasInvoices: false
      };
    }
    
    // Check isEditable from API response first (like PAN Master)
    const isEditable = row.isEditable;
    
    // If not editable, disable delete immediately
    if (!isEditable) {
      return {
        isDisabled: true,
        message: 'HSN is protected - dependent records found',
        className: DELETE_BUTTON_CONFIG.STYLES.DISABLED,
        hasInvoices: false,
        isEditable: false
      };
    }
    
    // Check if invoices exist for this HSN (similar to ddoCount check in GSTIN Master)
    const hasInvoices = hasInvoicesForHSN(
      row.id || row.hsnId,
      row.gstinNumber,
      row.hsnCode
    );
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
      isEditable: true,
      originalData: row
    };
  }, [hasInvoicesForHSN]);

  useEffect(() => {
    fetchGSTINList();
    fetchBills();
    // Fetch data initially even if gstinList is empty (will be re-transformed when gstinList loads)
    fetchData();
  }, []);

  useEffect(() => {
    if (gstinListHook && gstinListHook.length > 0) {
      setGstinList(gstinListHook);
    }
  }, [gstinListHook]);

  // Fetch HSN data after GSTIN list is loaded (if not already fetched)
  useEffect(() => {
    if ((gstinList.length > 0 || gstinListHook?.length > 0) && data.length === 0) {
      fetchData();
    }
  }, [gstinList.length, gstinListHook?.length]);

  // Re-transform data when gstinList is updated (in case data was fetched before gstinList was ready)
  useEffect(() => {
    if (data.length > 0 && (gstinList.length > 0 || gstinListHook?.length > 0)) {
      const currentGstinList = gstinList.length > 0 ? gstinList : (gstinListHook || []);
      let hasChanges = false;
      
      const transformedData = data.map(item => {
        const transformed = { ...item };
        
        // First, try to get GSTIN number from various possible field names
        const currentGstin = transformed.gstinNumber || 
                           transformed.gstNumber || 
                           transformed.gstin || 
                           transformed.gstIN ||
                           transformed.gstin_number ||
                           transformed.gst_number;
        
        // Map gstId to gstinNumber if gstinNumber is missing
        if (!currentGstin && transformed.gstId && currentGstinList.length > 0) {
          const gst = currentGstinList.find(g => {
            const itemGstId = transformed.gstId;
            return (
              g.gstId === itemGstId || 
              g.id === itemGstId ||
              String(g.gstId) === String(itemGstId) ||
              String(g.id) === String(itemGstId) ||
              Number(g.gstId) === Number(itemGstId) ||
              Number(g.id) === Number(itemGstId)
            );
          });
          if (gst) {
            const newGstinNumber = gst.value || gst.gstNumber || gst.gstinNumber || gst.label || gst.gstIN;
            if (newGstinNumber && newGstinNumber !== transformed.gstinNumber) {
              transformed.gstinNumber = newGstinNumber;
              hasChanges = true;
              console.log(`Re-transformed: Mapped gstId ${transformed.gstId} to gstinNumber: ${newGstinNumber}`);
            }
          }
        }
        
        // If still no GSTIN, try matching by value
        if (!transformed.gstinNumber && currentGstinList.length > 0) {
          const possibleGstinFields = [
            transformed.gstNumber,
            transformed.gstin,
            transformed.gstIN,
            transformed.gstin_number,
            transformed.gst_number
          ].filter(Boolean);
          
          for (const possibleGstin of possibleGstinFields) {
            const gst = currentGstinList.find(g => {
              const gstValue = g.value || g.gstNumber || g.gstinNumber || g.label || g.gstIN;
              return gstValue && String(gstValue).toUpperCase() === String(possibleGstin).toUpperCase();
            });
            if (gst) {
              const newGstinNumber = gst.value || gst.gstNumber || gst.gstinNumber || gst.label || gst.gstIN;
              if (newGstinNumber && newGstinNumber !== transformed.gstinNumber) {
                transformed.gstinNumber = newGstinNumber;
                hasChanges = true;
                console.log(`Re-transformed: Found GSTIN by matching value: ${newGstinNumber}`);
                break;
              }
            }
          }
        }
        
        return transformed;
      });
      
      // Only update if there are actual changes to avoid infinite loops
      if (hasChanges) {
        console.log('Re-transforming data with GSTIN numbers');
        setData(transformedData);
        setFilteredData(transformedData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gstinList.length, gstinListHook?.length]);

  useEffect(() => {
    console.log('Data state changed:', data);
    console.log('Data length:', data.length);
    if (data.length > 0) {
      console.log('First data item:', data[0]);
    }
  }, [data]);

  useEffect(() => {
    console.log('Filtered data changed:', filteredData);
    console.log('Filtered data length:', filteredData.length);
  }, [filteredData]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = data.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  const fetchGSTINList = async () => {
    try {
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.GST_LIST, 2000);
      if (response?.status === 'success' && response?.data) {
        // Ensure gstId is preserved in the GSTIN list
        const processedGstinList = response.data.map(item => ({
          ...item,
          gstId: item.gstId || item.id,
          value: item.gstNumber || item.gstinNumber || item.value,
          label: item.gstName ? `${item.gstNumber || item.gstinNumber} - ${item.gstName}` : (item.gstNumber || item.gstinNumber || item.label),
          gstNumber: item.gstNumber || item.gstinNumber || item.value,
          gstinNumber: item.gstNumber || item.gstinNumber || item.value
        }));
        console.log('Processed GSTIN List:', processedGstinList);
        setGstinList(processedGstinList);
      }
    } catch (error) {
      console.error('Error fetching GSTIN list:', error);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.BILL_LIST, 2000);
      if (response?.status === 'success' && response?.data) {
        setBills(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.HSN_LIST);
      
      console.log('HSN API Response:', response);
      console.log('Response data:', response?.data);
      console.log('Response data type:', Array.isArray(response?.data) ? 'Array' : typeof response?.data);
      console.log('Response data length:', Array.isArray(response?.data) ? response.data.length : 'Not an array');
      
      if (response && response.status === 'success') {
        // Ensure response.data is an array
        let rawData = response.data;
        if (!Array.isArray(rawData)) {
          console.warn('Response data is not an array, converting...', rawData);
          if (rawData && typeof rawData === 'object') {
            // If it's an object, try to extract array from common keys
            rawData = rawData.list || rawData.items || rawData.data || [rawData];
          } else {
            rawData = [];
          }
        }
        
        if (!Array.isArray(rawData)) {
          console.error('Could not convert response.data to array');
          rawData = [];
        }
        
        console.log('Processed raw data (array):', rawData);
        console.log('Raw data length:', rawData.length);
        
        // Use current gstinList state or fallback to hook
        const currentGstinList = gstinList.length > 0 ? gstinList : (gstinListHook || []);
        
        console.log('Current GSTIN List:', currentGstinList);
        console.log('Current GSTIN List length:', currentGstinList.length);
        
        const transformedData = rawData.map((item, index) => {
          console.log(`Processing item ${index}:`, item);
          const transformed = { ...item };
          
          // First, try to get GSTIN number from various possible field names in the item itself
          transformed.gstinNumber = transformed.gstinNumber || 
                                    transformed.gstNumber || 
                                    transformed.gstin || 
                                    transformed.gstIN ||
                                    transformed.gstin_number ||
                                    transformed.gst_number;
          
          // Map gstId to gstinNumber if gstinNumber is still missing
          if (!transformed.gstinNumber && transformed.gstId && currentGstinList.length > 0) {
            const gst = currentGstinList.find(g => {
              const itemGstId = transformed.gstId;
              return (
                g.gstId === itemGstId || 
                g.id === itemGstId ||
                String(g.gstId) === String(itemGstId) ||
                String(g.id) === String(itemGstId) ||
                Number(g.gstId) === Number(itemGstId) ||
                Number(g.id) === Number(itemGstId)
              );
            });
            if (gst) {
              transformed.gstinNumber = gst.gstNumber || gst.gstinNumber || gst.value || gst.label || gst.gstIN;
              console.log(`Mapped gstId ${transformed.gstId} to gstinNumber: ${transformed.gstinNumber}`);
              console.log('Matched GSTIN object:', gst);
            } else {
              console.log(`Could not find GSTIN for gstId: ${transformed.gstId} in list of ${currentGstinList.length} items`);
              console.log('Available GSTIN IDs:', currentGstinList.map(g => ({ gstId: g.gstId, id: g.id, gstNumber: g.gstNumber })));
              console.log('HSN item gstId type:', typeof transformed.gstId, 'value:', transformed.gstId);
            }
          }
          
          // If still no GSTIN number, try to find it from GSTIN list using other matching fields
          if (!transformed.gstinNumber && currentGstinList.length > 0) {
            // Try matching by any GSTIN-related field in the item
            const possibleGstinFields = [
              transformed.gstNumber,
              transformed.gstin,
              transformed.gstIN,
              transformed.gstin_number,
              transformed.gst_number
            ].filter(Boolean);
            
            for (const possibleGstin of possibleGstinFields) {
              const gst = currentGstinList.find(g => {
                const gstValue = g.value || g.gstNumber || g.gstinNumber || g.label || g.gstIN;
                return gstValue && String(gstValue).toUpperCase() === String(possibleGstin).toUpperCase();
              });
              if (gst) {
                transformed.gstinNumber = gst.value || gst.gstNumber || gst.gstinNumber || gst.label || gst.gstIN;
                console.log(`Found GSTIN by matching value: ${transformed.gstinNumber}`);
                break;
              }
            }
          }
          
          // Final fallback: use gstNumber if available (even if it's the same field)
          if (!transformed.gstinNumber && transformed.gstNumber) {
            transformed.gstinNumber = transformed.gstNumber;
          }
          
          // Log final GSTIN number
          if (transformed.gstinNumber) {
            console.log(`Final GSTIN Number for item ${index}: ${transformed.gstinNumber}`);
          } else {
            console.warn(`No GSTIN Number found for item ${index}:`, transformed);
          }
          
          // Map hsnNumber to hsnCode if needed
          if (!transformed.hsnCode && transformed.hsnNumber) {
            transformed.hsnCode = transformed.hsnNumber;
          }
          
          // Map name to serviceName if needed
          if (!transformed.serviceName && transformed.name) {
            transformed.serviceName = transformed.name;
          }
          
          // Map gstTaxRate to totalGst if needed
          if (!transformed.totalGst && transformed.gstTaxRate !== undefined && transformed.gstTaxRate !== null) {
            transformed.totalGst = transformed.gstTaxRate;
          }
          
          // Handle effectiveFrom and effectiveTo mapping
          if (!transformed.effectiveFrom && transformed.effectiveDate) {
            transformed.effectiveFrom = transformed.effectiveDate;
          }
          
          // Preserve isEditable field from API response
          transformed.isEditable = item.isEditable;
          
          console.log(`Transformed item ${index}:`, transformed);
          return transformed;
        });
        
        console.log('Final transformed data:', transformedData);
        console.log('Setting data with', transformedData.length, 'items');
        
        if (transformedData.length > 0) {
          console.log('Sample transformed item:', transformedData[0]);
        }
        
        setData(transformedData);
        setFilteredData(transformedData);
        
        // Force a re-render check
        setTimeout(() => {
          console.log('After setState - data should be updated');
        }, 100);
      } else {
        console.error('Failed to fetch HSN data - Invalid response:', response);
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error fetching HSN data:', error);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    // Set default effectiveFrom to today
    setFormData({
      effectiveFrom: new Date().toISOString().split('T')[0]
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFieldErrors({});

    const selectedGST = gstinList.find(
      (gst) => gst.gstNumber === item.gstinNumber || gst.value === item.gstinNumber
    );

    const updatedItem = {
      ...item,
      gstId: selectedGST?.gstId || selectedGST?.id || "",
      effectiveFrom: formatDateForInput(item.effectiveFrom),
      effectiveTo: formatDateForInput(item.effectiveTo),
    };
    setFormData(updatedItem);
    setIsModalOpen(true);
  };

  const handleViewHistory = async (item) => {
    setSelectedHsnForHistory(item);
    setIsHistoryModalOpen(true);
    setIsHistoryLoading(true);
    setHistoryData([]);
    
    try {
      // Get the HSN ID from the item
      const hsnId = item.id || item.hsnId;
      if (!hsnId) {
        toast.error('HSN ID not found');
        setIsHistoryLoading(false);
        return;
      }

      // Fetch history from API
      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.HSN_HISTORY}${hsnId}`);
      
      console.log('History API Response:', response); // Debug log
      
      if (response && response.status === 'success') {
        // Log the first item to see actual field names
        if (response.data && response.data.length > 0) {
          console.log('First history item keys:', Object.keys(response.data[0]));
          console.log('First history item:', response.data[0]);
        }
        
        // Transform the API response to match the expected format
        const transformedHistory = (response.data || []).map(historyItem => {
          // Helper function to extract date value from various formats
          const extractDateValue = (value) => {
            if (value === null || value === undefined) return null;
            
            // Handle timestamp (number)
            if (typeof value === 'number') {
              return new Date(value).toISOString();
            }
            
            // Handle string dates
            if (typeof value === 'string') {
              const trimmed = value.trim();
              if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
                return null;
              }
              return trimmed; // Return the trimmed string for date parsing
            }
            
            return null;
          };
          
          // Helper function to find date field with multiple variations
          const findDateField = (variations) => {
            for (const variation of variations) {
              if (historyItem.hasOwnProperty(variation)) {
                const value = historyItem[variation];
                const extracted = extractDateValue(value);
                if (extracted) {
                  console.log(`Found date field "${variation}":`, extracted);
                  return extracted;
                }
              }
            }
            return null;
          };
          
          // Comprehensive field mapping for effectiveFrom with all possible variations
          const effectiveFromVariations = [
            'effectiveFrom', 'effective_from', 'effectiveFromDate', 'effective_from_date',
            'startDate', 'start_date', 'startDateValue', 'start_date_value',
            'fromDate', 'from_date', 'fromDateValue', 'from_date_value',
            'effectiveDate', 'effective_date', 'effectiveDateValue', 'effective_date_value',
            'validFrom', 'valid_from', 'validFromDate', 'valid_from_date',
            'createdDate', 'created_date', 'createdAt', 'created_at',
            'dateFrom', 'date_from', 'dateEffective', 'date_effective',
            'effectiveFromDate', 'effective_from_date', 'effectiveFromTime', 'effective_from_time'
          ];
          
          // Comprehensive field mapping for effectiveTo with all possible variations
          const effectiveToVariations = [
            'effectiveTo', 'effective_to', 'effectiveToDate', 'effective_to_date',
            'endDate', 'end_date', 'endDateValue', 'end_date_value',
            'toDate', 'to_date', 'toDateValue', 'to_date_value',
            'validTo', 'valid_to', 'validToDate', 'valid_to_date',
            'expiryDate', 'expiry_date', 'expiresAt', 'expires_at',
            'dateTo', 'date_to', 'dateExpiry', 'date_expiry',
            'effectiveToDate', 'effective_to_date', 'effectiveToTime', 'effective_to_time'
          ];
          
          const effectiveFrom = findDateField(effectiveFromVariations);
          const effectiveTo = findDateField(effectiveToVariations);
          
          // Debug logging
          console.log('Extracted dates - effectiveFrom:', effectiveFrom, 'effectiveTo:', effectiveTo);
          console.log('Raw historyItem:', historyItem);
          
          return {
            id: historyItem.id || historyItem.historyId || historyItem.hsnHistoryId,
            totalGst: historyItem.totalGst || historyItem.gstTaxRate || historyItem.total_gst || historyItem.gst_tax_rate || historyItem.taxRate,
            igst: historyItem.igst || historyItem.igst_rate || historyItem.igstRate,
            cgst: historyItem.cgst || historyItem.cgst_rate || historyItem.cgstRate,
            sgst: historyItem.sgst || historyItem.sgst_rate || historyItem.sgstRate,
            effectiveFrom: effectiveFrom,
            effectiveTo: effectiveTo,
          };
        });
        
        console.log('Transformed History:', transformedHistory);
        setHistoryData(transformedHistory);
      } else {
        toast.error(response?.message || 'Failed to fetch history');
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error loading history data');
      setHistoryData([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!item) return;
    
    // Check isEditable first (like PAN Master)
    if (!item.isEditable) {
      toast.error('HSN is protected - dependent records found');
      return;
    }
    
    // Check if invoices exist (similar to ddoCount check in GSTIN Master)
    const hasInvoices = hasInvoicesForHSN(
      item.id || item.hsnId,
      item.gstinNumber,
      item.hsnCode
    );
    
    if (hasInvoices) {
      toast.error('HSN is protected - dependent records found');
      return;
    }
    
    const confirmationMessage = `${DELETE_BUTTON_CONFIG.MESSAGES.CONFIRMATION}\n\nHSN Code: ${item.hsnCode}\nGSTIN: ${item.gstinNumber}`;
    
    if (!confirm(confirmationMessage)) return;
    
    setIsDeleting(true);
    
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.HSN_DELETE}${item.id}`,
        {}
      );
      
      if (response && response.status === 'success') {
        toast.success('HSN record deleted successfully');
        fetchData();
        fetchBills(); // Refresh bills to update invoice status
      } else {
        const errorMessage = response?.message || 'Failed to delete record';
        toast.error(errorMessage);
        console.error('Delete operation failed:', response);
      }
    } catch (error) {
      const errorMessage = error.name === 'AbortError'
        ? 'Request timeout. Please try again.'
        : 'Network error occurred. Please check your connection.';
      
      toast.error(errorMessage);
      console.error('Delete operation error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const validateForm = (data) => {
    const gstValidation = validateGSTIN(data.gstinNumber);
    if (!gstValidation.valid) {
      return { valid: false, message: gstValidation.message };
    }
    
    const hsnValidation = validateHSN(data.hsnCode);
    if (!hsnValidation.valid) {
      return { valid: false, message: hsnValidation.message };
    }
    
    const serviceNameValidation = validateName(data.serviceName, 'HSN/SSC Description');
    if (!serviceNameValidation.valid) {
      return { valid: false, message: serviceNameValidation.message };
    }
    
    // Validate GST rates
    const totalGstValidation = validateGSTRate(data.totalGst);
    if (!totalGstValidation.valid) {
      return { valid: false, message: totalGstValidation.message };
    }
    
    const igstValidation = validateGSTRate(data.igst);
    if (!igstValidation.valid) {
      return { valid: false, message: igstValidation.message };
    }
    
    const cgstValidation = validateGSTRate(data.cgst);
    if (!cgstValidation.valid) {
      return { valid: false, message: cgstValidation.message };
    }
    
    const sgstValidation = validateGSTRate(data.sgst);
    if (!sgstValidation.valid) {
      return { valid: false, message: sgstValidation.message };
    }
    
    // Validate that CGST + SGST should equal IGST
    const cgst = cgstValidation.cleaned;
    const sgst = sgstValidation.cleaned;
    const igst = igstValidation.cleaned;
    if (Math.abs(cgst + sgst - igst) > 0.01) {
      return { valid: false, message: 'CGST + SGST should equal IGST' };
    }
    
    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataCopy = { ...formData };
    
    // Validate all fields before submission
    let hasErrors = false;
    getFormFields().forEach((field) => {
      if (!field.readOnly) {
        const value = dataCopy[field.key];
        const isValid = validateField(field.key, value, field);
        if (!isValid) {
          hasErrors = true;
        }
      }
    });

    if (hasErrors) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    // Validate form using custom validateForm function
    if (validateForm) {
      const validation = validateForm(dataCopy);
      if (!validation.valid) {
        toast.error(validation.message || t('validation.required'));
        return;
      }
    }

    // Check if editing and if restricted fields are being changed
    if (editingItem) {
      const hasInvoices = hasInvoicesForHSN(
        editingItem.id || editingItem.hsnId,
        editingItem.gstinNumber,
        editingItem.hsnCode
      );

      if (hasInvoices) {
        // Check if GSTIN, HSN Code, or Description are being changed
        if (dataCopy.gstinNumber !== editingItem.gstinNumber) {
          toast.error('Cannot edit GSTIN. Invoices have been generated for this HSN/SSC.');
          return;
        }
        if (dataCopy.hsnCode !== editingItem.hsnCode) {
          toast.error('Cannot edit HSN/SSC Code. Invoices have been generated for this HSN/SSC.');
          return;
        }
        if (dataCopy.serviceName !== editingItem.serviceName) {
          toast.error('Cannot edit HSN/SSC Description. Invoices have been generated for this HSN/SSC.');
          return;
        }
      }
    }

    // Convert gstinNumber to gstId for API
    if (dataCopy.gstinNumber && gstinList.length > 0) {
      const selectedGST = gstinList.find(
        (gst) => gst.value === dataCopy.gstinNumber || gst.gstNumber === dataCopy.gstinNumber || gst.gstinNumber === dataCopy.gstinNumber
      );
      if (selectedGST) {
        dataCopy.gstId = selectedGST.gstId || selectedGST.id;
      }
      // Keep gstinNumber for display but API expects gstId
    }

    try {
      const url = editingItem ? API_ENDPOINTS.HSN_UPDATE : API_ENDPOINTS.HSN_ADD;
      const response = await ApiService.handlePostRequest(url, dataCopy);
      
      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        setIsModalOpen(false);
        fetchData();
        fetchBills(); // Refresh bills to update invoice status
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateField = (fieldKey, value, fieldConfig) => {
    let error = '';
    const fieldName = fieldConfig?.label || fieldKey;
    const fieldLower = fieldKey.toLowerCase();

    // Skip validation for read-only fields
    if (fieldConfig?.readOnly) {
      return true;
    }

    // Required field validation
    if (fieldConfig?.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      error = `${fieldName} is required`;
      setFieldErrors((prev) => ({ ...prev, [fieldKey]: error }));
      return false;
    }

    // Skip further validation if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
      return true;
    }

    // Field-specific validation
    if (fieldLower.includes('gstin') && gstinList.length === 0) {
      const validation = validateGSTIN(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('hsn') && (fieldLower.includes('code') || fieldLower.includes('number'))) {
      const validation = validateHSN(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('name') && !fieldLower.includes('number') && !fieldLower.includes('code')) {
      const validation = validateName(value, fieldName);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('gstrate') || fieldLower.includes('gsttaxrate') || fieldLower.includes('igst') || fieldLower.includes('cgst') || fieldLower.includes('sgst')) {
      const validation = validateGSTRate(value);
      if (!validation.valid) error = validation.message;
    }

    if (error) {
      setFieldErrors((prev) => ({ ...prev, [fieldKey]: error }));
      return false;
    } else {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
      return true;
    }
  };

  const columns = [
    { key: 'gstinNumber', label: t('label.gstin') },
    { key: 'hsnCode', label: 'HSN/SSC Code' },
    { key: 'serviceName', label: 'HSN/SSC Description' },
    { 
      key: 'effectiveFrom', 
      label: 'Effective From',
      render: (value) => formatDate(value)
    },
    { 
      key: 'effectiveTo', 
      label: 'Effective To',
      render: (value) => value ? formatDate(value) : 'Current'
    },
    { key: 'totalGst', label: 'GST Tax Rate (%)' },
    { key: 'igst', label: 'IGST (%)' },
    { key: 'cgst', label: 'CGST (%)' },
    { key: 'sgst', label: 'SGST (%)' },
  ];

  const getFormFields = () => {
    const hasInvoices = editingItem ? hasInvoicesForHSN(
      editingItem.id || editingItem.hsnId,
      editingItem.gstinNumber,
      editingItem.hsnCode
    ) : false;

    return [
      { 
        key: 'gstinNumber', 
        label: t('label.gstin'), 
        required: true, 
        maxLength: 15,
        readOnly: editingItem && hasInvoices
      },
      { 
        key: 'hsnCode', 
        label: 'HSN/SSC Code', 
        required: true,
        readOnly: editingItem && hasInvoices
      },
      { 
        key: 'serviceName', 
        label: 'HSN/SSC Description', 
        required: true,
        readOnly: editingItem && hasInvoices
      },
     
      { 
        key: 'totalGst', 
        label: 'GST Tax Rate (%)', 
        type: 'number',
        required: true 
      },
      { 
        key: 'igst', 
        label: 'IGST (%)', 
        type: 'number',
        required: true, 
        readOnly: true 
      },
      { 
        key: 'cgst', 
        label: 'CGST (%)', 
        type: 'number',
        required: true, 
        readOnly: true 
      },
      { 
        key: 'sgst', 
        label: 'SGST (%)', 
        type: 'number',
        required: true, 
        readOnly: true 
      },
       { 
        key: 'effectiveFrom', 
        label: 'Effective From', 
        type: 'date',
        required: true
      },
      { 
        key: 'effectiveTo', 
        label: 'Effective To', 
        type: 'date',
        required: false
      },
    ];
  };

  const tableActions = useMemo(() => (row) => {
    const buttonState = getDeleteButtonState(row);
    // Check isEditable from API response (exactly like PAN Master)
    const isEditable = row.isEditable;
    
    // Edit button is always enabled (like PAN Master)
    // Delete button is disabled if isEditable is false (checked in getDeleteButtonState) or if invoices exist
    const canDelete = !buttonState.isDisabled;
    
    return (
      <>
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canDelete) {
              handleDelete(row);
            }
          }}
          disabled={!canDelete || isDeleting}
          className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md ${
            canDelete && !isDeleting
              ? DELETE_BUTTON_CONFIG.STYLES.ENABLED
              : DELETE_BUTTON_CONFIG.STYLES.DISABLED
          }`}
          aria-label={`${isDeleting ? 'Deleting...' : !canDelete ? 'Delete disabled' : 'Delete '}HSN record`}
          title={!canDelete ? buttonState.message : 'Delete HSN record'}
          type="button"
          role="button"
          data-testid="hsn-delete-button"
          data-hsn-code={row.hsnCode}
          data-gstin={row.gstinNumber}
          aria-describedby={!canDelete ? 'hsn-delete-disabled-reason' : undefined}
        >
          {isDeleting ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Trash2 size={18} />
          )}
          <span className="sr-only">
            {isDeleting ? 'Deleting record' : !canDelete ? buttonState.message : 'Delete record'}
          </span>
        </button>
        
        {/* Hidden element for screen readers to explain why delete is disabled */}
        {!canDelete && (
          <div
            id="hsn-delete-disabled-reason"
            className="sr-only"
            role="status"
            aria-live="polite"
          >
            {buttonState.message}
          </div>
        )}
      </>
    );
  }, [isDeleting, getDeleteButtonState]);

  return (
    <Layout role="admin">
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
              <span className="gradient-text">HSN Master</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
              Manage hsn master efficiently
            </p>
          </div>
          <Button onClick={handleAdd} variant="primary" className="group w-full sm:w-auto">
            <Plus className="mr-2 group-hover:rotate-90 transition-transform duration-300" size={18} />
            {t('btn.add')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="premium-input w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3.5 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none shadow-md text-sm sm:text-base"
          />
        </div>

        {/* Table */}
        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading data..." variant="primary" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-8 sm:p-16 text-center">
              <p className="text-[var(--color-text-secondary)]">No HSN records found</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                {data.length === 0 ? 'No data available' : 'No data matches your search'}
              </p>
            </div>
          ) : (
            <Table
              columns={columns}
              data={filteredData}
              actions={tableActions}
            />
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? `Edit HSN Master` : `Add HSN Master`}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {getFormFields().map((field) => {
              const hasInvoices = editingItem ? hasInvoicesForHSN(
                editingItem.id || editingItem.hsnId,
                editingItem.gstinNumber,
                editingItem.hsnCode
              ) : false;
              
              const isReadOnly = field.readOnly || (
                editingItem && hasInvoices && 
                (field.key === 'gstinNumber' || field.key === 'hsnCode' || field.key === 'serviceName')
              );
              
              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                    {isReadOnly && editingItem && hasInvoices && (
                      <span className="ml-2 text-xs text-orange-500">
                        (Cannot edit: Invoices exist)
                      </span>
                    )}
                  </label>
                  {field.type === 'date' ? (
                    <>
                      <input
                        type="date"
                        value={formData[field.key] || ''}
                        onChange={(e) => updateFormData(field.key, e.target.value)}
                        onBlur={(e) => validateField(field.key, e.target.value, field)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                          fieldErrors[field.key] ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border)]'
                        } bg-[var(--color-background)]`}
                        required={field.required}
                        readOnly={isReadOnly}
                      />
                      {fieldErrors[field.key] && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors[field.key]}</p>
                      )}
                    </>
                  ) : (field.key.toLowerCase().includes('gstin') || field.key.toLowerCase().includes('gstnumber')) && gstinList.length > 0 ? (
                    <>
                      <select
                        value={formData[field.key] ?? ''}
                        onChange={(e) => updateFormData(field.key, e.target.value)}
                        onBlur={(e) => validateField(field.key, e.target.value, field)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] uppercase border-[var(--color-border)] ${
                          isReadOnly ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'bg-[var(--color-background)]'
                        }`}
                        required={field.required}
                        disabled={isReadOnly}
                      >
                        <option value="">Select GSTIN Number</option>
                        {gstinList.map((gstin) => (
                          <option key={gstin.value || gstin.gstNumber} value={gstin.value || gstin.gstNumber || gstin.gstinNumber}>
                            {gstin.label || gstin.value || gstin.gstNumber || gstin.gstinNumber}
                          </option>
                        ))}
                      </select>
                      {fieldErrors[field.key] && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors[field.key]}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type={field.type || 'text'}
                        value={formData[field.key] ?? ''}
                        onChange={(e) => {
                          let value = e.target.value;
                          const fieldLower = field.key.toLowerCase();

                          if (fieldLower.includes('hsn') || fieldLower.includes('hsnnumber')) {
                            value = value.replace(/\D/g, '');
                          } else if (fieldLower.includes('gstrate') || fieldLower.includes('gsttaxrate') || fieldLower.includes('igst') || fieldLower.includes('cgst') || fieldLower.includes('sgst')) {
                            value = value.replace(/[^\d.]/g, '');
                            const parts = value.split('.');
                            if (parts.length > 2) {
                              value = parts[0] + '.' + parts.slice(1).join('');
                            }
                          }

                          if (field.key === 'totalGst') {
                            const total = parseFloat(value) || 0;
                            updateFormData('totalGst', total);
                            updateFormData('igst', total);
                            updateFormData('cgst', total / 2);
                            updateFormData('sgst', total / 2);
                          } else {
                            updateFormData(field.key, value);
                          }
                        }}
                        onBlur={(e) => {
                          let valueToValidate = e.target.value;
                          if (field.type === 'number') {
                            valueToValidate = valueToValidate === '' ? '' : parseFloat(valueToValidate);
                          }
                          validateField(field.key, valueToValidate, field);
                        }}
                        readOnly={isReadOnly}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                          fieldErrors[field.key] ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border)]'
                        } ${isReadOnly ? 'bg-[var(--color-background)] cursor-not-allowed opacity-75' : 'bg-[var(--color-background)]'}`}
                        placeholder={field.placeholder}
                        required={field.required}
                        maxLength={field.maxLength}
                        min={field.min}
                        max={field.max}
                      />
                      {fieldErrors[field.key] && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors[field.key]}</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                {t('btn.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('btn.save')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* History Modal */}
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title="HSN/SSC Tax Change History"
          size="lg"
        >
          {selectedHsnForHistory && (
            <div className="space-y-4">
              <div className="mb-4 p-3 bg-[var(--color-surface)] rounded-lg">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <strong>GSTIN:</strong> {selectedHsnForHistory.gstinNumber}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <strong>HSN/SSC Code:</strong> {selectedHsnForHistory.hsnCode}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <strong>Description:</strong> {selectedHsnForHistory.serviceName}
                </p>
              </div>
              
              {isHistoryLoading ? (
                <div className="text-center py-8">
                  <LoadingProgressBar message="Loading history..." variant="primary" />
                </div>
              ) : historyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-surface)]">
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">GST Tax Rate (%)</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">IGST (%)</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">CGST (%)</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">SGST (%)</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">Effective From</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">Effective To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((history, index) => (
                        <HistoryRow key={history.id || `history-${index}`} history={history} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  <p>No history available for this HSN/SSC.</p>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsHistoryModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}