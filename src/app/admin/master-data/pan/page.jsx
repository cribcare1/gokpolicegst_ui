"use client";
import dynamic from 'next/dynamic';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { t } from '@/lib/localization';
import { validatePAN, validateEmail, validateMobile } from '@/lib/gstUtils';

// Lazy load MasterDataPage for better performance
const MasterDataPage = dynamic(() => import('@/components/master-data/MasterDataPage'), {
  loading: () => <div className="premium-card p-8 animate-pulse"><div className="h-96 bg-gray-200 rounded"></div></div>,
  ssr: false
});

const columns = [
  { key: 'panNumber', label: t('label.panNumber') },
  { key: 'panName', label: t('label.name') },
  { key: 'address', label: t('label.address') },
  { key: 'mobile', label: t('label.mobile') },
  { key: 'email', label: t('label.email') },
];

const formFields = [
  { key: 'panNumber', label: t('label.panNumber'), required: true, maxLength: 10 },
  { key: 'panName', label: t('label.name'), required: true },
  { key: 'address', label: t('label.address'), type: 'textarea', required: true },
  { key: 'mobile', label: t('label.mobile'), required: true, maxLength: 10 },
  { key: 'email', label: t('label.email'), type: 'email', required: true },
];

const validateForm = (data) => {
  const panValidation = validatePAN(data.panNumber);
  if (!panValidation.valid) {
    return { valid: false, message: panValidation.message };
  }
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    return { valid: false, message: emailValidation.message };
  }
  
  const mobileValidation = validateMobile(data.mobile);
  if (!mobileValidation.valid) {
    return { valid: false, message: mobileValidation.message };
  }
  
  return { valid: true };
};

export default function PANRecordsPage() {
  return (
    <MasterDataPage
      title="PAN Master"
      endpoint={{
        LIST: API_ENDPOINTS.PAN_LIST,
        ADD: API_ENDPOINTS.PAN_ADD,
        UPDATE: API_ENDPOINTS.PAN_UPDATE,
        DELETE: API_ENDPOINTS.PAN_DELETE,
      }}
      columns={columns}
      formFields={formFields}
      validateForm={validateForm}
      role="admin"
    />
  );
}

