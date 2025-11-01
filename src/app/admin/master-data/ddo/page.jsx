"use client";
import MasterDataPage from '@/components/master-data/MasterDataPage';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { t } from '@/lib/localization';
import { validateGSTIN, validateEmail, validateMobile } from '@/lib/gstUtils';

const columns = [
  { key: 'gstinNumber', label: t('label.gstin') },
  { key: 'ddoCode', label: t('label.ddoCode') },
  { key: 'ddoName', label: t('label.ddoName') },
  { key: 'mobile', label: t('label.mobile') },
  { key: 'email', label: t('label.email') },
];

const formFields = [
  { key: 'gstinNumber', label: t('label.gstin'), required: true, maxLength: 15 },
  { key: 'ddoCode', label: t('label.ddoCode'), required: true },
  { key: 'ddoName', label: t('label.ddoName'), required: true },
  { key: 'mobile', label: t('label.mobile'), required: true, maxLength: 10 },
  { key: 'email', label: t('label.email'), type: 'email', required: true },
];

const validateForm = (data) => {
  const gstValidation = validateGSTIN(data.gstinNumber);
  if (!gstValidation.valid) {
    return { valid: false, message: gstValidation.message };
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

export default function DDORecordsPage() {
  return (
    <MasterDataPage
      title="DDO Details"
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

