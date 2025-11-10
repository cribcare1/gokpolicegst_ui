"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Layout from '@/components/shared/Layout';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { calculateGST, validateBillDate, formatCurrency, validateGSTIN, validateEmail, validateMobile, validatePIN, validateBillNumber, validateAmount, validateDescription, validateName, validateAddress, validateCity, validateStateCode } from '@/lib/gstUtils';
import { getAllStates } from '@/lib/stateCodes';
import { Plus, Trash2, X, Download, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { IndeterminateProgressBar } from '@/components/shared/ProgressBar';
import { useGstinList } from '@/hooks/useGstinList';

export default function GenerateBillPage() {
  const [customers, setCustomers] = useState([]);
  const [hsnList, setHsnList] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Bill Details
  const [billDetails, setBillDetails] = useState({
    gstinNumber: '29AAAGO1111W1ZB',
    gstAddress: 'No.1, Police Head Quarters, Nrupathunga Road, Opp: Martha\'s Hospital, Bengaluru-560001',
    ddoCode: '0200PO0032',
    billNumber: '1ZB/PO0032/0001',
    date: new Date().toISOString().split('T')[0],
  });
  
  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    gstNumber: '',
    address: '',
    stateCode: '',
    pin: '',
    mobile: '',
    email: '',
  });
  
  // Line Items
  const [lineItems, setLineItems] = useState([
    { 
      serialNo: 1, 
      description: 'Deployment of police personnel for Bandobast/Security duty is a supply of service by the Police Department for the Quarter June-2025 to Sept-2025', 
      amount: 500000, 
      hsnNumber: '999293',
      quantity: 1
    },
    { 
      serialNo: 2, 
      description: 'Deployment of police personnel for Bandobast/Security duty is a supply of service by the Police Department for the Quarter Oct-2025 to Oct-2025', 
      amount: 200000, 
      hsnNumber: '999293',
      quantity: 1
    },
  ]);
  
  // Calculations
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
    } else {
      setGstCalculation(null);
    }
  }, [selectedCustomer, lineItems, billDetails.gstinNumber]);

  const loadDDOInfo = () => {
    const ddoCode = localStorage.getItem('ddoCode') || '0200PO0032';
    const ddoName = localStorage.getItem('ddoUserName') || 'DCP CAR HQ';
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
        // Auto-select first customer for demo
        if (response.data && response.data.length > 0) {
          setSelectedCustomer(response.data[0]);
        }
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

    // Get supplier GSTIN from bill details
    const supplierGSTIN = billDetails.gstinNumber;
    const customerGSTIN = selectedCustomer.gstNumber || '';
    const customerPAN = selectedCustomer.pan || '';
    
    // Determine invoice type (default to FCM)
    const invoiceType = 'FCM'; // Can be 'FCM', 'RCM', or 'EXEMPTED'
    
    // Get HSN details if available (for GST rates)
    const firstHSN = lineItems[0]?.hsnNumber;
    const hsnDetails = firstHSN ? hsnList.find(h => 
      h.hsnNumber === firstHSN || 
      h.hsnCode === firstHSN || 
      h.code === firstHSN
    ) : null;
    
    // Call calculateGST with proper parameters
    const calculation = calculateGST(
      supplierGSTIN,
      customerGSTIN,
      customerPAN,
      taxableValue,
      18, // Default GST rate
      invoiceType,
      hsnDetails
    );
    
    setGstCalculation(calculation);
    
    // Update note based on GST calculation
    if (calculation.note) {
      setNote(calculation.note);
    } else if (calculation.isGovernment) {
      setNote('GST Not Applicable - Government Entity (Karnataka)');
    } else if (calculation.isSameState) {
      setNote('CGST @9% + SGST @9% = 18% (Karnataka Same State)');
    } else {
      setNote(`IGST @18% (Different State)`);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const validations = [
      validateName(newCustomer.name, 'Customer Name'),
      validateGSTIN(newCustomer.gstNumber),
      validateAddress(newCustomer.address),
      validateStateCode(newCustomer.stateCode),
      validatePIN(newCustomer.pin),
      validateMobile(newCustomer.mobile),
      validateEmail(newCustomer.email)
    ];

    for (const validation of validations) {
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }
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
          stateCode: '',
          pin: '',
          mobile: '',
          email: '',
        });
        // Refresh customers list and select the newly added customer
        const updatedResponse = await ApiService.handleGetRequest(API_ENDPOINTS.CUSTOMER_LIST);
        if (updatedResponse && updatedResponse.status === 'success') {
          setCustomers(updatedResponse.data || []);
          // Select the newly added customer (it should be the last one or match by GSTIN)
          if (updatedResponse.data && updatedResponse.data.length > 0) {
            const newCustomerData = updatedResponse.data.find(c => c.gstNumber === newCustomer.gstNumber) || updatedResponse.data[updatedResponse.data.length - 1];
            if (newCustomerData) {
              setSelectedCustomer(newCustomerData);
            }
          }
        } else {
          fetchCustomers();
        }
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
      { 
        serialNo: lineItems.length + 1, 
        description: '', 
        amount: 0, 
        hsnNumber: '', 
        quantity: 1 
      },
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
    // Validate all required fields
    const validations = [
      validateGSTIN(billDetails.gstinNumber),
      { valid: billDetails.gstAddress?.trim(), message: 'GST Address is required' },
      { valid: billDetails.ddoCode?.trim(), message: 'DDO Code is required' },
      validateBillNumber(billDetails.billNumber),
      validateBillDate(billDetails.date),
      { valid: selectedCustomer, message: 'Please select a customer' },
      { valid: lineItems.length > 0, message: 'Please add at least one line item' }
    ];

    for (const validation of validations) {
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }
    }

    // Validate line items
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      const descValidation = validateDescription(item.description);
      const amountValidation = validateAmount(item.amount, `Line item ${i + 1} Amount`);
      
      if (!descValidation.valid) {
        toast.error(`Line item ${i + 1}: ${descValidation.message}`);
        return;
      }
      if (!amountValidation.valid) {
        toast.error(`Line item ${i + 1}: ${amountValidation.message}`);
        return;
      }
    }

    const taxableValue = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    if (taxableValue <= 0) {
      toast.error('Total taxable value must be greater than 0');
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
          quantity: parseInt(item.quantity) || 1,
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
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = () => {
    const printContent = document.getElementById('bill-preview-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Bill</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .invoice-table th, .invoice-table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .total-section { margin-top: 20px; }
            .signature { margin-top: 50px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + numberToWords(num % 100) : '');
    
    return 'Number too large for conversion';
  };

  const amountInWords = (amount) => {
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    
    let words = numberToWords(rupees) + ' Rupees';
    if (paise > 0) {
      words += ' and ' + numberToWords(paise) + ' Paise';
    }
    
    return words + ' Only';
  };

  // Calculate totals
  const totalQuantity = lineItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  const totalAmount = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <Layout role="ddo">
      <div className="space-y-4 sm:space-y-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-xl">
              <FileText className="text-[var(--color-primary)]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-1">
                <span className="gradient-text">{t('nav.generateBill')}</span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
                Generate GST Bill - Government of Karnataka Format
              </p>
            </div>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Header Section with Logo */}
          <div className="border-b-2 border-[var(--color-border)] pb-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
              {/* Logo Section - Left Side */}
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
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
              
              {/* Header Text Section - Right Side */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  Government of Karnataka - Office of the Director General & Inspector General of Police, Karnataka
                </h1>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-1">
                  No.1, Police Head Quarters, Nrupathunga Road
                </p>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-1">
                  Opp: Martha's Hospital, Bengaluru-560001
                </p>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-2">
                  Contact No : 080-22535100 , Copadmin@ksp.gov.in
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[var(--color-primary)]">
                  GSTIN : {billDetails.gstinNumber}
                </p>
              </div>
            </div>
          </div>

          {/* TAX INVOICE Header */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] border-b-2 border-[var(--color-border)] pb-2">
              TAX INVOICE
            </h2>
          </div>

          {/* Bill To and Invoice Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bill To Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Details of Service Receiver (BILL TO)</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Select Customer</label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value);
                    setSelectedCustomer(customer || null);
                  }}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.gstNumber || 'No GSTIN'}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCustomerModal(true)}
                  className="mt-2"
                >
                  <Plus className="mr-2" size={14} />
                  Add New Customer
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">M/s</label>
                <input
                  type="text"
                  value={selectedCustomer?.name || ''}
                  readOnly
                  className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded"
                  placeholder="Customer Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Address</label>
                <textarea
                  value={selectedCustomer?.address || ''}
                  readOnly
                  className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded resize-none"
                  rows="2"
                  placeholder="Customer Address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">GSTIN</label>
                  <input
                    type="text"
                    value={selectedCustomer?.gstNumber || ''}
                    readOnly
                    className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded uppercase"
                    placeholder="GSTIN Number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">State Code</label>
                  <input
                    type="text"
                    value={selectedCustomer?.stateCode || '29'}
                    readOnly
                    className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Exempted Service / RCM / FCM</label>
                <select className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                  <option>Exempted Service</option>
                  <option>RCM</option>
                  <option>FCM</option>
                </select>
              </div>
            </div>

            {/* Invoice Details Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">INVOICE NO</label>
                  <input
                    type="text"
                    value={billDetails.billNumber}
                    onChange={(e) => setBillDetails({...billDetails, billNumber: e.target.value})}
                    className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">INVOICE DATE</label>
                  <input
                    type="date"
                    value={billDetails.date}
                    onChange={(e) => setBillDetails({...billDetails, date: e.target.value})}
                    className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Place of Supply</label>
                <input
                  type="text"
                  value="Karnataka"
                  readOnly
                  className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">DDO Code</label>
                  <input
                    type="text"
                    value={billDetails.ddoCode}
                    onChange={(e) => setBillDetails({...billDetails, ddoCode: e.target.value})}
                    className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">DDO Name</label>
                  <input
                    type="text"
                    value="DCP CAR HQ"
                    readOnly
                    className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">DDO City/District</label>
                <input
                  type="text"
                  value="Bengaluru"
                  readOnly
                  className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-[var(--color-border)]">
              <thead>
                <tr className="bg-[var(--color-muted)]">
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">Sl. No</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">Item Description</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">HSN Code</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">Qty</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">Amount (Rs.)</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">Taxable Value (Rs.)</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-[var(--color-border)] p-2 text-sm">{item.serialNo}</td>
                    <td className="border border-[var(--color-border)] p-2 text-sm">
                      <textarea
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        className="premium-input w-full px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm resize-none"
                        rows="2"
                      />
                    </td>
                    <td className="border border-[var(--color-border)] p-2 text-sm">
                      <input
                        type="text"
                        value={item.hsnNumber}
                        onChange={(e) => handleLineItemChange(index, 'hsnNumber', e.target.value)}
                        className="premium-input w-full px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                        list="hsn-list"
                      />
                    </td>
                    <td className="border border-[var(--color-border)] p-2 text-sm">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                        className="premium-input w-full px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                        min="1"
                      />
                    </td>
                    <td className="border border-[var(--color-border)] p-2 text-sm">
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                        className="premium-input w-full px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-[var(--color-border)] p-2 text-sm text-right">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="border border-[var(--color-border)] p-2 text-sm">
                      {lineItems.length > 1 && (
                        <button
                          onClick={() => handleRemoveLineItem(index)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="border border-[var(--color-border)] p-2 text-sm font-semibold text-right">
                    Qty.
                  </td>
                  <td className="border border-[var(--color-border)] p-2 text-sm font-semibold text-center">
                    {totalQuantity}
                  </td>
                  <td className="border border-[var(--color-border)] p-2 text-sm font-semibold text-right">
                    Total Amt
                  </td>
                  <td className="border border-[var(--color-border)] p-2 text-sm font-semibold text-right">
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

          <Button onClick={handleAddLineItem} variant="secondary" className="mt-2">
            <Plus className="mr-2" size={16} />
            Add Line Item
          </Button>

          {/* GST Calculation Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Tax is Payable on Reverse Charges</label>
                <select className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                  <option>YES</option>
                  <option>NO</option>
                  <option>NA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Invoice Remarks</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded resize-none"
                  rows="3"
                  placeholder="Notification details will be displayed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Total Invoice Value in Words</label>
                <div className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded italic">
                  {amountInWords(gstCalculation?.finalAmount || totalAmount)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-sm font-medium">Total Taxable Value</div>
                <div className="text-sm font-semibold text-right">{formatCurrency(totalAmount)}</div>

                <div className="text-sm font-medium">GST Collectable Under FCM</div>
                <div className="text-sm text-right">-</div>

                <div className="text-sm font-medium">IGST @ 18%</div>
                <div className="text-sm text-right">{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</div>

                <div className="text-sm font-medium">CGST @ 9%</div>
                <div className="text-sm font-semibold text-right">{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</div>

                <div className="text-sm font-medium">SGST @ 9%</div>
                <div className="text-sm font-semibold text-right">{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</div>

                <div className="text-sm font-medium border-t border-[var(--color-border)] pt-2">Total GST Amount</div>
                <div className="text-sm font-semibold text-right border-t border-[var(--color-border)] pt-2">
                  {formatCurrency(gstCalculation?.gstAmount || 0)}
                </div>

                <div className="text-sm font-medium">Total Invoice Amount</div>
                <div className="text-sm font-bold text-right text-[var(--color-primary)]">
                  {formatCurrency(gstCalculation?.finalAmount || totalAmount)}
                </div>
              </div>

              <div className="text-xs text-[var(--color-text-secondary)] mt-4">
                <p>GST Payable Under RCM by the Recipient = IGST: CGST: SGST:</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setShowPreviewModal(true)}>
              <FileText className="mr-2" size={16} />
              Preview
            </Button>
            <Button variant="primary" onClick={handleSaveBill} disabled={loading}>
              {loading ? 'Saving...' : 'Save Bill'}
            </Button>
          </div>
        </div>

        {/* Add Customer Modal */}
        <Modal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          title="Add New Customer"
          size="lg"
        >
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                Customer Name *
              </label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                GSTIN Number *
              </label>
              <input
                type="text"
                value={newCustomer.gstNumber}
                onChange={(e) => setNewCustomer({...newCustomer, gstNumber: e.target.value.toUpperCase()})}
                className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded uppercase"
                placeholder="29XXXXXXXXXXXXX"
                maxLength={15}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                Address *
              </label>
              <textarea
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded resize-none"
                rows="3"
                placeholder="Enter complete address"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                  State Code *
                </label>
                <input
                  type="number"
                  value={newCustomer.stateCode}
                  onChange={(e) => setNewCustomer({...newCustomer, stateCode: e.target.value})}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  placeholder="29"
                  min="1"
                  max="99"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                  PIN Code *
                </label>
                <input
                  type="text"
                  value={newCustomer.pin}
                  onChange={(e) => setNewCustomer({...newCustomer, pin: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  placeholder="560001"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  value={newCustomer.mobile}
                  onChange={(e) => setNewCustomer({...newCustomer, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  placeholder="9876543210"
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                  Email *
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  placeholder="customer@example.com"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCustomerModal(false);
                  setNewCustomer({
                    name: '',
                    gstNumber: '',
                    address: '',
                    stateCode: '',
                    pin: '',
                    mobile: '',
                    email: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Add Customer
              </Button>
            </div>
          </form>
        </Modal>

        {/* Bill Preview Modal */}
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Bill Preview"
          size="full"
        >
          <div id="bill-preview-content" className="p-6 bg-white dark:bg-gray-900 text-black dark:text-white">
            {/* Header with Logo */}
            <div className="mb-6 border-b-2 border-black dark:border-white pb-4">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
                {/* Logo Section - Left Side */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                    <Image
                      src="/1.png"
                      alt="Bengaluru City Police Logo"
                      fill
                      className="object-contain"
                      quality={90}
                      sizes="(max-width: 768px) 128px, 160px"
                    />
                  </div>
                </div>
                
                {/* Header Text Section - Right Side */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-base sm:text-lg font-bold mb-2">Government of Karnataka - Office of the Director General & Inspector General of Police, Karnataka</h1>
                  <p className="text-xs sm:text-sm mb-1">No.1, Police Head Quarters, Nrupathunga Road</p>
                  <p className="text-xs sm:text-sm mb-1">Opp: Martha's Hospital, Bengaluru-560001</p>
                  <p className="text-xs sm:text-sm mb-2">Contact No : 080-22535100 , Copadmin@ksp.gov.in</p>
                  <p className="text-xs sm:text-sm font-semibold">GSTIN : {billDetails.gstinNumber}</p>
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold border-b-2 border-black dark:border-white pb-2">TAX INVOICE</h2>
            </div>

            {/* Bill Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Details of Service Receiver (BILL TO)</h3>
                <p>Customer Type : Govt / Non Govt</p>
                <p className="font-semibold">M/s {selectedCustomer?.name || 'Karnataka Education Board'}</p>
                <p>{selectedCustomer?.address || 'O/o GOK Education Board, 1ST FLOOR, Bengaluru-560016'}</p>
                <p>GSTIN: {selectedCustomer?.gstNumber || ''}</p>
                <p>State Code: 29</p>
                <p className="font-semibold">Exempted Service / RCM / FCM</p>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-semibold">INVOICE NO</p>
                    <p>{billDetails.billNumber}</p>
                  </div>
                  <div>
                    <p className="font-semibold">INVOICE DATE</p>
                    <p>{formatDate(billDetails.date)}</p>
                  </div>
                </div>
                <p className="font-semibold">Place of Supply</p>
                <p>Karnataka</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="font-semibold">DDO Code</p>
                    <p>{billDetails.ddoCode}</p>
                  </div>
                  <div>
                    <p className="font-semibold">DDO Name</p>
                    <p>DCP CAR HQ</p>
                  </div>
                </div>
                <p className="font-semibold mt-2">DDO City/District</p>
                <p>Bengaluru</p>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full border-collapse border border-black dark:border-white mb-6">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">Sl. No</th>
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">Item Description</th>
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">HSN Code</th>
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">Qty</th>
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">Amount (Rs.)</th>
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">Taxable Value (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black dark:border-white p-2 text-sm">{item.serialNo}</td>
                    <td className="border border-black dark:border-white p-2 text-sm">{item.description}</td>
                    <td className="border border-black dark:border-white p-2 text-sm">{item.hsnNumber} - Public Administration and Security Services</td>
                    <td className="border border-black dark:border-white p-2 text-sm text-center">{item.quantity}</td>
                    <td className="border border-black dark:border-white p-2 text-sm text-right">{formatCurrency(item.amount)}</td>
                    <td className="border border-black dark:border-white p-2 text-sm text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="3" className="border border-black dark:border-white p-2 text-sm font-semibold text-right">Qty.</td>
                  <td className="border border-black dark:border-white p-2 text-sm font-semibold text-center">{totalQuantity}</td>
                  <td className="border border-black dark:border-white p-2 text-sm font-semibold text-right">Total Amt</td>
                  <td className="border border-black dark:border-white p-2 text-sm font-semibold text-right">{formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>

            {/* GST Calculation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold mb-2">Tax is Payable on Reverse Charges: YES / NO/ NA</p>
                <p className="font-semibold">Invoice Remarks:</p>
                <p className="mb-4">{note || 'Notification Details will be displayed'}</p>
                <p className="font-semibold">Total Invoice Value in Words</p>
                <p className="italic">{amountInWords(gstCalculation?.finalAmount || totalAmount)}</p>
              </div>

              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Taxable Value</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Collectable Under FCM</span>
                    <span>-</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IGST @ 18%</span>
                    <span>{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST @ 9%</span>
                    <span className="font-semibold">{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST @ 9%</span>
                    <span className="font-semibold">{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</span>
                  </div>
                  <div className="flex justify-between border-t border-black dark:border-white pt-2">
                    <span>Total GST Amount</span>
                    <span className="font-semibold">{formatCurrency(gstCalculation?.gstAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Invoice Amount</span>
                    <span>{formatCurrency(gstCalculation?.finalAmount || totalAmount)}</span>
                  </div>
                </div>
                <p className="text-sm mt-4">GST Payable Under RCM by the Recipient = IGST: CGST: SGST:</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm">** This is a computer generated invoice **</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handlePrintBill}>
              <Printer className="mr-2" size={16} />
              Print
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}