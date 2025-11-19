"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { validateGSTIN, validateEmail, validateMobile, validatePIN, validateName, validateAddress, validateCity, validateStateCode, validateExemptionCert } from '@/lib/gstUtils';
import { getAllStates, getStateCodeFromGSTIN } from '@/lib/stateCodes';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';
import { LOGIN_CONSTANT } from '@/components/utils/constant';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    gstNumber: '',
    address: '',
    city: '',
    stateCode: '',
    pin: '',
    customerType: '',
    serviceType: '',
    exemptionCertNumber: '',
    mobile: '',
    email: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter((customer) =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.exemptionCertNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile?.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      
      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.CUSTOMER_ACTIVE_LIST}${ddoId}`
      );

      if (response && response.status === 'success' && response.data) {
        // Map API response to table format
        const mappedCustomers = response.data.map((customer) => ({
          id: customer.id,
          name: customer.customerName || '',
          gstNumber: customer.gstNumber || '',
          address: customer.address || '',
          city: customer.city||'', // Not in API response, keeping for compatibility
          stateCode: customer.stateCode || '',
          pin: customer.pinCode || '',
          customerType: customer.customerType === 'gov' || customer.customerType === 'Govt' || customer.customerType === 'Government' ? 'Government' : 'Non-Government',
          serviceType: customer.serviceType || '',
          exemptionCertNumber: customer.exemptionNumber || '',
          mobile: customer.mobile||'', // Not in API response, keeping for compatibility
          email: customer.customerEmail || '',
        }));
        
        setCustomers(mappedCustomers);
        setFilteredCustomers(mappedCustomers);
      } else {
        setCustomers([]);
        setFilteredCustomers([]);
        if (response?.message) {
          toast.error(response.message);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers. Please try again.');
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      gstNumber: '',
      address: '',
      city: '',
      stateCode: '',
      pin: '',
      customerType: '',
      serviceType: '',
      exemptionCertNumber: '',
      mobile: '',
      email: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    // Map customer data back to form format
    setFormData({
      name: customer.name || '',
      gstNumber: customer.gstNumber || '',
      address: customer.address || '',
      city: customer.city || '',
      stateCode: customer.stateCode || '',
      pin: customer.pin || '',
      customerType: customer.customerType || '',
      serviceType: customer.serviceType || '',
      exemptionCertNumber: customer.exemptionCertNumber || '',
      mobile: customer.mobile || '',
      email: customer.email || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (customer) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.CUSTOMER_DELETE_BY_ID}${customer.id}`
      );
      
      if (response && response.status === 'success') {
        toast.success(response.message || t('alert.success'));
        fetchCustomers();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error(t('alert.error'));
    }
  };

  const handleGSTINChange = (value) => {
    const upperValue = value.toUpperCase().slice(0, 15);
    let updatedFormData = { ...formData, gstNumber: upperValue };
    
    // Extract state code from first 2 characters
    if (upperValue.length >= 2) {
      const stateCode = getStateCodeFromGSTIN(upperValue);
      if (stateCode) {
        updatedFormData.stateCode = stateCode.toString();
      } else {
        updatedFormData.stateCode = '';
      }
    } else {
      // Reset state code if GSTIN is less than 2 characters
      updatedFormData.stateCode = '';
    }
    
    // Check 6th character (index 5) if GSTIN has at least 6 characters
    if (upperValue.length >= 6) {
      const sixthChar = upperValue.charAt(5);
      if (sixthChar === 'G') {
        updatedFormData.customerType = 'Government';
      } else {
        updatedFormData.customerType = 'Non-Government';
      }
    } else {
      // Reset customer type if GSTIN is less than 6 characters
      updatedFormData.customerType = '';
    }
    
    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("submit called");
    // Validate Name
    const nameValidation = validateName(formData.name, 'Customer Name');
    if (!nameValidation.valid) {
      toast.error(nameValidation.message);
      return;
    }
    
    // Validate GSTIN (optional - only validate if provided)
    if (formData.gstNumber && formData.gstNumber.trim() !== '') {
      const gstValidation = validateGSTIN(formData.gstNumber);
      if (!gstValidation.valid) {
        toast.error(gstValidation.message);
        return;
      }
    }
    
    // Validate Address
    const addressValidation = validateAddress(formData.address);
    if (!addressValidation.valid) {
      toast.error(addressValidation.message);
      return;
    }
    
    // Validate City
    const cityValidation = validateCity(formData.city);
    if (!cityValidation.valid) {
      toast.error(cityValidation.message);
      return;
    }
    
    // Validate State Code
    const stateCodeValidation = validateStateCode(formData.stateCode);
    if (!stateCodeValidation.valid) {
      toast.error(stateCodeValidation.message);
      return;
    }
    
    // Validate PIN
    const pinValidation = validatePIN(formData.pin);
    if (!pinValidation.valid) {
      toast.error(pinValidation.message);
      return;
    }
    
    // Validate Service Type
    if (!formData.serviceType || formData.serviceType.trim() === '') {
      toast.error('Service Type is required');
      return;
    }
    
    // Validate Email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      toast.error(emailValidation.message);
      return;
    }
    
    // Validate Mobile
    const mobileValidation = validateMobile(formData.mobile);
    if (!mobileValidation.valid) {
      toast.error(mobileValidation.message);
      return;
    }
    
    // Validate Exemption Certificate (optional)
    // if (formData.exemptionCertNumber && formData.exemptionCertNumber.trim() !== '') {
    //   const exemptionValidation = validateExemptionCert(formData.exemptionCertNumber);
    //   if (!exemptionValidation.valid) {
    //     toast.error(exemptionValidation.message);
    //     return;
    //   }
    // }

    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      
      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        return;
      }

      // Map form data to API payload format
      const payload = {
        ...(editingCustomer && editingCustomer.id ? { id: editingCustomer.id } : {}),
        customerName: formData.name,
        customerType: formData.customerType === 'Government' ? 'gov' : 'non-gov',
        customerEmail: formData.email,
        address: formData.address,
        pinCode: formData.pin,
        stateCode: formData.stateCode,
        gstNumber: formData.gstNumber || '',
        city: formData.city,
        mobile: formData.mobile,
        exemptionNumber: formData.exemptionCertNumber || '',
        serviceType: formData.serviceType,
        ddoId: parseInt(ddoId, 10),
      };

      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.CUSTOMER_ADD_OR_EDIT,
        payload
      );
      
      if (response && response.status === 'success') {
        toast.success(response.message || t('alert.success'));
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(t('alert.error'));
    }
  };

  const columns = [
    { key: 'name', label: 'Customer Name' },
    { key: 'gstNumber', label: t('label.gstin') },
    { key: 'address', label: t('label.address') },
    { key: 'city', label: 'City' },
    { key: 'stateCode', label: 'State Code', render: (value) => value || '-' },
    { key: 'pin', label: 'PIN Code' },
    { key: 'customerType', label: 'Type' },
    { key: 'mobile', label: t('label.mobile') },
    { key: 'email', label: t('label.email') },
  ];

  const tableActions = (row) => (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
        className="p-2 hover:bg-[var(--color-muted)] rounded-lg transition-colors"
        aria-label="Edit"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row);
        }}
        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600"
        aria-label="Delete"
      >
        <Trash2 size={16} />
      </button>
    </>
  );

  return (
    <Layout role="ddo">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">{t('nav.customers')}</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              Manage customer records
            </p>
          </div>
          <Button onClick={handleAdd} variant="primary" className="w-full sm:w-auto">
            <Plus className="mr-2" size={18} />
            {t('btn.add')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Table */}
        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading customers..." variant="primary" />
            </div>
          ) : (
            <Table
              columns={columns}
              data={filteredCustomers}
              actions={tableActions}
            />
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => handleGSTINChange(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('label.address')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                State Code <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.stateCode}
                onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                required
                disabled
              >
                <option value="">Select State Code</option>
                {getAllStates().map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.code} - {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                PIN Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                  setFormData({ ...formData, pin: pastedText });
                }}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                maxLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Type of Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                required
                disabled
              >
                <option value="">Select Type</option>
                <option value="Government">Government</option>
                <option value="Non-Government">Non-Government</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                required
              >
                <option value="">Select Service Type</option>
                <option value="Exempted">Exempted</option>
                <option value="RCM">RCM</option>
                <option value="FCM">FCM</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Exemption Certificate Number
              </label>
              <input
                type="text"
                value={formData.exemptionCertNumber}
                onChange={(e) => setFormData({ ...formData, exemptionCertNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                placeholder="Enter alphanumeric certificate number"
                pattern="[A-Za-z0-9]*"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('label.mobile')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, mobile: pastedText });
                }}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                maxLength={10}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('label.email')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
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

