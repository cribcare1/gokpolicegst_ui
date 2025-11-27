"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { Edit, Save, X, Building2, MapPin, Mail, Phone, Hash, FileText, Landmark } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { validateEmail, validateMobile, validateDDOCode, validateName, validatePIN, validateAddress, validateCity } from '@/lib/gstUtils';
import { LOGIN_CONSTANT } from '@/components/utils/constant';

export default function DDOProfilePage() {
  const [formData, setFormData] = useState({
    ddoCode: '',
    fullName: '',
    area: '',
    address: '',
    city: '',
    pinCode: '',
    mobileNumber: '',
    email: '',
    gstinNumber: '',
    gstinBankDetails: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

   useEffect(() => {
      const storedProfile = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);
      console.log("storedprfole", storedProfile);
      if (storedProfile) {
        try {
          // Check if the value looks like JSON (starts with { or [)
          const trimmedValue = storedProfile.trim();
          if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
            const userProfile = JSON.parse(storedProfile);
            console.log("userProfile", userProfile);
            // If data exists and not empty
            if (userProfile && typeof userProfile === 'object' && Object.keys(userProfile).length > 0) {
              console.log("userProfile=====called");
              setFormData(userProfile);
              setLoading(false);
              setFetching(false);
              return;
            }
          }
          // If not valid JSON or empty, fetch from API
          // fetchProfileData();
        } catch (error) {
          // If JSON parsing fails, fetch from API
          console.error('Error parsing stored profile data:', error);
          // fetchProfileData();
        }
      } 
    }, []);

  const fetchProfileData = async () => {
    setFetching(true);
    try {
      const ddoCode = localStorage.getItem('ddoCode');
      const ddoId = localStorage.getItem('ddoId');
      
      if (!ddoCode && !ddoId) {
        toast.error('DDO information not found. Please login again.');
        setFetching(false);
        return;
      }

      let response;
      
      // Try to fetch using DDO ID first (if available)
      if (ddoId) {
        try {
          response = await ApiService.handleGetRequest(`${API_ENDPOINTS.GET_DDO_DETAILS}${ddoId}`);
          if (response?.status === 'success' && response?.data) {
            const ddoData = response.data;
            setFormData({
              ddoCode: ddoData.ddoCode || ddoData.code || '',
              fullName: ddoData.fullName || ddoData.name || '',
              area: ddoData.area || '',
              address: ddoData.address || '',
              city: ddoData.city || '',
              pinCode: ddoData.pinCode || ddoData.ddoPin || ddoData.pin || '',
              mobileNumber: ddoData.mobileNumber || ddoData.contactNo || ddoData.mobileNumberNumber || '',
              email: ddoData.email || '',
            });
            setFetching(false);
            return;
          }
        } catch (error) {
          console.log('Failed to fetch using DDO ID, trying alternative method');
        }
      }

      // Fallback: Try to fetch using DDO Code
      if (ddoCode) {
        // Try with gstId parameter if available
        const gstId = localStorage.getItem('gstId');
        if (gstId) {
          response = await ApiService.handleGetRequest(`${API_ENDPOINTS.DDO_LIST}${gstId}`);
          if (response?.status === 'success' && response?.data && Array.isArray(response.data)) {
            const ddoData = response.data.find(ddo => ddo.ddoCode === ddoCode || ddo.code === ddoCode);
            if (ddoData) {
              setFormData({
                ddoCode: ddoData.ddoCode || ddoData.code || ddoCode,
                fullName: ddoData.fullName || ddoData.name || '',
                area: ddoData.area || '',
                address: ddoData.address || '',
                city: ddoData.city || '',
                pinCode: ddoData.pinCode || ddoData.ddoPin || ddoData.pin || '',
                mobileNumber: ddoData.mobileNumber || ddoData.contactNo || ddoData.mobileNumber || '',
                email: ddoData.email || '',
              });
              setFetching(false);
              return;
            }
          }
        }
        
        // Try direct DDO profile endpoint if available
        try {
          response = await ApiService.handleGetRequest(`${API_ENDPOINTS.PROFILE_GET}?ddoCode=${ddoCode}`);
          if (response?.status === 'success' && response?.data) {
            const ddoData = response.data;
            setFormData({
              ddoCode: ddoData.ddoCode || ddoData.code || ddoCode,
              fullName: ddoData.fullName || ddoData.name || '',
              area: ddoData.area || '',
              address: ddoData.address || '',
              city: ddoData.city || '',
              pinCode: ddoData.pinCode || ddoData.ddoPin || ddoData.pin || '',
              mobileNumber: ddoData.mobileNumber || ddoData.contactNo || ddoData.mobileNumber || '',
              email: ddoData.email || '',
            });
            setFetching(false);
            return;
          }
        } catch (error) {
          console.log('Failed to fetch using profile endpoint');
        }
      }

      // If all methods fail, show error
      toast.error('Failed to load DDO profile data. Please try again.');
    } catch (error) {
      console.error('Error fetching DDO profile:', error);
      toast.error('An error occurred while loading profile data');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    // Validate DDO Code
    const ddoCodeValidation = validateDDOCode(formData.ddoCode);
    if (!ddoCodeValidation.valid) {
      toast.error(ddoCodeValidation.message);
      return;
    }
    
    // Validate Full Name
    const fullNameValidation = validateName(formData.fullName, 'Full Name');
    if (!fullNameValidation.valid) {
      toast.error(fullNameValidation.message);
      return;
    }
    
    // Validate Area (if provided)
    if (formData.area && formData.area.trim() !== '') {
      const areaValidation = validateName(formData.area, 'Area');
      if (!areaValidation.valid) {
        toast.error('Area: ' + areaValidation.message);
        return;
      }
    }
    
    // Validate Address (if provided)
    if (formData.address && formData.address.trim() !== '') {
      const addressValidation = validateAddress(formData.address);
      if (!addressValidation.valid) {
        toast.error('Address: ' + addressValidation.message);
        return;
      }
    }
    
    // Validate City (if provided)
    if (formData.city && formData.city.trim() !== '') {
      const cityValidation = validateCity(formData.city);
      if (!cityValidation.valid) {
        toast.error('City: ' + cityValidation.message);
        return;
      }
    }
    
    // Validate PIN (if provided)
    if (formData.pinCode && formData.pinCode.trim() !== '') {
      const pinValidation = validatePIN(formData.pinCode);
      if (!pinValidation.valid) {
        toast.error(pinValidation.message);
        return;
      }
    }
    
    // Validate Email
    if (formData.email && formData.email.trim() !== '') {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        toast.error(emailValidation.message);
        return;
      }
    }

    // Validate Mobile
    if (formData.mobileNumber && formData.mobileNumber.trim() !== '') {
      const mobileValidation = validateMobile(formData.mobileNumber);
      if (!mobileValidation.valid) {
        toast.error(mobileValidation.message);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ddoCode: formData.ddoCode,
        fullName: formData.fullName,
        area: formData.area || '',
        address: formData.address || '',
        city: formData.city || '',
        pinCode: formData.pinCode || '',
        mobileNumber: formData.mobileNumber || '',
        email: formData.email || '',
      };

      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.DDO_UPDATE,
        payload
      );

      if (response?.status === 'success') {
        toast.success('DDO profile updated successfully');
        setIsEditing(false);
        localStorage.setItem('ddoCode', formData.ddoCode);
      } else {
        toast.error(response?.message || 'Failed to update DDO profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    fetchProfileData();
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatLabel = (label = '') => {
    return label
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatBankDetails = (details) => {
    console.log("Bank details to format: ", details);
    if (!details) return '-';
    if (typeof details === 'string') {
      return details.trim() || '-';
    }
    if (Array.isArray(details)) {
      const filtered = details.filter((item) => !!item);
      return filtered.length ? filtered.join(' | ') : '-';
    }
    if (typeof details === 'object') {
      // Exclude sensitive/metadata fields: id, gstId, gstName, gstNumber, status
      const excludedKeys = ['id', 'gstId', 'gstName', 'gstNumber', 'status'];
      const entries = Object.entries(details)
        .filter(([key, value]) => !excludedKeys.includes(key) && value)
        .filter(([, value]) => value);
      if (!entries.length) return '-';
      return entries
        .map(([key, value]) => `${formatLabel(key)}: ${value}`)
        .join(' | ');
    }
    return String(details);
  };

  const gstinValue = formData.gstinNumber || formData.gstNumber || formData.gstin || '';
  const gstinBankDetails = formatBankDetails(formData.bankDetailsResponse || formData.bankDetails);

  return (
    <Layout role="ddo">
      <div className="space-y-6 sm:space-y-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3">
            <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Manage your DDO profile information
          </p>
        </div>

        <div className="premium-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl shadow-lg">
                <Building2 className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">DDO Profile</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">Update your organization details</p>
              </div>
            </div>
            {isEditing ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="secondary" onClick={handleCancel} disabled={loading} className="w-full sm:w-auto">
                  <X className="mr-2" size={18} /> Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <><Save className="mr-2" size={18} /> Save Changes</>
                  )}
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                <Edit className="mr-2" size={18} /> Edit Profile
              </Button>
            )}
          </div>

          {fetching ? (
            <div className="py-12">
              <LoadingProgressBar message="Loading profile data..." variant="primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* DDO Code */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-1">
                    <Hash className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      DDO Code
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="ddoCode"
                        value={formData.ddoCode}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter DDO code"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium font-mono">{formData.ddoCode}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DDO Name */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mt-1">
                    <Building2 className="text-indigo-600 dark:text-indigo-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      DDO Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter DDO name"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.fullName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* GSTIN Number (Read Only) */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg mt-1">
                    <FileText className="text-cyan-600 dark:text-cyan-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      GSTIN Number
                    </label>
                    <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                      <p className="text-[var(--color-text-primary)] font-medium font-mono uppercase tracking-wide">
                        {gstinValue || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Area */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mt-1">
                    <MapPin className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Area
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter area"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.area || '-'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* City */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mt-1">
                    <MapPin className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      City
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter city"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.city || '-'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* GSTIN Bank Details (Read Only) */}
              <div className="lg:col-span-2">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg mt-1">
                    <Landmark className="text-amber-600 dark:text-amber-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      GSTIN Bank Details
                    </label>
                    <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                      <p className="text-[var(--color-text-primary)] font-medium">
                        {gstinBankDetails}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address - Full Width */}
              <div className="lg:col-span-2">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mt-1">
                    <MapPin className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter full address"
                        rows={3}
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.address || '-'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PIN */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mt-1">
                    <MapPin className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      PIN Code
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          handleChange({ target: { name: 'pinCode', value } });
                        }}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                          handleChange({ target: { name: 'pinCode', value: pastedText } });
                        }}
                        maxLength={6}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter pin code"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.pinCode || '-'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact No */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mt-1">
                    <Phone className="text-orange-600 dark:text-orange-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Contact Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          handleChange({ target: { name: 'mobileNumber', value } });
                        }}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 10);
                          handleChange({ target: { name: 'mobileNumber', value: pastedText } });
                        }}
                        maxLength={10}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter contact number"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.mobileNumber || '-'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mt-1">
                    <Mail className="text-purple-600 dark:text-purple-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter email address"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

