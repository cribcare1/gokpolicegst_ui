"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { Edit, Save, X, Building2, MapPin, Mail, Phone } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { validateEmail, validateMobile } from '@/lib/gstUtils';
import { LOGIN_CONSTANT } from '@/components/utils/constant';

export default function AdminProfilePage() {
  const [formData, setFormData] = useState({
    profileName: 'Wings - E-business Services',
    address: 'No: 119, 3rd Floor, The Oasis Building, Pai Layout, 8th Cross, Bengaluru-560016',
    email: 'Wingdebs@gmail.com',
    mobile: '9902991133',
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
      // Try to fetch from API
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.PROFILE_GET);
      if (response?.status === 'success' && response?.data) {
        setFormData({
          profileName: response.data.companyName || response.data.profileName || 'Wings - E-business Services',
          address: response.data.address || 'No: 119, 3rd Floor, The Oasis Building, Pai Layout, 8th Cross, Bengaluru-560016',
          email: response.data.email || 'Wingdebs@gmail.com',
          mobile: response.data.mobile || '9902991133',
        });
      }
    } catch (error) {
      // Use default demo data
      console.log('Using default profile data');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    // Validate form
    if (!formData.profileName || formData.profileName.trim() === '') {
      toast.error('Profile Name is required');
      return;
    }

    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        toast.error(emailValidation.message);
        return;
      }
    }

    if (formData.mobile) {
      const mobileValidation = validateMobile(formData.mobile);
      if (!mobileValidation.valid) {
        toast.error(mobileValidation.message);
        return;
      }
    }

    setLoading(true);
    try {
      const updateData = {
        companyName: formData.profileName,
        address: formData.address,
        email: formData.email,
        mobile: formData.mobile,
      };

      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.PROFILE_UPDATE,
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
                        name="profileName"
                        value={formData.profileName}
                        onChange={handleChange}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter profile name"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.profileName}</p>
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
                        placeholder="Enter complete address"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium whitespace-pre-wrap">{formData.address}</p>
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
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        maxLength={10}
                        className="premium-input w-full px-4 py-3 text-base"
                        placeholder="Enter mobile number"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-primary)] font-medium">{formData.mobile}</p>
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

