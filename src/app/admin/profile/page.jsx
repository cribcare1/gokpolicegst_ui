"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { Edit, Save, X, Building2, MapPin, Mail, Phone } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { validateEmail, validateMobile, validateName, validateAddress, validateCity, validatePIN } from '@/lib/gstUtils';
import { LOGIN_CONSTANT } from '@/components/utils/constant';

// Helper function to parse address and extract city and pin code
const parseAddress = (fullAddress) => {
  if (!fullAddress) return { address: '', city: '', pinCode: '' };
  
  // Pattern to match: city-pincode at the end (e.g., "Bengaluru-560016")
  const cityPinPattern = /,\s*([A-Za-z\s]+)-(\d{6})$/;
  const match = fullAddress.match(cityPinPattern);
  
  if (match) {
    const city = match[1].trim();
    const pinCode = match[2];
    const address = fullAddress.substring(0, match.index).trim();
    return { address, city, pinCode };
  }
  
  // Fallback: try to extract pin code at the end
  const pinPattern = /-(\d{6})$/;
  const pinMatch = fullAddress.match(pinPattern);
  if (pinMatch) {
    const beforePin = fullAddress.substring(0, pinMatch.index);
    const lastCommaIndex = beforePin.lastIndexOf(',');
    if (lastCommaIndex > 0) {
      const address = beforePin.substring(0, lastCommaIndex).trim();
      const city = beforePin.substring(lastCommaIndex + 1).trim();
      const pinCode = pinMatch[1];
      return { address, city, pinCode };
    }
  }
  
  // If no pattern matches, return the full address as address
  return { address: fullAddress, city: '', pinCode: '' };
};

export default function AdminProfilePage() {
  // const [formData, setFormData] = useState({
  //   fullName: 'Wings - E-business Services',
  //   address: 'No: 119, 3rd Floor, The Oasis Building, Pai Layout, 8th Cross',
  //   city: 'Bengaluru',
  //   pinCode: '560016',
  //   email: 'Wingdebs@gmail.com',
  //   mobileNumber: '9902991133',
  // });
  const [formData, setFormData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

 useEffect(() => {
    const storedProfile = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);

    if (storedProfile) {
      const userProfile = JSON.parse(storedProfile);
      // If data exists and not empty
      if (userProfile && Object.keys(userProfile).length > 0) {
        setFormData(userProfile);
        setLoading(false);
        setFetching(false);
      } else {
        fetchProfileData();
      }
    } else {
      fetchProfileData();
    }
  }, []);

  const fetchProfileData = async () => {
    setFetching(true);
    try {
      // Try to fetch from API
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.PROFILE_GET);
      if (response?.status === 'success' && response?.data) {
        // If API returns separate city and pinCode, use them directly
        if (response.data.city && response.data.pinCode) {
          setFormData({
            fullName: response.data.companyName || response.data.fullName || 'Wings - E-business Services',
            address: response.data.address || 'No: 119, 3rd Floor, The Oasis Building, Pai Layout, 8th Cross',
            city: response.data.city || 'Bengaluru',
            pinCode: response.data.pinCode || '560016',
            email: response.data.email || 'Wingdebs@gmail.com',
            mobileNumber: response.data.mobileNumber || '9902991133',
          });
        } else {
          // Parse the old format address string
          const parsed = parseAddress(response.data.address || 'No: 119, 3rd Floor, The Oasis Building, Pai Layout, 8th Cross, Bengaluru-560016');
          setFormData({
            fullName: response.data.companyName || response.data.fullName || 'Wings - E-business Services',
            address: parsed.address || 'No: 119, 3rd Floor, The Oasis Building, Pai Layout, 8th Cross',
            city: parsed.city || 'Bengaluru',
            pinCode: parsed.pinCode || '560016',
            email: response.data.email || 'Wingdebs@gmail.com',
            mobileNumber: response.data.mobileNumber || '9902991133',
          });
        }
      }
    } catch (error) {
      // Use default demo data
      console.log('Using default profile data');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    // Validate Profile Name
    const nameValidation = validateName(formData.fullName, 'Profile Name');
    if (!nameValidation.valid) {
      toast.error(nameValidation.message);
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
    
    // Validate PIN Code
    const pinValidation = validatePIN(formData.pinCode);
    if (!pinValidation.valid) {
      toast.error(pinValidation.message);
      return;
    }

    // Validate Email
    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        toast.error(emailValidation.message);
        return;
      }
    }

    // Validate Mobile
    if (formData.mobileNumber) {
      const mobileValidation = validateMobile(formData.mobileNumber);
      if (!mobileValidation.valid) {
        toast.error(mobileValidation.message);
        return;
      }
    }

    setLoading(true);
    try {
      const updateData = {
        id: formData.id,
        fullName: formData.fullName,
        address: formData.address,
        city: formData.city,
        pinCode: formData.pinCode,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
      };

      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.ADMIN_PROFILE_UPDATE,
        updateData
      );

      if (response?.status === 'success') {
        toast.success('Profile updated successfully');
        setIsEditing(false);
      } else {
        toast.error(response?.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.success('Profile saved (demo mode)');
      setIsEditing(false);
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
    <Layout role="admin">
      <div className="space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Manage your admin profile information
          </p>
        </div>

        <div className="premium-card p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl shadow-lg">
                <Building2 className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Profile Information</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">Update your organization details</p>
              </div>
            </div>
            {!isEditing ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto"
              >
                <Edit className="mr-2" size={18} />
                Edit Profile
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
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
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleCancel}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <X className="mr-2" size={18} />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {fetching ? (
            <div className="py-12">
              <LoadingProgressBar message="Loading profile data..." variant="primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Profile Name */}
              <div className="lg:col-span-2">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-1">
                    <Building2 className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Profile Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter profile name"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.fullName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
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
                        rows={3}
                        className="premium-input w-full px-4 py-3 text-base resize-none"
                        placeholder="Enter address (street, building, area)"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium whitespace-pre-wrap">{formData.address}</p>
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
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.city}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pin Code */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mt-1">
                    <MapPin className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Pin Code
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={handleChange}
                        maxLength={6}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter pin code"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.pinCode}</p>
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

              {/* Mobile */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mt-1">
                    <Phone className="text-orange-600 dark:text-orange-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Mobile Number
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
                        maxLength={10}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter mobile number"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.mobileNumber}</p>
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

