"use client";
import dynamic from 'next/dynamic';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { t } from '@/lib/localization';
import { validateGSTIN, validateEmail, validateMobile } from '@/lib/gstUtils';

// Lazy load MasterDataPage for better performance
const MasterDataPage = dynamic(() => import('@/components/master-data/MasterDataPage'), {
  loading: () => <div className="premium-card p-8 animate-pulse"><div className="h-96 bg-gray-200 rounded"></div></div>,
  ssr: false
});

const columns = [
  { key: 'gstNumber', label: t('label.gstin') },
  { key: 'name', label: t('label.name') },
  { key: 'address', label: t('label.address') },
  { key: 'contactNumber', label: t('label.mobile') },
  { key: 'email', label: t('label.email') },
];

const formFields = [
  { key: 'gstNumber', label: t('label.gstin'), required: true, maxLength: 15 },
  { key: 'name', label: t('label.name'), required: true },
  { key: 'address', label: t('label.address'), type: 'textarea', required: true },
  { key: 'contactNumber', label: t('label.mobile'), required: true, maxLength: 10 },
  { key: 'email', label: t('label.email'), type: 'email', required: true },
];

const validateForm = (data) => {
  const gstValidation = validateGSTIN(data.gstNumber);
  if (!gstValidation.valid) {
    return { valid: false, message: gstValidation.message };
  }
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    return { valid: false, message: emailValidation.message };
  }
  
  const mobileValidation = validateMobile(data.contactNumber);
  if (!mobileValidation.valid) {
    return { valid: false, message: mobileValidation.message };
  }
  
  return { valid: true };
};

export default function GSTRecordsPage() {
  return (
    <MasterDataPage
      title="GST Records"
      endpoint={{
        LIST: API_ENDPOINTS.GST_LIST,
        ADD: API_ENDPOINTS.GST_ADD,
        UPDATE: API_ENDPOINTS.GST_UPDATE,
        DELETE: API_ENDPOINTS.GST_DELETE,
      }}
      columns={columns}
      formFields={formFields}
      validateForm={validateForm}
      role="admin"
    />
  );
}

