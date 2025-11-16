"use client";
import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { validatePAN, validateEmail, validateMobile, validateName, validateAddress, validateCity, validatePIN } from '@/lib/gstUtils';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';

// Extract PAN from GSTIN (positions 2-11, 0-indexed: 2-12)
const extractPANFromGSTIN = (gstin) => {
  if (!gstin || gstin.length < 12) return null;
  return gstin.substring(2, 12).toUpperCase();
};

export default function PANRecordsPage() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [gstinList, setGstinList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchData();
    fetchGSTINList();
  }, []);

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
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.GST_LIST);
      if (response?.status === 'success' && response?.data) {
        setGstinList(response.data);
      }
    } catch (error) {
      console.error('Error fetching GSTIN list:', error);
    }
  };

  // Calculate GSTIN count for each PAN
  const getGSTINCount = (panNumber) => {
    if (!panNumber || !gstinList.length) return 0;
    return gstinList.filter(gstin => {
      const extractedPAN = extractPANFromGSTIN(gstin.gstNumber || gstin.gstinNumber);
      return extractedPAN === panNumber.toUpperCase();
    }).length;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.PAN_LIST);
      if (response && response.status === 'success') {
        // Add GSTIN count and isEditable to each PAN record
        const panData = (response.data || []).map(item => {
          const gstinCount = getGSTINCount(item.panNumber);
          return {
            ...item,
            gstinCount: gstinCount,
            isEditable: item.isEditable,
          };
        });
        setData(panData);
        setFilteredData(panData);
      }
    } catch (error) {
      console.log('Error fetching PAN data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    const gstinCount = getGSTINCount(item.panNumber);
    if (gstinCount > 0) {
      toast.error(`PAN is protected - dependent records found`);
      return;
    }

    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.PAN_DELETE}${item.id}`,
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
    const panValidation = validatePAN(data.panNumber);
    if (!panValidation.valid) {
      return { valid: false, message: panValidation.message };
    }
    
    const panNameValidation = validateName(data.panName, 'PAN Name');
    if (!panNameValidation.valid) {
      return { valid: false, message: panNameValidation.message };
    }
    
    const addressValidation = validateAddress(data.address);
    if (!addressValidation.valid) {
      return { valid: false, message: addressValidation.message };
    }
    
    const cityValidation = validateCity(data.city);
    if (!cityValidation.valid) {
      return { valid: false, message: cityValidation.message };
    }
    
    const pinValidation = validatePIN(data.pinCode);
    if (!pinValidation.valid) {
      return { valid: false, message: pinValidation.message };
    }
    
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
      return { valid: false, message: emailValidation.message };
    }
    
    const mobileValidation = validateMobile(data.mobile);
    if (!mobileValidation.valid) {
      return { valid: false, message: mobileValidation.message };
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

    // Check if PAN number is being edited and GSTIN count > 0
    if (editingItem && dataCopy.panNumber !== editingItem.panNumber) {
      // const gstinCount = getGSTINCount(editingItem.panNumber);
      if (!dataCopy.isEditable) {

        // toast.error(`Cannot edit PAN number. There are ${gstinCount} GSTIN(s) associated with this PAN.`);
        // return;
      }
    }

    try {
      const url = editingItem ? API_ENDPOINTS.PAN_UPDATE : API_ENDPOINTS.PAN_ADD;
      const response = await ApiService.handlePostRequest(url, dataCopy);
      
      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        setIsModalOpen(false);
        fetchData();
        fetchGSTINList(); // Refresh GSTIN list to update counts
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
    if (fieldLower.includes('pan') && (fieldLower.includes('number') || fieldLower.includes('no') || fieldLower.includes('pannumber'))) {
      const validation = validatePAN(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('email')) {
      const validation = validateEmail(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('mobile') || fieldLower.includes('contactnumber') || fieldLower.includes('phone')) {
      const validation = validateMobile(String(value));
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('pin') || fieldLower.includes('pincode')) {
      const validation = validatePIN(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('name') && !fieldLower.includes('number') && !fieldLower.includes('code')) {
      const validation = validateName(value, fieldName);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('address')) {
      const validation = validateAddress(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('city')) {
      const validation = validateCity(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldConfig?.maxLength && String(value).length > fieldConfig.maxLength) {
      error = `${fieldName} must be less than ${fieldConfig.maxLength} characters`;
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
    { key: 'panNumber', label: t('label.panNumber') },
    { key: 'panName', label: t('label.name') },
    { key: 'address', label: t('label.address') },
    { key: 'city', label: 'City' },
    { key: 'pinCode', label: 'PIN' },
    { key: 'mobile', label: t('label.mobile') },
    { key: 'email', label: t('label.email') },
    
  ];

  /**
   * Determines if a PAN item can be edited based on its properties and business rules
   * @param {Object} item - The PAN item to check editability for
   * @returns {boolean} - Whether the item can be edited
   */
  const getItemEditability = (item) => {
    // New items are always editable
    if (!item) {
      return true;
    }
    
    // Defensive programming: ensure the item has the expected structure
    if (typeof item !== 'object' || item === null) {
      console.warn('Invalid item structure for editability check:', item);
      return true;
    }
    
    // Check for explicit isEditable property
    if (Object.prototype.hasOwnProperty.call(item, 'isEditable')) {
      // Ensure we return a boolean, handle edge cases
      return Boolean(item.isEditable);
    }
    
    // Default behavior for backward compatibility
    return true;
  };

  /**
   * Gets form field configurations with proper editability rules
   * @returns {Array} Array of field configuration objects
   */
  const getFormFields = () => {
    // Determine if the current PAN is editable based on associated GSTIN count and item state
    const currentIsEditable = getItemEditability(editingItem);
    
    // Optimized field configuration with memoization for better performance
    const panNumberField = useMemo(() => ({
      key: 'panNumber',
      label: t('label.panNumber'),
      required: true,
      maxLength: 10,
      readOnly: editingItem ? !currentIsEditable : false,
      // Add metadata for better debugging and maintenance
      _meta: {
        isProtectedField: editingItem && !currentIsEditable,
        protectionReason: editingItem && !currentIsEditable ?
          `PAN is protected - dependent records found` : null
      }
    }), [editingItem, currentIsEditable]);
    
    return [
      panNumberField,
      { key: 'panName', label: t('label.name'), required: true },
      { key: 'address', label: t('label.address'), type: 'textarea', required: true },
      { key: 'city', label: 'City', required: true },
      { key: 'pinCode', label: 'PIN', required: true, maxLength: 6, type: 'text' },
      { key: 'mobile', label: t('label.mobile'), required: true, maxLength: 10 },
      { key: 'email', label: t('label.email'), type: 'email', required: true },
    ];
  };

  const tableActions = (row) => {
    const gstinCount = getGSTINCount(row.panNumber);
    // const isEditable = gstinCount === 0;
    const isEditable = row.isEditable;
    console.log('Row GSTIN Count:', gstinCount, 'Is Editable:', isEditable);
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
          disabled={!isEditable}
          className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md ${
            isEditable 
              ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer' 
              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
          }`}
          aria-label="Delete"
          title={!isEditable ? `PAN is protected - dependent records found` : 'Delete'}
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
              <span className="gradient-text">PAN Master</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
              Manage pan master efficiently
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
          title={editingItem ? `Edit PAN Master` : `Add PAN Master`}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {getFormFields().map((field) => {
              const isPANNumberField = field.key === 'panNumber';
              const gstinCount = editingItem ? getGSTINCount(editingItem.panNumber) : 0;
              const isReadOnly = field.readOnly || (isPANNumberField && editingItem && gstinCount > 0);
              
              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                    {isReadOnly && isPANNumberField && (
                      <span className="ml-2 text-xs text-orange-500">
                        (PAN is protected - dependent records found)
                      </span>
                    )}
                  </label>
                  {field.type === 'textarea' ? (
                    <>
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => updateFormData(field.key, e.target.value)}
                        onBlur={(e) => validateField(field.key, e.target.value, field)}
                        className={`w-full px-3 py-2 bg-[var(--color-background)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                          fieldErrors[field.key] ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border)]'
                        }`}
                        rows={3}
                        required={field.required}
                      />
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

                          if (fieldLower.includes('mobile') || fieldLower.includes('contactnumber') || fieldLower.includes('phone')) {
                            value = value.replace(/\D/g, '').slice(0, 10);
                          } else if (fieldLower.includes('pin') || fieldLower.includes('pinCode')) {
                            value = value.replace(/\D/g, '').slice(0, 6);
                          } else if (fieldLower.includes('pan') || fieldLower.includes('gst')) {
                            value = value.toUpperCase();
                          }

                          updateFormData(field.key, value);
                        }}
                        onBlur={(e) => {
                          let valueToValidate = e.target.value;
                          validateField(field.key, valueToValidate, field);
                        }}
                        readOnly={isReadOnly}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                          fieldErrors[field.key] ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border)]'
                        } ${isReadOnly ? 'bg-[var(--color-background)] cursor-not-allowed opacity-75' : 'bg-[var(--color-background)]'}`}
                        placeholder={field.placeholder}
                        required={field.required}
                        maxLength={field.maxLength}
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
      </div>
    </Layout>
  );
}
