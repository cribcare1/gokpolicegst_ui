"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { Edit, Save, X, MapPin, Building2, Mail, Phone, FileText } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { validateEmail, validateMobile, validateName, validateAddress, validateCity, validatePIN } from '@/lib/gstUtils';
import { useGstinList } from '@/hooks/useGstinList';
import { LOGIN_CONSTANT } from '@/components/utils/constant';

// Helper function to parse address and extract city and pin code
const parseAddress = (fullAddress) => {
  if (!fullAddress) return { address: '', city: '', pinCode: '' };
  
  // Pattern to match: city-pincode at the end (e.g., "Bengaluru-560001")
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

export default function GstinProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { gstinList } = useGstinList();
  const [formData, setFormData] = useState({
    gstinNumber: '',
    gstName: '',
    address: '',
    city: '',
    pinCode: '',
    mobile: '',
    email: '',
    bankDetails: '',
    gstId: null,
    gstHolderName: '',
    userId: null,
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setFetching(true);
    try {
      // First, try to get data from localStorage
      const storedProfile = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);
    
      const gstId = localStorage.getItem(LOGIN_CONSTANT.GSTID);
      
      if (storedProfile) {
        try {
          const trimmedValue = storedProfile.trim();
          if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
            const userProfile = JSON.parse(storedProfile);
            console.log("userprofile gstin data", userProfile);
            if (userProfile && typeof userProfile === 'object' && Object.keys(userProfile).length > 0) {
              // If it's an array, find the matching record
              if (Array.isArray(userProfile)) {
                const matchedProfile = gstId 
                  ? userProfile.find(p => p.gstId === parseInt(gstId) || p.gstId === gstId)
                  : userProfile[0];
                if (matchedProfile) {
                  setFormDataFromApi(matchedProfile);
                  setFetching(false);
                  return;
                }
              } else {
                // Single object
                setFormDataFromApi(userProfile);
                setFetching(false);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error parsing stored profile data:', error);
        }
      }

    //   // Fetch from API
    //   const response = await ApiService.handleGetRequest(API_ENDPOINTS.GST_LIST);
      
    //   if (response?.status === 'success' && response?.data && Array.isArray(response.data)) {
    //     // Find the current user's GST record
    //     let matchedProfile = null;
        
    //     if (gstId) {
    //       // Try to match by gstId
    //       matchedProfile = response.data.find(
    //         item => item.gstId === parseInt(gstId) || item.gstId === gstId || String(item.gstId) === String(gstId)
    //       );
    //     }
        
    //     // If no match by gstId, try to match by userId
    //     if (!matchedProfile) {
    //       const userId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
    //       if (userId) {
    //         matchedProfile = response.data.find(
    //           item => item.userId === parseInt(userId) || item.userId === userId || String(item.userId) === String(userId)
    //         );
    //       }
    //     }
        
    //     // If still no match, use the first record
    //     if (!matchedProfile && response.data.length > 0) {
    //       matchedProfile = response.data[0];
    //     }
        
    //     if (matchedProfile) {
    //       setFormDataFromApi(matchedProfile);
    //       // Store in localStorage for future use
    //       localStorage.setItem(LOGIN_CONSTANT.USER_PROFILE_DATA, JSON.stringify(response.data));
    //     } else {
    //       toast.error('No GST profile found');
    //     }
    //   } else {
    //     toast.error('Failed to load GST profile data');
    //   }
    } catch (error) {
      console.error('Error fetching GST profile:', error);
      toast.error('An error occurred while loading profile data');
    } finally {
      setFetching(false);
    }
  };

  const setFormDataFromApi = (apiData) => {
    setFormData({
      gstinNumber: apiData.gstNumber || apiData.gstinNumber || '',
      gstName: apiData.gstName || '',
      address: apiData.address || '',
      city: apiData.city || '',
      pinCode: apiData.pinCode || apiData.pin || '',
      mobileNumber: apiData.mobileNumber || apiData.mobileNumberNumber || '',
      bankDetails: apiData.bankDetails || apiData.bank_details || apiData.bankName || apiData.bank || '',
      email: apiData.email || '',
      gstId: apiData.gstId || apiData.id || null,
      gstHolderName: apiData.gstHolderName || '',
      userId: apiData.userId || null,
    });
  };

  const handleSave = async () => {
    // Validate GSTIN Name
    const nameValidation = validateName(formData.gstName, 'GSTIN Name');
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
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      toast.error(emailValidation.message);
      return;
    }

    // Validate mobileNumber
    const mobileValidation = validateMobile(formData.mobileNumber);
    if (!mobileValidation.valid) {
      toast.error(mobileValidation.message);
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        gstNumber: formData.gstinNumber,
        gstName: formData.gstName,
        address: formData.address,
        city: formData.city,
        pinCode: formData.pinCode,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        gstId: formData.gstId,
        gstHolderName: formData.gstHolderName,
        createdBy: formData.userId,
}

      const response = await ApiService.handlePostMultiPartFileRequest(
        API_ENDPOINTS.GST_UPDATE || API_ENDPOINTS.GST_ADD,
        updateData, null
      );

      if (response?.status === 'success') {
        toast.success('GSTIN profile updated successfully');
        localStorage.setItem(LOGIN_CONSTANT.USER_PROFILE_DATA, JSON.stringify(response.login_response));
        setIsEditing(false);
        localStorage.setItem('gstinNumber', formData.gstinNumber);
      } else {
        toast.error(response?.message || 'Failed to update GSTIN profile');
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
    <Layout role="gstin">
      <div className="space-y-6 sm:space-y-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3">
            <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Manage your GSTIN profile information
          </p>
        </div>

        <div className="premium-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl shadow-lg">
                <Building2 className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">GSTIN Profile</h2>
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
              {/* GSTIN Number */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-1">
                    <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      name="gstinNumber"
                      value={formData.gstinNumber || ''}
                      readOnly
                      disabled
                      className="premium-input w-full px-4 py-3 text-base uppercase bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]"
                      placeholder="GSTIN number"
                    />
                  </div>
                </div>
              </div>

              {/* GSTIN Name */}
              <div className="lg:col-span-2">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mt-1">
                    <Building2 className="text-indigo-600 dark:text-indigo-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      GSTIN Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="gstName"
                        value={formData.gstName || ''}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter GSTIN name"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.gstName || '-'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Details (non-editable) */}
              <div className="lg:col-span-2">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg mt-1">
                    <Building2 className="text-sky-600 dark:text-sky-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Bank Details
                    </label>
                    <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                      <p className="text-[var(--color-text-primary)] font-medium whitespace-pre-wrap">{formData.bankDetails || '-'}</p>
                    </div>
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
                        value={formData.address || ''}
                        onChange={handleChange}
                        rows={3}
                        className="premium-input w-full px-4 py-3 text-base resize-none"
                        placeholder="Enter address (street, building, area)"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium whitespace-pre-wrap">{formData.address || '-'}</p>
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
                        value={formData.city || ''}
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
                        value={formData.pinCode || ''}
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

              {/* mobileNumber */}
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
                        value={formData.mobileNumber || ''}
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
                        placeholder="Enter mobile number"
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
                        value={formData.email || ''}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter email address"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.email || '-'}</p>
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

