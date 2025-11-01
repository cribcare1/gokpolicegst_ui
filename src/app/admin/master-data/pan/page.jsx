"use client";
import MasterDataPage from '@/components/master-data/MasterDataPage';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { t } from '@/lib/localization';
import { validatePAN } from '@/lib/gstUtils';

const columns = [
  { key: 'panNumber', label: t('label.panNumber') },
  { key: 'name', label: t('label.name') },
];

const formFields = [
  { key: 'panNumber', label: t('label.panNumber'), required: true, maxLength: 10 },
  { key: 'name', label: t('label.name'), required: true },
];

const validateForm = (data) => {
  const panValidation = validatePAN(data.panNumber);
  if (!panValidation.valid) {
    return { valid: false, message: panValidation.message };
  }
  return { valid: true };
};

export default function PANRecordsPage() {
  return (
    <MasterDataPage
      title="PAN Records"
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

