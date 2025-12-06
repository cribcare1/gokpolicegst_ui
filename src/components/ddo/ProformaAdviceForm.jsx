import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { calculateGST, formatCurrency, validateGSTIN, validateEmail, validateMobile, validatePIN, validateBillNumber, validateAmount, validateDescription, validateName, validateAddress, validateCity, validateStateCode, isGovernmentGSTIN, isGovernmentPAN } from '@/lib/gstUtils';
import { getAllStates, getStateCodeFromGSTIN } from '@/lib/stateCodes';
import { Plus, Trash2, X, Download, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { IndeterminateProgressBar, LoadingProgressBar } from '@/components/shared/ProgressBar';
import { LOGIN_CONSTANT } from '@/components/utils/constant';

export default function ProformaAdviceForm({
  loading,
  isNavigatingToCustomer,
  setIsNavigatingToCustomer,
  customers,
  setCustomers,
  hsnList,
  setHsnList,
  showCustomerModal,
  setShowCustomerModal,
  showPreviewModal,
  setShowPreviewModal,
  invoiceNumber,
  billDetails,
  setBillDetails,
  selectedCustomer,
  setSelectedCustomer,
  gstDetails,
  customerType,
  setCustomerType,
  invoiceType,
  setInvoiceType,
  taxPayableReverseCharge,
  setTaxPayableReverseCharge,
  exemptionNo,
  setExemptionNo,
  newCustomer,
  setNewCustomer,
  lineItems,
  setLineItems,
  gstCalculation,
  setGstCalculation,
  paidAmount,
  setPaidAmount,
  note,
  setNote,
  notificationDetails,
  setNotificationDetails,
  ddoDetails,
  bankDetails,
  saving,
  setSaving,
  currentLang,
  gstinList,
  ddoSignature,
  isInvoiceCreation,
  onNavigateToAddCustomer,
  onAddCustomer,
  onAddLineItem,
  onRemoveLineItem,
  onLineItemChange,
  onSaveBill,
  onPrintBill,
  formatDate,
  numberToWords,
  amountInWords,
  totalQuantity,
  totalAmount,
  totalAdviceAmountReceivable,
  renderDDOSignatureSection,
  onBackToList,
  // RCM specific fields
  rcmIgst,
  setRcmIgst,
  rcmCgst,
  setRcmCgst,
  rcmSgst,
  setRcmSgst
}) {
  const router = useRouter();

  // Form validation state
  const [formValidation, setFormValidation] = useState({
    hasCustomer: false,
    hasLineItems: false,
    hasValidAmounts: false,
    hasSignature: false,
    isValid: false
  });

  const [showGstDebug, setShowGstDebug] = useState(false);
  const [lineItemErrors, setLineItemErrors] = useState({});
  const [localTaxInvoice, setLocalTaxInvoice] = useState('');
  const [printOptimizedView, setPrintOptimizedView] = useState(false);

  // Validate form whenever required fields change
  useEffect(() => {
    validateForm();
  }, [selectedCustomer, lineItems, hsnList, ddoSignature]);

  // Keep localTaxInvoice in sync with paidAmount prop
  useEffect(() => {
    setLocalTaxInvoice(Number.isFinite(paidAmount) ? String(Math.floor(Number(paidAmount) || 0)) : '');
  }, [paidAmount]);

  const validateForm = () => {
    const hasCustomer = selectedCustomer && selectedCustomer.customerName && selectedCustomer.customerName.trim() !== '';
    const hasLineItems = lineItems && lineItems.length > 0;
    const hasValidAmounts = hasLineItems && lineItems.every(item => 
      item.description && item.description.trim() !== '' && 
      parseFloat(item.amount) > 0
    );
    // Signature validation - check if ddoSignature prop is available and not empty
    const hasSignature = ddoSignature && ddoSignature.trim() !== '';
    
    const isValid = hasCustomer && hasLineItems && hasValidAmounts && hasSignature;
    
    setFormValidation({
      hasCustomer,
      hasLineItems, 
      hasValidAmounts,
      hasSignature,
      isValid
    });
  };

  const handleSaveWithValidationAndNavigate = () => {
    const isValid = validateAndSetErrors(lineItems);
    if (isValid) {
      onSaveBill();
      setTimeout(() => {
        if (onBackToList) {
          onBackToList();
        }
      }, 2000);
    }
  };

  // Derive display GST rates from current calculation or HSN list (fallbacks)
  const latestCalc = gstCalculation || null;
  const firstHSN = lineItems?.[0]?.hsnNumber;
  const currentHsnDetails = firstHSN ? hsnList.find(h => h.hsnNumber === firstHSN || h.hsnCode === firstHSN || h.code === firstHSN) : null;
  const fallbackGst = currentHsnDetails?.igst ?? currentHsnDetails?.gstRate ?? 18;
  const fallbackCgst = currentHsnDetails?.cgst ?? (currentHsnDetails?.gstRate ? currentHsnDetails.gstRate / 2 : 9);
  const fallbackSgst = currentHsnDetails?.sgst ?? (currentHsnDetails?.gstRate ? currentHsnDetails.gstRate / 2 : 9);

  const displayGstRate = (latestCalc && (
    typeof latestCalc.gstRate === 'number' ? latestCalc.gstRate :
    typeof latestCalc.igst === 'number' ? latestCalc.igst :
    (typeof latestCalc.cgstRate === 'number' && typeof latestCalc.sgstRate === 'number' ? (latestCalc.cgstRate + latestCalc.sgstRate) : undefined)
  )) ?? fallbackGst;

  const computeRateFromAmounts = (amount, taxable) => {
    if (typeof amount !== 'number' || typeof taxable !== 'number' || taxable === 0) return null;
    return (amount / taxable) * 100;
  };

  const rawCgstRate = (typeof latestCalc?.cgstRate === 'number') ? latestCalc.cgstRate : computeRateFromAmounts(latestCalc?.cgst, latestCalc?.taxableValue);
  const rawSgstRate = (typeof latestCalc?.sgstRate === 'number') ? latestCalc.sgstRate : computeRateFromAmounts(latestCalc?.sgst, latestCalc?.taxableValue);

  const displayCgstRate = (rawCgstRate != null) ? rawCgstRate : fallbackCgst;
  const displaySgstRate = (rawSgstRate != null) ? rawSgstRate : fallbackSgst;

  const formatPercent = (val) => {
    if (val === null || val === undefined) return '';
    const num = Number(val);
    if (Number.isNaN(num)) return String(val);
    let s = num.toString();
    if (!/e/i.test(s) && s.includes('.')) {
      s = Number(num.toFixed(6)).toString();
    }
    s = s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/, '');
    return s;
  };

  const handleLineItemChangeWithValidation = (index, field, value) => {
    onLineItemChange(index, field, value);
    
    if ((value || field === 'amount') && lineItemErrors[index]) {
      const updatedErrors = { ...lineItemErrors };
      delete updatedErrors[index];
      setLineItemErrors(updatedErrors);
    }
  };

  const validateAndSetErrors = (items) => {
    const errors = {};
    items.forEach((item, idx) => {
      const descValidation = validateDescription(item.description);
      const amountValidation = validateAmount(item.amount, `Line item ${idx + 1} amount`);
      
      if (!descValidation.valid) {
        errors[`${idx}-desc`] = descValidation.message;
      }
      if (!amountValidation.valid) {
        errors[`${idx}-amount`] = amountValidation.message;
      }
    });
    setLineItemErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveWithValidation = () => {
    const isValid = validateAndSetErrors(lineItems);
    if (isValid) {
      onSaveBill();
    }
  };

  // Print Document Function
  const handlePrintDocument = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    const currentDate = formatDate(billDetails.date);
    const signatureUrl = ddoSignature || '';
    
    // Get logo source
    const logoImg = document.querySelector('#bill-preview-content img');
    const logoSrc = logoImg ? logoImg.src : '/1.png';
    
    // Build line items HTML
    const lineItemsHTML = lineItems.map((item, index) => `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${item.serialNo}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px;">${item.description || ''}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${item.hsnNumber || ''}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">1</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">Nos</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${formatCurrency(item.amount)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('');
    
    // GST Calculation HTML
    let gstCalcHTML = '';
    if (invoiceType === 'FCM' && gstCalculation) {
      gstCalcHTML = `
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #ddd; font-size: 10px;">
          <span>IGST @ ${formatPercent(displayGstRate)}%:</span>
          <span>${gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #ddd; font-size: 10px;">
          <span>CGST @ ${formatPercent(displayCgstRate)}%:</span>
          <span>${gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #ddd; font-size: 10px;">
          <span>SGST @ ${formatPercent(displaySgstRate)}%:</span>
          <span>${gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #ddd; font-size: 10px; font-weight: bold;">
          <span>Total GST:</span>
          <span>${formatCurrency(gstCalculation?.gstAmount || 0)}</span>
        </div>
      `;
    }
    
    // RCM Tax Details
    let rcmHTML = '';
    if (invoiceType === 'RCM') {
      rcmHTML = `
        <div style="margin-top: 8px;">
          <p style="font-weight: bold; font-size: 11px; margin-bottom: 4px;">RCM Tax Details:</p>
          <div style="padding: 8px; background-color: #f9f9f9; border: 1px solid #ddd; font-size: 11px;">
            <p style="font-weight: bold; margin-bottom: 4px;">GST Payable Under RCM by the Recipient</p>
            <p style="font-weight: bold;">IGST : ${formatCurrency(rcmIgst)} &nbsp;&nbsp; CGST : ${formatCurrency(rcmCgst)}/- &nbsp;&nbsp; SGST: ${formatCurrency(rcmSgst)}/-</p>
          </div>
        </div>
      `;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proforma Advice - ${invoiceNumber}</title>
          <style>
            @page {
              margin: 8mm;
              size: A4 portrait;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 10px;
              line-height: 1.3;
              color: black;
              background: white;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-container {
              width: 194mm;
              margin: 0 auto;
              padding: 3mm;
              box-sizing: border-box;
            }
            
            .print-header {
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            
            .print-section {
              margin-bottom: 8px;
              page-break-inside: avoid;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
              font-size: 10px;
            }
            
            th, td {
              border: 1px solid #000;
              padding: 4px;
              text-align: left;
            }
            
            th {
              background-color: #2C5F2D !important;
              color: white !important;
              font-weight: bold;
              text-align: center;
            }
            
            .total-row {
              background-color: #f5f5f5 !important;
              font-weight: bold;
            }
            
            .signature-section {
              margin-top: 15px;
              text-align: right;
            }
            
            .signature-box {
              display: inline-block;
              text-align: center;
            }
            
            .signature-image {
              max-height: 60px;
              max-width: 180px;
              object-fit: contain;
              margin-bottom: 5px;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              
              .print-container {
                width: 100%;
                min-height: 100%;
                padding: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <!-- Header Section -->
            <div class="print-header">
              <table style="border: none; margin-bottom: 5px;">
                <tr>
                  <td style="border: none; width: 20%; vertical-align: top;">
                    <div style="text-align: center;">
                      <img src="${logoSrc}" alt="Logo" style="max-width: 60px; max-height: 60px;" onerror="this.style.display='none'">
                    </div>
                  </td>
                  <td style="border: none; width: 60%; vertical-align: top; padding-left: 10px;">
                    <h1 style="margin: 0; font-size: 13px; font-weight: bold; color: #000;">
                      ${gstDetails?.gstName || 'Government of Karnataka Police Department'}
                    </h1>
                    <p style="margin: 1px 0; font-size: 10px;">${gstDetails?.address || 'Police Headquarters, Bangalore'}</p>
                    <p style="margin: 1px 0; font-size: 10px;">GSTIN: ${gstDetails?.gstNumber || '29AAAAA0000A1Z5'}</p>
                  </td>
                  <td style="border: none; width: 20%; vertical-align: top; text-align: right;">
                    <h2 style="margin: 0; font-size: 15px; font-weight: bold; color: #2C5F2D;">PROFORMA ADVISE</h2>
                    <p style="margin: 3px 0; font-size: 10px; font-weight: bold;">Proforma No: ${invoiceNumber}</p>
                    <p style="margin: 1px 0; font-size: 10px;">Date: ${currentDate}</p>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Customer and Advice Details -->
            <div class="print-section">
              <table style="border: none; margin-bottom: 10px;">
                <tr>
                  <td style="border: 1px solid #000; width: 50%; padding: 6px; vertical-align: top;">
                    <h3 style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px;">Service Receiver Details</h3>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>Name:</strong> M/s ${selectedCustomer?.customerName || ''}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>GSTIN:</strong> ${selectedCustomer?.gstNumber || 'Not provided'}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>Address:</strong> ${selectedCustomer?.address || ''}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>State Code:</strong> ${selectedCustomer?.stateCode || ''}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>Type:</strong> ${invoiceType}</p>
                  </td>
                  <td style="border: 1px solid #000; width: 50%; padding: 6px; vertical-align: top;">
                    <h3 style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px;">Advice Details</h3>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>DDO Code:</strong> ${ddoDetails?.ddoCode || ''}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>DDO Name:</strong> ${ddoDetails?.fullName || ''}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>Place of Supply:</strong> ${billDetails.placeOfSupply || 'Bengaluru'}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>City/District:</strong> ${ddoDetails?.city || ''}</p>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Line Items Table -->
            <div class="print-section">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Description</th>
                    <th>HSN Code</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th style="text-align: right;">Amount (₹)</th>
                    <th style="text-align: right;">Taxable Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsHTML}
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right; font-weight: bold;">Total</td>
                    <td style="text-align: center; font-weight: bold;">${totalQuantity}</td>
                    <td style="text-align: center; font-weight: bold;">Nos</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(totalAmount)}</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Additional Information and Calculation Summary -->
            <div class="print-section">
              <table style="border: none;">
                <tr>
                  <td style="border: 1px solid #000; width: 50%; padding: 6px; vertical-align: top;">
                    <h3 style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px;">Additional Information</h3>
                    <div style="margin-bottom: 6px;">
                      <p style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">Invoice Remarks:</p>
                      <p style="padding: 4px; background-color: #f9f9f9; border: 1px solid #ddd; font-size: 10px; margin: 0;">${note || '-'}</p>
                    </div>
                    <div style="margin-bottom: 6px;">
                      <p style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">Notification Details:</p>
                      <p style="padding: 4px; background-color: #f9f9f9; border: 1px solid #ddd; font-size: 10px; margin: 0; min-height: 30px;">${notificationDetails || '-'}</p>
                    </div>
                    ${rcmHTML}
                    <div style="margin-top: 6px;">
                      <p style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">Amount in Words:</p>
                      <p style="padding: 4px; background-color: #f9f9f9; border: 1px solid #ddd; font-size: 10px; margin: 0; font-style: italic;">${amountInWords(totalAdviceAmountReceivable)}</p>
                    </div>
                  </td>
                  <td style="border: 1px solid #000; width: 50%; padding: 6px; vertical-align: top;">
                    <h3 style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px;">Calculation Summary</h3>
                    <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #ddd; font-size: 10px;">
                      <span>Total Taxable Value:</span>
                      <span style="font-weight: bold;">${formatCurrency(totalAmount)}</span>
                    </div>
                    ${gstCalcHTML}
                    <div style="display: flex; justify-content: space-between; padding: 6px; background-color: #2C5F2D; color: white; border-radius: 3px; margin-top: 8px; font-weight: bold; font-size: 10px;">
                      <span>Total amount payable:</span>
                      <span>${formatCurrency(totalAdviceAmountReceivable)}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Bank Details and Signature on same page -->
            <div class="print-section" style="page-break-inside: avoid;">
              <table style="border: none; margin-bottom: 10px;">
                <tr>
                  <td style="border: 1px solid #000; padding: 6px; width: 60%;">
                    <h3 style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px;">Bank Details</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px;">
                      <div><strong>Bank:</strong> ${bankDetails?.bankName || 'State Bank of India'}</div>
                      <div><strong>Branch:</strong> ${bankDetails?.bankBranch || 'Bangalore Main'}</div>
                      <div><strong>IFSC:</strong> ${bankDetails?.ifscCode || 'SBIN0001234'}</div>
                      <div><strong>Account No:</strong> ${bankDetails?.accountNumber || '1234567890'}</div>
                    </div>
                  </td>
                  <td style="border: none; width: 40%; vertical-align: top; text-align: right; padding-left: 10px;">
                    <div class="signature-box" style="display: inline-block; text-align: center;">
                      ${signatureUrl 
                        ? `<img src="${signatureUrl}" 
                             alt="DDO Signature" 
                             class="signature-image"
                             style="max-height: 50px; max-width: 150px; object-fit: contain; margin-bottom: 4px;"
                             onerror="this.style.display='none'; this.parentElement.innerHTML+='<div style=\'height:35px; width:140px; border-bottom:1px solid #000; margin-bottom:4px;\'></div>'">`
                        : `<div style="height: 35px; width: 140px; border-bottom: 1px solid #000; margin-bottom: 4px;"></div>`
                      }
                      <div style="font-weight: bold; font-size: 10px;">Signature of DDO</div>
                      <div style="font-size: 10px;">${ddoDetails?.fullName || 'Karnataka Police Department'}</div>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <div style="text-align: center; margin-top: 8px; font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 4px;">
                This is a computer generated document
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Print-specific styles and content
  const PrintStyles = () => (
    <style jsx global>{`
      @media print {
        @page {
          margin: 10mm;
          size: A4 portrait;
        }
        
        body * {
          visibility: hidden;
        }
        .print-content,
        .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white;
          color: black;
          font-size: 11px;
        }
        .no-print {
          display: none !important;
        }
        .print-section {
          page-break-inside: avoid;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #000;
          padding: 4px 6px;
        }
        th {
          background-color: #2C5F2D !important;
          color: white !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
      
      /* Mobile Responsive Styles */
      @media (max-width: 768px) {
        .mobile-stack {
          flex-direction: column;
        }
        .mobile-full {
          width: 100%;
        }
        .mobile-p-2 {
          padding: 0.5rem;
        }
        .mobile-text-sm {
          font-size: 0.875rem;
        }
        .mobile-text-xs {
          font-size: 0.75rem;
        }
        .mobile-grid-1 {
          grid-template-columns: 1fr;
        }
        .mobile-space-y-2 > * + * {
          margin-top: 0.5rem;
        }
        .mobile-hidden {
          display: none;
        }
        .mobile-table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .mobile-table {
          min-width: 800px;
        }
        .mobile-btn-group {
          flex-direction: column;
          gap: 0.5rem;
        }
        .mobile-btn-group button {
          width: 100%;
        }
      }
      
      @media (max-width: 480px) {
        .mobile-xs-p-1 {
          padding: 0.25rem;
        }
        .mobile-xs-text-xs {
          font-size: 0.7rem;
        }
        .mobile-xs-table {
          min-width: 600px;
          font-size: 0.7rem;
        }
      }
    `}</style>
  );

  return (
    <>
      <PrintStyles />
      
      {loading ? (
        <div className="premium-card p-8 sm:p-16">
          <LoadingProgressBar message="Loading bill data..." variant="primary" />
        </div>
      ) : (
        <>
          {isNavigatingToCustomer && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="premium-card p-8 sm:p-16">
                <LoadingProgressBar message="Navigating to add customer..." variant="primary" />
              </div>
            </div>
          )}

          {/* Main Form Content */}
          <div className="space-y-6 mobile-p-2">

            {/* Bill To Section */}
            <div className="border border-[var(--color-border)] rounded-lg p-4 space-y-4 bg-[var(--color-background)]">
              <h3 className="text-lg font-semibold pb-2 border-b border-[var(--color-border)] text-[var(--color-text-primary)]">
                {t('bill.serviceReceiver')} 
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mobile-grid-1">
                {/* Left Column - Select Customer */}
                <div className="mobile-full">
                  <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
                    {t('bill.selectCustomer')}
                  </label>
                  <div className="flex items-center gap-2 mobile-stack mobile-space-y-2">
                    <select
                      value={selectedCustomer?.id ? String(selectedCustomer.id) : ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (!selectedId) {
                          setSelectedCustomer(null);
                          return;
                        }
                        const customer = customers.find(c => String(c.id) === String(selectedId));
                        if (customer) {
                          if (customer.gstNumber && customer.gstNumber.length >= 2) {
                            const stateCode = getStateCodeFromGSTIN(customer.gstNumber);
                            if (stateCode) {
                              customer.stateCode = stateCode.toString();
                            }
                          }
                          setSelectedCustomer(customer);
                        } else {
                          setSelectedCustomer(null);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-full mobile-text-sm"
                    >
                      <option value="">{t('bill.selectCustomerPlaceholder')}</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={String(customer.id)}>
                          {customer.customerName} - {customer.gstNumber || t('common.noGstin')}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onNavigateToAddCustomer}
                      disabled={isNavigatingToCustomer}
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-lg hover:shadow-xl transition-all duration-200 mobile-full"
                    >
                      <Plus className="mr-1 inline" size={14} />
                      {t('bill.addNewCustomer')}
                    </Button>
                  </div>
                </div>

                {/* Right Column - Customer Information */}
                <div className="mobile-full">
                  <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
                    Customer Information
                  </label>
                  <div className="bg-[var(--color-muted)]/20 p-3 rounded-lg border border-[var(--color-border)] space-y-2 mobile-text-sm">
                    <div className="text-sm">
                      <span className="font-medium text-[var(--color-text-primary)]">Name: </span>
                      <span className="text-[var(--color-text-secondary)]">{selectedCustomer ? `M/s ${selectedCustomer.customerName}` : 'Not selected'}</span>
                      {selectedCustomer?.gstNumber && (
                        <>
                          <span className="text-[var(--color-text-primary)] mx-1">|</span>
                          <span className="font-medium text-[var(--color-text-primary)]">GSTIN: </span>
                          <span className="text-[var(--color-text-secondary)]">{selectedCustomer.gstNumber}</span>
                        </>
                      )}
                    </div>

                    {selectedCustomer?.stateCode && (
                      <div className="text-sm">
                        <span className="font-medium text-[var(--color-text-primary)]">State: </span>
                        <span className="text-[var(--color-text-secondary)]">{selectedCustomer.stateCode}</span>
                        {invoiceType && (
                          <>
                            <span className="text-[var(--color-text-primary)] mx-1">|</span>
                            <span className="text-[var(--color-text-secondary)]">{invoiceType === 'EXEMPTED' ? 'Exempted' : invoiceType}</span>
                          </>
                        )}
                      </div>
                    )}

                    {selectedCustomer?.address && (
                      <div className="text-sm">
                        <span className="font-medium text-[var(--color-text-primary)]">Address: </span>
                        <span className="text-[var(--color-text-secondary)]">{selectedCustomer.address}</span>
                      </div>
                    )}

                    {/* {notificationDetails && (
                      <div className="text-sm">
                        <span className="font-medium text-[var(--color-text-primary)]">Notification: </span>
                        <span className="text-[var(--color-text-secondary)]">{notificationDetails}</span>
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Section */}
            <div className="border border-[var(--color-border)] rounded-lg p-4 space-y-4 bg-[var(--color-background)]">
              <div className="mobile-table-container">
                <table className="w-full border-collapse mobile-table mobile-xs-table">
                  <thead>
                    <tr className="bg-[var(--color-primary)] text-white">
                      <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm mobile-text-xs mobile-xs-p-1">S.No</th>
                      <th className="border border-[var(--color-primary)] p-2 text-left font-semibold text-sm mobile-text-xs mobile-xs-p-1">Description</th>
                      <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm mobile-text-xs mobile-xs-p-1">HSN Code</th>
                      <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm mobile-text-xs mobile-xs-p-1">Qty</th>
                      <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm mobile-text-xs mobile-xs-p-1">Unit</th>
                      <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm mobile-text-xs mobile-xs-p-1">Amount (₹)</th>
                      <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm mobile-text-xs mobile-xs-p-1">Taxable Value (₹)</th>
                      <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm mobile-text-xs mobile-xs-p-1 mobile-hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={index} className="hover:bg-[var(--color-muted)]/10">
                        <td className="border border-[var(--color-border)] p-2 text-sm text-center font-medium mobile-text-xs mobile-xs-p-1">
                          {item.serialNo}
                        </td>
                        <td className="border border-[var(--color-border)] p-2 text-sm mobile-text-xs mobile-xs-p-1">
                          <div>
                            <textarea
                              value={item.description}
                              onChange={(e) => handleLineItemChangeWithValidation(index, 'description', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-sm resize-none bg-[var(--color-background)] focus:outline-none focus:ring-1 mobile-text-xs ${
                                lineItemErrors[`${index}-desc`]
                                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                  : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
                              }`}
                              rows="2"
                              placeholder="Enter item description..."
                            />
                            {lineItemErrors[`${index}-desc`] && (
                              <p className="text-xs text-red-600 mt-1 font-medium mobile-text-xs">
                                {lineItemErrors[`${index}-desc`]}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="border border-[var(--color-border)] p-2 text-sm text-center mobile-text-xs mobile-xs-p-1">
                          {hsnList.length > 1 ? (
                            <select
                              value={item.hsnNumber || (hsnList[0]?.hsnCode || '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                onLineItemChange(index, 'hsnNumber', val);
                              }}
                              className="w-full px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm text-center text-[var(--color-primary)] font-semibold focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] mobile-text-xs"
                            >
                              {hsnList.map((hsn) => (
                                <option key={hsn.id || hsn.hsnCode} value={hsn.hsnCode || hsn.hsnNumber || hsn.code}>
                                  {hsn.hsnCode || hsn.hsnNumber || hsn.code}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={hsnList[0]?.hsnCode || ''}
                              readOnly
                              className="w-full px-2 py-1 bg-[var(--color-muted)]/30 border border-[var(--color-border)] rounded text-sm text-center text-[var(--color-primary)] font-semibold mobile-text-xs"
                            />
                          )}
                        </td>
                        <td className="border border-[var(--color-border)] p-2 text-sm text-center mobile-text-xs mobile-xs-p-1">
                          <div className="w-full px-2 py-1 bg-[var(--color-muted)]/30 border border-[var(--color-border)] rounded text-sm text-center font-semibold mobile-text-xs">
                            1
                          </div>
                        </td>
                        <td className="border border-[var(--color-border)] p-2 text-sm text-center font-medium mobile-text-xs mobile-xs-p-1">
                          Nos
                        </td>
                        <td className="border border-[var(--color-border)] p-2 text-sm text-center mobile-text-xs mobile-xs-p-1">
                          <div>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => handleLineItemChangeWithValidation(index, 'amount', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-sm bg-[var(--color-background)] focus:outline-none focus:ring-1 text-center mobile-text-xs ${
                                lineItemErrors[`${index}-amount`]
                                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                  : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
                              }`}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                            {lineItemErrors[`${index}-amount`] && (
                              <p className="text-xs text-red-600 mt-1 font-medium mobile-text-xs">
                                {lineItemErrors[`${index}-amount`]}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="border border-[var(--color-border)] p-2 text-sm text-center font-semibold text-[var(--color-primary)] mobile-text-xs mobile-xs-p-1">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="border border-[var(--color-border)] p-2 text-sm text-center mobile-text-xs mobile-xs-p-1 mobile-hidden">
                          {lineItems.length > 1 && (
                            <button
                              onClick={() => onRemoveLineItem(index)}
                              className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                              title="Remove line item"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--color-primary)]/10 font-semibold">
                      <td colSpan="3" className="border border-[var(--color-border)] p-2 text-sm text-right mobile-text-xs mobile-xs-p-1">
                        {t('bill.totalQty')}
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm text-center mobile-text-xs mobile-xs-p-1">
                        {totalQuantity}
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm text-center mobile-text-xs mobile-xs-p-1">
                        Nos
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm text-right mobile-text-xs mobile-xs-p-1">
                        {t('bill.totalAmt')}
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm text-right font-bold text-[var(--color-primary)] mobile-text-xs mobile-xs-p-1">
                        {formatCurrency(totalAmount)}
                      </td>
                      <td className="border border-[var(--color-border)] p-2 mobile-hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={onAddLineItem}
                  variant="outline"
                  className="px-4 py-2 text-sm border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white mobile-full mobile-text-sm"
                >
                  <Plus className="mr-1 inline" size={14} />
                  {t('bill.addLineItem')}
                </Button>
              </div>
            </div>

            {/* GST Calculation and Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mobile-grid-1 mobile-space-y-4">
              {/* Left Column - Additional Information */}
              <div className="space-y-4 mobile-full">
                <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-background)]">
                  <h4 className="font-semibold mb-3 text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">Additional Information</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)] mobile-text-sm">
                        Invoice Remarks
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded text-sm resize-none bg-[var(--color-background)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-text-sm"
                        rows="3"
                        placeholder="Enter any remarks or notes..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)] mobile-text-sm">
                        Notification Details
                      </label>
                      <div className="w-full px-3 py-2 bg-[var(--color-muted)]/20 border border-[var(--color-border)] rounded text-sm min-h-[60px] mobile-text-sm">
                        {notificationDetails || 'No notification details'}
                      </div>
                    </div>

                    {/* RCM specific fields - only show when invoiceType is RCM */}
                    {invoiceType === 'RCM' && (
                      <div className="space-y-3">
                        <div className="border-t border-[var(--color-border)] pt-3">
                          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                            RCM Tax Details
                          </h4>
                          <div className="w-full">
                            <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)] mobile-text-sm">
                              GST Payable Under RCM by the Recipient
                            </label>
                            <div className="w-full px-3 py-2 bg-[var(--color-muted)]/20 border border-[var(--color-border)] rounded text-sm font-medium bg-[var(--color-background)] text-[var(--color-text-primary)] mobile-text-sm">
                              IGST : {formatCurrency(rcmIgst)}          CGST : {formatCurrency(rcmCgst)}/-          SGST: {formatCurrency(rcmSgst)}/-
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-1 mobile-text-xs">
                              * These values are automatically calculated based on the GST calculation
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)] mobile-text-sm">
                        Total Invoice Value in Words
                      </label>
                      <div className="w-full px-3 py-2 bg-[var(--color-muted)]/20 border border-[var(--color-border)] rounded text-sm italic font-semibold mobile-text-sm">
                        {amountInWords(totalAdviceAmountReceivable)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Calculation Summary */}
              <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-background)] mobile-full">
                <h4 className="font-semibold mb-3 text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">Calculation Summary</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                    <span className="text-sm font-medium mobile-text-sm">Total Taxable Value</span>
                    <span className="text-sm font-semibold mobile-text-sm">{formatCurrency(totalAmount)}</span>
                  </div>

                  {invoiceType === 'FCM' && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                        <span className="text-sm font-medium mobile-text-sm">IGST @ {formatPercent(displayGstRate)}%</span>
                        <span className="text-sm font-semibold mobile-text-sm">{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                        <span className="text-sm font-medium mobile-text-sm">CGST @ {formatPercent(displayCgstRate)}%</span>
                        <span className="text-sm font-semibold mobile-text-sm">{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                        <span className="text-sm font-medium mobile-text-sm">SGST @ {formatPercent(displaySgstRate)}%</span>
                        <span className="text-sm font-semibold mobile-text-sm">{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                        <span className="text-sm font-semibold mobile-text-sm">Total GST Amount</span>
                        <span className="text-sm font-semibold text-[var(--color-primary)] mobile-text-sm">
                          {formatCurrency(gstCalculation?.gstAmount || 0)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center py-3 bg-[var(--color-primary)] text-white rounded-lg px-4 mt-4 font-semibold mobile-text-sm">
                    <span className="text-base mobile-text-sm">Total amount payable</span>
                    <span className="text-base mobile-text-sm">
                      {formatCurrency(totalAdviceAmountReceivable)}
                    </span>
                  </div>

                  {renderDDOSignatureSection && renderDDOSignatureSection()}
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-background)]">
              <h4 className="font-semibold mb-3 text-[var(--color-text-primary)]">Bank Details</h4>
              <div className="bg-[var(--color-muted)]/20 p-3 rounded-lg border border-[var(--color-border)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mobile-grid-1 mobile-space-y-2">
                  <div className="mobile-full">
                    <span className="font-medium text-[var(--color-text-primary)] mobile-text-sm">Bank Name:</span>
                    <p className="font-semibold mobile-text-sm">{bankDetails?.bankName || '-'}</p>
                  </div>
                  <div className="mobile-full">
                    <span className="font-medium text-[var(--color-text-primary)] mobile-text-sm">Branch:</span>
                    <p className="font-semibold mobile-text-sm">{bankDetails?.bankBranch || '-'}</p>
                  </div>
                  <div className="mobile-full">
                    <span className="font-medium text-[var(--color-text-primary)] mobile-text-sm">IFSC Code:</span>
                    <p className="font-semibold mobile-text-sm">{bankDetails?.ifscCode || '-'}</p>
                  </div>
                  <div className="mobile-full">
                    <span className="font-medium text-[var(--color-text-primary)] mobile-text-sm">Account No:</span>
                    <p className="font-semibold mobile-text-sm">{bankDetails?.accountNumber || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t border-[var(--color-border)] mobile-stack mobile-space-y-4">
              <div className="flex flex-col gap-2 mobile-full">
                <p className="text-xs text-[var(--color-text-secondary)] mobile-text-xs">
                  💡 <strong>Print Tip:</strong> Use Preview to see how your bill will look when printed
                </p>
              </div>
              
              <div className="flex gap-3 mobile-btn-group mobile-full">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewModal(true)}
                  disabled={!formValidation.isValid}
                  className={`min-w-[140px] px-4 py-2 text-sm border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-muted)] mobile-full mobile-text-sm ${
                    !formValidation.isValid ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FileText className="mr-2 inline" size={14} />
                  Preview
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveWithValidationAndNavigate}
                  disabled={saving || !formValidation.isValid}
                  className={`min-w-[140px] px-4 py-2 text-sm bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 mobile-full mobile-text-sm ${
                    (saving || !formValidation.isValid) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></div>
                      Saving...
                    </>
                  ) : (
                    isInvoiceCreation ? 'Create   ' : 'Save Bill'
                  )}
                </Button>
              </div>
            </div>

            {/* Form Validation Status */}
            {!formValidation.isValid && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm mobile-text-sm">
                <div className="text-amber-800 font-medium">Please complete the following:</div>
                <ul className="mt-1 text-amber-700 space-y-1 mobile-text-sm">
                  {!formValidation.hasCustomer && <li>• Select or add a customer</li>}
                  {!formValidation.hasLineItems && <li>• Add at least one line item</li>}
                  {!formValidation.hasValidAmounts && <li>• Fill description and amount for all line items</li>}
                  {!formValidation.hasSignature && <li>• Add your digital signature to authenticate the document</li>}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Add New Customer"
        size="lg"
      >
        <form onSubmit={onAddCustomer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-grid-1">
            <div className="mobile-full">
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-text-sm"
                required
              />
            </div>
            <div className="mobile-full">
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                GSTIN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCustomer.gstNumber}
                onChange={(e) => {
                  const upperValue = e.target.value.toUpperCase().slice(0, 15);
                  let updatedCustomer = { ...newCustomer, gstNumber: upperValue };

                  if (upperValue.length >= 2) {
                    const stateCode = getStateCodeFromGSTIN(upperValue);
                    if (stateCode) {
                      updatedCustomer.stateCode = stateCode.toString();
                    } else {
                      updatedCustomer.stateCode = '';
                    }
                  } else {
                    updatedCustomer.stateCode = '';
                  }

                  setNewCustomer(updatedCustomer);
                }}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-text-sm"
                maxLength={15}
                required
              />
            </div>
            <div className="mobile-full">
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCustomer.city}
                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-text-sm"
                required
              />
            </div>
            <div className="mobile-full">
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                State Code <span className="text-red-500">*</span>
              </label>
              <select
                value={newCustomer.stateCode}
                onChange={(e) => setNewCustomer({ ...newCustomer, stateCode: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-text-sm"
                required
              >
                <option value="">Select State Code</option>
                {getAllStates().map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.code} - {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mobile-full">
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                PIN Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCustomer.pin}
                onChange={(e) => setNewCustomer({ ...newCustomer, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-text-sm"
                maxLength={6}
                required
              />
            </div>
            <div className="mobile-full">
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                Customer Type <span className="text-red-500">*</span>
              </label>
              <select
                value={newCustomer.customerType}
                onChange={(e) => setNewCustomer({ ...newCustomer, customerType: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-text-sm"
                required
              >
                <option value="">Select Type</option>
                <option value="Govt">Government</option>
                <option value="Non Govt">Non-Government</option>
              </select>
            </div>
          </div>
          
          <div className="mobile-full">
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-text-sm"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-grid-1">
            <div className="mobile-full">
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={newCustomer.mobile}
                onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-text-sm"
                maxLength={10}
                required
              />
            </div>
            <div className="mobile-full">
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mobile-text-sm"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 mobile-btn-group">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCustomerModal(false);
                setNewCustomer({
                  name: '',
                  gstNumber: '',
                  address: '',
                  city: '',
                  stateCode: '',
                  pin: '',
                  customerType: '',
                  exemptionCertNumber: '',
                  mobile: '',
                  email: '',
                });
              }}
              className="mobile-full mobile-text-sm"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="mobile-full mobile-text-sm">
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bill Preview Modal - EXACTLY SAME AS ProformaAdviceList */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPrintOptimizedView(false);
        }}
        size="full"
      >
        {/* Custom Header - Title on left, Icons + Close on right */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-muted)] flex-shrink-0 sticky top-0 z-10">
          <h2 className="text-lg sm:text-2xl font-bold gradient-text truncate flex-1 pr-2">
            Bill Preview
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onPrintBill} className="p-2 hover:bg-blue-50 hover:text-blue-600">
              <Download size={18} />
            </Button>
            <Button variant="primary" onClick={handlePrintDocument} className="p-2 bg-[#2C5F2D] hover:bg-[#1e4d1f]">
              <Printer size={18} />
            </Button>
            <button
              onClick={() => {
                setShowPreviewModal(false);
                setPrintOptimizedView(false);
              }}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 hover:rotate-90 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col h-full">

          {/* Preview Content - Same as ProformaAdviceList */}
          <div 
            id="bill-preview-content" 
            className={`flex-1 overflow-auto bg-white text-black p-6 print-content ${
              printOptimizedView ? 'print-optimized' : ''
            }`}
            style={{ 
              maxWidth: '210mm', 
              margin: '0 auto',
              minHeight: '297mm',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Print Header */}
            <div className="print-header mb-4 pb-3 border-b-2 border-gray-400">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="relative w-14 h-14 mt-1">
                    <Image
                      src="/1.png"
                      alt="Organization Logo"
                      width={56}
                      height={56}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h1 className="font-bold text-gray-800 leading-tight" style={{ fontSize: '14px' }}>
                      {gstDetails?.gstName || 'Government of Karnataka Police Department'}
                    </h1>
                    <p className="text-gray-600 leading-tight" style={{ fontSize: '11px', marginTop: '2px' }}>{gstDetails?.address || 'Police Headquarters, Bangalore'}</p>
                    <p className="text-gray-600" style={{ fontSize: '11px', marginTop: '2px' }}>GSTIN: {gstDetails?.gstNumber || '29AAAAA0000A1Z5'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="font-bold text-[#2C5F2D]" style={{ fontSize: '16px' }}>PROFORMA ADVISE</h2>
                  <p className="font-semibold" style={{ fontSize: '11px', marginTop: '4px' }}>Proforma No: {invoiceNumber}</p>
                  <p style={{ fontSize: '11px', marginTop: '2px' }}>Date: {formatDate(billDetails.date)}</p>
                </div>
              </div>
            </div>

            {/* Customer and Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print-section">
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold mb-2 text-gray-800 border-b pb-1" style={{ fontSize: '12px' }}>Service Receiver Details</h3>
                <div className="space-y-1" style={{ fontSize: '11px' }}>
                  <p><strong>Name:</strong> M/s {selectedCustomer?.customerName || ''}</p>
                  <p><strong>GSTIN:</strong> {selectedCustomer?.gstNumber || 'Not provided'}</p>
                  <p><strong>Address:</strong> {selectedCustomer?.address || ''}</p>
                  <p><strong>State Code:</strong> {selectedCustomer?.stateCode || ''}</p>
                  <p><strong>Type:</strong> {invoiceType}</p>
                </div>
              </div>

              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold mb-2 text-gray-800 border-b pb-1" style={{ fontSize: '12px' }}>Advice Details</h3>
                <div className="space-y-1" style={{ fontSize: '11px' }}>
                  <p><strong>DDO Code:</strong> {ddoDetails.ddoCode}</p>
                  <p><strong>DDO Name:</strong> {ddoDetails.fullName}</p>
                  <p><strong>Place of Supply:</strong> {billDetails.placeOfSupply || 'Bengaluru'}</p>
                  <p><strong>City/District:</strong> {ddoDetails.city}</p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-3 print-section">
              <table className="w-full border-collapse border border-gray-400" style={{ fontSize: '11px' }}>
                <thead>
                  <tr className="bg-[#2C5F2D] text-white">
                    <th className="border border-gray-400 p-2 text-center font-bold" style={{ fontSize: '11px' }}>S.No</th>
                    <th className="border border-gray-400 p-2 text-left font-bold" style={{ fontSize: '11px' }}>Description</th>
                    <th className="border border-gray-400 p-2 text-center font-bold" style={{ fontSize: '11px' }}>HSN Code</th>
                    <th className="border border-gray-400 p-2 text-center font-bold" style={{ fontSize: '11px' }}>Qty</th>
                    <th className="border border-gray-400 p-2 text-center font-bold" style={{ fontSize: '11px' }}>Unit</th>
                    <th className="border border-gray-400 p-2 text-right font-bold" style={{ fontSize: '11px' }}>Amount (₹)</th>
                    <th className="border border-gray-400 p-2 text-right font-bold" style={{ fontSize: '11px' }}>Taxable Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>{item.serialNo}</td>
                      <td className="border border-gray-400 p-2" style={{ fontSize: '11px' }}>{item.description}</td>
                      <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>{item.hsnNumber}</td>
                      <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>1</td>
                      <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>Nos</td>
                      <td className="border border-gray-400 p-2 text-right" style={{ fontSize: '11px' }}>{formatCurrency(item.amount)}</td>
                      <td className="border border-gray-400 p-2 text-right" style={{ fontSize: '11px' }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan="3" className="border border-gray-400 p-2 text-right" style={{ fontSize: '11px' }}>Total</td>
                    <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>{totalQuantity}</td>
                    <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>Nos</td>
                    <td className="border border-gray-400 p-2 text-right" style={{ fontSize: '11px' }}>{formatCurrency(totalAmount)}</td>
                    <td className="border border-gray-400 p-2 text-right" style={{ fontSize: '11px' }}>{formatCurrency(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculation and Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print-section">
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold mb-2 text-gray-800 border-b pb-1" style={{ fontSize: '12px' }}>Additional Information</h3>
                <div className="space-y-2" style={{ fontSize: '11px' }}>
                  <div>
                    <p className="font-semibold">Invoice Remarks:</p>
                    <p className="mt-1 p-2 bg-gray-50 rounded border" style={{ fontSize: '11px' }}>{note || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Notification Details:</p>
                    <p className="mt-1 p-2 bg-gray-50 rounded border min-h-[40px]" style={{ fontSize: '11px' }}>{notificationDetails || '-'}</p>
                  </div>
                  
                  {/* RCM specific fields in preview */}
                  {invoiceType === 'RCM' && (
                    <div>
                      <p className="font-semibold">RCM Tax Details:</p>
                      <div className="mt-1 p-2 bg-gray-50 rounded border" style={{ fontSize: '11px' }}>
                        <span className="font-medium">GST Payable Under RCM by the Recipient</span>
                        <div className="mt-1 font-semibold">
                          IGST : {formatCurrency(rcmIgst)}          CGST : {formatCurrency(rcmCgst)}/-          SGST: {formatCurrency(rcmSgst)}/-
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">Amount in Words:</p>
                    <p className="mt-1 p-2 bg-gray-50 rounded border italic" style={{ fontSize: '11px' }}>{amountInWords(totalAdviceAmountReceivable)}</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold mb-2 text-gray-800 border-b pb-1" style={{ fontSize: '12px' }}>Calculation Summary</h3>
                <div className="space-y-1" style={{ fontSize: '11px' }}>
                  <div className="flex justify-between border-b py-1">
                    <span>Total Taxable Value:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  
                  {invoiceType === 'FCM' && (
                    <>
                      <div className="flex justify-between border-b py-1">
                        <span>IGST @ {formatPercent(displayGstRate)}%:</span>
                        <span>{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
                      </div>
                      <div className="flex justify-between border-b py-1">
                        <span>CGST @ {formatPercent(displayCgstRate)}%:</span>
                        <span>{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</span>
                      </div>
                      <div className="flex justify-between border-b py-1">
                        <span>SGST @ {formatPercent(displaySgstRate)}%:</span>
                        <span>{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</span>
                      </div>
                      <div className="flex justify-between border-b py-1 font-semibold">
                        <span>Total GST:</span>
                        <span>{formatCurrency(gstCalculation?.gstAmount || 0)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-2 bg-[#2C5F2D] text-white rounded px-3 mt-3 font-bold" style={{ fontSize: '11px' }}>
                    <span>Total amount payable:</span>
                    <span>{formatCurrency(totalAdviceAmountReceivable)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details - Should appear on separate page */}
            <div className="border border-gray-300 p-3 rounded mb-3 print-section" style={{ pageBreakBefore: 'always' }}>
              <h3 className="font-bold mb-2 text-gray-800 border-b pb-1" style={{ fontSize: '12px' }}>Bank Details</h3>
              <div className="grid grid-cols-2 gap-3" style={{ fontSize: '11px' }}>
                <div><strong>Bank:</strong> {bankDetails?.bankName || 'State Bank of India'}</div>
                <div><strong>Branch:</strong> {bankDetails?.bankBranch || 'Bangalore Main'}</div>
                <div><strong>IFSC:</strong> {bankDetails?.ifscCode || 'SBIN0001234'}</div>
                <div><strong>Account No:</strong> {bankDetails?.accountNumber || '1234567890'}</div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="signature-section print-section mt-6" style={{ pageBreakInside: 'avoid' }}>
              <div className="flex justify-end">
                <div className="text-center">
                  {ddoSignature ? (
                    <div className="mb-2 p-2 border border-gray-300 bg-white inline-block">
                      <img 
                        src={ddoSignature} 
                        alt="DDO Signature" 
                        className="h-20 max-w-48 object-contain mx-auto"
                        style={{ imageRendering: 'crisp-edges', maxHeight: '80px', maxWidth: '200px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="text-red-500 text-center py-4" style="font-size: 10px;">
                              Signature Image Not Available
                            </div>
                          `;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-20 border-2 border-dashed border-gray-400 mb-2 w-48 flex items-center justify-center inline-block">
                      <span className="text-gray-500" style={{ fontSize: '10px' }}>No Signature Available</span>
                    </div>
                  )}
                  <p className="font-semibold mt-1" style={{ fontSize: '11px' }}>Signature of DDO</p>
                  <p style={{ fontSize: '11px' }}>{ddoDetails?.fullName || 'Karnataka Police Department'}</p>
                </div>
              </div>

              <div className="text-center mt-6 pt-2 border-t border-gray-300">
                <p className="text-gray-600 italic" style={{ fontSize: '10px' }}>This is a computer generated document</p>
              </div>
            </div>
          </div>


        </div>
      </Modal>
    </>
  );
}