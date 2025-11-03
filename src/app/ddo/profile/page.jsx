"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { Edit, Save, X } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { validateEmail, validateMobile } from '@/lib/gstUtils';

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
    // Validate form
    const emailValidation = validateEmail(formData.email);
    if (formData.email && !emailValidation.valid) {
      toast.error(emailValidation.message);
      return;
    }

    const mobileValidation = validateMobile(formData.contactNo);
    if (formData.contactNo && !mobileValidation.valid) {
      toast.error(mobileValidation.message);
      return;
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
      <div className="space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Manage your DDO profile information
          </p>
        </div>

        <div className="premium-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">DDO Profile</h2>
            {isEditing ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="secondary" onClick={handleCancel} disabled={loading} className="w-full sm:w-auto">
                  <X className="mr-2" size={16} /> Cancel
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
                    <><Save className="mr-2" size={16} /> Save</>
                  )}
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                <Edit className="mr-2" size={16} /> Edit
              </Button>
            )}
          </div>

          {fetching ? (
            <div className="py-8">
              <LoadingProgressBar message="Loading profile data..." variant="primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  DDO Code
                </label>
                <input
                  type="text"
                  name="ddoCode"
                  value={formData.ddoCode}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`premium-input w-full ${!isEditing ? 'bg-[var(--color-muted)]' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  DDO Name
                </label>
                <input
                  type="text"
                  name="ddoName"
                  value={formData.ddoName}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`premium-input w-full ${!isEditing ? 'bg-[var(--color-muted)]' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Area & City
                </label>
                <input
                  type="text"
                  name="ddoAreaCity"
                  value={formData.ddoAreaCity}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`premium-input w-full ${!isEditing ? 'bg-[var(--color-muted)]' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  PIN
                </label>
                <input
                  type="text"
                  name="ddoPin"
                  value={formData.ddoPin}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  maxLength={6}
                  className={`premium-input w-full ${!isEditing ? 'bg-[var(--color-muted)]' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Contact No
                </label>
                <input
                  type="text"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  maxLength={10}
                  className={`premium-input w-full ${!isEditing ? 'bg-[var(--color-muted)]' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`premium-input w-full ${!isEditing ? 'bg-[var(--color-muted)]' : ''}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

