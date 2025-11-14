"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import Table from '@/components/shared/Table';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { validateGSTIN, validateEmail, validateMobile, validateDDOCode, validateName, validatePIN, validateAddress, validateCity } from '@/lib/gstUtils';

export default function GstinDDORegistrationPage() {
  const [ddos, setDdos] = useState([]);
  const [filteredDdos, setFilteredDdos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDDO, setEditingDDO] = useState(null);
  const [gstId, setGstId] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    ddoCode: '',
    ddoName: '',
    address: '',
    city: '',
    pinCode: '',
    mobile: '',
    email: '',
    password: '',
    
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const gstId = localStorage.getItem(LOGIN_CONSTANT.GSTID);
    const userId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);

    console.log("Loaded from localStorage:", { gstId, userId });

    if (gstId) setGstId(gstId);
    if (userId) setUserId(userId);

    if (gstId)fetchDDOs(gstId);
  }, []);

  useEffect(() => {
    filterDDOs();
  }, [searchTerm, ddos]);

  const fetchDDOs = async (gstId) => {
    setLoading(true);
    try {
      const demoDDOs = [
        {
          id: '1',
          ddoCode: '0200PO0032',
          ddoName: 'DCP CAR HQ',
          city: 'Mysore Road, Bengaluru',
          pinCode: '560018',
          mobile: '9902991313',
          email: 'Dcpadmin@ksp.gov.in',
        },
      ];

      setDdos(demoDDOs);
      setFilteredDdos(demoDDOs);

      console.log("gstid---------",gstId);
      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.DDO_LIST_PER_GST}${gstId}`);
      // if (response  && response.status === 'success') {
      //     setDdos(response.data);
      //     setFilteredDdos(response.data); 
      // }
      if (response?.status === 'success' && Array.isArray(response?.data)) {
          setDdos(response.data.ddos);
          setFilteredDdos(response.data.ddos);
        } else if (response?.status === 'success' && Array.isArray(response?.data?.ddos)) {
          setDdos(response.data.ddos);
          setFilteredDdos(response.data.ddos);
        } else {
          setDdos([]);
          setFilteredDdos([]);
        }

     
    } catch (error) {
      console.error('Error fetching DDOs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDDOs = () => {
    let filtered = [...ddos];

    if (searchTerm) {
      filtered = filtered.filter(
        (ddo) =>
          ddo.ddoCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ddo.ddoName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ddo.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDdos(filtered);
  };

  const handleAdd = () => {
    setEditingDDO(null);
    setFormData({
      ddoCode: '',
      ddoName: '',
      address: '',
      city: '',
      pinCode: '',
      mobile: '',
      email: '',
      password: '',
    });
    setShowPassword(false);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (ddo) => {
    setEditingDDO(ddo);
    setFormData({
      ddoCode: ddo.ddoCode || '',
      ddoName: ddo.ddoName || '',
      address: ddo.address || '',
      city: ddo.city || '',
      pinCode: ddo.pinCode || '',
      mobile: ddo.mobile|| '',
      email: ddo.email || '',
      id: ddo.userId || '',
     // password: '', // Password field is empty by default, user can set new password
    });
    setShowPassword(false);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this DDO?')) return;

    try {
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.DDO_DELETE, { id });
      if (response?.status === 'success') {
        toast.success('DDO deleted successfully');
        fetchDDOs();
      } else {
        toast.error(response?.message || 'Failed to delete DDO');
      }
    } catch (error) {
      toast.error('Error deleting DDO');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('handleSubmit called', { formData, editingDDO });

    // Validate DDO Code
    console.log('Validating DDO Code...');
    const ddoCodeValidation = validateDDOCode(formData.ddoCode);
    if (!ddoCodeValidation.valid) {
      console.error('DDO Code validation failed:', ddoCodeValidation.message);
      toast.error(ddoCodeValidation.message);
      return;
    }
    console.log('DDO Code validation passed');

    // Validate DDO Name
    console.log('Validating DDO Name...');
    const ddoNameValidation = validateName(formData.ddoName, 'DDO Name');
    if (!ddoNameValidation.valid) {
      console.error('DDO Name validation failed:', ddoNameValidation.message);
      toast.error(ddoNameValidation.message);
      return;
    }
    console.log('DDO Name validation passed');

    // Validate Address (optional but if provided, validate)
    setFieldErrors({}); // Clear previous errors
    if (formData.address && formData.address.trim() !== '') {
      console.log('Validating Address...', formData.address.length, 'characters');
      const addressValidation = validateAddress(formData.address);
      if (!addressValidation.valid) {
        console.error('Address validation failed:', addressValidation.message);
        setFieldErrors({ address: addressValidation.message });
        toast.error('Address: ' + addressValidation.message);
        return;
      }
      console.log('Address validation passed');
    } else {
      console.log('Address is empty, skipping validation');
    }

    // Validate Area & City (optional but if provided, validate)
    if (formData.city && formData.city.trim() !== '') {
      console.log('Validating City...', formData.city.length, 'characters');
      const cityValidation = validateCity(formData.city);
      if (!cityValidation.valid) {
        console.error('City validation failed:', cityValidation.message);
        setFieldErrors({ city: cityValidation.message });
        toast.error('Area & City: ' + cityValidation.message);
        return;
      }
      console.log('City validation passed');
    } else {
      console.log('City is empty, skipping validation');
    }

    // Validate PIN (optional but if provided, validate)
    if (formData.pinCode && formData.pinCode.trim() !== '') {
      console.log('Validating PIN...');
      const pinValidation = validatePIN(formData.pinCode);
      if (!pinValidation.valid) {
        console.error('PIN validation failed:', pinValidation.message);
        toast.error(pinValidation.message);
        return;
      }
      console.log('PIN validation passed');
    } else {
      console.log('PIN is empty, skipping validation');
    }

    // Validate Contact Number (optional but if provided, validate)
    if (formData.mobile && formData.mobile.trim() !== '') {
      console.log('Validating Mobile...');
      const mobileValidation = validateMobile(formData.mobile);
      if (!mobileValidation.valid) {
        console.error('Mobile validation failed:', mobileValidation.message);
        toast.error(mobileValidation.message);
        return;
      }
      console.log('Mobile validation passed');
    } else {
      console.log('Mobile is empty, skipping validation');
    }

    // Validate Email (optional but if provided, validate)
    if (formData.email && formData.email.trim() !== '') {
      console.log('Validating Email...');
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        console.error('Email validation failed:', emailValidation.message);
        toast.error(emailValidation.message);
        return;
      }
      console.log('Email validation passed');
    } else {
      console.log('Email is empty, skipping validation');
    }

    console.log('All validations passed, proceeding to API call...');

    // Check if userId is required for update
    if (editingDDO && !formData.id && !editingDDO.userId) {
      toast.error('User ID is missing. Cannot update DDO.');
      return;
    }

    setFormLoading(true);
    try {
      const gstinNumber = localStorage.getItem('gstinNumber');
      const payload = {
        ddoCode: formData.ddoCode,
        ddoName: formData.ddoName,
        address: formData.address || '',
        city: formData.city || '',
        pinCode: formData.pinCode || '',
        mobile: formData.mobile || '',
        email: formData.email || '',
        gstId: gstId || '',
        gstInUserId: userId || '',
      };

      // Include userId when editing - try multiple possible field names
      if (editingDDO) {
        const userIdValue = formData.id || editingDDO.userId || editingDDO.id;
        if (userIdValue) {
          payload.userId = userIdValue;
          payload.id = userIdValue;
        }
      }

      // Only include password when editing (not when adding new DDO)
      if (editingDDO && formData.password) {
        payload.password = formData.password;
      }

      const endpoint = editingDDO ? API_ENDPOINTS.DDO_UPDATE : API_ENDPOINTS.DDO_ADD;
      
      console.log('Submitting DDO update:', { endpoint, payload, editingDDO });
      
      const response = await ApiService.handlePostRequest(endpoint, payload);

      console.log('API Response:', response);

      if (response?.status === 'success') {
        toast.success(editingDDO ? 'DDO updated successfully' : 'DDO added successfully');
        setIsModalOpen(false);
        fetchDDOs(gstId);
      } else {
        const errorMessage = response?.message || response?.error || 'Failed to save DDO';
        console.error('Update failed:', errorMessage, response);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving DDO:', error);
      toast.error(error?.message || 'Error saving DDO. Please check console for details.');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      key: 'ddoCode',
      label: 'DDO Code',
      render: (code) => <span className="font-medium text-[var(--color-text-primary)]">{code}</span>,
    },
    { key: 'ddoName', label: 'DDO Name' },
    { key: 'city', label: 'Area & City', render: (val, row) => val || row.city || '-' },
    { key: 'pinCode', label: 'PIN', render: (val, row) => val || row.pinCode || '-' },
    { key: 'mobile', label: 'Contact No', render: (val, row) => val || row.mobile || '-' },
    { key: 'email', label: 'Email', render: (email) => email ? <a href={`mailto:${email}`} className="text-[var(--color-primary)] hover:underline">{email}</a> : '-' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout role="gstin">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">DDO Registration</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              Add and manage DDOs for your GSTIN
            </p>
          </div>
          <Button onClick={handleAdd} variant="primary" className="w-full sm:w-auto">
            <Plus className="mr-2" size={18} /> Add DDO
          </Button>
        </div>

        <div className="premium-card p-4 sm:p-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
            <input
              type="text"
              placeholder="Search DDOs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading DDOs..." variant="primary" />
            </div>
          ) : (
            <Table columns={columns} data={Array.isArray(filteredDdos) ? filteredDdos : []} />
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDDO ? 'Edit DDO' : 'Add DDO'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  DDO Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ddoCode}
                  onChange={(e) => setFormData({ ...formData, ddoCode: e.target.value })}
                  className="premium-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  DDO Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ddoName}
                  onChange={(e) => setFormData({ ...formData, ddoName: e.target.value })}
                  className="premium-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Area & City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    // Clear error when user starts typing
                    if (fieldErrors.city) {
                      setFieldErrors({ ...fieldErrors, city: '' });
                    }
                  }}
                  className={`premium-input w-full ${fieldErrors.city ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {fieldErrors.city && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{fieldErrors.city}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  PIN
                </label>
                <input
                  type="text"
                  value={formData.pinCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormData({ ...formData, pinCode: value });
                  }}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                    setFormData({ ...formData, pinCode: pastedText });
                  }}
                  className="premium-input w-full"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Contact No
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, mobile: value });
                  }}
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
                  className="premium-input w-full"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="premium-input w-full"
                />
              </div>
            </div>

            {/* Address field - full width */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  // Clear error when user starts typing
                  if (fieldErrors.address) {
                    setFieldErrors({ ...fieldErrors, address: '' });
                  }
                }}
                className={`premium-input w-full ${fieldErrors.address ? 'border-red-500 focus:ring-red-500' : ''}`}
                rows={3}
                placeholder="Enter full address (minimum 10 characters)"
              />
              {fieldErrors.address && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{fieldErrors.address}</span>
                </p>
              )}
            </div>

            {/* Password field - only shown when editing */}
            {editingDDO && (
              <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    <div className="flex items-center gap-2">
                      <Lock className="text-[var(--color-text-secondary)]" size={16} />
                      <span>Password</span>
                      <span className="text-xs text-[var(--color-text-secondary)] font-normal">(Leave blank to keep current password)</span>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="premium-input w-full pr-10"
                      placeholder="Enter new password (optional)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={formLoading} className="w-full sm:w-auto">
                {formLoading ? 'Saving...' : editingDDO ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}

