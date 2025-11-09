"use client";
import dynamic from 'next/dynamic';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { t } from '@/lib/localization';
import { validateGSTIN, validateEmail, validateDDOCode, validateName } from '@/lib/gstUtils';

// Lazy load MasterDataPage for better performance
const MasterDataPage = dynamic(() => import('@/components/master-data/MasterDataPage'), {
  loading: () => <div className="premium-card p-8 animate-pulse"><div className="h-96 bg-gray-200 rounded"></div></div>,
  ssr: false
});

const columns = [
  { key: 'gstinNumber', label: t('label.gstin') },
  { key: 'ddoCode', label: t('label.ddoCode') },
  { key: 'ddoName', label: t('label.ddoName') },
  { key: 'email', label: t('label.email') },
];

const formFields = [
  { key: 'gstinNumber', label: t('label.gstin'), required: true, maxLength: 15 },
  { key: 'ddoCode', label: t('label.ddoCode'), required: true },
  { key: 'ddoName', label: t('label.ddoName'), required: true },
  { key: 'email', label: t('label.email'), type: 'email', required: true },
];

const validateForm = (data) => {
  const gstValidation = validateGSTIN(data.gstinNumber);
  if (!gstValidation.valid) {
    return { valid: false, message: gstValidation.message };
  }
  
  const ddoCodeValidation = validateDDOCode(data.ddoCode);
  if (!ddoCodeValidation.valid) {
    return { valid: false, message: ddoCodeValidation.message };
  }
  
  const ddoNameValidation = validateName(data.ddoName, 'DDO Name');
  if (!ddoNameValidation.valid) {
    return { valid: false, message: ddoNameValidation.message };
  }
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    return { valid: false, message: emailValidation.message };
  }
  
  return { valid: true };
};

export default function DDORecordsPage() {
  return (
    <MasterDataPage
      title="DDO Mapping"
      endpoint={{
        LIST: API_ENDPOINTS.DDO_LIST,
        ADD: API_ENDPOINTS.DDO_ADD,
        UPDATE: API_ENDPOINTS.DDO_UPDATE,
        DELETE: API_ENDPOINTS.DDO_DELETE,
      }}
      columns={columns}
      formFields={formFields}
      validateForm={validateForm}
      role="admin"
    />
  );
}

