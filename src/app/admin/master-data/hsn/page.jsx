"use client";
import MasterDataPage from '@/components/master-data/MasterDataPage';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { t } from '@/lib/localization';

const columns = [
  { key: 'hsnNumber', label: t('label.hsnNumber') },
  { key: 'name', label: t('label.name') },
];

const formFields = [
  { key: 'hsnNumber', label: t('label.hsnNumber'), required: true },
  { key: 'name', label: t('label.name'), required: true },
];

const validateForm = (data) => {
  if (!data.hsnNumber || !data.name) {
    return { valid: false, message: 'HSN Number and Name are required' };
  }
  return { valid: true };
};

export default function HSNRecordsPage() {
  return (
    <MasterDataPage
      title="HSN Details"
      endpoint={{
        LIST: API_ENDPOINTS.HSN_LIST,
        ADD: API_ENDPOINTS.HSN_ADD,
        UPDATE: API_ENDPOINTS.HSN_UPDATE,
        DELETE: API_ENDPOINTS.HSN_DELETE,
      }}
      columns={columns}
      formFields={formFields}
      validateForm={validateForm}
      role="admin"
    />
  );
}

