"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { Edit, Save, X } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { validateGSTIN, validateEmail, validateMobile } from '@/lib/gstUtils';
import { useGstinList } from '@/hooks/useGstinList';

export default function GstinProfilePage() {
  const [formData, setFormData] = useState({
    gstinNumber: '29AAAGO1111W1ZB',
    gstinName: 'Government of Karnataka- Office of the Director General & Inspector General of Police, Karnataka',
    address: 'No.1, Police Head Quarterz, Narpathuga Road Opp: Martha\'s Hospital, K R Circle Bengaluru-560001',
    mobile: '9902991144',
    email: 'Copadmin@ksp.gov.in',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { gstinList } = useGstinList();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    // Show default data immediately - UI ready instantly
    setFetching(false);
    
    // Fetch real data in background (non-blocking)
    try {
      const gstinNumber = localStorage.getItem('gstinNumber') || '29AAAGO1111W1ZB';
      
      // Try to fetch from API with timeout
      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.GST_LIST}?gstin=${gstinNumber}`, 1500);
      if (response?.status === 'success' && response?.data && response.data.length > 0 && !response.timeout) {
        const gstinData = response.data[0];
        setFormData({
          gstinNumber: gstinData.gstNumber || gstinNumber,
          gstinName: gstinData.name || '',
          address: gstinData.address || '',
          mobile: gstinData.contactNumber || '',
          email: gstinData.email || '',
        });
      }
    } catch (error) {
      console.log('Using default GSTIN profile data');
      // Keep default data on error
    }
  };

  const handleSave = async () => {
    // Validate form
    const gstValidation = validateGSTIN(formData.gstinNumber);
    if (!gstValidation.valid) {
      toast.error(gstValidation.message);
      return;
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

    setLoading(true);
    try {
      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.GST_UPDATE || API_ENDPOINTS.GST_ADD,
        formData
      );

      if (response?.status === 'success') {
        toast.success('GSTIN profile updated successfully');
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
      <div className="space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Manage your GSTIN profile information
          </p>
        </div>

        <div className="premium-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">GSTIN Profile</h2>
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
                  GSTIN Number
                </label>
                {isEditing && gstinList.length > 0 ? (
                  <select
                    name="gstinNumber"
                    value={formData.gstinNumber}
                    onChange={handleChange}
                    className="premium-input w-full uppercase"
                  >
                    <option value="">Select GSTIN Number</option>
                    {gstinList.map((gstin) => (
                      <option key={gstin.value} value={gstin.value}>
                        {gstin.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="gstinNumber"
                    value={formData.gstinNumber}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    maxLength={15}
                    className={`premium-input w-full ${!isEditing ? 'bg-[var(--color-muted)]' : ''}`}
                  />
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  GSTIN Name
                </label>
                <input
                  type="text"
                  name="gstinName"
                  value={formData.gstinName}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`premium-input w-full ${!isEditing ? 'bg-[var(--color-muted)]' : ''}`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  rows={3}
                  className={`premium-input w-full ${!isEditing ? 'bg-[var(--color-muted)]' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Mobile
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
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

