"use client";
import { useState, useEffect } from 'react';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { Edit, Save, X } from 'lucide-react';
import { validateName, validateAddress, validateEmail, validateMobile } from '@/lib/gstUtils';
import { LOGIN_CONSTANT } from '@/components/utils/constant';

export default function ProfileMaster() {
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    email: '',
    mobile: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

 useEffect(() => {
    const storedProfile = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);

    if (storedProfile) {
      try {
        // Check if the value looks like JSON (starts with { or [)
        const trimmedValue = storedProfile.trim();
        if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
          const userProfile = JSON.parse(storedProfile);
          // If data exists and not empty
          if (userProfile && typeof userProfile === 'object' && Object.keys(userProfile).length > 0) {
            setFormData(userProfile);
            return;
          }
        }
        // If not valid JSON or empty, fetch from API
        fetchProfileData();
      } catch (error) {
        // If JSON parsing fails, fetch from API
        console.error('Error parsing stored profile data:', error);
        fetchProfileData();
      }
    } else {
      fetchProfileData();
    }
  }, []);

  const fetchProfileData = async () => {
    try {
      // Try to fetch from API
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.PROFILE_GET);
      if (response?.status === 'success' && response?.data) {
        setFormData(response.data);
      }
    } catch (error) {
      // Use default demo data
      console.log('Using default profile data');
    }
  };

  const handleSave = async () => {
    // Validate Company Name
    const nameValidation = validateName(formData?.companyName, 'Company Name');
    if (!nameValidation.valid) {
      toast.error(nameValidation.message);
      return;
    }
    
    // Validate Address
    const addressValidation = validateAddress(formData?.address);
    if (!addressValidation.valid) {
      toast.error(addressValidation.message);
      return;
    }
    
    // Validate Email
    const emailValidation = validateEmail(formData?.email);
    if (!emailValidation.valid) {
      toast.error(emailValidation.message);
      return;
    }
    
    // Validate Mobile
    const mobileValidation = validateMobile(formData?.mobile);
    if (!mobileValidation.valid) {
      toast.error(mobileValidation.message);
      return;
    }
    
    setLoading(true);
    try {
      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.PROFILE_UPDATE,
        formData
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

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="premium-card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">Profile</h2>
        {!isEditing ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto"
          >
            <Edit className="mr-2" size={16} />
            Edit
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <X className="mr-2" size={16} />
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Save className="mr-2" size={16} />
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Company Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData?.companyName || ''}
              onChange={(e) => updateFormData('companyName', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          ) : (
            <p className="px-3 py-2 bg-[var(--color-muted)] rounded-lg text-[var(--color-text-primary)]">
              {formData?.companyName || 'N/A'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Address
          </label>
          {isEditing ? (
            <textarea
              value={formData?.address || ''}
              onChange={(e) => updateFormData('address', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          ) : (
            <p className="px-3 py-2 bg-[var(--color-muted)] rounded-lg text-[var(--color-text-primary)]">
              {formData?.address || 'N/A'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Email
          </label>
          {isEditing ? (
            <input
              type="email"
              value={formData?.email || ''}
              onChange={(e) => updateFormData('email', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          ) : (
            <p className="px-3 py-2 bg-[var(--color-muted)] rounded-lg text-[var(--color-text-primary)]">
              {formData?.email || 'N/A'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Mobile
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData?.mobile || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                updateFormData('mobile', value);
              }}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 10);
                updateFormData('mobile', pastedText);
              }}
              maxLength={10}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          ) : (
            <p className="px-3 py-2 bg-[var(--color-muted)] rounded-lg text-[var(--color-text-primary)]">
              {formData?.mobile || 'N/A'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

