"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';
import { useGstinList } from '@/hooks/useGstinList';
import { 
  validateGSTIN, 
  validatePAN, 
  validateEmail, 
  validateMobile, 
  validatePIN, 
  validateName, 
  validateAddress, 
  validateCity, 
  validateStateCode,
  validateIFSC,
  validateMICR,
  validateAccountNumber,
  validateHSN,
  validateGSTRate,
  validateDDOCode,
  validateAmount,
  validateDescription,
  validatePassword
} from '@/lib/gstUtils';

export default function MasterDataPage({
  title,
  endpoint,
  columns,
  formFields,
  validateForm,
  role = 'admin',
}) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { gstinList } = useGstinList();

  useEffect(() => {
    fetchData();
  }, [gstinList]);

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


  const getDemoData = () => {
    const endpointStr = endpoint.LIST || '';
    // if (endpointStr.includes('gst')) {
    //   return [
    //     { id: '1', gstNumber: '29AAAGO1111W1ZB', name: 'Government of Karnataka- Office of the Director General & Inspector General of Police, Karnataka', address: 'No.1, Police Head Quarterz, Narpathuga Road, Opp: Martha\'s Hospital, K R Circle, Bengaluru-560001', contactNumber: '9902991144', email: 'Copadmin@ksp.gov.in' },
    //     { id: '2', gstNumber: '19ABCDE1234F1Z5', name: 'XYZ Corporation', address: '456 Brigade Road, Bangalore', contactNumber: '9876543211', email: 'xyz@example.com' },
    //   ];
    // } else if (endpointStr.includes('pan')) {
    //   return [
    //     { id: '1', panNumber: 'AMQPP1137R', name: 'GOK, Police department.', address: 'No.1, Police Head Quartez, Napathunga road, K R Circle, Bengaluru-560001', mobile: '9902991133', email: 'dgpolicehq@ksp.gov.in' },
    //     { id: '2', panNumber: 'FGHIJ5678K', name: 'Jane Smith', address: '456 Brigade Road, Bangalore', mobile: '9876543211', email: 'jane@example.com' },
    //     { id: '3', panNumber: 'LMNOP9012Q', name: 'Robert Johnson', address: '789 Indira Nagar, Bangalore', mobile: '9876543212', email: 'robert@example.com' },
    //   ];
     if (endpointStr.includes('ddo')) {
      return [
        { id: '1', ddoCode: '0200PO0032', ddoName: 'DCP CAR HQ', gstinNumber: '29AAAGO1111W1ZB', mobile: '9902991133', email: 'ddo001@example.com' },
        { id: '2', ddoCode: '0200PO0033', ddoName: 'DCP South', gstinNumber: '29AAAGO1111W1ZB', mobile: '9902991134', email: 'ddo002@example.com' },
        { id: '3', ddoCode: '0200PO0034', ddoName: 'DCP North', gstinNumber: '29AAAGO1111W1ZB', mobile: '9902991135', email: 'ddo003@example.com' },
        { id: '4', ddoCode: '0200PO0035', ddoName: 'DCP West', gstinNumber: '29AAAGO1111W1ZB', mobile: '9902991136', email: 'ddo004@example.com' },
        { id: '5', ddoCode: '0200PO0036', ddoName: 'DCP east', gstinNumber: '29AAAGO1111W1ZB', mobile: '9902991137', email: 'ddo005@example.com' },
      ];
    } else if (endpointStr.includes('hsn')) {
      return [
        { id: '1', gstinNumber: '29AAAGO1111W1ZB', hsnCode: '999293', serviceName: 'Public Administration and Security Services', totalGst: 18, igst: 18, cgst: 9, sgst: 9 },
        { id: '2', gstinNumber: '29AAAGO1111W1ZB', hsnCode: '999294', serviceName: 'Arm Security Services', totalGst: 12, igst: 12, cgst: 6, sgst: 6 },
        { id: '3', gstinNumber: '29AAAGO1111W1ZB', hsnCode: '8471', serviceName: 'Automatic data processing machines', totalGst: 18, igst: 18, cgst: 9, sgst: 9 },
      ];
    } else if (endpointStr.includes('bank')) {
      return [
        { id: '1', gstinNumber: '29AAAGO1111W1ZB', bankName: 'Union Bank of India-Current Account', accountNumber: '143211100000627', ifscCode: 'UBIN0814326', branchName: 'Banaswadi', accountType: 'Current', accountHolderName: 'Government of Karnataka- Office of the Director General & Inspector General of Police, Karnataka', micrCode: '560026077' },
        { id: '2', gstinNumber: '19ABCDE1234F1Z5', bankName: 'HDFC Bank', accountNumber: '98765432109', ifscCode: 'HDFC0005678', branchName: 'Koramangala Branch', accountType: 'Current', accountHolderName: 'XYZ Corporation' },
      ];
    }
    return [];
  };

  const fetchData = async () => {
    // Load demo data immediately for instant UI
    const demoData = getDemoData();
    setData(demoData);
    setFilteredData(demoData);
    setLoading(false);
    
    try {
      setLoading(true);
    
       const response = await ApiService.handleGetRequest(`${endpoint.LIST}` );
      if (response  && response.status === 'success') {
        // Transform the data to ensure field names match column keys
        const transformedData = (response.data || []).map(item => {
          const transformed = { ...item };
          
          // For HSN data, map gstId to gstinNumber if gstinNumber is missing
          if (endpoint.LIST.includes('hsn')) {
            // If gstinNumber is missing but gstId exists, find the GSTIN number from gstinList
            if (!transformed.gstinNumber && transformed.gstId && gstinList.length > 0) {
              const gst = gstinList.find(g => g.gstId === transformed.gstId || g.id === transformed.gstId);
              if (gst) {
                transformed.gstinNumber = gst.value || gst.gstNumber || gst.gstinNumber;
              }
            }
            // Also handle if API returns gstNumber instead of gstinNumber
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
          }
          
          // For Bank Details data, map gstId to gstinNumber and handle accountHolderName
          if (endpoint.LIST.includes('bank')) {
            // If gstinNumber is missing but gstId exists, find the GSTIN number from gstinList
            if (!transformed.gstinNumber && transformed.gstId && gstinList.length > 0) {
              const gst = gstinList.find(g => g.gstId === transformed.gstId || g.id === transformed.gstId);
              if (gst) {
                transformed.gstinNumber = gst.value || gst.gstNumber || gst.gstinNumber;
              }
            }
            // Also handle if API returns gstNumber instead of gstinNumber
            if (!transformed.gstinNumber && transformed.gstNumber) {
              transformed.gstinNumber = transformed.gstNumber;
            }
            
            // Map alternative field names for accountHolderName (case-insensitive search)
            // Check if accountHolderName is missing, null, undefined, or empty string
            const hasAccountHolderName = transformed.accountHolderName && 
                                        transformed.accountHolderName.toString().trim() !== '';
            
            if (!hasAccountHolderName) {
              // Debug: Log the raw item to see what fields are available
              const keys = Object.keys(transformed);
              console.log('Bank Details - Available fields:', keys);
              console.log('Bank Details - Raw item:', JSON.stringify(transformed, null, 2));
              
              // Try exact matches first
              let foundValue = null;
              
              // API returns 'accountName' instead of 'accountHolderName'
              if (transformed.accountName && transformed.accountName.toString().trim() !== '') {
                foundValue = transformed.accountName;
              } else if (transformed.accountHolder && transformed.accountHolder.toString().trim() !== '') {
                foundValue = transformed.accountHolder;
              } else if (transformed.holderName && transformed.holderName.toString().trim() !== '') {
                foundValue = transformed.holderName;
              } else if (transformed.account_holder_name && transformed.account_holder_name.toString().trim() !== '') {
                foundValue = transformed.account_holder_name;
              } else if (transformed.AccountHolderName && transformed.AccountHolderName.toString().trim() !== '') {
                foundValue = transformed.AccountHolderName;
              } else if (transformed.account_holder && transformed.account_holder.toString().trim() !== '') {
                foundValue = transformed.account_holder;
              } else if (transformed.holder_name && transformed.holder_name.toString().trim() !== '') {
                foundValue = transformed.holder_name;
              } else {
                // Case-insensitive search for any field containing 'holder' or 'account' and 'name'
                const accountHolderKey = keys.find(key => {
                  const lowerKey = key.toLowerCase();
                  const value = transformed[key];
                  const hasValue = value && value.toString().trim() !== '';
                  return hasValue && (
                    lowerKey === 'accountname' ||
                    (lowerKey.includes('holder') && lowerKey.includes('name')) ||
                    (lowerKey.includes('account') && lowerKey.includes('holder')) ||
                    (lowerKey === 'accountholdername' || lowerKey === 'account_holder_name')
                  );
                });
                if (accountHolderKey) {
                  foundValue = transformed[accountHolderKey];
                } else if (transformed.name && transformed.name.toString().trim() !== '' && !transformed.bankName) {
                  // If there's a 'name' field and no bankName, it might be accountHolderName
                  foundValue = transformed.name;
                }
              }
              
              if (foundValue) {
                transformed.accountHolderName = foundValue;
                console.log('Bank Details - Mapped accountHolderName from:', foundValue);
              } else {
                console.warn('Bank Details - Could not find accountHolderName field. Available keys:', keys);
              }
            }
          }
          
          return transformed;
        });
        
        // Debug: Log transformed data for bank details
        if (endpoint.LIST.includes('bank')) {
          console.log('Bank Details - Transformed data:', transformedData);
          transformedData.forEach((item, index) => {
            console.log(`Bank Details - Row ${index + 1} accountHolderName:`, item.accountHolderName);
          });
        }
        
        setData(transformedData);
        setFilteredData(transformedData);
        
      }
    } catch (error) {
      // Keep demo data, API failed or timed out
      console.log('Using demo data');
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
    setFieldErrors({});

    const selectedGST = gstinList.find(
    (gst) => gst.gstNumber === item.gstinNumber
    );

    // Create a new object to set in formData
    const updatedItem = {
      ...item,
      gstId: selectedGST?.gstId || "", // Set gstId if found
    };
    setFormData(updatedItem);

    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const response = await ApiService.handlePostRequest(
        `${endpoint.DELETE}${item.id}`,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handle submit called", gstinList);
    const dataCopy = { ...formData };
    
    // Validate all fields before submission (with original data including gstinNumber)
    let hasErrors = false;
    const newErrors = {};
    
    formFields.forEach((field) => {
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

    // Validate form using custom validateForm function if provided (with original data)
    if (validateForm) {
      const validation = validateForm(dataCopy);
      console.log("validation  form ", validation);
      if (!validation.valid) {
        toast.error(validation.message || t('validation.required'));
        return;
      }
    }
    
    // After validation, convert gstinNumber to gstId for HSN records before sending to API
    if (endpoint.LIST && endpoint.LIST.includes('hsn') && dataCopy.gstinNumber && gstinList.length > 0) {
      const selectedGST = gstinList.find(
        (gst) => gst.value === dataCopy.gstinNumber || gst.gstNumber === dataCopy.gstinNumber || gst.gstinNumber === dataCopy.gstinNumber
      );
      if (selectedGST) {
        dataCopy.gstId = selectedGST.gstId || selectedGST.id;
      }
      // Remove gstinNumber as API expects gstId
      delete dataCopy.gstinNumber;
    } else if (dataCopy.gstinNumber && endpoint.LIST && !endpoint.LIST.includes('hsn')) {
      // For other endpoints, keep gstinNumber or remove if not needed
      // You can adjust this based on API requirements
    }

    console.log("form data ", dataCopy);

    try {
      const url = editingItem ? endpoint.UPDATE : endpoint.ADD;
      
      // Check if there are any file uploads
      const hasFiles = Object.values(dataCopy).some(value => value instanceof File);
      
      let response;
      if (hasFiles) {
        // Handle multipart/form-data for file uploads
        const multipartFormData = new FormData();
        const jsonData = {};
        
        // Separate files from other data
        Object.keys(dataCopy).forEach(key => {
          if (dataCopy[key] instanceof File) {
            multipartFormData.append(key, dataCopy[key]);
          } else {
            jsonData[key] = dataCopy[key];
          }
        });
        
        // Append JSON data as string (backend might expect this format)
        multipartFormData.append('formData', JSON.stringify(jsonData));
        
        // Use fetch directly for multipart requests
        const token = localStorage.getItem('token') || '';
        const fetchResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: multipartFormData,
        });
        
        response = await fetchResponse.json();
      } else {
        // Use regular JSON request
        response = await ApiService.handlePostRequest(url, dataCopy);
      }
      
      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        setIsModalOpen(false);
        fetchData();
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

    // Field-specific validation based on field key or type
    // Skip GSTIN validation for dropdown fields (when gstinList has items)
    if ((fieldLower.includes('gstin') || fieldLower.includes('gstnumber')) && gstinList.length === 0) {
      const validation = validateGSTIN(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('pan') && (fieldLower.includes('number') || fieldLower.includes('no') || fieldLower.includes('pannumber'))) {
      // Only treat this as a PAN field when the key indicates a PAN number (e.g. 'panNumber', 'pan_no')
      // Avoid matching keys like 'panName' which contain 'pan' but are actually a name field.
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
    } else if (fieldLower.includes('statecode')) {
      const validation = validateStateCode(value);
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
    } else if (fieldLower.includes('hsn') || fieldLower.includes('hsnnumber')) {
      const validation = validateHSN(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('gstrate') || fieldLower.includes('gsttaxrate') || fieldLower.includes('igst') || fieldLower.includes('cgst') || fieldLower.includes('sgst')) {
      const validation = validateGSTRate(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('ddocode') || fieldLower.includes('ddo code')) {
      const validation = validateDDOCode(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('amount') || fieldLower.includes('price') || fieldLower.includes('total')) {
      const validation = validateAmount(value, fieldName);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('description')) {
      const validation = validateDescription(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldLower.includes('password')) {
      const validation = validatePassword(value);
      if (!validation.valid) error = validation.message;
    } else if (fieldConfig?.type === 'number' || fieldConfig?.type === 'tel') {
      // Validate number fields
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        error = `${fieldName} must be a valid number`;
      } else if (fieldConfig?.min !== undefined && numValue < fieldConfig.min) {
        error = `${fieldName} must be at least ${fieldConfig.min}`;
      } else if (fieldConfig?.max !== undefined && numValue > fieldConfig.max) {
        error = `${fieldName} must be at most ${fieldConfig.max}`;
      }
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

  const tableColumns = [
    ...columns.map((col) => ({
      key: col.key,
      label: col.label,
      render: col.render,
    })),
  ];

  const tableActions = (row) => (
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
        className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-red-600 dark:text-red-400"
        aria-label="Delete"
      >
        <Trash2 size={18} />
      </button>
    </>
  );

  return (
    <Layout role={role}>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
              <span className="gradient-text">{title}</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
              Manage {title.toLowerCase()} efficiently
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
              columns={tableColumns}
              data={filteredData}
              actions={tableActions}
            />
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? `Edit ${title}` : `Add ${title}`}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {formFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
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
                ) : field.type === 'file' ? (
                  <div>
                    <input
                      type="file"
                      accept={field.accept || 'image/*'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateFormData(field.key, file);
                        }
                      }}
                      className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                      required={field.required}
                    />
                    {formData[field.key] && formData[field.key] instanceof File && (
                      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                        Selected: {formData[field.key].name}
                      </p>
                    )}
                    {formData[field.key] && typeof formData[field.key] === 'string' && (
                      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                        Current: {formData[field.key]}
                      </p>
                    )}
                  </div>
                ) : field.type === 'select' && field.options ? (
                  <>
                    <select
                      value={formData[field.key] ?? ''}
                      onChange={(e) => updateFormData(field.key, e.target.value)}
                      onBlur={(e) => validateField(field.key, e.target.value, field)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                        fieldErrors[field.key] ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border)]'
                      } ${field.readOnly ? 'bg-[var(--color-background)] cursor-not-allowed opacity-75' : 'bg-[var(--color-background)]'}`}
                      required={field.required}
                      disabled={field.readOnly}
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
                ) : (field.key.toLowerCase().includes('gstin') || field.key.toLowerCase().includes('gstnumber')) && gstinList.length > 0 ? (
                 <>
                   <select
                     value={formData[field.key] ?? ''}
                     onChange={(e) => updateFormData(field.key, e.target.value)}
                     onBlur={(e) => validateField(field.key, e.target.value, field)}
                     className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] uppercase border-[var(--color-border)] ${field.readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-[var(--color-background)]'}`}
                     required={field.required}
                     disabled={field.readOnly}
                   >
                     <option value="">Select GSTIN Number</option>
                     {gstinList.map((gstin) => (
                       <option key={gstin.value} value={gstin.value}>
                         {gstin.label}
                       </option>
                     ))}
                   </select>
                 </>
                ) : (
                  <>
                    <input
                      type={field.type || 'text'}
                      value={formData[field.key] ?? ''}
                      onChange={(e) => {
                        let value = e.target.value;
                        const fieldLower = field.key.toLowerCase();

                        // ✅ Only allow integers for mobile, account number, and PIN fields
                        if (fieldLower.includes('mobile') || fieldLower.includes('contactnumber') || fieldLower.includes('phone')) {
                          // Mobile: only digits, max 10
                          value = value.replace(/\D/g, '').slice(0, 10);
                        } else if (fieldLower.includes('accountnumber') || fieldLower.includes('account number')) {
                          // Account number: only digits
                          value = value.replace(/\D/g, '');
                        } else if (fieldLower.includes('pin') || fieldLower.includes('pincode')) {
                          // PIN: only digits, max 6
                          value = value.replace(/\D/g, '').slice(0, 6);
                        } else if (fieldLower.includes('hsn') || fieldLower.includes('hsnnumber')) {
                          // HSN: only digits
                          value = value.replace(/\D/g, '');
                        } else if (fieldLower.includes('micr') || fieldLower.includes('micr code')) {
                          // MICR: only digits, max 9
                          value = value.replace(/\D/g, '').slice(0, 9);
                        } else if (fieldLower.includes('gstrate') || fieldLower.includes('gsttaxrate') || fieldLower.includes('igst') || fieldLower.includes('cgst') || fieldLower.includes('sgst')) {
                          // GST Rate: only numbers (allow decimal)
                          value = value.replace(/[^\d.]/g, '');
                          // Allow only one decimal point
                          const parts = value.split('.');
                          if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                          }
                        } else if (fieldLower.includes('statecode') || fieldLower.includes('state code')) {
                          // State Code: only digits, max 2
                          value = value.replace(/\D/g, '').slice(0, 2);
                        } else if (fieldLower.includes('amount') || fieldLower.includes('price') || fieldLower.includes('total')) {
                          // Amount: only numbers (allow decimal)
                          value = value.replace(/[^\d.]/g, '');
                          // Allow only one decimal point
                          const parts = value.split('.');
                          if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                          }
                        } else if (fieldLower.includes('pan') || fieldLower.includes('gst')) {
                          // ✅ Auto-uppercase for PAN or GST fields
                          value = value.toUpperCase();
                        } else if (field.type === 'number' || field.type === 'tel') {
                          // Number type fields: only digits (allow decimal for number type)
                          if (field.type === 'number') {
                            value = value.replace(/[^\d.]/g, '');
                            // Allow only one decimal point
                            const parts = value.split('.');
                            if (parts.length > 2) {
                              value = parts[0] + '.' + parts.slice(1).join('');
                            }
                          } else {
                            // tel type: only digits
                            value = value.replace(/\D/g, '');
                          }
                        }

                        if (field.type === 'number') {
                          const numValue = value === '' ? '' : parseFloat(value);
                          updateFormData(field.key, isNaN(numValue) ? '' : numValue);
                        } else if (field.key === 'totalGst') {
                          const total = parseFloat(value) || 0;
                          updateFormData('totalGst', total);
                          updateFormData('igst', total);
                          updateFormData('cgst', total / 2);
                          updateFormData('sgst', total / 2);
                        } else {
                          updateFormData(field.key, value);
                        }
                      }}
                      onKeyPress={(e) => {
                        const fieldLower = field.key.toLowerCase();
                        // Block non-numeric input for mobile, account number, and PIN fields
                        if (fieldLower.includes('mobile') || fieldLower.includes('contactnumber') || fieldLower.includes('phone') ||
                            fieldLower.includes('accountnumber') || fieldLower.includes('account number') ||
                            fieldLower.includes('pin') || fieldLower.includes('pincode') ||
                            fieldLower.includes('micr') || fieldLower.includes('micr code') ||
                            fieldLower.includes('statecode') || fieldLower.includes('state code')) {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }
                      }}
                      onPaste={(e) => {
                        const fieldLower = field.key.toLowerCase();
                        // Handle paste for numeric fields
                        if (fieldLower.includes('mobile') || fieldLower.includes('contactnumber') || fieldLower.includes('phone')) {
                          e.preventDefault();
                          const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 10);
                          updateFormData(field.key, pastedText);
                        } else if (fieldLower.includes('accountnumber') || fieldLower.includes('account number')) {
                          e.preventDefault();
                          const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
                          updateFormData(field.key, pastedText);
                        } else if (fieldLower.includes('pin') || fieldLower.includes('pincode')) {
                          e.preventDefault();
                          const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                          updateFormData(field.key, pastedText);
                        } else if (fieldLower.includes('micr') || fieldLower.includes('micr code')) {
                          e.preventDefault();
                          const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 9);
                          updateFormData(field.key, pastedText);
                        } else if (fieldLower.includes('statecode') || fieldLower.includes('state code')) {
                          e.preventDefault();
                          const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 2);
                          updateFormData(field.key, pastedText);
                        }
                      }}
                      onBlur={(e) => {
                        let valueToValidate = e.target.value;
                        if (field.type === 'number') {
                          valueToValidate = valueToValidate === '' ? '' : parseFloat(valueToValidate);
                        }
                        validateField(field.key, valueToValidate, field);
                      }}
                      readOnly={field.readOnly}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                        fieldErrors[field.key] ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border)]'
                      } ${field.readOnly ? 'bg-[var(--color-background)] cursor-not-allowed opacity-75' : 'bg-[var(--color-background)]'}`}
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
            ))}

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

