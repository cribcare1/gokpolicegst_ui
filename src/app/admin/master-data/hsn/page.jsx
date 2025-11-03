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
  { key: 'hsnNumber', label: t('label.hsnNumber') },
  { key: 'name', label: t('label.name') },
  { key: 'gstTaxRate', label: 'GST Tax Rate (%)' },
  { key: 'igst', label: 'IGST (%)' },
  { key: 'cgst', label: 'CGST (%)' },
  { key: 'sgst', label: 'SGST (%)' },
];

const formFields = [
  { key: 'hsnNumber', label: t('label.hsnNumber'), required: true },
  { key: 'name', label: t('label.name'), required: true },
  { key: 'gstTaxRate', label: 'GST Tax Rate (%)', type: 'number', required: true, placeholder: '18' },
  { key: 'igst', label: 'IGST (%)', type: 'number', required: true, placeholder: '18' },
  { key: 'cgst', label: 'CGST (%)', type: 'number', required: true, placeholder: '9' },
  { key: 'sgst', label: 'SGST (%)', type: 'number', required: true, placeholder: '9' },
];

const validateForm = (data) => {
  if (!data.hsnNumber || !data.name) {
    return { valid: false, message: 'HSN Number and Name are required' };
  }
  
  // Validate GST rates
  const gstRate = parseFloat(data.gstTaxRate);
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

