import { useState } from 'react';
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
  onBackToList
}) {
  const router = useRouter();

  // derive display GST rates from current calculation or HSN list (fallbacks)
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
    // Convert to string without forcing integer rounding; trim unnecessary trailing zeros
    let s = num.toString();
    // If exponential or too long, limit to 6 decimal places then trim
    if (!/e/i.test(s) && s.includes('.')) {
      // keep up to 6 decimals for readability, but avoid unnecessary rounding if already short
      s = Number(num.toFixed(6)).toString();
    }
    // trim trailing zeros and trailing dot
    s = s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/, '');
    return s;
  };

  const [showGstDebug, setShowGstDebug] = useState(false);
  const [lineItemErrors, setLineItemErrors] = useState({});
  const [localTaxInvoice, setLocalTaxInvoice] = useState('');

  // keep localTaxInvoice in sync with paidAmount prop
  useState(() => {
    setLocalTaxInvoice(Number.isFinite(paidAmount) ? String(Math.floor(Number(paidAmount) || 0)) : '');
  });

  const handleLineItemChangeWithValidation = (index, field, value) => {
    onLineItemChange(index, field, value);
    
    // Clear error for this field when user starts typing/entering value
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

  return (
    <>
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

          {/* Header Section with Logo - Centered - Hidden in UI, visible only in preview/print */}
          <div className="hidden border-b-2 border-[var(--color-primary)]/30 pb-8 mb-8">
            <div className="flex flex-col items-center gap-6">
              {/* Logo Section - Centered */}
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 drop-shadow-2xl">
                  <Image
                    src="/1.png"
                    alt="Bengaluru City Police Logo"
                    fill
                    className="object-contain"
                    priority
                    quality={90}
                    sizes="(max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                  />
                </div>
              </div>

              {/* Header Text Section - Centered */}
              <div className="text-center max-w-4xl">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)] mb-4 leading-relaxed">
                  {gstDetails?.gstName||''}
                </h1>
                <div className="space-y-2 text-[var(--color-text-secondary)]">
                  <p className="text-sm sm:text-base md:text-lg leading-relaxed">
                    {gstDetails?.address||''}
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    {gstDetails?.city||''} - {gstDetails?.pinCode||''}
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    Contact No : {gstDetails?.mobile||''} , {gstDetails?.email||''}
                  </p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-[var(--color-primary)] mt-4 px-4 py-2 bg-[var(--color-primary)]/10 rounded-lg inline-block">
                    GSTIN : {gstDetails?.gstNumber||''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TAX INVOICE Header - Hidden in UI, visible only in preview/print */}
          <div className="hidden text-center my-8">
            <div className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary)]/90 to-[var(--color-accent)] rounded-2xl px-8 py-5 inline-block shadow-lg border-2 border-[var(--color-primary)]/50">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-md">
                {t('bill.taxInvoice')}
              </h2>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="border border-[var(--color-border)] rounded p-4 space-y-4">
            <h3 className="text-lg font-semibold pb-2 border-b border-[var(--color-border)] text-[var(--color-text-primary)]">
              {t('bill.serviceReceiver')} (BILL TO)
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column - Select Customer */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
                  {t('bill.selectCustomer')}
                </label>
                <div className="flex items-center gap-2">
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
                    className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded bg-[var(--color-background)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  >
                    <option value="">{t('bill.selectCustomerPlaceholder')}</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={String(customer.id)}>
                        {customer.customerName} - {customer.gstNumber || t('common.noGstin')}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onNavigateToAddCustomer}
                    disabled={isNavigatingToCustomer}
                    className="px-3 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Plus className="mr-1" size={14} />
                    {t('bill.addNewCustomer')}
                  </Button>
                </div>
              </div>

              {/* Right Column - Customer Information */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
                  Customer Information
                </label>
                <div className="bg-[var(--color-muted)]/20 p-3 rounded border border-[var(--color-border)] space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-[var(--color-text-primary)]">Name: </span>
                    <span className="text-[var(--color-text-secondary)]">{selectedCustomer ? `M/s ${selectedCustomer.customerName}` : 'Not selected'}</span>
                    {selectedCustomer?.gstNumber && (
                      <>
                        <span className="text-[var(--color-text-primary)] mx-2">|</span>
                        <span className="font-medium text-[var(--color-text-primary)]">GSTIN: </span>
                        <span className="text-[var(--color-text-secondary)]">{selectedCustomer.gstNumber}</span>
                      </>
                    )}
                    {selectedCustomer?.stateCode && (
                      <>
                        <span className="text-[var(--color-text-primary)] mx-2">|</span>
                        <span className="font-medium text-[var(--color-text-primary)]">State: </span>
                        <span className="text-[var(--color-text-secondary)]">{selectedCustomer.stateCode}</span>
                      </>
                    )}
                    {invoiceType && (
                      <>
                        <span className="text-[var(--color-text-primary)] mx-2">|</span>
                        <span className="text-[var(--color-text-secondary)]">{invoiceType === 'EXEMPTED' ? 'Exempted' : invoiceType}</span>
                      </>
                    )}
                  </div>

                  {selectedCustomer?.address && (
                    <div className="text-sm">
                      <span className="font-medium text-[var(--color-text-primary)]">Address: </span>
                      <span className="text-[var(--color-text-secondary)]">{selectedCustomer.address}</span>
                    </div>
                  )}

                  {notificationDetails && (
                    <div className="text-sm">
                      <span className="font-medium text-[var(--color-text-primary)]">Notification: </span>
                      <span className="text-[var(--color-text-secondary)]">{notificationDetails}</span>
                    </div>
                  )}
                  {/* Editable Tax Invoice Amount (integer only) */}
                  <div className="mt-2">
                    <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">Tax Invoice Amount (Rs.)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={localTaxInvoice}
                      onChange={(e) => {
                        const raw = e.target.value || '';
                        const digits = raw.toString().replace(/[^0-9]/g, '');
                        setLocalTaxInvoice(digits);
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) e.preventDefault();
                      }}
                      onBlur={() => {
                        const intVal = localTaxInvoice === '' ? 0 : parseInt(localTaxInvoice, 10);
                        setPaidAmount(Number.isFinite(intVal) ? intVal : 0);
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
                        setLocalTaxInvoice(pasted);
                        const intVal = pasted === '' ? 0 : parseInt(pasted, 10);
                        setPaidAmount(intVal);
                      }}
                      className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-[var(--color-background)] text-right font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border border-[var(--color-border)] rounded p-4 space-y-4">
            {/* Table Container */}
            <div className="overflow-x-auto border border-[var(--color-border)] rounded">
              <table className="w-full border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '35%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-[var(--color-primary)] text-white">
                    <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm">{t('bill.serialNo')}</th>
                    <th className="border border-[var(--color-primary)] p-2 text-left font-semibold text-sm">{t('bill.itemDescription')}</th>
                    <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm">{t('bill.hsnCode')}</th>
                    <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm">{t('bill.quantity')}</th>
                    <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm">Unit</th>
                    <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm">{t('bill.amount')}</th>
                    <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm">{t('bill.taxableValueRs')}</th>
                    <th className="border border-[var(--color-primary)] p-2 text-center font-semibold text-sm">{t('bill.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className="hover:bg-[var(--color-muted)]/20">
                      <td className="border border-[var(--color-border)] p-2 text-sm text-center font-medium text-[var(--color-text-primary)]">
                        {item.serialNo}
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm">
                        <div>
                          <textarea
                            value={item.description}
                            onChange={(e) => handleLineItemChangeWithValidation(index, 'description', e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-sm resize-none bg-[var(--color-background)] focus:outline-none focus:ring-1 ${
                              lineItemErrors[`${index}-desc`]
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
                            }`}
                            rows="2"
                            placeholder="Enter item description..."
                          />
                          {lineItemErrors[`${index}-desc`] && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                              {lineItemErrors[`${index}-desc`]}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm text-center">
                        {hsnList.length > 1 ? (
                          <select
                            value={item.hsnNumber || (hsnList[0]?.hsnCode || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              const selected = hsnList.find(h => (h.hsnCode || h.hsnNumber || h.code) === val) || null;
                              console.log('HSN selected in form:', { index, value: val, selected });
                              onLineItemChange(index, 'hsnNumber', val);
                            }}
                            className="w-full px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm text-center text-[var(--color-primary)] font-semibold focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          >
                            {hsnList.map((hsn) => (
                              <option key={hsn.id || hsn.hsnCode || hsn.hsnNumber} value={hsn.hsnCode || hsn.hsnNumber || hsn.code}>
                                {hsn.hsnCode || hsn.hsnNumber || hsn.code}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={hsnList[0]?.hsnCode || ''}
                            readOnly
                            className="w-full px-2 py-1 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded text-sm text-center text-[var(--color-primary)] font-semibold"
                          />
                        )}
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm text-center">
                        <div className="w-full px-2 py-1 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded text-sm text-center text-[var(--color-accent)] font-semibold">
                          1
                        </div>
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm text-center font-medium text-[var(--color-text-primary)]">
                        Nos
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm text-center">
                        <div>
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => handleLineItemChangeWithValidation(index, 'amount', e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-sm bg-[var(--color-background)] focus:outline-none focus:ring-1 text-center ${
                              lineItemErrors[`${index}-amount`]
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
                            }`}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                          {lineItemErrors[`${index}-amount`] && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                              {lineItemErrors[`${index}-amount`]}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm text-center font-semibold text-[var(--color-primary)]">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="border border-[var(--color-border)] p-2 text-sm text-center">
                        {lineItems.length > 1 && (
                          <button
                            onClick={() => onRemoveLineItem(index)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
                            title="Remove line item"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--color-primary)]/20 font-semibold">
                    <td colSpan="3" className="border border-[var(--color-border)] p-2 text-sm text-right text-[var(--color-text-primary)]">
                      {t('bill.totalQty')}
                    </td>
                    <td className="border border-[var(--color-border)] p-2 text-sm text-center text-[var(--color-text-primary)]">
                      {totalQuantity}
                    </td>
                    <td className="border border-[var(--color-border)] p-2 text-sm text-center text-[var(--color-text-primary)]">
                      Nos
                    </td>
                    <td className="border border-[var(--color-border)] p-2 text-sm text-right text-[var(--color-text-primary)]">
                      {t('bill.totalAmt')}
                    </td>
                    <td className="border border-[var(--color-border)] p-2 text-sm text-right font-bold text-[var(--color-primary)]">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="border border-[var(--color-border)] p-2"></td>
                  </tr>
                </tfoot>
              </table>
              <datalist id="hsn-list">
                {hsnList.map((hsn) => (
                  <option key={hsn.id || hsn.hsnNumber} value={hsn.hsnNumber || hsn.hsnCode || hsn.code}>
                    {hsn.name || hsn.description || hsn.hsnNumber}
                  </option>
                ))}
              </datalist>
            </div>
            {/* Add Line Item Button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={onAddLineItem}
                variant="secondary"
                className="px-3 py-2 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-muted)]"
              >
                <Plus className="mr-1" size={16} />
                {t('bill.addLineItem')}
              </Button>
            </div>
          </div>

          {/* GST Calculation Section */}
          {(() => {
            const isExempted = invoiceType === 'EXEMPTED';
            const hasExemption = selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber;
            const isRCMExempted = invoiceType === 'RCM' && hasExemption;
            const isFCMExempted = invoiceType === 'FCM' && hasExemption;
            const showGSTCalculationUI = invoiceType === 'FCM' && !isFCMExempted;
            const showRCMGST = invoiceType === 'RCM' && !isRCMExempted;

            return (
              <div className={`grid grid-cols-1 ${showGSTCalculationUI ? 'lg:grid-cols-2' : ''} gap-4`}>
                <div className="space-y-3">
                  {/* Conditional layout: 2-column for RCM and EXEMPTED, single column for FCM */}
                  {invoiceType === 'RCM' || invoiceType === 'EXEMPTED' ? (
                    // RCM/EXEMPTED: 2-column layout
                    <div className="grid grid-cols-2 gap-3">
                      {/* Left Column */}
                      <div className="space-y-3">
                        {invoiceType === 'EXEMPTED' ? (
                          // EXEMPTED: Show Invoice Remarks, Notification Details and Total Invoice Value in Words on left
                          <>
                            {/* Invoice Remarks */}
                            <div className="border border-[var(--color-border)] rounded p-3">
                              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                                {t('bill.invoiceRemarks')}
                              </label>
                              <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--color-border)] rounded text-sm resize-none bg-[var(--color-background)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                rows="2"
                                placeholder={t('bill.invoiceRemarksPlaceholder')}
                                readOnly={isExempted || isRCMExempted || isFCMExempted}
                              />
                            </div>
                            {/* Notification Details */}
                            <div className="border border-[var(--color-border)] rounded p-3">
                              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                                {t('bill.notificationDetails')}
                              </label>
                              <div className="w-full px-3 py-2 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded text-sm min-h-[65px] text-[var(--color-text-secondary)]">
                                {notificationDetails || '-'}
                              </div>
                            </div>
                            {/* Total Invoice Value in Words */}
                            <div className="border border-[var(--color-border)] rounded p-3">
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium whitespace-nowrap text-[var(--color-text-primary)]">
                                  {t('bill.totalInvoiceValueWords')}
                                </label>
                                <div className="px-3 py-2 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded italic text-sm flex-1 overflow-x-auto font-semibold text-[var(--color-text-primary)]">
                                  {amountInWords(totalAdviceAmountReceivable)}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          // RCM: Show Invoice Remarks, Tax Payable on Reverse Charge, Notification Details, Total Invoice Value in Words, and GST values on left
                          <>
                            {/* Invoice Remarks */}
                            <div className="border border-[var(--color-border)] rounded p-3">
                              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                                {t('bill.invoiceRemarks')}
                              </label>
                              <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--color-border)] rounded text-sm resize-none bg-[var(--color-background)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                rows="2"
                                placeholder={t('bill.invoiceRemarksPlaceholder')}
                                readOnly={isExempted || isRCMExempted || isFCMExempted}
                              />
                            </div>
                            {/* Tax Payable on Reverse Charge */}
                            {selectedCustomer?.serviceType?.toString().trim().toUpperCase() === 'RCM' && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium whitespace-nowrap text-[var(--color-text-primary)]">
                                  {t('bill.taxPayableReverse')}
                                </label>
                                <span className="flex-1 px-3 py-2 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded text-sm">
                                  YES
                                </span>
                              </div>
                            )}
                            {/* Notification Details */}
                            <div className="border border-[var(--color-border)] rounded p-3">
                              <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                                {t('bill.notificationDetails')}
                              </label>
                              <div className="w-full px-3 py-2 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded text-sm min-h-[65px] text-[var(--color-text-secondary)]">
                                {notificationDetails || '-'}
                              </div>
                            </div>
                            {/* Total Invoice Value in Words */}
                            <div className="border border-[var(--color-border)] rounded p-3">
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium whitespace-nowrap text-[var(--color-text-primary)]">
                                  {t('bill.totalInvoiceValueWords')}
                                </label>
                                <div className="px-3 py-2 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded italic text-sm flex-1 overflow-x-auto font-semibold text-[var(--color-text-primary)]">
                                  {amountInWords(totalAdviceAmountReceivable)}
                                </div>
                              </div>
                            </div>
                            {/* Show RCM GST values for RCM (not exempted) */}
                            {showRCMGST && (
                              <div className="border border-[var(--color-border)] rounded p-3">
                                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                                  <span>GST Payable Under RCM by the Recipient = </span>
                                  <span className="font-semibold">
                                    IGST: {gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}  CGST: {gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'} SGST: {gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-3">
                        {invoiceType === 'EXEMPTED' ? (
                          // EXEMPTED: Show Total Taxable Value and Total Invoice Amount on right
                          <div className="border border-[var(--color-border)] rounded p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{t('bill.totalTaxableValue')}</span>
                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCurrency(totalAmount)}</span>
                              </div>

                              <div className="flex justify-between items-center py-3 bg-[var(--color-primary)] text-white rounded px-4 -mx-4 -mb-4 mt-12 font-semibold">
                                <span className="text-base">{t('bill.totalInvoiceAmount')}</span>
                                <span className="text-base">
                                  {formatCurrency(totalAdviceAmountReceivable)}
                                </span>
                              </div>
                              {renderDDOSignatureSection()}
                            </div>
                          </div>
                        ) : (
                          // RCM: Show Total Taxable Value and Total Invoice Amount on right
                          <div className="border border-[var(--color-border)] rounded p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{t('bill.totalTaxableValue')}</span>
                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCurrency(totalAmount)}</span>
                              </div>

                              <div className="flex justify-between items-center py-3 bg-[var(--color-primary)] text-white rounded px-4 -mx-4 -mb-4 mt-12 font-semibold">
                                <span className="text-base">{t('bill.totalInvoiceAmount')}</span>
                                <span className="text-base">
                                  {formatCurrency(totalAdviceAmountReceivable)}
                                </span>
                              </div>
                              {renderDDOSignatureSection()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // FCM: Single column layout
                    <div className="space-y-3">
                      {/* 1. Invoice Remarks */}
                      <div className="border border-[var(--color-border)] rounded p-3">
                        <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                          {t('bill.invoiceRemarks')}
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--color-border)] rounded text-sm resize-none bg-[var(--color-background)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          rows="2"
                          placeholder={t('bill.invoiceRemarksPlaceholder')}
                          readOnly={isExempted || isRCMExempted || isFCMExempted}
                        />
                      </div>

                      {/* 2. Notification Details */}
                      <div className="border border-[var(--color-border)] rounded p-3">
                        <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
                          {t('bill.notificationDetails')}
                        </label>
                        <div className="w-full px-3 py-2 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded text-sm min-h-[65px] text-[var(--color-text-secondary)]">
                          {notificationDetails || '-'}
                        </div>
                      </div>

                      {/* 3. Total Invoice Value in Words */}
                      <div className="border border-[var(--color-border)] rounded p-3">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium whitespace-nowrap text-[var(--color-text-primary)]">
                            {t('bill.totalInvoiceValueWords')}
                          </label>
                          <div className="px-3 py-2 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded italic text-sm flex-1 overflow-x-auto font-semibold text-[var(--color-text-primary)]">
                            {amountInWords(totalAdviceAmountReceivable)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Show GST Calculation UI only for FCM (not exempted) */}
                {showGSTCalculationUI && (
                  <div>
                    <div className="border border-[var(--color-border)] rounded p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{t('bill.totalTaxableValue')}</span>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCurrency(totalAmount)}</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{t('bill.gstCollectableFCM')}</span>
                          <span className="text-sm text-[var(--color-text-secondary)]">-</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{`IGST @ ${formatPercent(displayGstRate)}%`}</span>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{`CGST @ ${formatPercent(displayCgstRate)}%`}</span>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{`SGST @ ${formatPercent(displaySgstRate)}%`}</span>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-t border-[var(--color-border)] mt-2">
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t('bill.totalGstAmount')}</span>
                          <span className="text-sm font-semibold text-[var(--color-primary)]">
                            {formatCurrency(gstCalculation?.gstAmount || 0)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-3 bg-[var(--color-primary)] text-white rounded px-4 -mx-4 -mb-4 mt-12 font-semibold">
                          <span className="text-base">{t('bill.totalInvoiceAmount')}</span>
                          <span className="text-base">
                            {formatCurrency(totalAdviceAmountReceivable)}
                          </span>
                        </div>
                        {renderDDOSignatureSection()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Bank Details Section */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
              {t('bill.bankDetails')}
            </label>
            <div className="bg-[var(--color-muted)]/20 p-3 rounded border border-[var(--color-border)] space-y-2">
              <div className="text-sm">
                <span className="font-medium text-[var(--color-text-primary)]">Bank Name: </span>
                <span className="text-[var(--color-text-secondary)]">{bankDetails?.bankName}</span>
                {bankDetails?.bankBranch && (
                  <>
                    <span className="text-[var(--color-text-primary)] mx-2">|</span>
                    <span className="font-medium text-[var(--color-text-primary)]">Branch: </span>
                    <span className="text-[var(--color-text-secondary)]">{bankDetails?.bankBranch}</span>
                  </>
                )}
                {bankDetails?.ifscCode && (
                  <>
                    <span className="text-[var(--color-text-primary)] mx-2">|</span>
                    <span className="font-medium text-[var(--color-text-primary)]">IFSC: </span>
                    <span className="text-[var(--color-text-secondary)]">{bankDetails?.ifscCode}</span>
                  </>
                )}
                {bankDetails.accountNumber && (
                  <>
                    <span className="text-[var(--color-text-primary)] mx-2">|</span>
                    <span className="font-medium text-[var(--color-text-primary)]">Account No: </span>
                    <span className="text-[var(--color-text-secondary)]">{bankDetails?.accountNumber}</span>
                  </>
                )}
                {bankDetails?.accountType && (
                  <>
                    <span className="text-[var(--color-text-primary)] mx-2">|</span>
                    <span className="text-[var(--color-text-secondary)]">{bankDetails.accountType}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4 border-t border-[var(--color-border)]">
            <Button
              onClick={onBackToList}
              variant="secondary"
              className="px-4 py-2 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-muted)]"
            >
              ← Back to List
            </Button>
            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={() => setShowPreviewModal(true)}
                className="min-w-[140px] px-4 py-2 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-muted)]"
              >
                <FileText className="mr-2" size={16} />
                {t('bill.preview')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveWithValidation}
                disabled={saving}
                className="min-w-[140px] px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary)]/90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></div>
                    {t('bill.saving')}
                  </>
                ) : (
                  <>
                    {t('bill.saveBill')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title={t('bill.addNewCustomer')}
        size="lg"
      >
        <form onSubmit={onAddCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('label.gstin')} <span className="text-red-500">*</span>
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
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
              maxLength={15}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('label.address')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newCustomer.city}
              onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              State Code <span className="text-red-500">*</span>
            </label>
            <select
              value={newCustomer.stateCode}
              onChange={(e) => setNewCustomer({ ...newCustomer, stateCode: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              required
              disabled
            >
              <option value="">Select State Code</option>
              {getAllStates().map((state) => (
                <option key={state.code} value={state.code}>
                  {state.code} - {state.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              PIN Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newCustomer.pin}
              onChange={(e) => setNewCustomer({ ...newCustomer, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                setNewCustomer({ ...newCustomer, pin: pastedText });
              }}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
              maxLength={6}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Type of Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={newCustomer.customerType}
              onChange={(e) => setNewCustomer({ ...newCustomer, customerType: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
              required
            >
              <option value="">Select Type</option>
              <option value="Govt">Govt</option>
              <option value="Non Govt">Non Govt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Exemption Certificate Number
            </label>
            <input
              type="text"
              value={newCustomer.exemptionCertNumber}
              onChange={(e) => setNewCustomer({ ...newCustomer, exemptionCertNumber: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
              placeholder="Enter alphanumeric certificate number"
              pattern="[A-Za-z0-9]*"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('label.mobile')} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={newCustomer.mobile}
              onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 10);
                setNewCustomer({ ...newCustomer, mobile: pastedText });
              }}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
              maxLength={10}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('label.email')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
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
            >
              {t('btn.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('btn.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bill Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={t('bill.billPreview')}
        size="full"
      >
        <div className="flex flex-col h-full">
          {/* Preview Content */}
          <div id="bill-preview-content" className="flex-1 overflow-auto p-8 bg-white text-black">
            {/* Header with Logo - Centered */}
            <div className="mb-8 border-b-4 border-[#2C5F2D] pb-6">
              <div className="flex flex-col items-center gap-6">
                {/* Logo Section - Centered */}
                <div className="flex-shrink-0">
                  <div className="relative w-40 h-40 drop-shadow-lg">
                    <Image
                      src="/1.png"
                      alt="Bengaluru City Police Logo"
                      fill
                      className="object-contain"
                      quality={90}
                      sizes="160px"
                    />
                  </div>
                </div>

                {/* Header Text Section - Centered */}
                <div className="text-center max-w-5xl">
                  <h1 className="text-xl font-bold mb-4 leading-relaxed text-gray-800">
                    {gstDetails?.gstName||''}
                  </h1>
                  <div className="space-y-2 text-gray-700">
                    <p className="text-base">{gstDetails?.address||''}</p>
                    <p className="text-base">{gstDetails?.city||''} - {gstDetails?.pinCode||''}</p>
                    <p className="text-base">Contact No : {gstDetails?.mobile||''} , {gstDetails?.email||''}</p>
                    <p className="text-lg font-bold text-[#2C5F2D] mt-4">GSTIN : {gstDetails?.gstNumber||''}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TAX INVOICE Header */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-[#2C5F2D]/20 to-green-500/20 rounded-2xl px-8 py-4 inline-block border-2 border-[#2C5F2D]">
                <h2 className="text-3xl font-bold text-[#2C5F2D]">{t('bill.taxInvoice')}</h2>
              </div>
            </div>

            {/* Bill Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="font-bold mb-4 text-lg text-gray-800 border-b border-gray-300 pb-2">{t('bill.serviceReceiver')} (BILL TO)</h3>
                <div className="space-y-2">
                  <p className="mb-2"><strong>{t('bill.customerType')}:</strong> <span className="text-[#2C5F2D] font-semibold">{customerType}</span></p>
                  <p className="font-bold mb-2 text-lg">{t('common.ms')} {selectedCustomer?.customerName || ''}</p>
                  <p className="mb-2 leading-relaxed">{selectedCustomer?.address || ''}</p>
                  <p className="mb-2"><strong>{t('label.gstin')}:</strong> {selectedCustomer?.gstNumber || ''}</p>
                  <p className="mb-2"><strong>{t('bill.exemptionNo')}:</strong> {selectedCustomer?.exemptionNumber||''}</p>
                  <p className="mb-2"><strong>{t('label.stateCode')}:</strong> {selectedCustomer?.stateCode || ''}</p>
                  <p className="font-bold mb-2 text-[#2C5F2D]"><strong>{t('bill.exemptedService')} / RCM / FCM:</strong> {invoiceType}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="font-bold mb-4 text-lg text-gray-800 border-b border-gray-300 pb-2">Invoice Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-700">{t('bill.invoiceNo')}</p>
                      <p className="text-lg font-bold">{invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">{t('bill.invoiceDate')}</p>
                      <p className="text-lg font-bold">{formatDate(billDetails.date)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">{t('bill.placeOfSupply')}</p>
                    <p className="text-lg font-bold">{billDetails.placeOfSupply || 'Bengaluru'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="font-semibold text-gray-700">{t('label.ddoCode')}</p>
                      <p className="font-bold">{ddoDetails.ddoCode}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">{t('label.ddoName')}</p>
                      <p className="font-bold">{ddoDetails.fullName}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="font-semibold text-gray-700">{t('bill.ddoCityDistrict')}</p>
                    <p className="font-bold">{ddoDetails.city}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <table className="w-full border-collapse border-2 border-gray-400 mb-6 table-fixed shadow-lg">
                <colgroup>
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '38%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '16%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#2C5F2D] text-white">
                    <th className="border border-gray-400 p-3 text-left font-bold text-sm">{t('bill.serialNo')}</th>
                    <th className="border border-gray-400 p-3 text-left font-bold text-sm">{t('bill.itemDescription')}</th>
                    <th className="border border-gray-400 p-3 text-left font-bold text-sm">{t('bill.hsnCode')}</th>
                    <th className="border border-gray-400 p-3 text-left font-bold text-sm">{t('bill.quantity')}</th>
                    <th className="border border-gray-400 p-3 text-left font-bold text-sm">Unit</th>
                    <th className="border border-gray-400 p-3 text-left font-bold text-sm">{t('bill.amount')}</th>
                    <th className="border border-gray-400 p-3 text-left font-bold text-sm">{t('bill.taxableValueRs')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-400 p-3 text-sm font-bold text-center">{item.serialNo}</td>
                      <td className="border border-gray-400 p-3 text-sm leading-relaxed">{item.description}</td>
                      <td className="border border-gray-400 p-3 text-sm font-semibold">{item.hsnNumber} - {t('bill.publicAdministration')}</td>
                      <td className="border border-gray-400 p-3 text-sm text-center font-semibold">1</td>
                      <td className="border border-gray-400 p-3 text-sm text-center font-semibold">Nos</td>
                      <td className="border border-gray-400 p-3 text-sm text-right font-bold">{formatCurrency(item.amount)}</td>
                      <td className="border border-gray-400 p-3 text-sm text-right font-bold">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan="3" className="border border-gray-400 p-3 text-sm text-right">{t('bill.totalQty')}</td>
                    <td className="border border-gray-400 p-3 text-sm text-center">{totalQuantity}</td>
                    <td className="border border-gray-400 p-3 text-sm text-center">Nos</td>
                    <td className="border border-gray-400 p-3 text-sm text-right">{t('bill.totalAmt')}</td>
                    <td className="border border-gray-400 p-3 text-sm text-right">{formatCurrency(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* GST Calculation */}
            {(() => {
              const hasExemption = selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber;
              const isRCMExempted = invoiceType === 'RCM' && hasExemption;
              const isFCMExempted = invoiceType === 'FCM' && hasExemption;
              const showGSTCalculationUI = invoiceType === 'FCM' && !isFCMExempted;
              const showRCMGST = invoiceType === 'RCM' && !isRCMExempted;

              return (
                <div className={`grid grid-cols-1 ${showGSTCalculationUI ? 'lg:grid-cols-2' : ''} gap-8 mb-8`}>
                  <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                    <h3 className="font-bold mb-4 text-lg text-gray-800 border-b border-gray-300 pb-2">Additional Information</h3>
                    <div className="space-y-3">
                      <p className="font-semibold"><strong>{t('bill.taxPayableReverse')}:</strong> {taxPayableReverseCharge}</p>
                      <div>
                        <p className="font-semibold mb-2"><strong>{t('bill.invoiceRemarks')}:</strong></p>
                        <p className="bg-white p-3 rounded border min-h-[60px] leading-relaxed">{note || '-'}</p>
                      </div>
                      <div>
                        <p className="font-semibold mb-2"><strong>{t('bill.notificationDetails')}:</strong></p>
                        <p className="bg-white p-3 rounded border text-sm min-h-[80px] leading-relaxed">{notificationDetails || '-'}</p>
                      </div>
                      <div>
                        <p className="font-semibold mb-2"><strong>{t('bill.totalInvoiceValueWords')}</strong></p>
                        <p className="bg-white p-3 rounded border italic font-semibold min-h-[60px] leading-relaxed">{amountInWords(totalAdviceAmountReceivable)}</p>
                      </div>
                      {showRCMGST && (
                        <div>
                          <p className="font-semibold mb-2 text-sm">
                            <strong>GST Payable Under RCM by the Recipient = </strong>
                            <span className="font-normal">
                              IGST: {gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}  CGST: {gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'} SGST: {gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}
                            </span>
                          </p>
                        </div>
                      )}
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setShowGstDebug(!showGstDebug)}
                          className="text-xs text-[var(--color-primary)] underline"
                        >
                          {showGstDebug ? 'Hide GST debug' : 'Show GST debug'}
                        </button>
                        {showGstDebug && (
                          <div className="mt-2 bg-gray-100 p-3 rounded text-xs text-gray-700">
                            <div><strong>firstHSN:</strong> {firstHSN || '-'}</div>
                            <div><strong>currentHsnDetails:</strong> {currentHsnDetails ? JSON.stringify({ id: currentHsnDetails.id, hsnCode: currentHsnDetails.hsnCode || currentHsnDetails.hsnNumber || currentHsnDetails.code, igst: currentHsnDetails.igst, cgst: currentHsnDetails.cgst, sgst: currentHsnDetails.sgst, gstRate: currentHsnDetails.gstRate }) : '-'}</div>
                            <div><strong>gstCalculation:</strong> {gstCalculation ? JSON.stringify({ gstRate: gstCalculation.gstRate, cgstRate: gstCalculation.cgstRate, sgstRate: gstCalculation.sgstRate, cgst: gstCalculation.cgst, sgst: gstCalculation.sgst, igst: gstCalculation.igst, taxableValue: gstCalculation.taxableValue }) : '-'}</div>
                            <div className="mt-2 text-[var(--color-text-secondary)]">If SGST amount is present but SGST rate is missing, the panel computes rate = (sgst / taxableValue) * 100. If taxableValue is 0 or missing, rate can't be derived.</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {showGSTCalculationUI && (
                    <div className="bg-gradient-to-br from-[#2C5F2D]/10 to-green-500/10 p-6 rounded-lg border-2 border-[#2C5F2D]">
                      <h3 className="font-bold mb-4 text-lg text-gray-800 border-b border-[#2C5F2D] pb-2">GST Calculation</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-300">
                          <span className="font-semibold">{t('bill.totalTaxableValue')}</span>
                          <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-300">
                          <span className="font-semibold">{t('bill.gstCollectableFCM')}</span>
                          <span className="text-gray-500">-</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-300">
                          <span className="font-semibold">{`IGST @ ${formatPercent(displayGstRate)}%`}</span>
                          <span className="font-semibold">{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-300">
                          <span className="font-semibold">{`CGST @ ${formatPercent(displayCgstRate)}%`}</span>
                          <span className="font-bold text-lg">{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-300">
                          <span className="font-semibold">{`SGST @ ${formatPercent(displaySgstRate)}%`}</span>
                          <span className="font-bold text-lg">{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-t-2 border-[#2C5F2D]">
                          <span className="font-bold text-lg">{t('bill.totalGstAmount')}</span>
                          <span className="font-bold text-lg text-[#2C5F2D]">{formatCurrency(gstCalculation?.gstAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 bg-[#2C5F2D] text-white rounded-lg px-4 -mx-4">
                          <span className="font-bold text-xl">{t('bill.totalInvoiceAmount')}</span>
                          <span className="font-bold text-xl">{formatCurrency(totalAdviceAmountReceivable)}</span>
                        </div>
                        <div className="mt-6 flex flex-row gap-4 border-t border-white/40 pt-4 text-white">
                          <div className="flex-1">
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            <p className="mt-2 font-semibold text-lg">{ddoDetails?.fullName || '-'}</p>
                            <p className="text-xs uppercase tracking-wide opacity-75">{t('bill.signatureOfDdo')}</p>
                            <div className="mt-3 h-16 border-2 border-solid border-white/70"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Bank Details */}
            <div className="mb-8 bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <h3 className="font-bold mb-4 text-lg text-gray-800 border-b border-gray-300 pb-2">{t('bill.bankDetails')}</h3>
              <div className="text-base">
                <p>
                  <strong className="text-gray-700">Bank Name: </strong>
                  <span className="font-semibold">{bankDetails.bankName}</span>
                  {bankDetails.bankBranch && (
                    <>
                      <span className="text-gray-700 mx-2">|</span>
                      <strong className="text-gray-700">Branch: </strong>
                      <span className="font-semibold">{bankDetails.bankBranch}</span>
                    </>
                  )}
                  {bankDetails.ifscCode && (
                    <>
                      <span className="text-gray-700 mx-2">|</span>
                      <strong className="text-gray-700">IFSC: </strong>
                      <span className="font-semibold">{bankDetails.ifscCode}</span>
                    </>
                  )}
                  {bankDetails.accountNumber && (
                    <>
                      <span className="text-gray-700 mx-2">|</span>
                      <strong className="text-gray-700">Account No: </strong>
                      <span className="font-semibold">{bankDetails.accountNumber}</span>
                    </>
                  )}
                  {bankDetails.accountType && (
                    <>
                      <span className="text-gray-700 mx-2">|</span>
                      <span className="font-semibold">{bankDetails.accountType}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-4 border-t-2 border-gray-300">
              <p className="text-sm font-semibold text-gray-600 italic">{t('bill.computerGenerated')}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-300 bg-white p-6 flex justify-end gap-4">
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)} className="px-6 py-3">
              {t('bill.close')}
            </Button>
            <Button variant="primary" onClick={onPrintBill} className="px-6 py-3 bg-[#2C5F2D] hover:bg-[#1e4d1f]">
              <Printer className="mr-2" size={18} />
              {t('bill.print')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}