"use client";
import dynamic from 'next/dynamic';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { t } from '@/lib/localization';
import { validateGSTIN, validateIFSC, validateMICR, validateAccountNumber, validateName } from '@/lib/gstUtils';

// Lazy load MasterDataPage for better performance
const MasterDataPage = dynamic(() => import('@/components/master-data/MasterDataPage'), {
  loading: () => <div className="premium-card p-8 animate-pulse"><div className="h-96 bg-gray-200 rounded"></div></div>,
  ssr: false
});

const columns = [
  { key: 'gstinNumber', label: t('label.gstin') },
  { key: 'accountNumber', label: 'Account Number' },
  { key: 'accountHolderName', label: 'Account Holder Name' },
  { key: 'bankName', label: 'Bank Name' },
  { key: 'branchName', label: 'Branch Name' },
  { key: 'accountType', label: 'Account Type' },
  { key: 'ifscCode', label: 'IFSC Code' },
  { key: 'micrCode', label: 'MICR Code' },
];

const formFields = [
  { key: 'gstinNumber', label: t('label.gstin'), required: true, maxLength: 15 },
  { key: 'accountNumber', label: 'Account Number', required: true },
  { key: 'accountHolderName', label: 'Account Holder Name', required: true },
  { key: 'bankName', label: 'Bank Name', required: true },
  { key: 'branchName', label: 'Branch Name', required: true },
  { key: 'accountType', label: 'Account Type', required: true, type: 'select', options: [
    { value: 'Savings', label: 'Savings' },
    { value: 'Current', label: 'Current' },
    { value: 'Fixed Deposit', label: 'Fixed Deposit' },
    { value: 'Recurring Deposit', label: 'Recurring Deposit' },
  ]},
  { key: 'ifscCode', label: 'IFSC Code', required: true, maxLength: 11 },
  { key: 'micrCode', label: 'MICR Code', required: true, maxLength: 9 },
];

const validateForm = (data) => {
  console.log("Bank validate form: ", data);
  // const gstValidation = validateGSTIN(data.gstinNumber);
  // if (!gstValidation.valid) {
  //   return { valid: false, message: gstValidation.message };
  // }
  const accountNumberValidation = validateAccountNumber(data.accountNumber);
  if (!accountNumberValidation.valid) {
    return { valid: false, message: accountNumberValidation.message };
  }
  
  const accountHolderNameValidation = validateName(data.accountHolderName, 'Account Holder Name');
  if (!accountHolderNameValidation.valid) {
    return { valid: false, message: accountHolderNameValidation.message };
  }
  
  const bankNameValidation = validateName(data.bankName, 'Bank Name');
  if (!bankNameValidation.valid) {
    return { valid: false, message: bankNameValidation.message };
  }
  
  const branchNameValidation = validateName(data.branchName, 'Branch Name');
  if (!branchNameValidation.valid) {
    return { valid: false, message: branchNameValidation.message };
  }
  const ifscValidation = validateIFSC(data.ifscCode);
  if (!ifscValidation.valid) {
    return { valid: false, message: ifscValidation.message };
  }
  
  const micrValidation = validateMICR(data.micrCode);
  if (!micrValidation.valid) {
    return { valid: false, message: micrValidation.message };
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

