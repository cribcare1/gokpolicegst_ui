"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Layout from '@/components/shared/Layout';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t, getLanguage } from '@/lib/localization';
import { calculateGST, validateBillDate, formatCurrency, validateGSTIN, validateEmail, validateMobile, validatePIN, validateBillNumber, validateAmount, validateDescription, validateName, validateAddress, validateCity, validateStateCode, isGovernmentGSTIN, isGovernmentPAN } from '@/lib/gstUtils';
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
    gstinNumber: '29AAAG01111W1ZB',
    gstAddress: 'No.1, Police Head Quarters, Nrupathunga Road, Opp: Martha\'s Hospital, Bengaluru-560001',
    ddoCode: '0200P00032',
    billNumber: '1ZB/PO0032/0001',
    date: new Date().toISOString().split('T')[0],
    placeOfSupply: 'Bengaluru',
  });
  
  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerType, setCustomerType] = useState('Govt'); // Govt or Non Govt
  const [invoiceType, setInvoiceType] = useState('FCM'); // RCM, FCM, or EXEMPTED
  const [taxPayableReverseCharge, setTaxPayableReverseCharge] = useState('YES'); // YES, NO, NA
  const [exemptionNo, setExemptionNo] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    gstNumber: '',
    address: '',
    stateCode: '',
    pin: '',
    mobile: '',
    email: '',
    customerType: 'Non Govt',
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
  const [notificationDetails, setNotificationDetails] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const { gstinList } = useGstinList();

  useEffect(() => {
    fetchCustomers();
    fetchHSNList();
    loadDDOInfo();
    setCurrentLang(getLanguage());
    
    // Listen for language changes
    const handleLanguageChange = (event) => {
      const newLang = event?.detail?.language || getLanguage();
      setCurrentLang(newLang);
    };
    
    // Listen to custom language change event
    if (typeof window !== 'undefined') {
      window.addEventListener('languageChanged', handleLanguageChange);
      // Also listen to storage events (for cross-tab communication)
      window.addEventListener('storage', (e) => {
        if (e.key === 'preferredLanguage') {
          setCurrentLang(getLanguage());
        }
      });
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('languageChanged', handleLanguageChange);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      // Determine customer type from GSTIN or customer data
      const isGovt = selectedCustomer.customerType === 'Govt' || 
                     (selectedCustomer.gstNumber && isGovernmentGSTIN(selectedCustomer.gstNumber)) ||
                     (selectedCustomer.pan && isGovernmentPAN(selectedCustomer.pan));
      setCustomerType(isGovt ? 'Govt' : 'Non Govt');
      
      // Determine invoice type based on customer type and GSTIN
      if (isGovt) {
        setInvoiceType('EXEMPTED');
        setTaxPayableReverseCharge('NA');
      } else if (selectedCustomer.gstNumber) {
        setInvoiceType('RCM');
        setTaxPayableReverseCharge('YES');
      } else {
        setInvoiceType('FCM');
        setTaxPayableReverseCharge('NO');
      }
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer && lineItems.length > 0) {
      calculateGSTAmount();
    } else {
      setGstCalculation(null);
    }
  }, [selectedCustomer, lineItems, billDetails.gstinNumber, invoiceType, customerType]);

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
    
    // Get HSN details if available (for GST rates)
    const firstHSN = lineItems[0]?.hsnNumber;
    const hsnDetails = firstHSN ? hsnList.find(h => 
      h.hsnNumber === firstHSN || 
      h.hsnCode === firstHSN || 
      h.code === firstHSN
    ) : null;
    
    // Get GST rate from HSN details or default to 18%
    const gstRate = hsnDetails?.igst || hsnDetails?.gstRate || 18;
    
    // Call calculateGST with proper parameters
    const calculation = calculateGST(
      supplierGSTIN,
      customerGSTIN,
      customerPAN,
      taxableValue,
      gstRate,
      invoiceType,
      hsnDetails
    );
    
    setGstCalculation(calculation);
    
    // Update note and notification details based on GST calculation
    if (invoiceType === 'EXEMPTED' || calculation.isGovernment) {
      setNote('Exempted Services - No GST (Government Entity)');
      setNotificationDetails('Entry 6 of Notification No. 12/2017-CT (Rate) - Exempted from GST');
    } else if (invoiceType === 'RCM') {
      setNote('Reverse Charge Mechanism - Tax payable by recipient');
      setNotificationDetails('Notification No. 13/2017-CT (Rate) Sl. No. 5 - Services supplied by the Central Government, State Government, Union Territory, or local authority to a business entity');
    } else if (invoiceType === 'FCM') {
      setNote('Forward Charge Mechanism - Taxable @18%');
      setNotificationDetails('Section 7 of the CGST Act, 2017. Taxable @18% Refer: Sl. No. 5, Notif. 13/2017 + Sec. 9(1) of CGST Act on Bandobast/Security charges');
    } else if (calculation.isSameState) {
      setNote('CGST @9% + SGST @9% = 18% (Karnataka Same State)');
      setNotificationDetails('Same State - CGST and SGST applicable');
    } else {
      setNote(`IGST @18% (Different State)`);
      setNotificationDetails('Different State - IGST applicable');
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
      { valid: billDetails.gstAddress?.trim(), message: t('bill.gstAddressRequired') },
      { valid: billDetails.ddoCode?.trim(), message: t('bill.ddoCodeRequired') },
      validateBillNumber(billDetails.billNumber),
      validateBillDate(billDetails.date),
      { valid: selectedCustomer, message: t('bill.selectCustomerRequired') },
      { valid: lineItems.length > 0, message: t('bill.addLineItemRequired') }
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
      const amountValidation = validateAmount(item.amount, `${t('bill.lineItem')} ${i + 1} ${t('label.amount')}`);
      
      if (!descValidation.valid) {
        toast.error(`${t('bill.lineItem')} ${i + 1}: ${descValidation.message}`);
        return;
      }
      if (!amountValidation.valid) {
        toast.error(`${t('bill.lineItem')} ${i + 1}: ${amountValidation.message}`);
        return;
      }
    }

    const taxableValue = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    if (taxableValue <= 0) {
      toast.error(t('bill.totalTaxableValueGreater'));
      return;
    }

    try {
      setLoading(true);
      const billData = {
        ...billDetails,
        customerId: selectedCustomer.id,
        customerType,
        invoiceType,
        taxPayableReverseCharge,
        exemptionNo,
        lineItems: lineItems.map((item, idx) => ({
          serialNo: idx + 1,
          description: item.description,
          amount: parseFloat(item.amount) || 0,
          hsnNumber: item.hsnNumber,
          quantity: parseInt(item.quantity) || 1,
        })),
        taxableValue: gstCalculation?.taxableValue || 0,
        gstAmount: gstCalculation?.gstAmount || 0,
        igst: gstCalculation?.igst || 0,
        cgst: gstCalculation?.cgst || 0,
        sgst: gstCalculation?.sgst || 0,
        finalAmount: gstCalculation?.finalAmount || 0,
        paidAmount: parseFloat(paidAmount) || 0,
        note,
        notificationDetails,
        status: 'pending',
      };

      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.BILL_ADD,
        billData
      );
      
      if (response && response.status === 'success') {
        toast.success(t('bill.savedSuccessfully'));
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
    // Get logo image source
    const logoImg = document.querySelector('#bill-preview-content img');
    const logoSrc = logoImg ? logoImg.src : '/1.png';
    
    const printWindow = window.open('', '_blank');
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${billDetails.billNumber}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: #000;
              background: #fff;
              padding: 20px;
            }
            .header-section {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #000;
            }
            .logo-container {
              margin-bottom: 15px;
            }
            .logo-container img {
              width: 120px;
              height: 120px;
              object-fit: contain;
            }
            .org-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .org-details {
              font-size: 11px;
              margin-bottom: 4px;
            }
            .gstin {
              font-size: 11px;
              font-weight: bold;
              margin-top: 8px;
            }
            .invoice-title {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
            }
            .bill-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 20px;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 8px;
              font-size: 13px;
            }
            .section-content {
              font-size: 11px;
              margin-bottom: 4px;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 11px;
            }
            .invoice-table th,
            .invoice-table td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            .invoice-table th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .invoice-table td {
              text-align: left;
            }
            .invoice-table td.text-right {
              text-align: right;
            }
            .invoice-table td.text-center {
              text-align: center;
            }
            .gst-calculation {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin: 20px 0;
            }
            .calc-section {
              font-size: 11px;
            }
            .calc-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              padding-bottom: 4px;
            }
            .calc-row.border-top {
              border-top: 1px solid #000;
              padding-top: 8px;
              margin-top: 8px;
            }
            .calc-row.bold {
              font-weight: bold;
            }
            .calc-row.total {
              font-weight: bold;
              font-size: 14px;
            }
            .terms-section {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #000;
            }
            .terms-section h3 {
              font-weight: bold;
              margin-bottom: 8px;
              font-size: 13px;
            }
            .terms-section ol {
              margin-left: 20px;
              font-size: 11px;
            }
            .terms-section li {
              margin-bottom: 4px;
            }
            .bank-section {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #000;
            }
            .bank-section h3 {
              font-weight: bold;
              margin-bottom: 8px;
              font-size: 13px;
            }
            .bank-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              font-size: 11px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 10px;
              font-style: italic;
            }
            @media print {
              body {
                padding: 10px;
              }
              @page {
                margin: 1cm;
                size: A4;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header Section -->
          <div class="header-section">
            <div class="logo-container">
              <img src="${logoSrc}" alt="Bengaluru City Police Logo" />
            </div>
            <div class="org-name">
              Government of Karnataka - Office of the Director General & Inspector General of Police, Karnataka
            </div>
            <div class="org-details">No.1, Police Head Quarters, Nrupathunga Road</div>
            <div class="org-details">Opp: Martha's Hospital, Bengaluru-560001</div>
            <div class="org-details">Contact No : 080-22535100 , Copadmin@ksp.gov.in</div>
            <div class="gstin">GSTIN : ${billDetails.gstinNumber}</div>
          </div>

          <!-- Invoice Title -->
          <div class="invoice-title">TAX INVOICE</div>

          <!-- Bill Details -->
          <div class="bill-details">
            <div>
              <div class="section-title">Details of Service Receiver (BILL TO)</div>
              <div class="section-content"><strong>Customer Type:</strong> ${customerType}</div>
              <div class="section-content"><strong>M/s:</strong> ${selectedCustomer?.name || 'Karnataka Education Board'}</div>
              <div class="section-content">${selectedCustomer?.address || 'O/o GOK Education Board, 1ST FLOOR, Bengaluru-560016'}</div>
              <div class="section-content">GSTIN: ${selectedCustomer?.gstNumber || ''}</div>
              ${exemptionNo ? `<div class="section-content">Exemption No: ${exemptionNo}</div>` : ''}
              <div class="section-content">State Code: ${selectedCustomer?.stateCode || '29'}</div>
              <div class="section-content"><strong>Exempted Service / RCM / FCM:</strong> ${invoiceType}</div>
            </div>
            <div>
              <div class="section-title">Invoice Details</div>
              <div class="section-content"><strong>Invoice No:</strong> ${billDetails.billNumber}</div>
              <div class="section-content"><strong>Invoice Date:</strong> ${formatDate(billDetails.date)}</div>
              <div class="section-content"><strong>Place of Supply:</strong> ${billDetails.placeOfSupply || 'Bengaluru'}</div>
              <div class="section-content"><strong>DDO Code:</strong> ${billDetails.ddoCode}</div>
              <div class="section-content"><strong>DDO Name:</strong> DCP CAR HQ</div>
              <div class="section-content"><strong>DDO City/District:</strong> Bengaluru</div>
            </div>
          </div>

          <!-- Line Items Table -->
          <table class="invoice-table" style="table-layout: fixed; width: 100%;">
            <colgroup>
              <col style="width: 5%;" />
              <col style="width: 45%;" />
              <col style="width: 10%;" />
              <col style="width: 6%;" />
              <col style="width: 12%;" />
              <col style="width: 12%;" />
            </colgroup>
            <thead>
              <tr>
                <th>Sl. No</th>
                <th>Item Description</th>
                <th>HSN Code</th>
                <th>Qty</th>
                <th>Amount (Rs.)</th>
                <th>Taxable Value (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              ${lineItems.map((item, index) => `
                <tr>
                  <td class="text-center">${item.serialNo}</td>
                  <td>${item.description}</td>
                  <td>${item.hsnNumber}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.amount)}</td>
                  <td class="text-right">${formatCurrency(item.amount)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="3" class="text-right bold">Total Qty</td>
                <td class="text-center bold">${totalQuantity}</td>
                <td class="text-right bold">Total Amt</td>
                <td class="text-right bold">${formatCurrency(totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <!-- GST Calculation -->
          <div class="gst-calculation">
            <div class="calc-section">
              <div class="calc-row"><strong>Govt / Non Govt:</strong> ${customerType}</div>
              <div class="calc-row"><strong>Tax is Payable on Reverse Charges:</strong> ${taxPayableReverseCharge}</div>
              <div class="calc-row"><strong>Invoice Remarks:</strong></div>
              <div class="calc-row" style="margin-left: 20px; margin-bottom: 10px;">${note || '-'}</div>
              <div class="calc-row"><strong>Notification Details:</strong></div>
              <div class="calc-row" style="margin-left: 20px; margin-bottom: 10px; font-size: 10px;">${notificationDetails || '-'}</div>
              <div class="calc-row"><strong>Total Invoice Value in Words:</strong></div>
              <div class="calc-row" style="margin-left: 20px; margin-bottom: 10px; font-style: italic;">${amountInWords(gstCalculation?.finalAmount || totalAmount)}</div>
              <div class="calc-row"><strong>GST Payable Under RCM by the Recipient:</strong></div>
              <div class="calc-row" style="margin-left: 20px;">
                IGST: ${invoiceType === 'RCM' && gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'} | 
                CGST: ${invoiceType === 'RCM' && gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'} | 
                SGST: ${invoiceType === 'RCM' && gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}
              </div>
            </div>
            <div class="calc-section">
              <div class="calc-row">
                <span>Total Taxable Value</span>
                <span class="bold">${formatCurrency(totalAmount)}</span>
              </div>
              <div class="calc-row">
                <span>GST Collectable Under FCM</span>
                <span>-</span>
              </div>
              <div class="calc-row">
                <span>IGST @ 18%</span>
                <span>${gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
              </div>
              <div class="calc-row">
                <span>CGST @ 9%</span>
                <span class="bold">${gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</span>
              </div>
              <div class="calc-row">
                <span>SGST @ 9%</span>
                <span class="bold">${gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</span>
              </div>
              <div class="calc-row border-top">
                <span>Total GST Amount</span>
                <span class="bold">${formatCurrency(gstCalculation?.gstAmount || 0)}</span>
              </div>
              <div class="calc-row total">
                <span>Total Invoice Amount</span>
                <span>${formatCurrency(gstCalculation?.finalAmount || totalAmount)}</span>
              </div>
            </div>
          </div>

          <!-- Terms and Conditions -->
          <div class="terms-section">
            <h3>Terms and Conditions</h3>
            <ol>
              <li>The Invoices which are digital signed do not need our physical seal & signature for payment processing.</li>
              <li>Payments to be received within 30 days from the bill date.</li>
            </ol>
          </div>

          <!-- Bank Details -->
          <div class="bank-section">
            <h3>Bank Details</h3>
            <div class="bank-details">
              <div><strong>Bank Name:</strong> Union Bank of India-Current Account</div>
              <div><strong>Bank Branch:</strong> Banaswadi</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            ** This is a computer generated invoice **
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
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
                {t('bill.generateBillSubtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Header Section with Logo - Centered */}
          <div className="border-b-2 border-[var(--color-border)] pb-4">
            <div className="flex flex-col items-center gap-4">
              {/* Logo Section - Centered */}
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
              
              {/* Header Text Section - Centered */}
              <div className="text-center">
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
              {t('bill.taxInvoice')}
            </h2>
          </div>

          {/* Bill To and Invoice Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bill To Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--color-text-primary)]">{t('bill.serviceReceiver')} (BILL TO)</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">{t('bill.customerType')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <label 
                    className={`
                      relative flex items-center justify-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200
                      ${customerType === 'Govt' 
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-md' 
                        : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="customerType"
                      value="Govt"
                      checked={customerType === 'Govt'}
                      onChange={(e) => {
                        setCustomerType(e.target.value);
                        if (e.target.value === 'Govt') {
                          setInvoiceType('EXEMPTED');
                          setTaxPayableReverseCharge('NA');
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                      ${customerType === 'Govt' 
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' 
                        : 'border-[var(--color-border)] bg-transparent'
                      }
                    `}>
                      {customerType === 'Govt' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className={`font-medium transition-colors ${
                      customerType === 'Govt' 
                        ? 'text-[var(--color-primary)]' 
                        : 'text-[var(--color-text-secondary)]'
                    }`}>
                      Govt
                    </span>
                  </label>
                  <label 
                    className={`
                      relative flex items-center justify-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200
                      ${customerType === 'Non Govt' 
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-md' 
                        : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="customerType"
                      value="Non Govt"
                      checked={customerType === 'Non Govt'}
                      onChange={(e) => {
                        setCustomerType(e.target.value);
                        if (e.target.value === 'Non Govt' && selectedCustomer?.gstNumber) {
                          setInvoiceType('RCM');
                          setTaxPayableReverseCharge('YES');
                        } else if (e.target.value === 'Non Govt') {
                          setInvoiceType('FCM');
                          setTaxPayableReverseCharge('NO');
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                      ${customerType === 'Non Govt' 
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' 
                        : 'border-[var(--color-border)] bg-transparent'
                      }
                    `}>
                      {customerType === 'Non Govt' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className={`font-medium transition-colors ${
                      customerType === 'Non Govt' 
                        ? 'text-[var(--color-primary)]' 
                        : 'text-[var(--color-text-secondary)]'
                    }`}>
                      Non Govt
                    </span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.selectCustomer')}</label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value);
                    setSelectedCustomer(customer || null);
                  }}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                >
                  <option value="">{t('bill.selectCustomerPlaceholder')}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.gstNumber || t('common.noGstin')}
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
                  {t('bill.addNewCustomer')}
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('common.ms')}</label>
                <input
                  type="text"
                  value={selectedCustomer?.name || ''}
                  readOnly
                  className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded"
                  placeholder={t('bill.customerName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('label.address')}</label>
                <textarea
                  value={selectedCustomer?.address || ''}
                  readOnly
                  className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded resize-none"
                  rows="2"
                  placeholder={t('bill.customerAddress')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('label.gstin')}</label>
                  <input
                    type="text"
                    value={selectedCustomer?.gstNumber || ''}
                    readOnly
                    className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded uppercase"
                    placeholder={t('label.gstin')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.exemptionNo')}</label>
                  <input
                    type="text"
                    value={exemptionNo}
                    onChange={(e) => setExemptionNo(e.target.value)}
                    className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                    placeholder={t('bill.exemptionNoPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('label.stateCode')}</label>
                <input
                  type="text"
                  value={selectedCustomer?.stateCode || '29'}
                  readOnly
                  className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.exemptedService')} / RCM / FCM</label>
                <select 
                  value={invoiceType}
                  onChange={(e) => {
                    setInvoiceType(e.target.value);
                    if (e.target.value === 'EXEMPTED') {
                      setTaxPayableReverseCharge('NA');
                    } else if (e.target.value === 'RCM') {
                      setTaxPayableReverseCharge('YES');
                    } else {
                      setTaxPayableReverseCharge('NO');
                    }
                  }}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                >
                  <option value="EXEMPTED">Exempted Service</option>
                  <option value="RCM">RCM</option>
                  <option value="FCM">FCM</option>
                </select>
              </div>
            </div>

            {/* Invoice Details Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.invoiceNo')}</label>
                  <input
                    type="text"
                    value={billDetails.billNumber}
                    onChange={(e) => setBillDetails({...billDetails, billNumber: e.target.value})}
                    className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.invoiceDate')}</label>
                  <input
                    type="date"
                    value={billDetails.date}
                    onChange={(e) => setBillDetails({...billDetails, date: e.target.value})}
                    className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.placeOfSupply')}</label>
                <input
                  type="text"
                  value={billDetails.placeOfSupply}
                  onChange={(e) => setBillDetails({...billDetails, placeOfSupply: e.target.value})}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('label.ddoCode')}</label>
                  <input
                    type="text"
                    value={billDetails.ddoCode}
                    onChange={(e) => setBillDetails({...billDetails, ddoCode: e.target.value})}
                    className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('label.ddoName')}</label>
                  <input
                    type="text"
                    value="DCP CAR HQ"
                    readOnly
                    className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.ddoCityDistrict')}</label>
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
            <table className="w-full border-collapse border border-[var(--color-border)] table-fixed">
              <colgroup>
                <col style={{ width: '5%' }} /> {/* Serial No */}
                <col style={{ width: '45%' }} /> {/* Item Description - Bigger */}
                <col style={{ width: '10%' }} /> {/* HSN Code - Smaller */}
                <col style={{ width: '6%' }} /> {/* Qty - Smaller */}
                <col style={{ width: '12%' }} /> {/* Amount */}
                <col style={{ width: '12%' }} /> {/* Taxable Value */}
                <col style={{ width: '10%' }} /> {/* Action */}
              </colgroup>
              <thead>
                <tr className="bg-[var(--color-muted)]">
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">{t('bill.serialNo')}</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">{t('bill.itemDescription')}</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">{t('bill.hsnCode')}</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">{t('bill.quantity')}</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">{t('bill.amount')}</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">{t('bill.taxableValueRs')}</th>
                  <th className="border border-[var(--color-border)] p-2 text-left font-semibold text-sm">{t('bill.action')}</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-[var(--color-border)] p-2 text-sm text-center">{item.serialNo}</td>
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
                    {t('bill.totalQty')}
                  </td>
                  <td className="border border-[var(--color-border)] p-2 text-sm font-semibold text-center">
                    {totalQuantity}
                  </td>
                  <td className="border border-[var(--color-border)] p-2 text-sm font-semibold text-right">
                    {t('bill.totalAmt')}
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
            {t('bill.addLineItem')}
          </Button>

          {/* GST Calculation Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.govtNonGovt')}</label>
                <div className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded">
                  {customerType}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.taxPayableReverse')}</label>
                <select 
                  value={taxPayableReverseCharge}
                  onChange={(e) => setTaxPayableReverseCharge(e.target.value)}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                >
                  <option value="YES">{t('bill.yes')}</option>
                  <option value="NO">{t('bill.no')}</option>
                  <option value="NA">{t('bill.na')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.invoiceRemarks')}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded resize-none"
                  rows="2"
                  placeholder={t('bill.invoiceRemarksPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.notificationDetails')}</label>
                <div className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded text-sm min-h-[60px]">
                  {notificationDetails || '-'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.totalInvoiceValueWords')}</label>
                <div className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded italic min-h-[50px]">
                  {amountInWords(gstCalculation?.finalAmount || totalAmount)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.gstPayableRCM')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs mb-1">IGST:</label>
                    <input
                      type="text"
                      value={invoiceType === 'RCM' && gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}
                      readOnly
                      className="premium-input w-full px-2 py-1 bg-[var(--color-muted)] border border-[var(--color-border)] rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">CGST:</label>
                    <input
                      type="text"
                      value={invoiceType === 'RCM' && gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}
                      readOnly
                      className="premium-input w-full px-2 py-1 bg-[var(--color-muted)] border border-[var(--color-border)] rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">SGST:</label>
                    <input
                      type="text"
                      value={invoiceType === 'RCM' && gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}
                      readOnly
                      className="premium-input w-full px-2 py-1 bg-[var(--color-muted)] border border-[var(--color-border)] rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-sm font-medium">{t('bill.totalTaxableValue')}</div>
                <div className="text-sm font-semibold text-right">{formatCurrency(totalAmount)}</div>

                <div className="text-sm font-medium">{t('bill.gstCollectableFCM')}</div>
                <div className="text-sm text-right">-</div>

                <div className="text-sm font-medium">{t('bill.igst18')}</div>
                <div className="text-sm text-right">{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</div>

                <div className="text-sm font-medium">{t('bill.cgst9')}</div>
                <div className="text-sm font-semibold text-right">{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</div>

                <div className="text-sm font-medium">{t('bill.sgst9')}</div>
                <div className="text-sm font-semibold text-right">{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</div>

                <div className="text-sm font-medium border-t border-[var(--color-border)] pt-2">{t('bill.totalGstAmount')}</div>
                <div className="text-sm font-semibold text-right border-t border-[var(--color-border)] pt-2">
                  {formatCurrency(gstCalculation?.gstAmount || 0)}
                </div>

                <div className="text-sm font-medium">{t('bill.totalInvoiceAmount')}</div>
                <div className="text-sm font-bold text-right text-[var(--color-primary)]">
                  {formatCurrency(gstCalculation?.finalAmount || totalAmount)}
                </div>
              </div>

            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mt-6 border-t border-[var(--color-border)] pt-4">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">{t('bill.termsConditions')}</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--color-text-secondary)]">
              <li>{t('bill.term1')}</li>
              <li>{t('bill.term2')}</li>
            </ol>
          </div>

          {/* Bank Details */}
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">{t('bill.bankDetails')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.bankName')}</label>
                <input
                  type="text"
                  value="Union Bank of India-Current Account"
                  readOnly
                  className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{t('bill.bankBranch')}</label>
                <input
                  type="text"
                  value="Banaswadi"
                  readOnly
                  className="premium-input w-full px-3 py-2 bg-[var(--color-muted)] border border-[var(--color-border)] rounded"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setShowPreviewModal(true)}>
              <FileText className="mr-2" size={16} />
              {t('bill.preview')}
            </Button>
            <Button variant="primary" onClick={handleSaveBill} disabled={loading}>
              {loading ? t('bill.saving') : t('bill.saveBill')}
            </Button>
          </div>
        </div>

        {/* Add Customer Modal */}
        <Modal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          title={t('bill.addNewCustomer')}
          size="lg"
        >
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                {t('bill.customerNameRequired')}
              </label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                placeholder={t('bill.enterCustomerName')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                {t('bill.gstinNumberRequired')}
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
                {t('bill.addressRequired')}
              </label>
              <textarea
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded resize-none"
                rows="3"
                placeholder={t('bill.enterCompleteAddress')}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                  {t('bill.stateCodeRequired')}
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
                  {t('bill.pinCodeRequired')}
                </label>
                <input
                  type="text"
                  value={newCustomer.pin}
                  onChange={(e) => setNewCustomer({...newCustomer, pin: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                    setNewCustomer({...newCustomer, pin: pastedText});
                  }}
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
                  {t('bill.mobileNumberRequired')}
                </label>
                <input
                  type="text"
                  value={newCustomer.mobile}
                  onChange={(e) => setNewCustomer({...newCustomer, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 10);
                    setNewCustomer({...newCustomer, mobile: pastedText});
                  }}
                  className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  placeholder="9876543210"
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                  {t('bill.emailRequired')}
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
                {t('btn.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('btn.addCustomer')}
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
          <div id="bill-preview-content" className="p-6 bg-white dark:bg-gray-900 text-black dark:text-white">
            {/* Header with Logo - Centered */}
            <div className="mb-6 border-b-2 border-black dark:border-white pb-4">
              <div className="flex flex-col items-center gap-4">
                {/* Logo Section - Centered */}
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
                
                {/* Header Text Section - Centered */}
                <div className="text-center">
                  <h1 className="text-base sm:text-lg font-bold mb-2">Government of Karnataka - Office of the Director General & Inspector General of Police, Karnataka</h1>
                  <p className="text-xs sm:text-sm mb-1">No.1, Police Head Quarters, Nrupathunga Road</p>
                  <p className="text-xs sm:text-sm mb-1">Opp: Martha's Hospital, Bengaluru-560001</p>
                  <p className="text-xs sm:text-sm mb-2">Contact No : 080-22535100 , Copadmin@ksp.gov.in</p>
                  <p className="text-xs sm:text-sm font-semibold">GSTIN : {billDetails.gstinNumber}</p>
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold border-b-2 border-black dark:border-white pb-2">{t('bill.taxInvoice')}</h2>
            </div>

            {/* Bill Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">{t('bill.serviceReceiver')} (BILL TO)</h3>
                <p className="mb-1"><strong>{t('bill.customerType')}:</strong> {customerType}</p>
                <p className="font-semibold mb-1">{t('common.ms')} {selectedCustomer?.name || 'Karnataka Education Board'}</p>
                <p className="mb-1">{selectedCustomer?.address || 'O/o GOK Education Board, 1ST FLOOR, Bengaluru-560016'}</p>
                <p className="mb-1">{t('label.gstin')}: {selectedCustomer?.gstNumber || ''}</p>
                {exemptionNo && <p className="mb-1">{t('bill.exemptionNo')}: {exemptionNo}</p>}
                <p className="mb-1">{t('label.stateCode')}: {selectedCustomer?.stateCode || '29'}</p>
                <p className="font-semibold mb-1">{t('bill.exemptedService')} / RCM / FCM: {invoiceType}</p>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-semibold">{t('bill.invoiceNo')}</p>
                    <p>{billDetails.billNumber}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{t('bill.invoiceDate')}</p>
                    <p>{formatDate(billDetails.date)}</p>
                  </div>
                </div>
                <p className="font-semibold">{t('bill.placeOfSupply')}</p>
                <p>{billDetails.placeOfSupply || 'Bengaluru'}</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="font-semibold">{t('label.ddoCode')}</p>
                    <p>{billDetails.ddoCode}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{t('label.ddoName')}</p>
                    <p>DCP CAR HQ</p>
                  </div>
                </div>
                <p className="font-semibold mt-2">{t('bill.ddoCityDistrict')}</p>
                <p>Bengaluru</p>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full border-collapse border border-black dark:border-white mb-6 table-fixed">
              <colgroup>
                <col style={{ width: '5%' }} /> {/* Serial No */}
                <col style={{ width: '45%' }} /> {/* Item Description - Bigger */}
                <col style={{ width: '10%' }} /> {/* HSN Code - Smaller */}
                <col style={{ width: '6%' }} /> {/* Qty - Smaller */}
                <col style={{ width: '12%' }} /> {/* Amount */}
                <col style={{ width: '12%' }} /> {/* Taxable Value */}
              </colgroup>
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">{t('bill.serialNo')}</th>
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">{t('bill.itemDescription')}</th>
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">{t('bill.hsnCode')}</th>
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">{t('bill.quantity')}</th>
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">{t('bill.amount')}</th>
                  <th className="border border-black dark:border-white p-2 text-left font-semibold text-sm">{t('bill.taxableValueRs')}</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black dark:border-white p-2 text-sm">{item.serialNo}</td>
                    <td className="border border-black dark:border-white p-2 text-sm">{item.description}</td>
                    <td className="border border-black dark:border-white p-2 text-sm">{item.hsnNumber} - {t('bill.publicAdministration')}</td>
                    <td className="border border-black dark:border-white p-2 text-sm text-center">{item.quantity}</td>
                    <td className="border border-black dark:border-white p-2 text-sm text-right">{formatCurrency(item.amount)}</td>
                    <td className="border border-black dark:border-white p-2 text-sm text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="3" className="border border-black dark:border-white p-2 text-sm font-semibold text-right">{t('bill.totalQty')}</td>
                  <td className="border border-black dark:border-white p-2 text-sm font-semibold text-center">{totalQuantity}</td>
                  <td className="border border-black dark:border-white p-2 text-sm font-semibold text-right">{t('bill.totalAmt')}</td>
                  <td className="border border-black dark:border-white p-2 text-sm font-semibold text-right">{formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>

            {/* GST Calculation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="font-semibold mb-1">{t('bill.govtNonGovt')}: {customerType}</p>
                <p className="font-semibold mb-1">{t('bill.taxPayableReverse')}: {taxPayableReverseCharge}</p>
                <p className="font-semibold mb-1">{t('bill.invoiceRemarks')}:</p>
                <p className="mb-2">{note || '-'}</p>
                <p className="font-semibold mb-1">{t('bill.notificationDetails')}:</p>
                <p className="mb-2 text-sm">{notificationDetails || '-'}</p>
                <p className="font-semibold mb-1">{t('bill.totalInvoiceValueWords')}</p>
                <p className="italic mb-4">{amountInWords(gstCalculation?.finalAmount || totalAmount)}</p>
                <p className="font-semibold mb-1">{t('bill.gstPayableRCM')}</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>IGST: {invoiceType === 'RCM' && gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</div>
                  <div>CGST: {invoiceType === 'RCM' && gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</div>
                  <div>SGST: {invoiceType === 'RCM' && gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</div>
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('bill.totalTaxableValue')}</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('bill.gstCollectableFCM')}</span>
                    <span>-</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('bill.igst18')}</span>
                    <span>{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('bill.cgst9')}</span>
                    <span className="font-semibold">{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('bill.sgst9')}</span>
                    <span className="font-semibold">{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</span>
                  </div>
                  <div className="flex justify-between border-t border-black dark:border-white pt-2">
                    <span>{t('bill.totalGstAmount')}</span>
                    <span className="font-semibold">{formatCurrency(gstCalculation?.gstAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('bill.totalInvoiceAmount')}</span>
                    <span>{formatCurrency(gstCalculation?.finalAmount || totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-6 border-t border-black dark:border-white pt-4">
              <h3 className="font-semibold mb-2">{t('bill.termsConditions')}</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>{t('bill.term1')}</li>
                <li>{t('bill.term2')}</li>
              </ol>
            </div>

            {/* Bank Details */}
            <div className="mt-4 border-t border-black dark:border-white pt-4">
              <h3 className="font-semibold mb-2">{t('bill.bankDetails')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>{t('bill.bankName')}:</strong> Union Bank of India-Current Account</p>
                </div>
                <div>
                  <p><strong>{t('bill.bankBranch')}:</strong> Banaswadi</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm">{t('bill.computerGenerated')}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
              {t('bill.close')}
            </Button>
            <Button variant="primary" onClick={handlePrintBill}>
              <Printer className="mr-2" size={16} />
              {t('bill.print')}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}