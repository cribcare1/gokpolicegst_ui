"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { validateGSTIN, validateEmail, validateMobile, validateName, validateAddress, validateCity, validatePIN, validateStateCode, validatePassword } from '@/lib/gstUtils';
import { Plus, Edit, Trash2, Search, ArrowLeft, Users, Download } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';

// Extract PAN from GSTIN (positions 2-11, 0-indexed: 2-12)
const extractPANFromGSTIN = (gstin) => {
  if (!gstin || gstin.length < 12) return null;
  return gstin.substring(2, 12).toUpperCase();
};

// Extract State Code from GSTIN (first 2 digits)
const extractStateCodeFromGSTIN = (gstin) => {
  if (!gstin || gstin.length < 2) return null;
  const stateCode = parseInt(gstin.substring(0, 2));
  return isNaN(stateCode) ? null : stateCode;
};

export default function GSTMasterPage() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [panList, setPanList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDDOList, setShowDDOList] = useState(false);
  const [selectedGSTIN, setSelectedGSTIN] = useState(null);
  const [ddoList, setDdoList] = useState([]);
  const [ddoLoading, setDdoLoading] = useState(false);
  const [editingDDO, setEditingDDO] = useState(null);
  const [ddoPasswordModal, setDdoPasswordModal] = useState(false);
  const [ddoPasswordData, setDdoPasswordData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [ddoCounts, setDdoCounts] = useState({}); // Store DDO counts for each GSTIN

  useEffect(() => {
    fetchData();
    fetchPANList();
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

  const fetchPANList = async () => {
    try {
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.PAN_LIST, 2000);
      if (response?.status === 'success' && response?.data) {
        setPanList(response.data);
      } else {
        // Demo PAN data
        setPanList([
          { id: '1', panNumber: 'AAAGO1111W' },
          { id: '2', panNumber: 'ABCDE1234F' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching PAN list:', error);
      setPanList([
        { id: '1', panNumber: 'AAAGO1111W' },
        { id: '2', panNumber: 'ABCDE1234F' },
      ]);
    }
  };

  const fetchDdoCountForGstin = async (gstinId, gstinNumber) => {
    try {
      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.DDO_LIST_PER_GST}${gstinId}`,
        2000
      );
      let count = 0;
      if (response?.status === 'success') {
        if (Array.isArray(response.data)) {
          count = response.data.length;
        } else if (Array.isArray(response.data?.ddos)) {
          count = response.data.ddos.length;
        } else if (response.data?.ddoCount) {
          count = response.data.ddoCount;
        }
      }
      setDdoCounts((prev) => ({ ...prev, [gstinId]: count }));
      return count;
    } catch (error) {
      console.error(`Error fetching DDO count for GSTIN ${gstinNumber}:`, error);
      setDdoCounts((prev) => ({ ...prev, [gstinId]: 0 }));
      return 0;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.GST_LIST}` );
      if (response  && response.status === 'success') {
          const gstData = response.data;
          setData(gstData);
          setFilteredData(gstData);
          
          // Fetch DDO counts for all GSTINs
          if (Array.isArray(gstData)) {
            const countPromises = gstData.map((item) => 
              fetchDdoCountForGstin(item.id, item.gstNumber)
            );
            await Promise.all(countPromises);
          }
      }
      
    } catch (error) {
      console.log('Using demo data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDDOList = async (gstinNumber) => {
    setDdoLoading(true);
    try {
      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.DDO_LIST}?gstin=${gstinNumber}`,
        2000
      );
      if (response?.status === 'success' && response?.data) {
        setDdoList(response.data);
      } else {
        // Demo DDO data
        setDdoList([
          { id: '1', ddoCode: '0200PO0032', ddoName: 'DCP CAR HQ', email: 'ddo001@example.com' },
          { id: '2', ddoCode: '0200PO0033', ddoName: 'DCP South', email: 'ddo002@example.com' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching DDO list:', error);
      setDdoList([
        { id: '1', ddoCode: '0200PO0032', ddoName: 'DCP CAR HQ', email: 'ddo001@example.com' },
        { id: '2', ddoCode: '0200PO0033', ddoName: 'DCP South', email: 'ddo002@example.com' },
      ]);
    } finally {
      setDdoLoading(false);
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
    const ddoCount = ddoCounts[item.id] || item.ddoCount || 0;
    
    // Auto-populate state code from GSTIN if not already present
    let stateCode = item.stateCode;
    if (!stateCode && item.gstNumber) {
      stateCode = extractStateCodeFromGSTIN(item.gstNumber);
    }
    
    setFormData({
      ...item,
      ddoCount: ddoCount, // Store DDO count in form data for reference
      stateCode: stateCode || item.stateCode || ''
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    const ddoCount = ddoCounts[item.id] || item.ddoCount || 0;
    
    if (ddoCount > 0) {
      toast.error(`GSTIN is protected - dependent records found`);
      return;
    }
    
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.GST_DELETE}${item.id}`,
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
    console.log("validate form is called");
    
    // Validate GSTIN
    const gstValidation = validateGSTIN(data.gstNumber);
    if (!gstValidation.valid) {
      return { valid: false, message: gstValidation.message };
    }

    // Extract PAN from GSTIN and validate it exists
    const extractedPAN = extractPANFromGSTIN(data.gstNumber);
    if (!extractedPAN) {
      return { valid: false, message: 'Invalid GSTIN format - cannot extract PAN' };
    }

    const panExists = panList.some(pan => pan.panNumber === extractedPAN);
    if (!panExists) {
      return { 
        valid: false, 
        message: `GSTIN contains PAN "${extractedPAN}" which does not exist in PAN Master. Please add the PAN first.` 
      };
    }
    
    // Validate GST Holder Name
    const holderNameValidation = validateName(data.gstHolderName, 'GST Holder Name');
    if (!holderNameValidation.valid) {
      return { valid: false, message: holderNameValidation.message };
    }
    
    // Validate GST Name
    const gstNameValidation = validateName(data.gstName, 'GST Name');
    if (!gstNameValidation.valid) {
      return { valid: false, message: gstNameValidation.message };
    }
    
    // Validate Address
    const addressValidation = validateAddress(data.address);
    if (!addressValidation.valid) {
      return { valid: false, message: addressValidation.message };
    }
    
    // Validate City
    const cityValidation = validateCity(data.city);
    if (!cityValidation.valid) {
      return { valid: false, message: cityValidation.message };
    }
    
    // Validate PIN Code
    const pinValidation = validatePIN(data.pinCode);
    if (!pinValidation.valid) {
      return { valid: false, message: pinValidation.message };
    }
    
    // Validate Email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
      return { valid: false, message: emailValidation.message };
    }
    
    // Validate Mobile
    const mobileValidation = validateMobile(String(data.mobile));
    if (!mobileValidation.valid) {
      return { valid: false, message: mobileValidation.message };
    }
    
    // Validate State Code (if provided)
    if (data.stateCode) {
      const stateCodeValidation = validateStateCode(data.stateCode);
      if (!stateCodeValidation.valid) {
        return { valid: false, message: stateCodeValidation.message };
      }
    }
    
    // Validate Password (if provided in edit mode)
    if (data.password && data.password.trim() !== '') {
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.valid) {
        return { valid: false, message: passwordValidation.message };
      }
    }
    
    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("submit is called");
    const validation = validateForm(formData);
    console.log("validation is called ", validation);
    if (!validation.valid) {
      // Show toast error
      toast.error(validation.message || t('validation.required'));
      
      // Set field error in UI for better visibility
      // Check which field the error is related to
      if (validation.message && validation.message.includes('GSTIN')) {
        setFieldErrors((prev) => ({ ...prev, gstNumber: validation.message }));
      } else if (validation.message && validation.message.includes('GST Holder Name')) {
        setFieldErrors((prev) => ({ ...prev, gstHolderName: validation.message }));
      } else if (validation.message && validation.message.includes('GST Name')) {
        setFieldErrors((prev) => ({ ...prev, gstName: validation.message }));
      } else if (validation.message && (validation.message.includes('Address') || validation.message.includes('address'))) {
        setFieldErrors((prev) => ({ ...prev, address: validation.message }));
      } else if (validation.message && validation.message.includes('City')) {
        setFieldErrors((prev) => ({ ...prev, city: validation.message }));
      } else if (validation.message && (validation.message.includes('PIN') || validation.message.includes('Pin'))) {
        setFieldErrors((prev) => ({ ...prev, pinCode: validation.message }));
      } else if (validation.message && validation.message.includes('Email')) {
        setFieldErrors((prev) => ({ ...prev, email: validation.message }));
      } else if (validation.message && (validation.message.includes('Mobile') || validation.message.includes('mobile'))) {
        setFieldErrors((prev) => ({ ...prev, mobile: validation.message }));
      } else if (validation.message && validation.message.includes('State Code')) {
        setFieldErrors((prev) => ({ ...prev, stateCode: validation.message }));
      } else if (validation.message && validation.message.includes('Password')) {
        setFieldErrors((prev) => ({ ...prev, password: validation.message }));
      } else if (validation.message && validation.message.includes('PAN')) {
        // PAN validation error is related to GSTIN field
        setFieldErrors((prev) => ({ ...prev, gstNumber: validation.message }));
      }
      
      return;
    }

    try {
      const url = editingItem ? API_ENDPOINTS.GST_UPDATE : API_ENDPOINTS.GST_ADD;
      
      // Prepare form data - remove empty password if not provided in edit mode
      const submitData = { ...formData };
      if (editingItem && (!submitData.password || submitData.password.trim() === '')) {
        delete submitData.password;
      }
       delete submitData.userId;
       delete submitData.ddoCount;
       delete submitData.logo;
      const response = await ApiService.handlePostMultiPartFileRequest(url, submitData, formData.logo);
      
      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
        setFieldErrors({});
        fetchData();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(t('alert.error'));
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'gstNumber':
        const gstValidation = validateGSTIN(value);
        if (!gstValidation.valid) error = gstValidation.message;
        break;
      case 'gstHolderName':
        const holderNameValidation = validateName(value, 'GST Holder Name');
        if (!holderNameValidation.valid) error = holderNameValidation.message;
        break;
      case 'gstName':
        const gstNameValidation = validateName(value, 'GST Name');
        if (!gstNameValidation.valid) error = gstNameValidation.message;
        break;
      case 'address':
        const addressValidation = validateAddress(value);
        if (!addressValidation.valid) error = addressValidation.message;
        break;
      case 'city':
        const cityValidation = validateCity(value);
        if (!cityValidation.valid) error = cityValidation.message;
        break;
      case 'pinCode':
        const pinValidation = validatePIN(value);
        if (!pinValidation.valid) error = pinValidation.message;
        break;
      case 'email':
        const emailValidation = validateEmail(value);
        if (!emailValidation.valid) error = emailValidation.message;
        break;
      case 'mobile':
        const mobileValidation = validateMobile(String(value));
        if (!mobileValidation.valid) error = mobileValidation.message;
        break;
      case 'stateCode':
        if (value) {
          const stateCodeValidation = validateStateCode(value);
          if (!stateCodeValidation.valid) error = stateCodeValidation.message;
        }
        break;
      case 'password':
        if (value && value.trim() !== '') {
          const passwordValidation = validatePassword(value);
          if (!passwordValidation.valid) error = passwordValidation.message;
        }
        break;
    }
    
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    return !error;
  };

  const handleDDOCountClick = async (gstItem) => {
    setSelectedGSTIN(gstItem);
    setShowDDOList(true);
    await fetchDDOList(gstItem.gstNumber);
  };

  const handleDDOEditPassword = (ddo) => {
    setEditingDDO(ddo);
    setDdoPasswordData({ password: '' });
    setDdoPasswordModal(true);
  };

  const handleDDOPasswordSubmit = async (e) => {
    e.preventDefault();
    const passwordValidation = validatePassword(ddoPasswordData.password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message);
      return;
    }

    try {
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.RESET_DDO_PASSWORD, {
        userName: editingDDO.ddoCode || editingDDO.email,
        password: ddoPasswordData.password,
      });

      if (response && response.status === 'success') {
        toast.success('Password updated successfully');
        setDdoPasswordModal(false);
        setEditingDDO(null);
        setDdoPasswordData({});
      } else {
        toast.error(response?.message || 'Failed to update password');
      }
    } catch (error) {
      toast.error('Error updating password');
    }
  };

  const handleDownloadCSV = () => {
    try {
      // Prepare CSV headers
      const headers = [
        'GSTIN Number',
        'GST Holder Name',
        'Name',
        'Address',
        'City',
        'PIN',
        'Mobile',
        'Email',
        'State Code',
        'DDO Count'
      ];

      // Prepare CSV rows
      const rows = filteredData.map((item) => {
        const ddoCount = ddoCounts[item.id] || item.ddoCount || 0;
        return [
          item.gstNumber || '',
          item.gstHolderName || '',
          item.gstName || item.name || '',
          item.address || '',
          item.city || '',
          item.pinCode || item.pin || '',
          item.mobile || item.contactNumber || '',
          item.email || '',
          item.stateCode || '',
          ddoCount.toString()
        ];
      });

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            // Escape commas and quotes in cell values
            const cellStr = String(cell || '');
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `GSTIN_Master_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV file downloaded successfully');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Failed to download CSV file');
    }
  };

  const columns = [
    { 
      key: 'logo', 
      label: 'Logo',
      render: (value, row) => {
        const logoUrl = row.logo || row.logoUrl || value;
        if (logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '') {
          return (
            <div className="flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-12 h-12 object-contain rounded-lg border border-[var(--color-border)] bg-white dark:bg-gray-800"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.parentElement.querySelector('.logo-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="logo-fallback w-12 h-12 hidden items-center justify-center text-xs text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg bg-gray-50 dark:bg-gray-800">
                No Logo
              </div>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center w-12 h-12 text-xs text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg bg-gray-50 dark:bg-gray-800">
            No Logo
          </div>
        );
      }
    },
    { key: 'gstNumber', label: t('label.gstin') },
    { key: 'gstHolderName', label: 'GST Holder Name' },
    { key: 'gstName', label: t('label.name') },
    { key: 'address', label: t('label.address') },
    { key: 'city', label: 'City' },
    { key: 'pinCode', label: 'PIN' },
    { key: 'mobile', label: t('label.mobile') },
    { key: 'email', label: t('label.email') },
    { 
      key: 'ddoCount', 
      label: 'DDO Count',
      render: (value, row) => {
        const count = ddoCounts[row.id] || value || 0;
        return (
          <button
            onClick={() => handleDDOCountClick(row)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
          >
            <Users size={16} />
            {count}
          </button>
        );
      }
    },
  ];

  const tableActions = (row) => {
    const ddoCount = ddoCounts[row.id] || row.ddoCount || 0;
    const canDelete = ddoCount === 0;
    
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
          title={!canDelete ? `GSTIN is protected - dependent records found` : 'Delete'}
        >
          <Trash2 size={18} />
        </button>
      </>
    );
  };

  const formFields = [
    { key: 'gstNumber', label: t('label.gstin'), required: true, maxLength: 15 },
    { key: 'gstHolderName', label: 'GST Holder Name', required: true },
    { key: 'gstName', label: t('label.name'), required: true },
    { key: 'address', label: t('label.address'), type: 'textarea', required: true },
    { key: 'city', label: 'City', required: true },
    { key: 'pinCode', label: 'PIN', required: true, maxLength: 6, type: 'text' },
    { key: 'mobile', label: t('label.mobile'), required: true, maxLength: 10 },
    { key: 'email', label: t('label.email'), type: 'email', required: true },
    { key: 'stateCode', label: t('label.stateCode'), type: 'number', required: false, min: 1, max: 99 },
    { key: 'logo', label: t('label.logo'), type: 'file', required: false, accept: 'image/*' },
  ];

  // Add password field only in edit mode
  if (editingItem) {
    formFields.push({ key: 'password', label: 'Password', type: 'password', required: false });
  }

  return (
    <Layout role="admin">
      {!showDDOList ? (
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
                <span className="gradient-text">GSTIN Master</span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
                Manage gstin master efficiently
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleDownloadCSV} 
                variant="secondary" 
                className="group w-full sm:w-auto"
              >
                <Download className="mr-2 group-hover:scale-110 transition-transform duration-300" size={18} />
                Download CSV
              </Button>
              <Button onClick={handleAdd} variant="primary" className="group w-full sm:w-auto">
                <Plus className="mr-2 group-hover:rotate-90 transition-transform duration-300" size={18} />
                {t('btn.add')}
              </Button>
            </div>
          </div>

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

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingItem ? `Edit GSTIN Master` : `Add GSTIN Master`}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {formFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                    {field.key === 'gstNumber' && editingItem && (formData.ddoCount || 0) > 0 && (
                      <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                        (GSTIN is protected - dependent records found)
                      </span>
                    )}
                    {field.key === 'stateCode' && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        (Auto-populated from GSTIN)
                      </span>
                    )}
                  </label>
                  {field.type === 'textarea' ? (
                    <>
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => {
                          updateFormData(field.key, e.target.value);
                          // Clear error when user starts typing
                          if (fieldErrors[field.key]) {
                            setFieldErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[field.key];
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={(e) => {
                          if (field.required || e.target.value) {
                            validateField(field.key, e.target.value);
                          }
                        }}
                        className={`w-full px-3 py-2 bg-[var(--color-background)] border rounded-lg focus:outline-none focus:ring-2 ${
                          fieldErrors[field.key] 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]'
                        }`}
                        rows={3}
                        required={field.required}
                      />
                      {fieldErrors[field.key] && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors[field.key]}</p>
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
                  ) : field.type === 'password' ? (
                    <>
                      <input
                        type="password"
                        value={formData[field.key] || ''}
                        onChange={(e) => {
                          updateFormData(field.key, e.target.value);
                          // Clear error when user starts typing
                          if (fieldErrors[field.key]) {
                            setFieldErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[field.key];
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value && e.target.value.trim() !== '') {
                            validateField(field.key, e.target.value);
                          }
                        }}
                        className={`w-full px-3 py-2 bg-[var(--color-background)] border rounded-lg focus:outline-none focus:ring-2 ${
                          fieldErrors[field.key] 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]'
                        }`}
                        placeholder="Leave blank to keep current password"
                        required={field.required}
                      />
                      {fieldErrors[field.key] && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors[field.key]}</p>
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
                          
                          // ✅ Only allow integers for mobile, PIN, and account number fields
                          if (fieldLower.includes('mobile') || fieldLower.includes('contactnumber') || fieldLower.includes('phone')) {
                            // Mobile: only digits, max 10
                            value = value.replace(/\D/g, '').slice(0, 10);
                          } else if (fieldLower.includes('pin') || fieldLower.includes('pincode')) {
                            // PIN: only digits, max 6
                            value = value.replace(/\D/g, '').slice(0, 6);
                          } else if (fieldLower.includes('accountnumber') || fieldLower.includes('account number')) {
                            // Account number: only digits
                            value = value.replace(/\D/g, '');
                          } else if (fieldLower.includes('statecode') || fieldLower.includes('state code')) {
                            // State Code: only digits, max 2 (read-only, but handle just in case)
                            value = value.replace(/\D/g, '').slice(0, 2);
                          } else if (fieldLower.includes('pan') || fieldLower.includes('gst')) {
                            // ✅ Auto-uppercase for PAN or GST fields
                            value = value.toUpperCase();
                            
                            // Auto-populate state code from GSTIN (first 2 digits)
                            if (fieldLower.includes('gst') && value.length >= 2) {
                              const stateCode = extractStateCodeFromGSTIN(value);
                              if (stateCode !== null) {
                                updateFormData('stateCode', stateCode);
                              }
                            }
                          }
                          
                          if (field.type === 'number') {
                            const numValue = value === '' ? '' : parseInt(value);
                            updateFormData(field.key, isNaN(numValue) ? '' : numValue);
                          } else {
                            updateFormData(field.key, value);
                          }
                          // Clear error when user starts typing
                          if (fieldErrors[field.key]) {
                            setFieldErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[field.key];
                              return newErrors;
                            });
                          }
                        }}
                        onKeyPress={(e) => {
                          const fieldLower = field.key.toLowerCase();
                          // Block non-numeric input for mobile, PIN, and account number fields
                          if (fieldLower.includes('mobile') || fieldLower.includes('contactnumber') || fieldLower.includes('phone') ||
                              fieldLower.includes('pin') || fieldLower.includes('pincode') ||
                              fieldLower.includes('accountnumber') || fieldLower.includes('account number') ||
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
                          } else if (fieldLower.includes('pin') || fieldLower.includes('pincode')) {
                            e.preventDefault();
                            const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                            updateFormData(field.key, pastedText);
                          } else if (fieldLower.includes('accountnumber') || fieldLower.includes('account number')) {
                            e.preventDefault();
                            const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
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
                            valueToValidate = valueToValidate === '' ? '' : parseInt(valueToValidate);
                          }
                          if (field.required || valueToValidate) {
                            validateField(field.key, valueToValidate);
                          }
                        }}
                        className={`w-full px-3 py-2 bg-[var(--color-background)] border rounded-lg focus:outline-none focus:ring-2 ${
                          fieldErrors[field.key] 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]'
                        } ${
                          (field.key === 'gstNumber' && editingItem && (formData.ddoCount || 0) > 0) ||
                          (field.key === 'stateCode')
                            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70'
                            : ''
                        }`}
                        placeholder={field.placeholder}
                        required={field.required}
                        maxLength={field.maxLength}
                        min={field.min}
                        max={field.max}
                        disabled={
                          (field.key === 'gstNumber' && editingItem && (formData.ddoCount || 0) > 0) ||
                          (field.key === 'stateCode')
                        }
                        readOnly={field.key === 'stateCode'}
                      />
                      {fieldErrors[field.key] && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors[field.key]}</p>
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
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="secondary"
              onClick={() => setShowDDOList(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
                <span className="gradient-text">DDO List</span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
                GSTIN: {selectedGSTIN?.gstNumber}
              </p>
            </div>
          </div>

          <div className="premium-card overflow-hidden">
            {ddoLoading ? (
              <div className="p-8 sm:p-16">
                <LoadingProgressBar message="Loading DDOs..." variant="primary" />
              </div>
            ) : (
              <Table
                columns={[
                  { key: 'ddoCode', label: t('label.ddoCode') },
                  { key: 'ddoName', label: t('label.ddoName') },
                  { key: 'email', label: t('label.email') },
                  {
                    key: 'actions',
                    label: 'Actions',
                    render: (_, row) => (
                      <button
                        onClick={() => handleDDOEditPassword(row)}
                        className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-blue-600 dark:text-blue-400"
                        aria-label="Edit Password"
                      >
                        <Edit size={18} />
                      </button>
                    ),
                  },
                ]}
                data={ddoList}
              />
            )}
          </div>

          <Modal
            isOpen={ddoPasswordModal}
            onClose={() => {
              setDdoPasswordModal(false);
              setEditingDDO(null);
              setDdoPasswordData({});
            }}
            title="Edit DDO Password"
            size="md"
          >
            <form onSubmit={handleDDOPasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  DDO Code: <span className="font-normal">{editingDDO?.ddoCode}</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={ddoPasswordData.password || ''}
                  onChange={(e) => setDdoPasswordData({ password: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setDdoPasswordModal(false);
                    setEditingDDO(null);
                    setDdoPasswordData({});
                  }}
                >
                  {t('btn.cancel')}
                </Button>
                <Button type="submit" variant="primary">
                  Update Password
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </Layout>
  );
}
