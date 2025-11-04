"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { calculateGST, validateBillDate, canSubmitBill, formatCurrency } from '@/lib/gstUtils';
import { validateGSTIN, validateEmail, validateMobile, validatePIN } from '@/lib/gstUtils';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { IndeterminateProgressBar } from '@/components/shared/ProgressBar';
import { useGstinList } from '@/hooks/useGstinList';

export default function GenerateBillPage() {
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [hsnList, setHsnList] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Part 1: Bill Details
  const [billDetails, setBillDetails] = useState({
    gstinNumber: '',
    gstAddress: '',
    ddoCode: '',
    billNumber: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  // Part 2: Customer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    gstNumber: '',
    address: '',
    pin: '',
    mobile: '',
    email: '',
  });
  
  // Part 3: Line Items
  const [lineItems, setLineItems] = useState([
    { serialNo: 1, description: '', amount: 0, hsnNumber: '' },
  ]);
  
  // Part 4: Calculations
  const [gstCalculation, setGstCalculation] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [note, setNote] = useState('');
  
  const [loading, setLoading] = useState(false);
  const { gstinList } = useGstinList();

  useEffect(() => {
    fetchCustomers();
    fetchHSNList();
    loadDDOInfo();
  }, []);

  useEffect(() => {
    if (selectedCustomer && lineItems.length > 0) {
      calculateGSTAmount();
    }
  }, [selectedCustomer, lineItems]);

  const loadDDOInfo = () => {
    // Load DDO info from localStorage or API
    const ddoCode = localStorage.getItem('ddoCode') || '';
    const ddoName = localStorage.getItem('ddoUserName') || '';
    setBillDetails(prev => ({
      ...prev,
      ddoCode,
    }));
  };

  const fetchCustomers = async () => {
    try {
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.CUSTOMER_LIST);
      if (response && response.status === 'success') {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchHSNList = async () => {
    try {
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.HSN_LIST);
      if (response && response.status === 'success') {
        setHsnList(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching HSN list:', error);
    }
  };

  const calculateGSTAmount = () => {
    if (!selectedCustomer) {
      setGstCalculation(null);
      return;
    }

    const taxableValue = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    if (taxableValue <= 0) {
      setGstCalculation(null);
      return;
    }

    const calculation = calculateGST(selectedCustomer.gstNumber, taxableValue);
    setGstCalculation(calculation);
    
    // Update note
    if (calculation.isGovernment) {
      setNote('GST Not Applicable - Government Entity (Karnataka)');
    } else if (calculation.isKarnataka) {
      setNote('CGST @9% + SGST @9% = 18% (Karnataka Non-Government)');
    } else {
      setNote(`GST @18% (Standard Rate)`);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    // Validate
    const gstValidation = validateGSTIN(newCustomer.gstNumber);
    if (!gstValidation.valid) {
      toast.error(gstValidation.message);
      return;
    }
    
    const emailValidation = validateEmail(newCustomer.email);
    if (!emailValidation.valid) {
      toast.error(emailValidation.message);
      return;
    }
    
    const mobileValidation = validateMobile(newCustomer.mobile);
    if (!mobileValidation.valid) {
      toast.error(mobileValidation.message);
      return;
    }
    
    const pinValidation = validatePIN(newCustomer.pin);
    if (!pinValidation.valid) {
      toast.error(pinValidation.message);
      return;
    }

    try {
      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.CUSTOMER_ADD,
        newCustomer
      );
      
      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        setShowCustomerModal(false);
        setNewCustomer({
          name: '',
          gstNumber: '',
          address: '',
          pin: '',
          mobile: '',
          email: '',
        });
        fetchCustomers();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
    }
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { serialNo: lineItems.length + 1, description: '', amount: 0, hsnNumber: '' },
    ]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length > 1) {
      const updated = lineItems.filter((_, i) => i !== index);
      updated.forEach((item, i) => {
        item.serialNo = i + 1;
      });
      setLineItems(updated);
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const handleSaveBill = async () => {
    // Validate
    if (!billDetails.gstinNumber || !billDetails.billNumber || !billDetails.date) {
      toast.error('Please fill all bill details');
      return;
    }
    
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    
    const dateValidation = validateBillDate(billDetails.date);
    if (!dateValidation.valid) {
      toast.error(dateValidation.message);
      return;
    }
    
    const taxableValue = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    if (taxableValue <= 0) {
      toast.error('Please add at least one line item with amount > 0');
      return;
    }
    
    if (paidAmount > (gstCalculation?.finalAmount || 0)) {
      toast.error(t('validation.amountExceed'));
      return;
    }

    try {
      setLoading(true);
      const billData = {
        ...billDetails,
        customerId: selectedCustomer.id,
        lineItems: lineItems.map((item, idx) => ({
          serialNo: idx + 1,
          description: item.description,
          amount: parseFloat(item.amount) || 0,
          hsnNumber: item.hsnNumber,
        })),
        taxableValue: gstCalculation?.taxableValue || 0,
        gstAmount: gstCalculation?.gstAmount || 0,
        cgst: gstCalculation?.cgst || 0,
        sgst: gstCalculation?.sgst || 0,
        finalAmount: gstCalculation?.finalAmount || 0,
        paidAmount: parseFloat(paidAmount) || 0,
        note,
        status: 'pending',
      };

      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.BILL_ADD,
        billData
      );
      
      if (response && response.status === 'success') {
        toast.success('Bill saved successfully!');
        // Reset form
        setBillDetails({
          gstinNumber: '',
          gstAddress: '',
          ddoCode: billDetails.ddoCode,
          billNumber: '',
          date: new Date().toISOString().split('T')[0],
        });
        setSelectedCustomer(null);
        setLineItems([{ serialNo: 1, description: '', amount: 0, hsnNumber: '' }]);
        setPaidAmount(0);
        setNote('');
        setGstCalculation(null);
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="ddo">
      <div className="space-y-4 sm:space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="gradient-text">{t('nav.generateBill')}</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Generate a new bill/invoice with automatic GST calculation
          </p>
        </div>

        <div className="premium-card p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Part 1: Bill Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-[var(--color-border)]">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-xl">
                <span className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">1</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                Bill Details
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                  {t('label.gstin')} <span className="text-red-500">*</span>
                </label>
                {gstinList.length > 0 ? (
                  <select
                    value={billDetails.gstinNumber}
                    onChange={(e) => setBillDetails({ ...billDetails, gstinNumber: e.target.value.toUpperCase() })}
                    className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm uppercase"
                    required
                  >
                    <option value="">Select GSTIN Number</option>
                    {gstinList.map((gstin) => (
                      <option key={gstin.value} value={gstin.value}>
                        {gstin.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={billDetails.gstinNumber}
                    onChange={(e) => setBillDetails({ ...billDetails, gstinNumber: e.target.value.toUpperCase() })}
                    className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                    maxLength={15}
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                  GST Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={billDetails.gstAddress}
                  onChange={(e) => setBillDetails({ ...billDetails, gstAddress: e.target.value })}
                  className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                  {t('label.ddoCode')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={billDetails.ddoCode}
                  onChange={(e) => setBillDetails({ ...billDetails, ddoCode: e.target.value })}
                  className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                  {t('label.billNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={billDetails.billNumber}
                  onChange={(e) => setBillDetails({ ...billDetails, billNumber: e.target.value })}
                  className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                  {t('label.date')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={billDetails.date}
                  onChange={(e) => setBillDetails({ ...billDetails, date: e.target.value })}
                  className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          </div>

          {/* Part 2: Customer Selection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-[var(--color-border)]">
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-xl">
                  <span className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">2</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                  Customer Selection
                </h2>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                  {t('label.customer')} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => {
                      const customer = customers.find(c => c.id === e.target.value);
                      setSelectedCustomer(customer || null);
                    }}
                    className="premium-input flex-1 px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.gstNumber})
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => setShowCustomerModal(true)} variant="secondary" className="whitespace-nowrap">
                    <Plus className="mr-2" size={16} />
                    {t('btn.addCustomer')}
                  </Button>
                </div>
              </div>
              
              {selectedCustomer && (
                <div className="p-4 sm:p-6 bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-accent)]/5 rounded-xl border-2 border-[var(--color-primary)]/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Name</p>
                      <p className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">GSTIN</p>
                      <p className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">{selectedCustomer.gstNumber}</p>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Address</p>
                      <p className="font-medium text-sm sm:text-base text-[var(--color-text-primary)]">{selectedCustomer.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Part 3: Line Items */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-[var(--color-border)]">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-xl">
                <span className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">3</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                Bill Amount Details
              </h2>
            </div>
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="premium-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--color-text-primary)]">S. No: {item.serialNo}</span>
                    {lineItems.length > 1 && (
                      <button
                        onClick={() => handleRemoveLineItem(index)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">{t('label.description')}</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">{t('label.amount')}</label>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                      className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-lg text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">{t('label.hsnNumber')}</label>
                    <input
                      type="text"
                      value={item.hsnNumber}
                      onChange={(e) => handleLineItemChange(index, 'hsnNumber', e.target.value)}
                      className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-lg text-sm"
                      list={`hsn-list-mobile-${index}`}
                    />
                    <datalist id={`hsn-list-mobile-${index}`}>
                      {hsnList.map((hsn) => (
                        <option key={hsn.id} value={hsn.hsnNumber}>
                          {hsn.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border-2 border-[var(--color-border)]">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)]">
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left border-b-2 border-[var(--color-border)] font-bold text-xs sm:text-sm uppercase tracking-wide">S. No.</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left border-b-2 border-[var(--color-border)] font-bold text-xs sm:text-sm uppercase tracking-wide">{t('label.description')}</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left border-b-2 border-[var(--color-border)] font-bold text-xs sm:text-sm uppercase tracking-wide">{t('label.amount')}</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left border-b-2 border-[var(--color-border)] font-bold text-xs sm:text-sm uppercase tracking-wide">{t('label.hsnNumber')}</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left border-b-2 border-[var(--color-border)] font-bold text-xs sm:text-sm uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className="hover:bg-[var(--color-muted)]/50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--color-border)] font-semibold text-sm">{item.serialNo}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--color-border)]">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                          className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--color-border)]">
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                          className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-lg text-sm"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--color-border)]">
                        <input
                          type="text"
                          value={item.hsnNumber}
                          onChange={(e) => handleLineItemChange(index, 'hsnNumber', e.target.value)}
                          className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-lg text-sm"
                          list={`hsn-list-${index}`}
                        />
                        <datalist id={`hsn-list-${index}`}>
                          {hsnList.map((hsn) => (
                            <option key={hsn.id} value={hsn.hsnNumber}>
                              {hsn.name}
                            </option>
                          ))}
                        </datalist>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--color-border)]">
                        {lineItems.length > 1 && (
                          <button
                            onClick={() => handleRemoveLineItem(index)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-110 text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={handleAddLineItem} variant="secondary" className="mt-4 group">
              <Plus className="mr-2 group-hover:rotate-90 transition-transform duration-300" size={16} />
              Add Row
            </Button>
          </div>

          {/* Part 4: Totals & GST */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-[var(--color-border)]">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-xl">
                <span className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">4</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                Total & GST Details
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="premium-card p-4 sm:p-6 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-muted)]">
                <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mb-3 sm:mb-4 pb-2 border-b border-[var(--color-border)]">
                  Calculation Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[var(--color-text-secondary)] font-medium">{t('bill.taxableValue')}:</span>
                    <strong className="text-lg text-[var(--color-text-primary)]">{formatCurrency(gstCalculation?.taxableValue || 0)}</strong>
                  </div>
                  {gstCalculation && gstCalculation.gstApplicable && (
                    <>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[var(--color-text-secondary)] font-medium">{t('bill.cgst')}:</span>
                        <strong className="text-[var(--color-text-primary)]">{formatCurrency(gstCalculation.cgst)}</strong>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[var(--color-text-secondary)] font-medium">{t('bill.sgst')}:</span>
                        <strong className="text-[var(--color-text-primary)]">{formatCurrency(gstCalculation.sgst)}</strong>
                      </div>
                      <div className="flex justify-between items-center py-2 border-t border-[var(--color-border)] pt-3">
                        <span className="text-[var(--color-text-secondary)] font-medium">{t('bill.gstAmount')}:</span>
                        <strong className="text-lg text-[var(--color-primary)]">{formatCurrency(gstCalculation.gstAmount)}</strong>
                      </div>
                    </>
                  )}
                  {gstCalculation && !gstCalculation.gstApplicable && (
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
                      <p className="text-yellow-800 dark:text-yellow-300 font-semibold flex items-center gap-2">
                        <span className="text-xl">✓</span>
                        {t('bill.gstNotApplicable')}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t-2 border-[var(--color-border)] mt-4">
                    <span className="text-xl font-bold gradient-text">{t('bill.finalAmount')}:</span>
                    <strong className="text-2xl font-extrabold text-[var(--color-primary)]">{formatCurrency(gstCalculation?.finalAmount || 0)}</strong>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                    {t('bill.note')}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm resize-none"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                    {t('bill.paidAmount')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm text-lg font-semibold"
                    min="0"
                    max={gstCalculation?.finalAmount || 0}
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {loading && (
              <div className="premium-card p-4 sm:p-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 border-2 border-[var(--color-primary)]/20">
                <IndeterminateProgressBar message="Saving bill..." variant="primary" />
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2 border-[var(--color-border)]">
              <Button variant="secondary" onClick={() => window.history.back()} size="lg" disabled={loading} className="w-full sm:w-auto">
                {t('btn.cancel')}
              </Button>
              <Button variant="primary" onClick={handleSaveBill} disabled={loading} size="lg" className="w-full sm:w-auto">
                {t('btn.save')}
              </Button>
            </div>
          </div>
        </div>

        {/* Add Customer Modal */}
        <Modal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          title={t('btn.addCustomer')}
        >
          <form onSubmit={handleAddCustomer} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                {t('label.gstin')} <span className="text-red-500">*</span>
              </label>
              {gstinList.length > 0 ? (
                <select
                  value={newCustomer.gstNumber}
                  onChange={(e) => setNewCustomer({ ...newCustomer, gstNumber: e.target.value.toUpperCase() })}
                  className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm uppercase"
                  required
                >
                  <option value="">Select GSTIN Number</option>
                  {gstinList.map((gstin) => (
                    <option key={gstin.value} value={gstin.value}>
                      {gstin.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newCustomer.gstNumber}
                  onChange={(e) => setNewCustomer({ ...newCustomer, gstNumber: e.target.value.toUpperCase() })}
                  className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                  maxLength={15}
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                {t('label.address')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm resize-none"
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                  PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomer.pin}
                  onChange={(e) => setNewCustomer({ ...newCustomer, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                  maxLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                  {t('label.mobile')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newCustomer.mobile}
                  onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                  maxLength={10}
                  required
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
                  {t('label.email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="premium-input w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-[var(--color-border)]">
              <Button type="button" variant="secondary" onClick={() => setShowCustomerModal(false)} className="w-full sm:w-auto">
                {t('btn.cancel')}
              </Button>
              <Button type="submit" variant="primary" className="w-full sm:w-auto">
                {t('btn.save')}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}

