"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from 'react';
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

function CustomersPageContent() {
  const searchParams = useSearchParams();
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
  const [gstinError, setGstinError] = useState('');
  const [hasOpenedFromQuery, setHasOpenedFromQuery] = useState(false); // Fix: track modal opening from query param
  const customerCount = filteredCustomers.length;

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fix: Open modal from query param reliably
  useEffect(() => {
    const addParam = searchParams.get('add');

    if (addParam === 'true' && !hasOpenedFromQuery) {
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
      setGstinError('');
      setIsModalOpen(true);

      // Remove query param from URL without reload
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/ddo/customers');
      }

      setHasOpenedFromQuery(true);
    }
  }, [searchParams, hasOpenedFromQuery]);

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
        const mappedCustomers = response.data.map((customer) => ({
          id: customer.id,
          name: customer.customerName || '',
          gstNumber: customer.gstNumber || '',
          address: customer.address || '',
          city: customer.city || '',
          stateCode: customer.stateCode || '',
          pin: customer.pinCode || '',
          customerType: customer.customerType === 'gov' || customer.customerType === 'Govt' || customer.customerType === 'Government' ? 'Government' : 'Non-Government',
          serviceType: customer.serviceType || '',
          exemptionCertNumber: customer.exemptionNumber || '',
          mobile: customer.mobile || '',
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
    setGstinError('');
    setIsModalOpen(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    const customerType = customer.customerType === 'Government' ? 'Government' : 
                        customer.customerType === 'Non-Government' ? 'Non-Government' : '';
    setFormData({
      name: customer.name || '',
      gstNumber: customer.gstNumber || '',
      address: customer.address || '',
      city: customer.city || '',
      stateCode: customer.stateCode || '',
      pin: customer.pin || '',
      customerType: customerType,
      serviceType: customer.serviceType || '',
      exemptionCertNumber: customer.exemptionCertNumber || '',
      mobile: customer.mobile || '',
      email: customer.email || '',
    });
    setGstinError('');
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
    let errorMessage = '';

    if (upperValue.length >= 2) {
      const stateCode = getStateCodeFromGSTIN(upperValue);
      updatedFormData.stateCode = stateCode ? stateCode.toString() : '';
    } else {
      updatedFormData.stateCode = '';
    }

    if (upperValue && upperValue.trim() !== '') {
      updatedFormData.exemptionCertNumber = '';
    }

    if (updatedFormData.customerType === 'Government' && upperValue.length >= 6) {
      const sixthChar = upperValue.charAt(5);
      if (sixthChar !== 'G') {
        errorMessage = 'Entered GSTIN is not belongs to govt, correct the GSTIN/remove to proceed';
      }
    }

    setGstinError(errorMessage);
    updateServiceType(updatedFormData.customerType, upperValue, updatedFormData);
    setFormData(updatedFormData);
  };

  const handleCustomerTypeChange = (value) => {
    let updatedFormData = { ...formData, customerType: value };
    let errorMessage = '';

    if (value === 'Government' && updatedFormData.gstNumber.length >= 6) {
      const sixthChar = updatedFormData.gstNumber.charAt(5);
      if (sixthChar !== 'G') {
        errorMessage = 'Entered GSTIN is not belongs to govt, correct the GSTIN/remove to proceed';
      }
    }

    setGstinError(errorMessage);
    updateServiceType(value, updatedFormData.gstNumber, updatedFormData);
    setFormData(updatedFormData);
  };

  const updateServiceType = (customerType, gstNumber, formDataObj) => {
    if (customerType === 'Government') {
      formDataObj.serviceType = 'Exempted';
    } else if (customerType === 'Non-Government') {
      if (gstNumber && gstNumber.trim() !== '') {
        if (!formDataObj.serviceType || formDataObj.serviceType === 'FCM') {
          formDataObj.serviceType = 'RCM';
        }
      } else {
        if (!formDataObj.serviceType || formDataObj.serviceType === 'RCM') {
          formDataObj.serviceType = 'FCM';
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameValidation = validateName(formData.name, 'Customer Name');
    if (!nameValidation.valid) {
      toast.error(nameValidation.message);
      return;
    }

    if (formData.gstNumber && formData.gstNumber.trim() !== '') {
      const gstValidation = validateGSTIN(formData.gstNumber);
      if (!gstValidation.valid) {
        toast.error(gstValidation.message);
        return;
      }
    }

    const addressValidation = validateAddress(formData.address);
    if (!addressValidation.valid) {
      toast.error(addressValidation.message);
      return;
    }

    const cityValidation = validateCity(formData.city);
    if (!cityValidation.valid) {
      toast.error(cityValidation.message);
      return;
    }

    const stateCodeValidation = validateStateCode(formData.stateCode);
    if (!stateCodeValidation.valid) {
      toast.error(stateCodeValidation.message);
      return;
    }

    const pinValidation = validatePIN(formData.pin);
    if (!pinValidation.valid) {
      toast.error(pinValidation.message);
      return;
    }

    if (formData.customerType === 'Government' && formData.gstNumber && formData.gstNumber.length >= 6) {
      const sixthChar = formData.gstNumber.charAt(5);
      if (sixthChar !== 'G') {
        toast.error('Entered GSTIN is not belongs to govt, correct the GSTIN/remove to proceed');
        return;
      }
    }

    if (!formData.serviceType || formData.serviceType.trim() === '') {
      toast.error('Service Type is required');
      return;
    }

    if (formData.serviceType === 'Exempted' && formData.customerType !== 'Government' && !(formData.gstNumber && formData.gstNumber.trim() !== '')) {
      if (!formData.exemptionCertNumber || formData.exemptionCertNumber.trim() === '') {
        toast.error('Notification is required when Service Type is Exempted for Non-Government customers without GSTIN');
        return;
      }
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      toast.error(emailValidation.message);
      return;
    }

    const mobileValidation = validateMobile(formData.mobile);
    if (!mobileValidation.valid) {
      toast.error(mobileValidation.message);
      return;
    }

    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);

      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        return;
      }

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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2 flex items-center gap-3 flex-wrap">
              <span className="gradient-text">{t('nav.customers')}</span>
              <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
                {customerCount ?? 0} {customerCount === 1 ? 'Customer' : 'Customers'}
              </span>
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
          size="xl"
        >
           <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Type (Govt, Non Govt) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customerType}
                  onChange={(e) => handleCustomerTypeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Government">Govt</option>
                  <option value="Non-Government">Non Govt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  GSTIN Number
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => handleGSTINChange(e.target.value)}
                  className={`w-full px-3 py-2 bg-[var(--color-background)] border rounded-lg ${
                    gstinError ? 'border-red-500' : 'border-[var(--color-border)]'
                  }`}
                  maxLength={15}
                />
                {gstinError && (
                  <p className="mt-1 text-sm text-red-500">{gstinError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => {
                    const updatedData = { ...formData, serviceType: e.target.value };
                    // Clear exemption cert number if not Exempted
                    if (e.target.value !== 'Exempted') {
                      updatedData.exemptionCertNumber = '';
                    }
                    setFormData(updatedData);
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={formData.customerType === 'Government'}
                >
                  <option value="">Select Service Type</option>
                  {formData.customerType === 'Government' ? (
                    <option value="Exempted">Exempted</option>
                  ) : formData.gstNumber && formData.gstNumber.trim() !== '' ? (
                    <>
                      <option value="RCM">RCM</option>
                      <option value="Exempted">Exempted</option>
                    </>
                  ) : (
                    <>
                      <option value="FCM">FCM</option>
                      <option value="Exempted">Exempted</option>
                    </>
                  )}
                </select>
              </div>
              {!(formData.gstNumber && formData.gstNumber.trim() !== '') && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notification
                    {formData.serviceType === 'Exempted' && formData.customerType !== 'Government' && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.exemptionCertNumber}
                    onChange={(e) => setFormData({ ...formData, exemptionCertNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                    placeholder="Enter notification"
                    pattern="[A-Za-z0-9]*"
                    required={formData.serviceType === 'Exempted' && formData.customerType !== 'Government'}
                    disabled={formData.serviceType !== 'Exempted'}
                  />
                  {formData.serviceType === 'Exempted' && formData.customerType !== 'Government' && (
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      Required for Exempted service type (Non-Government)
                    </p>
                  )}
                </div>
              )}
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
                  disabled={formData.gstNumber && formData.gstNumber.trim() !== ''}
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
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('label.address')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                rows={2}
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

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <Layout role="ddo">
        <div className="p-8 sm:p-16">
          <LoadingProgressBar message="Loading customers..." variant="primary" />
        </div>
      </Layout>
    }>
      <CustomersPageContent />
    </Suspense>
  );
}
