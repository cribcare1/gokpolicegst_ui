"use client";
import dynamic from 'next/dynamic';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { t } from '@/lib/localization';
import { validateGSTIN, validateHSN, validateGSTRate, validateName } from '@/lib/gstUtils';

// Lazy load MasterDataPage for better performance
const MasterDataPage = dynamic(() => import('@/components/master-data/MasterDataPage'), {
  loading: () => <div className="premium-card p-8 animate-pulse"><div className="h-96 bg-gray-200 rounded"></div></div>,
  ssr: false
});

const columns = [
  { key: 'gstinNumber', label: t('label.gstin') },
  { key: 'hsnCode', label: t('label.hsnNumber') },
  { key: 'serviceName', label: t('label.name') },
  { key: 'totalGst', label: 'GST Tax Rate (%)' },
  { key: 'igst', label: 'IGST (%)' },
  { key: 'cgst', label: 'CGST (%)' },
  { key: 'sgst', label: 'SGST (%)' },
];

// Common GST rate options
const gstRateOptions = [
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
];

const formFields = [
  { key: 'gstinNumber', label: t('label.gstin'), required: true, maxLength: 15 },
  { key: 'hsnCode', label: t('label.hsnNumber'), required: true },
  { key: 'serviceName', label: t('label.name'), required: true },
  { key: 'totalGst', label: 'GST Tax Rate (%)',  required: true },
  { key: 'igst', label: 'IGST (%)',  required: true, readOnly: true },
  { key: 'cgst', label: 'CGST (%)',  required: true, readOnly: true },
  { key: 'sgst', label: 'SGST (%)',  required: true, readOnly: true },
];

const validateForm = (data) => {
  const gstValidation = validateGSTIN(data.gstinNumber);
  if (!gstValidation.valid) {
    return { valid: false, message: gstValidation.message };
  }
  
  const hsnValidation = validateHSN(data.hsnCode);
  if (!hsnValidation.valid) {
    return { valid: false, message: hsnValidation.message };
  }
  
  const serviceNameValidation = validateName(data.serviceName, 'Service Name');
  if (!serviceNameValidation.valid) {
    return { valid: false, message: serviceNameValidation.message };
  }
  
  // Validate GST rates
  const totalGstValidation = validateGSTRate(data.totalGst);
  if (!totalGstValidation.valid) {
    return { valid: false, message: totalGstValidation.message };
  }
  
  const igstValidation = validateGSTRate(data.igst);
  if (!igstValidation.valid) {
    return { valid: false, message: igstValidation.message };
  }
  
  const cgstValidation = validateGSTRate(data.cgst);
  if (!cgstValidation.valid) {
    return { valid: false, message: cgstValidation.message };
  }
  
  const sgstValidation = validateGSTRate(data.sgst);
  if (!sgstValidation.valid) {
    return { valid: false, message: sgstValidation.message };
  }
  
  // Validate that CGST + SGST should equal IGST (or GST Tax Rate)
  const cgst = cgstValidation.cleaned;
  const sgst = sgstValidation.cleaned;
  const igst = igstValidation.cleaned;
  if (Math.abs(cgst + sgst - igst) > 0.01) {
    return { valid: false, message: 'CGST + SGST should equal IGST' };
  }
  
  return { valid: true };
};

export default function HSNRecordsPage() {
  return (
    <MasterDataPage
      title="HSN Master"
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

