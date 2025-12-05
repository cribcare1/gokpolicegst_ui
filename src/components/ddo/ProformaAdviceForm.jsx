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

  // Print-specific styles and content
  const PrintStyles = () => (
    <style jsx global>{`
      @media print {
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
        }
        .no-print {
          display: none !important;
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
            <Button variant="primary" onClick={() => window.print()} className="p-2 bg-[#2C5F2D] hover:bg-[#1e4d1f]">
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
              minHeight: '297mm'
            }}
          >
            {/* Print Header */}
            <div className="print-header mb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <div className="relative w-12 h-12 mt-1">
                    <Image
                      src="/1.png"
                      alt="Organization Logo"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-sm font-bold text-gray-800 leading-tight">
                      {gstDetails?.gstName || 'Government of Karnataka Police Department'}
                    </h1>
                    <p className="text-xs text-gray-600 leading-tight">{gstDetails?.address || 'Police Headquarters, Bangalore'}</p>
                    <p className="text-xs text-gray-600">GSTIN: {gstDetails?.gstNumber || '29AAAAA0000A1Z5'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-[#2C5F2D]">PROFORMA ADVISE</h2>
                  <p className="text-sm font-semibold">Proforma No: {invoiceNumber}</p>
                  <p className="text-sm">Date: {formatDate(billDetails.date)}</p>
                </div>
              </div>
            </div>

            {/* Customer and Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 print-section">
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold mb-1 text-gray-800 border-b pb-1 text-xs">Service Receiver Details</h3>
                <div className="space-y-1 text-xs">
                  <p><strong>Name:</strong> M/s {selectedCustomer?.customerName || ''}</p>
                  <p><strong>GSTIN:</strong> {selectedCustomer?.gstNumber || 'Not provided'}</p>
                  <p><strong>Address:</strong> {selectedCustomer?.address || ''}</p>
                  <p><strong>State Code:</strong> {selectedCustomer?.stateCode || ''}</p>
                  <p><strong>Type:</strong> {invoiceType}</p>
                </div>
              </div>

              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold mb-1 text-gray-800 border-b pb-1 text-xs">Advice Details</h3>
                <div className="space-y-1 text-xs">
                  <p><strong>DDO Code:</strong> {ddoDetails.ddoCode}</p>
                  <p><strong>DDO Name:</strong> {ddoDetails.fullName}</p>
                  <p><strong>Place of Supply:</strong> {billDetails.placeOfSupply || 'Bengaluru'}</p>
                  <p><strong>City/District:</strong> {ddoDetails.city}</p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-3 print-section">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-[#2C5F2D] text-white">
                    <th className="border border-gray-400 p-1 text-left font-bold text-xs">S.No</th>
                    <th className="border border-gray-400 p-1 text-left font-bold text-xs">Description</th>
                    <th className="border border-gray-400 p-1 text-left font-bold text-xs">HSN Code</th>
                    <th className="border border-gray-400 p-1 text-left font-bold text-xs">Qty</th>
                    <th className="border border-gray-400 p-1 text-left font-bold text-xs">Unit</th>
                    <th className="border border-gray-400 p-1 text-left font-bold text-xs">Amount (₹)</th>
                    <th className="border border-gray-400 p-1 text-left font-bold text-xs">Taxable Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-400 p-1 text-xs text-center">{item.serialNo}</td>
                      <td className="border border-gray-400 p-1 text-xs">{item.description}</td>
                      <td className="border border-gray-400 p-1 text-xs text-center">{item.hsnNumber}</td>
                      <td className="border border-gray-400 p-1 text-xs text-center">1</td>
                      <td className="border border-gray-400 p-1 text-xs text-center">Nos</td>
                      <td className="border border-gray-400 p-1 text-xs text-right">{formatCurrency(item.amount)}</td>
                      <td className="border border-gray-400 p-1 text-xs text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan="3" className="border border-gray-400 p-1 text-xs text-right">Total</td>
                    <td className="border border-gray-400 p-1 text-xs text-center">{totalQuantity}</td>
                    <td className="border border-gray-400 p-1 text-xs text-center">Nos</td>
                    <td className="border border-gray-400 p-1 text-xs text-right">Total Amount</td>
                    <td className="border border-gray-400 p-1 text-xs text-right">{formatCurrency(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculation and Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 print-section">
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold mb-1 text-gray-800 border-b pb-1 text-xs">Additional Information</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-semibold">Invoice Remarks:</p>
                    <p className="mt-1 p-1 bg-gray-50 rounded border">{note || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Notification Details:</p>
                    <p className="mt-1 p-1 bg-gray-50 rounded border min-h-[40px]">{notificationDetails || '-'}</p>
                  </div>
                  
                  {/* RCM specific fields in preview */}
                  {invoiceType === 'RCM' && (
                    <div>
                      <p className="font-semibold">RCM Tax Details:</p>
                      <div className="mt-1 p-2 bg-gray-50 rounded border text-xs">
                        <span className="font-medium">GST Payable Under RCM by the Recipient</span>
                        <div className="mt-1 font-semibold">
                          IGST : {formatCurrency(rcmIgst)}          CGST : {formatCurrency(rcmCgst)}/-          SGST: {formatCurrency(rcmSgst)}/-
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">Amount in Words:</p>
                    <p className="mt-1 p-1 bg-gray-50 rounded border italic">{amountInWords(totalAdviceAmountReceivable)}</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold mb-1 text-gray-800 border-b pb-1 text-xs">Calculation Summary</h3>
                <div className="space-y-1 text-xs">
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

                  <div className="flex justify-between py-2 bg-[#2C5F2D] text-white rounded px-3 mt-3 font-bold text-xs">
                    <span>Total amount payable:</span>
                    <span>{formatCurrency(totalAdviceAmountReceivable)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border border-gray-300 p-3 rounded mb-3 print-section">
              <h3 className="font-bold mb-1 text-gray-800 border-b pb-1 text-xs">Bank Details</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>Bank:</strong> {bankDetails?.bankName || 'State Bank of India'}</div>
                <div><strong>Branch:</strong> {bankDetails?.bankBranch || 'Bangalore Main'}</div>
                <div><strong>IFSC:</strong> {bankDetails?.ifscCode || 'SBIN0001234'}</div>
                <div><strong>Account No:</strong> {bankDetails?.accountNumber || '1234567890'}</div>
              </div>
            </div>

            {/* Signature Section - EXACTLY SAME */}
            <div className="signature-section print-section mt-4">
              <div className="flex justify-end">
                <div className="text-center">
                  {ddoSignature ? (
                    <div className="mb-2 p-2 border border-gray-300 bg-white">
                      <img 
                        src={ddoSignature} 
                        alt="DDO Signature" 
                        className="h-20 max-w-48 object-contain mx-auto"
                        style={{ imageRendering: 'crisp-edges' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="text-red-500 text-center py-4">
                              <svg class="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                              </svg>
                              Signature Image Not Available
                            </div>
                          `;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-20 border-2 border-dashed border-gray-400 mb-2 w-48 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Signature Available</span>
                    </div>
                  )}
                  <p className="text-xs font-semibold mt-1">Signature of DDO</p>
                  <p className="text-xs">{ddoDetails?.fullName || 'Karnataka Police Department'}</p>
                </div>
              </div>

              <div className="text-center mt-4 pt-2 border-t border-gray-300">
                <p className="text-xs text-gray-600 italic">This is a computer generated document</p>
              </div>
            </div>
          </div>


        </div>
      </Modal>
    </>
  );
}