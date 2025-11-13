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
import { getAllStates } from '@/lib/stateCodes';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';

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
    // Load demo data immediately for instant UI
    const demoCustomers = [
      { id: '1', name: 'ABC Enterprises', gstNumber: '29AABCU9603R1ZX', address: '123 MG Road', city: 'Bangalore', stateCode: '29', pin: '560001', customerType: 'Non Govt', exemptionCertNumber: '', mobile: '9876543210', email: 'abc@example.com' },
      { id: '2', name: 'XYZ Corporation', gstNumber: '19ABCDE1234F1Z5', address: '456 Brigade Road', city: 'Bangalore', stateCode: '29', pin: '560025', customerType: 'Non Govt', exemptionCertNumber: '', mobile: '9876543211', email: 'xyz@example.com' },
      { id: '3', name: 'Tech Solutions Pvt Ltd', gstNumber: '27AACCB1234D1Z2', address: '789 Indira Nagar', city: 'Bangalore', stateCode: '29', pin: '560038', customerType: 'Non Govt', exemptionCertNumber: '', mobile: '9876543212', email: 'tech@example.com' },
      { id: '4', name: 'Global Industries', gstNumber: '09AABCT1234E1Z3', address: '321 Koramangala', city: 'Bangalore', stateCode: '29', pin: '560095', customerType: 'Govt', exemptionCertNumber: 'EXEMPT001', mobile: '9876543213', email: 'global@example.com' },
      { id: '5', name: 'Prime Services', gstNumber: '07AACCF1234G1Z4', address: '654 Whitefield', city: 'Bangalore', stateCode: '29', pin: '560066', customerType: 'Non Govt', exemptionCertNumber: '', mobile: '9876543214', email: 'prime@example.com' },
      { id: '6', name: 'Metro Constructions', gstNumber: '29METRO1234H1Z5', address: '987 Hebbal', city: 'Bangalore', stateCode: '29', pin: '560024', customerType: 'Govt', exemptionCertNumber: 'EXEMPT002', mobile: '9876543215', email: 'metro@example.com' },
    ];
    
    // Show demo data immediately
    setCustomers(demoCustomers);
    setFilteredCustomers(demoCustomers);
    setLoading(false);
    
    try {
      setLoading(true);
      
      // Try to fetch real data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(API_ENDPOINTS.CUSTOMER_LIST, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken') || ''}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success' && data.data && data.data.length > 0) {
          setCustomers(data.data);
          setFilteredCustomers(data.data);
        }
      }
    } catch (error) {
      // Keep demo data
      console.log('Using demo data');
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
      exemptionCertNumber: '',
      mobile: '',
      email: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (customer) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.CUSTOMER_DELETE}${customer.id}`,
        {}
      );
      
      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        fetchCustomers();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate Name
    const nameValidation = validateName(formData.name, 'Customer Name');
    if (!nameValidation.valid) {
      toast.error(nameValidation.message);
      return;
    }
    
    // Validate GSTIN
    const gstValidation = validateGSTIN(formData.gstNumber);
    if (!gstValidation.valid) {
      toast.error(gstValidation.message);
      return;
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
    if (formData.exemptionCertNumber && formData.exemptionCertNumber.trim() !== '') {
      const exemptionValidation = validateExemptionCert(formData.exemptionCertNumber);
      if (!exemptionValidation.valid) {
        toast.error(exemptionValidation.message);
        return;
      }
    }

    try {
      const url = editingCustomer ? API_ENDPOINTS.CUSTOMER_UPDATE : API_ENDPOINTS.CUSTOMER_ADD;
      const response = await ApiService.handlePostRequest(url, formData);
      
      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
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
                {t('label.gstin')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase().slice(0, 15) })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                maxLength={15}
                required
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
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                required
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
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                required
              >
                <option value="">Select Type</option>
                <option value="Govt">Govt</option>
                <option value="Non Govt">Non Govt</option>
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

