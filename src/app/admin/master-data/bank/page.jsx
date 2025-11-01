"use client";
import MasterDataPage from '@/components/master-data/MasterDataPage';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { t } from '@/lib/localization';
import { validateGSTIN, validateIFSC } from '@/lib/gstUtils';

const columns = [
  { key: 'gstinNumber', label: t('label.gstin') },
  { key: 'accountNumber', label: 'Account Number' },
  { key: 'accountHolderName', label: 'Account Holder Name' },
  { key: 'bankName', label: 'Bank Name' },
  { key: 'branchName', label: 'Branch Name' },
  { key: 'ifscCode', label: 'IFSC Code' },
];

const formFields = [
  { key: 'gstinNumber', label: t('label.gstin'), required: true, maxLength: 15 },
  { key: 'accountNumber', label: 'Account Number', required: true },
  { key: 'accountHolderName', label: 'Account Holder Name', required: true },
  { key: 'bankName', label: 'Bank Name', required: true },
  { key: 'branchName', label: 'Branch Name', required: true },
  { key: 'accountType', label: 'Account Type', required: true },
  { key: 'ifscCode', label: 'IFSC Code', required: true, maxLength: 11 },
];

const validateForm = (data) => {
  const gstValidation = validateGSTIN(data.gstinNumber);
  if (!gstValidation.valid) {
    return { valid: false, message: gstValidation.message };
  }
  
  const ifscValidation = validateIFSC(data.ifscCode);
  if (!ifscValidation.valid) {
    return { valid: false, message: ifscValidation.message };
  }
  
  return { valid: true };
};

export default function BankDetailsPage() {
  return (
    <MasterDataPage
      title="Bank Details"
      endpoint={{
        LIST: API_ENDPOINTS.BANK_LIST,
        ADD: API_ENDPOINTS.BANK_ADD,
        UPDATE: API_ENDPOINTS.BANK_UPDATE,
        DELETE: API_ENDPOINTS.BANK_DELETE,
      }}
      columns={columns}
      formFields={formFields}
      validateForm={validateForm}
      role="admin"
    />
  );
}

