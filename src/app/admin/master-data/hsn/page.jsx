"use client";
import { useState, useEffect } from 'react';
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
  const { gstinList: gstinListHook } = useGstinList();

  useEffect(() => {
    fetchData();
    fetchGSTINList();
    fetchBills();
  }, []);

  useEffect(() => {
    if (gstinListHook && gstinListHook.length > 0) {
      setGstinList(gstinListHook);
    }
  }, [gstinListHook]);

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
        setGstinList(response.data);
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

  // Check if invoices exist for this HSN
  const hasInvoicesForHSN = (hsnId, gstinNumber, hsnCode) => {
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
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.HSN_LIST);
      if (response && response.status === 'success') {
        const transformedData = (response.data || []).map(item => {
          const transformed = { ...item };
          
          // Map gstId to gstinNumber if gstinNumber is missing
          if (!transformed.gstinNumber && transformed.gstId && gstinList.length > 0) {
            const gst = gstinList.find(g => g.gstId === transformed.gstId || g.id === transformed.gstId);
            if (gst) {
              transformed.gstinNumber = gst.value || gst.gstNumber || gst.gstinNumber;
            }
          }
          if (!transformed.gstinNumber && transformed.gstNumber) {
            transformed.gstinNumber = transformed.gstNumber;
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
          if (!transformed.totalGst && transformed.gstTaxRate !== undefined) {
            transformed.totalGst = transformed.gstTaxRate;
          }

          // Check if invoices exist for this HSN
          const hasInvoices = hasInvoicesForHSN(
            transformed.id || transformed.hsnId,
            transformed.gstinNumber,
            transformed.hsnCode
          );
          transformed.hasInvoices = hasInvoices;
          transformed.isEditable = !hasInvoices;
          
          return transformed;
        });
        
        setData(transformedData);
        setFilteredData(transformedData);
      }
    } catch (error) {
      console.log('Error fetching HSN data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    // Set default effectiveDate to today
    setFormData({
      effectiveDate: new Date().toISOString().split('T')[0]
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
    };
    setFormData(updatedItem);
    setIsModalOpen(true);
  };

  const handleViewHistory = async (item) => {
    setSelectedHsnForHistory(item);
    setIsHistoryModalOpen(true);
    
    // Fetch history - for now, we'll create a mock history based on current data
    // In production, this should call an API endpoint
    try {
      // TODO: Replace with actual API endpoint when available
      // const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.HSN_HISTORY}/${item.id}`);
      // For now, create mock history
      const mockHistory = [
        {
          id: 1,
          effectiveDate: item.effectiveDate || new Date().toISOString().split('T')[0],
          totalGst: item.totalGst,
          igst: item.igst,
          cgst: item.cgst,
          sgst: item.sgst,
          changedBy: 'Admin',
          changedAt: new Date().toISOString(),
        }
      ];
      setHistoryData(mockHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistoryData([]);
    }
  };

  const handleDelete = async (item) => {
    const hasInvoices = hasInvoicesForHSN(
      item.id || item.hsnId,
      item.gstinNumber,
      item.hsnCode
    );
    
    if (hasInvoices) {
      toast.error('Cannot delete HSN/SSC. Invoices have been generated for this HSN/SSC.');
      return;
    }

    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.HSN_DELETE}${item.id}`,
        {}
      );
      
      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        fetchData();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
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
      key: 'effectiveDate', 
      label: 'Effective Date',
      render: (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A'
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
        key: 'effectiveDate', 
        label: 'Effective Date', 
        type: 'date',
        required: true
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
    ];
  };

  const tableActions = (row) => {
    const hasInvoices = hasInvoicesForHSN(
      row.id || row.hsnId,
      row.gstinNumber,
      row.hsnCode
    );
    
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewHistory(row);
          }}
          className="p-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-purple-600 dark:text-purple-400"
          aria-label="View History"
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
          aria-label="Edit"
        >
          <Edit size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row);
          }}
          disabled={hasInvoices}
          className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md ${
            hasInvoices 
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50' 
              : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer'
          }`}
          aria-label="Delete"
          title={hasInvoices ? 'Cannot delete: Invoices exist for this HSN/SSC' : 'Delete'}
        >
          <Trash2 size={18} />
        </button>
      </>
    );
  };

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
              
              {historyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-surface)]">
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">Effective Date</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">GST Tax Rate (%)</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">IGST (%)</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">CGST (%)</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">SGST (%)</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">Changed By</th>
                        <th className="border border-[var(--color-border)] p-2 text-left text-sm font-semibold">Changed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((history, index) => (
                        <tr key={index} className="hover:bg-[var(--color-surface)]">
                          <td className="border border-[var(--color-border)] p-2 text-sm">
                            {new Date(history.effectiveDate).toLocaleDateString()}
                          </td>
                          <td className="border border-[var(--color-border)] p-2 text-sm">{history.totalGst}</td>
                          <td className="border border-[var(--color-border)] p-2 text-sm">{history.igst}</td>
                          <td className="border border-[var(--color-border)] p-2 text-sm">{history.cgst}</td>
                          <td className="border border-[var(--color-border)] p-2 text-sm">{history.sgst}</td>
                          <td className="border border-[var(--color-border)] p-2 text-sm">{history.changedBy || 'N/A'}</td>
                          <td className="border border-[var(--color-border)] p-2 text-sm">
                            {history.changedAt ? new Date(history.changedAt).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
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
