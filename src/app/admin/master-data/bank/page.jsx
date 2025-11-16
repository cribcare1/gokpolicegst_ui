"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { validateIFSC, validateMICR, validateAccountNumber, validateName } from '@/lib/gstUtils';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';
import { useGstinList } from '@/hooks/useGstinList';

export default function BankDetailsPage() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [gstinList, setGstinList] = useState([]);
  const [bills, setBills] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fieldErrors, setFieldErrors] = useState({});
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
    let filtered = data;

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredData(filtered);
  }, [searchTerm, statusFilter, data]);

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

  // Check if invoices exist for this bank
  const hasInvoicesForBank = (bankId, gstinNumber) => {
    if (!bills || bills.length === 0) return false;
    
    return bills.some(bill => {
      // Normalize GSTIN for comparison
      const billGstin = bill.gstinNumber || bill.gstNumber || '';
      const normalizedGstin = gstinNumber?.toUpperCase() || '';
      const normalizedBillGstin = billGstin.toUpperCase();
      
      // Check if GSTIN matches
      return normalizedBillGstin === normalizedGstin;
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.BANK_LIST);
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
          
          // Map alternative field names for accountHolderName
          const hasAccountHolderName = transformed.accountHolderName && 
                                      transformed.accountHolderName.toString().trim() !== '';
          
          if (!hasAccountHolderName) {
            const keys = Object.keys(transformed);
            let foundValue = null;
            
            if (transformed.accountName && transformed.accountName.toString().trim() !== '') {
              foundValue = transformed.accountName;
            } else if (transformed.accountHolder && transformed.accountHolder.toString().trim() !== '') {
              foundValue = transformed.accountHolder;
            } else if (transformed.holderName && transformed.holderName.toString().trim() !== '') {
              foundValue = transformed.holderName;
            } else if (transformed.account_holder_name && transformed.account_holder_name.toString().trim() !== '') {
              foundValue = transformed.account_holder_name;
            }
            
            if (foundValue) {
              transformed.accountHolderName = foundValue;
            }
          }

          // Map status field - normalize to 'Active' or 'Inactive'
          // Handle various status formats from API
          if (transformed.status) {
            // Normalize existing status to capitalized format
            const statusLower = String(transformed.status).toLowerCase();
            transformed.status = statusLower === 'active' ? 'Active' : 'Inactive';
          } else if (transformed.isActive !== undefined) {
            // Derive from isActive boolean
            transformed.status = transformed.isActive ? 'Active' : 'Inactive';
          } else {
            // Default to Active
            transformed.status = 'Active';
          }

          // Check if invoices exist for this bank
          const hasInvoices = hasInvoicesForBank(
            transformed.id || transformed.bankId,
            transformed.gstinNumber
          );
          transformed.hasInvoices = hasInvoices;
          
          return transformed;
        });
        
        setData(transformedData);
        setFilteredData(transformedData);
      }
    } catch (error) {
      console.log('Error fetching bank data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    // Set default effectiveDate to today and status to Active
    setFormData({
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'Active'
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
      // Ensure status is set
      status: item.status || (item.isActive !== undefined ? (item.isActive ? 'Active' : 'Inactive') : 'Active'),
    };
    setFormData(updatedItem);
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    // Check if invoices exist (similar to ddoCount check in GSTIN Master)
    const hasInvoices = hasInvoicesForBank(
      item.id || item.bankId,
      item.gstinNumber
    );
    
    if (hasInvoices) {
      toast.error('Bank details is protected - dependent records found');
      return;
    }

    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.BANK_DELETE}${item.id}`,
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
    console.log("Bank validate form: ", data);
    
    const accountNumberValidation = validateAccountNumber(data.accountNumber);
    if (!accountNumberValidation.valid) {
      return { valid: false, message: accountNumberValidation.message };
    }
    
    const accountHolderNameValidation = validateName(data.accountHolderName, 'Account Holder Name');
    if (!accountHolderNameValidation.valid) {
      return { valid: false, message: accountHolderNameValidation.message };
    }
    
    const bankNameValidation = validateName(data.bankName, 'Bank Name');
    if (!bankNameValidation.valid) {
      return { valid: false, message: bankNameValidation.message };
    }
    
    const branchNameValidation = validateName(data.branchName, 'Branch Name');
    if (!branchNameValidation.valid) {
      return { valid: false, message: branchNameValidation.message };
    }
    
    const ifscValidation = validateIFSC(data.ifscCode);
    if (!ifscValidation.valid) {
      return { valid: false, message: ifscValidation.message };
    }
    
    const micrValidation = validateMICR(data.micrCode);
    if (!micrValidation.valid) {
      return { valid: false, message: micrValidation.message };
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

    // Convert gstinNumber to gstId for API
    if (dataCopy.gstinNumber && gstinList.length > 0) {
      const selectedGST = gstinList.find(
        (gst) => gst.value === dataCopy.gstinNumber || gst.gstNumber === dataCopy.gstinNumber || gst.gstinNumber === dataCopy.gstinNumber
      );
      if (selectedGST) {
        dataCopy.gstId = selectedGST.gstId || selectedGST.id;
      }
    }

    try {
      if (editingItem) {
        // When editing: ALWAYS inactivate old record and create new one
        // Step 1: Inactivate the old bank record
        const oldBankData = {
          ...editingItem,
          status: 'Inactive',
          isActive: false
        };
        
        // Convert old GSTIN to gstId if needed
        if (oldBankData.gstinNumber && gstinList.length > 0) {
          const oldGST = gstinList.find(
            (gst) => gst.value === oldBankData.gstinNumber || gst.gstNumber === oldBankData.gstinNumber
          );
          if (oldGST) {
            oldBankData.gstId = oldGST.gstId || oldGST.id;
          }
        }

        // Inactivate old record
        await ApiService.handlePostRequest(API_ENDPOINTS.BANK_UPDATE, oldBankData);
        
        // Step 2: Create new active record with same GSTIN
        const newBankData = {
          ...dataCopy,
          status: 'Active',
          isActive: true,
          // Ensure GSTIN matches the old one
          gstinNumber: editingItem.gstinNumber,
          // Remove id to create new record
          id: undefined,
          bankId: undefined
        };

        // Convert GSTIN to gstId for new record
        if (newBankData.gstinNumber && gstinList.length > 0) {
          const newGST = gstinList.find(
            (gst) => gst.value === newBankData.gstinNumber || gst.gstNumber === newBankData.gstinNumber
          );
          if (newGST) {
            newBankData.gstId = newGST.gstId || newGST.id;
          }
        }

        const response = await ApiService.handlePostRequest(API_ENDPOINTS.BANK_ADD, newBankData);
        
        if (response && response.status === 'success') {
          toast.success('Bank details updated successfully. Old record inactivated, new record created.');
          setIsModalOpen(false);
          fetchData();
          fetchBills();
        } else {
          toast.error(response?.message || t('alert.error'));
        }
      } else {
        // Adding new record - ensure status is Active
        dataCopy.status = 'Active';
        dataCopy.isActive = true;
        
        const response = await ApiService.handlePostRequest(API_ENDPOINTS.BANK_ADD, dataCopy);
        
        if (response && response.status === 'success') {
          toast.success(t('alert.success'));
          setIsModalOpen(false);
          fetchData();
          fetchBills();
        } else {
          toast.error(response?.message || t('alert.error'));
        }
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
    if (fieldLower.includes('name') && !fieldLower.includes('number') && !fieldLower.includes('code')) {
      const validation = validateName(value, fieldName);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('ifsc') || fieldLower.includes('ifsc code')) {
      const validation = validateIFSC(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('micr') || fieldLower.includes('micr code')) {
      const validation = validateMICR(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('accountnumber') || fieldLower.includes('account number')) {
      const validation = validateAccountNumber(value);
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
    { key: 'accountNumber', label: 'Account Number' },
    { key: 'accountHolderName', label: 'Account Holder Name' },
    { key: 'bankName', label: 'Bank Name' },
    { key: 'branchName', label: 'Branch Name' },
    { key: 'accountType', label: 'Account Type' },
    { key: 'ifscCode', label: 'IFSC Code' },
    { key: 'micrCode', label: 'MICR Code' },
    { 
      key: 'effectiveDate', 
      label: 'Effective Date',
      render: (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A'
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (status) => {
        const statusValue = status || 'Active';
        const isActive = statusValue === 'Active' || statusValue === 'active' || statusValue === true;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
  ];

  const getFormFields = () => {
    return [
      { 
        key: 'gstinNumber', 
        label: t('label.gstin'), 
        required: true, 
        maxLength: 15,
        readOnly: editingItem ? true : false // GSTIN cannot be changed when editing (must remain same)
      },
      { key: 'accountNumber', label: 'Account Number', required: true },
      { key: 'accountHolderName', label: 'Account Holder Name', required: true },
      { key: 'bankName', label: 'Bank Name', required: true },
      { key: 'branchName', label: 'Branch Name', required: true },
      { key: 'accountType', label: 'Account Type', required: true, type: 'select', options: [
        { value: 'Savings', label: 'Savings' },
        { value: 'Current', label: 'Current' },
        { value: 'Fixed Deposit', label: 'Fixed Deposit' },
        { value: 'Recurring Deposit', label: 'Recurring Deposit' },
      ]},
      { key: 'ifscCode', label: 'IFSC Code', required: true, maxLength: 11 },
      { key: 'micrCode', label: 'MICR Code', required: true, maxLength: 9 },
      { 
        key: 'effectiveDate', 
        label: 'Effective Date', 
        type: 'date',
        required: true
      },
      { 
        key: 'status', 
        label: 'Status', 
        type: 'select', 
        required: true,
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' },
        ],
        readOnly: editingItem ? true : false // Status is read-only when editing (auto-set to Active for new record)
      },
    ];
  };

  const tableActions = (row) => {
    // Check if invoices exist (similar to ddoCount check in GSTIN Master)
    const hasInvoices = hasInvoicesForBank(
      row.id || row.bankId,
      row.gstinNumber
    );
    const canDelete = !hasInvoices;
    
    return (
      <>
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
          disabled={!canDelete}
          className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md ${
            canDelete
              ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
          }`}
          aria-label="Delete"
          title={!canDelete ? 'Bank details is protected - dependent records found' : 'Delete'}
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
              <span className="gradient-text">Bank Details</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
              Manage bank details efficiently
            </p>
          </div>
          <Button onClick={handleAdd} variant="primary" className="group w-full sm:w-auto">
            <Plus className="mr-2 group-hover:rotate-90 transition-transform duration-300" size={18} />
            {t('btn.add')}
          </Button>
        </div>

        {/* Search and Status Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="premium-input w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3.5 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none shadow-md text-sm sm:text-base"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="premium-input w-full px-4 py-2.5 sm:py-3.5 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] shadow-md text-sm sm:text-base cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
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
          title={editingItem ? `Edit Bank Details` : `Add Bank Details`}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {getFormFields().map((field) => {
              const isReadOnly = field.readOnly;
              
              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                    {isReadOnly && editingItem && (
                      <span className="ml-2 text-xs text-orange-500">
                        (Auto-set when editing)
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
                      {isReadOnly && editingItem && (
                        <p className="mt-1 text-xs text-orange-500">GSTIN cannot be changed when editing</p>
                      )}
                      {fieldErrors[field.key] && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors[field.key]}</p>
                      )}
                    </>
                  ) : field.type === 'select' && field.options ? (
                    <>
                      <select
                        value={formData[field.key] ?? ''}
                        onChange={(e) => updateFormData(field.key, e.target.value)}
                        onBlur={(e) => validateField(field.key, e.target.value, field)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                          fieldErrors[field.key] ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border)]'
                        } ${isReadOnly ? 'bg-[var(--color-background)] cursor-not-allowed opacity-75' : 'bg-[var(--color-background)]'}`}
                        required={field.required}
                        disabled={isReadOnly}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
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

                          if (fieldLower.includes('accountnumber') || fieldLower.includes('account number')) {
                            value = value.replace(/\D/g, '');
                          } else if (fieldLower.includes('micr') || fieldLower.includes('micr code')) {
                            value = value.replace(/\D/g, '').slice(0, 9);
                          } else if (fieldLower.includes('ifsc') || fieldLower.includes('ifsc code')) {
                            value = value.toUpperCase().slice(0, 11);
                          }

                          updateFormData(field.key, value);
                        }}
                        onKeyPress={(e) => {
                          const fieldLower = field.key.toLowerCase();
                          if (fieldLower.includes('accountnumber') || fieldLower.includes('account number') ||
                              fieldLower.includes('micr') || fieldLower.includes('micr code')) {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }
                        }}
                        onPaste={(e) => {
                          const fieldLower = field.key.toLowerCase();
                          if (fieldLower.includes('accountnumber') || fieldLower.includes('account number')) {
                            e.preventDefault();
                            const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
                            updateFormData(field.key, pastedText);
                          } else if (fieldLower.includes('micr') || fieldLower.includes('micr code')) {
                            e.preventDefault();
                            const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 9);
                            updateFormData(field.key, pastedText);
                          }
                        }}
                        onBlur={(e) => {
                          validateField(field.key, e.target.value, field);
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

            {editingItem && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> When editing bank details, the old record will be inactivated and a new active record will be created with the same GSTIN. GSTIN cannot be changed.
              </div>
            )}

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
      </div>
    </Layout>
  );
}
