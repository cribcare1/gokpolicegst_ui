"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { Edit, Save, X, Building2, MapPin, Mail, Phone, Hash } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { validateEmail, validateMobile, validateDDOCode, validateName, validatePIN, validateAddress } from '@/lib/gstUtils';

export default function DDOProfilePage() {
  const [formData, setFormData] = useState({
    ddoCode: '0200PO0032',
    ddoName: 'DCP CAR HQ',
    ddoAreaCity: 'Mysore Road, Bengaluru',
    ddoPin: '560018',
    contactNo: '9902991313',
    email: 'Dcpadmin@ksp.gov.in',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setFetching(true);
    try {
      const ddoCode = localStorage.getItem('ddoCode') || '0200PO0032';
      
      // Try to fetch from API
      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.DDO_LIST}?ddoCode=${ddoCode}`);
      if (response?.status === 'success' && response?.data && response.data.length > 0) {
        const ddoData = response.data[0];
        setFormData({
          ddoCode: ddoData.ddoCode || ddoCode,
          ddoName: ddoData.ddoName || '',
          ddoAreaCity: ddoData.ddoAreaCity || ddoData.areaCity || '',
          ddoPin: ddoData.ddoPin || ddoData.pin || '',
          contactNo: ddoData.contactNo || ddoData.mobile || '',
          email: ddoData.email || '',
        });
      }
    } catch (error) {
      console.log('Using default DDO profile data');
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
    
    // Validate DDO Name
    const ddoNameValidation = validateName(formData.ddoName, 'DDO Name');
    if (!ddoNameValidation.valid) {
      toast.error(ddoNameValidation.message);
      return;
    }
    
    // Validate Area & City (if provided)
    if (formData.ddoAreaCity && formData.ddoAreaCity.trim() !== '') {
      const addressValidation = validateAddress(formData.ddoAreaCity);
      if (!addressValidation.valid) {
        toast.error('Area & City: ' + addressValidation.message);
        return;
      }
    }
    
    // Validate PIN (if provided)
    if (formData.ddoPin && formData.ddoPin.trim() !== '') {
      const pinValidation = validatePIN(formData.ddoPin);
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
    if (formData.contactNo && formData.contactNo.trim() !== '') {
      const mobileValidation = validateMobile(formData.contactNo);
      if (!mobileValidation.valid) {
        toast.error(mobileValidation.message);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        mobile: formData.contactNo,
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
                        name="ddoName"
                        value={formData.ddoName}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter DDO name"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.ddoName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Area & City */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mt-1">
                    <MapPin className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Area & City
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="ddoAreaCity"
                        value={formData.ddoAreaCity}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter area and city"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.ddoAreaCity}</p>
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
                        name="ddoPin"
                        value={formData.ddoPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          handleChange({ target: { name: 'ddoPin', value } });
                        }}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                          handleChange({ target: { name: 'ddoPin', value: pastedText } });
                        }}
                        maxLength={6}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter pin code"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.ddoPin}</p>
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
                        name="contactNo"
                        value={formData.contactNo}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          handleChange({ target: { name: 'contactNo', value } });
                        }}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 10);
                          handleChange({ target: { name: 'contactNo', value: pastedText } });
                        }}
                        maxLength={10}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter contact number"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.contactNo}</p>
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

