"use client";
import dynamic from 'next/dynamic';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { t } from '@/lib/localization';

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
  if (!data.hsnNumber || !data.name) {
    return { valid: false, message: 'HSN Number and Name are required' };
  }
  
  // Validate GST rates (values come as strings from dropdown)
  if (!data.totalGst || !data.igst || !data.cgst || !data.sgst) {
    return { valid: false, message: 'All GST rates are required' };
  }
  
  const gstRate = parseFloat(data.totalGst);
  const igst = parseFloat(data.igst);
  const cgst = parseFloat(data.cgst);
  const sgst = parseFloat(data.sgst);
  
  if (isNaN(gstRate) || gstRate < 0 || gstRate > 100) {
    return { valid: false, message: 'GST Tax Rate must be between 0 and 100' };
  }
  
  if (isNaN(igst) || igst < 0 || igst > 100) {
    return { valid: false, message: 'IGST must be between 0 and 100' };
  }
  
  if (isNaN(cgst) || cgst < 0 || cgst > 100) {
    return { valid: false, message: 'CGST must be between 0 and 100' };
  }
  
  if (isNaN(sgst) || sgst < 0 || sgst > 100) {
    return { valid: false, message: 'SGST must be between 0 and 100' };
  }
  
  // Validate that CGST + SGST should equal IGST (or GST Tax Rate)
  if (Math.abs(cgst + sgst - igst) > 0.01) {
    return { valid: false, message: 'CGST + SGST should equal IGST' };
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

