"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t, getLanguage } from '@/lib/localization';
import { calculateGST, validateBillDate, formatCurrency, validateGSTIN, validateEmail, validateMobile, validatePIN, validateBillNumber, validateAmount, validateDescription, validateName, validateAddress, validateCity, validateStateCode, isGovernmentGSTIN, isGovernmentPAN } from '@/lib/gstUtils';
import { getAllStates, getStateCodeFromGSTIN } from '@/lib/stateCodes';
import { Plus, Trash2, X, Download, Printer, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import { IndeterminateProgressBar, LoadingProgressBar } from '@/components/shared/ProgressBar';
import { useGstinList } from '@/hooks/useGstinList';
import { LOGIN_CONSTANT } from '@/components/utils/constant';
import ProformaAdviceList from '@/components/ddo/ProformaAdviceList';
import ProformaAdviceForm from '@/components/ddo/ProformaAdviceForm';

export default function GenerateBillPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [hsnList, setHsnList] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  
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
  const [gstDetails, setGstDetails] = useState(null);
  const [customerType, setCustomerType] = useState('Govt');
  const [invoiceType, setInvoiceType] = useState('FCM');
  const [taxPayableReverseCharge, setTaxPayableReverseCharge] = useState('YES');
  const [exemptionNo, setExemptionNo] = useState('');
  const [newCustomer, setNewCustomer] = useState({
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
  const [ddoDetails, setDdoDetails] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: 'Union Bank of India-Current Account',
    bankBranch: 'Banaswadi',
    ifscCode: 'UBIN0534567',
    accountNumber: '1234567890123456',
    accountType: 'Current Account'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNavigatingToCustomer, setIsNavigatingToCustomer] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const { gstinList } = useGstinList();
  const [proformaList, setProformaList] = useState([]);
  const [filteredProformaList, setFilteredProformaList] = useState([]);
  const [proformaSearchTerm, setProformaSearchTerm] = useState('');
  const [proformaLoading, setProformaLoading] = useState(true);
  const [isProformaFormOpen, setIsProformaFormOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchGSTDetails();
    getDdoDetails();
    fetchCustomers();
    fetchHSNList();
    fetchProformaRecords();
    setCurrentLang(getLanguage());
    
    const handleLanguageChange = (event) => {
      const newLang = event?.detail?.language || getLanguage();
      setCurrentLang(newLang);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('languageChanged', handleLanguageChange);
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
      const isGovt = selectedCustomer.customerType === 'Govt' || 
                     selectedCustomer.customerType === 'Government' ||
                     (selectedCustomer.gstNumber && isGovernmentGSTIN(selectedCustomer.gstNumber)) ||
                     (selectedCustomer.pan && isGovernmentPAN(selectedCustomer.pan));
      setCustomerType(isGovt ? 'Govt' : 'Non Govt');
      
      if (selectedCustomer.serviceType) {
        const serviceType = selectedCustomer.serviceType.toUpperCase();
        setInvoiceType(serviceType);
      }
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer && lineItems.length > 0) {
      calculateGSTAmount();
    } else {
      setGstCalculation(null);
    }
  }, [selectedCustomer, lineItems, billDetails.gstinNumber, invoiceType, customerType, hsnList]);

  useEffect(() => {
    if (lineItems.length === 0) return;
    
    let needsUpdate = false;
    const updated = lineItems.map(item => {
      const newItem = { ...item };
      
      if (hsnList.length === 1) {
        const defaultHsn = hsnList[0].hsnNumber || hsnList[0].hsnCode || hsnList[0].code || '';
        if (item.hsnNumber !== defaultHsn) {
          newItem.hsnNumber = defaultHsn;
          needsUpdate = true;
        }
      }
      
      const currentQty = parseInt(item.quantity) || 0;
      if (currentQty !== 1) {
        newItem.quantity = 1;
        needsUpdate = true;
      }
      
      return newItem;
    });
    
    if (needsUpdate) {
      setLineItems(updated);
    }
  }, [hsnList.length, hsnList, lineItems.length]);

  useEffect(() => {
    if (!proformaSearchTerm.trim()) {
      setFilteredProformaList(proformaList);
      return;
    }

    const term = proformaSearchTerm.toLowerCase();
    const filtered = proformaList.filter((record) => {
      return [
        record.proformaNumber,
        record.customerName,
        record.serviceType,
        record.taxInvoiceAmount,
      ].some((value) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(term);
      });
    });
    setFilteredProformaList(filtered);
  }, [proformaSearchTerm, proformaList]);

  function getDdoDetails() {
    const storedProfile = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);
    if (storedProfile) {
      try {
        const trimmedValue = storedProfile.trim();
        if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
          const userProfile = JSON.parse(storedProfile);
          if (userProfile && typeof userProfile === 'object' && Object.keys(userProfile).length > 0) {
            setDdoDetails(userProfile);
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing stored profile data:', error);
      }
    }
  }

  const fetchCustomers = async () => {
    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      
      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.CUSTOMER_ACTIVE_LIST}${ddoId}`);
      if (response && response.status === 'success') {
        const customersWithStateCode = (response.data || []).map(customer => {
          if (customer.gstNumber && customer.gstNumber.length >= 2) {
            const stateCode = getStateCodeFromGSTIN(customer.gstNumber);
            if (stateCode) {
              customer.stateCode = stateCode.toString();
            }
          }
          return customer;
        });
        setCustomers(customersWithStateCode);
        if (customersWithStateCode.length > 0) {
          setSelectedCustomer(customersWithStateCode[0]);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  const fetchGSTDetails = async () => {
    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      
      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.GET_CURRENT_GST_OF_DDO}?ddoId=${ddoId}`);
      if (response) {
        setGstDetails(response || []);
        setLoading(false);
        fetchInvoiceNumber(response.gstId);
      }
    } catch (error) {
      console.error('Error fetching GST details:', error);
      setLoading(false);
    }
  };

  const fetchInvoiceNumber = async (gstId) => {
    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      
      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.GENERATE_INVOICE_NUMBER}?ddoId=${ddoId}&gstId=${gstId}`);
      if (response && response.status === 'success') {
        setInvoiceNumber(response?.invoiceNumber || '');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching invoice number:', error);
      setLoading(false);
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

  const fetchProformaRecords = async () => {
    const demoRecords = [
      {
        id: 'PA-2025-0001',
        proformaNumber: 'PA-2025-0001',
        proformaAmount: 500000,
        taxInvoiceAmount: 0,
        customerName: 'M/s Pradeep',
        serviceType: 'Exempted',
        proformaDate: '2025-11-20T00:00:00.000Z',
        invoiceDate: null,
      },
      {
        id: 'PA-2025-0002',
        proformaNumber: 'PA-2025-0002',
        proformaAmount: 200000,
        taxInvoiceAmount: 0,
        customerName: 'Metro Constructions',
        serviceType: 'RCM',
        proformaDate: '2025-11-18T00:00:00.000Z',
        invoiceDate: null,
      },
      {
        id: 'PA-2025-0003',
        proformaNumber: 'PA-2025-0003',
        proformaAmount: 345000,
        taxInvoiceAmount: 125000,
        customerName: 'Global Industries',
        serviceType: 'FCM',
        proformaDate: '2025-11-10T00:00:00.000Z',
        invoiceDate: '2025-11-15T00:00:00.000Z',
      },
    ];

    setProformaList(demoRecords);
    setFilteredProformaList(demoRecords);
    setProformaLoading(false);

    try {
      if (typeof window === 'undefined') {
        return;
      }

      const ddoCode = localStorage.getItem('ddoCode') || '';
      if (!ddoCode) {
        return;
      }

      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.BILL_LIST}?ddoCode=${ddoCode}`);
      if (response?.status === 'success' && Array.isArray(response.data)) {
        const mappedRecords = response.data.map((item, index) => ({
          id: item.id || item.billId || `proforma-${index}`,
          proformaNumber: item.billNumber || item.proformaNumber || `PA-${String(index + 1).padStart(4, '0')}`,
          proformaAmount: item.totalAmount || item.billAmount || 0,
          taxInvoiceAmount: item.invoiceAmount || item.paidAmount || 0,
          customerName: item.customerName || item.customer?.customerName || '-',
          serviceType: item.serviceType || item.invoiceType || '-',
          proformaDate: item.billDate || item.createdAt || item.createdDate || null,
          invoiceDate: item.invoiceDate || item.updatedAt || null,
        }));

        setProformaList(mappedRecords);
        setFilteredProformaList(mappedRecords);
      }
    } catch (error) {
      console.error('Error fetching proforma advices:', error);
    }
  };

  const handleScrollToForm = () => {
    setIsProformaFormOpen(true);
    if (typeof window === 'undefined') return;
    
    setTimeout(() => {
      const formSection = document.getElementById('proforma-form');
      formSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleCreateInvoiceFromProforma = (record) => {
    if (!record) return;
    const reference = record.id || record.proformaNumber;
    router.push(`/ddo/invoices?fromProforma=${encodeURIComponent(reference)}`);
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

    const hasExemption = selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber;
    const isRCMExempted = invoiceType === 'RCM' && hasExemption;
    const isFCMExempted = invoiceType === 'FCM' && hasExemption;

    const supplierGSTIN = billDetails.gstinNumber;
    const customerGSTIN = selectedCustomer.gstNumber || '';
    const customerPAN = selectedCustomer.pan || '';
    
    const firstHSN = lineItems[0]?.hsnNumber;
    const hsnDetails = firstHSN ? hsnList.find(h => 
      h.hsnNumber === firstHSN || 
      h.hsnCode === firstHSN || 
      h.code === firstHSN
    ) : null;
    
    const gstRate = hsnDetails?.igst || hsnDetails?.gstRate || 18;
    
    if (invoiceType === 'EXEMPTED') {
      if (selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber) {
        const exemptionNo = selectedCustomer.exemptionNumber || selectedCustomer.exemptionCertNumber;
        setNote('GST is Exempted with Notification');
        setNotificationDetails(`Notification No. ${exemptionNo} - GST is Exempted`);
      } else {
        setNote('GST is Exempted with Notification');
        setNotificationDetails('Entry 6 of Notification No. 12/2017-CT (Rate) - Exempted from GST');
      }
    } else if (invoiceType === 'RCM') {
      setNote('Reverse Charge Mechanism - Tax payable by recipient');
      if (selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber) {
        const exemptionNo = selectedCustomer.exemptionNumber || selectedCustomer.exemptionCertNumber;
        setNotificationDetails(`Customer Declared Notification: ${exemptionNo}`);
      } else {
        setNotificationDetails('Notification No. 13/2017-CT (Rate) Sl. No. 5 - Services supplied by the Central Government, State Government, Union Territory, or local authority to a business entity');
      }
    } else if (invoiceType === 'FCM') {
      if (selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber) {
        const exemptionNo = selectedCustomer.exemptionNumber || selectedCustomer.exemptionCertNumber;
        setNote('GST is Exempted with Notification');
        setNotificationDetails(`Customer Declared Notification: ${exemptionNo}`);
      } else {
        setNote('Forward Charge Mechanism - Taxable @18%');
        setNotificationDetails('Section 7 of the CGST Act, 2017. Taxable @18% Refer: Sl. No. 5, Notif. 13/2017 + Sec. 9(1) of CGST Act on Bandobast/Security charges');
      }
    }

    if (invoiceType === 'EXEMPTED' || isRCMExempted || isFCMExempted) {
      setGstCalculation({
        taxableValue,
        gstAmount: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        finalAmount: taxableValue,
        isGovernment: invoiceType === 'EXEMPTED',
        isSameState: false,
        gstApplicable: false,
        invoiceType: invoiceType,
        note: '',
        taxPayableBy: 'none',
      });
      return;
    }
    
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
    
    if (invoiceType !== 'RCM' && invoiceType !== 'FCM' && invoiceType !== 'EXEMPTED') {
      if (calculation.isSameState) {
        setNote('CGST @9% + SGST @9% = 18% (Karnataka Same State)');
        setNotificationDetails('Same State - CGST and SGST applicable');
      } else {
        setNote(`IGST @18% (Different State)`);
        setNotificationDetails('Different State - IGST applicable');
      }
    }
  };

  const handleNavigateToAddCustomer = () => {
    setIsNavigatingToCustomer(true);
    router.push('/ddo/customers?add=true');
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    const nameValidation = validateName(newCustomer.name, 'Customer Name');
    if (!nameValidation.valid) {
      toast.error(nameValidation.message);
      return;
    }
    
    const gstValidation = validateGSTIN(newCustomer.gstNumber);
    if (!gstValidation.valid) {
      toast.error(gstValidation.message);
      return;
    }
    
    const addressValidation = validateAddress(newCustomer.address);
    if (!addressValidation.valid) {
      toast.error(addressValidation.message);
      return;
    }
    
    const cityValidation = validateCity(newCustomer.city);
    if (!cityValidation.valid) {
      toast.error(cityValidation.message);
      return;
    }
    
    const stateCodeValidation = validateStateCode(newCustomer.stateCode);
    if (!stateCodeValidation.valid) {
      toast.error(stateCodeValidation.message);
      return;
    }
    
    const pinValidation = validatePIN(newCustomer.pin);
    if (!pinValidation.valid) {
      toast.error(pinValidation.message);
      return;
    }
    
    if (!newCustomer.customerType || newCustomer.customerType.trim() === '') {
      toast.error('Customer Type is required');
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

    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      
      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        return;
      }

      const payload = {
        customerName: newCustomer.name,
        customerType: newCustomer.customerType === 'Govt' ? 'gov' : 'non-gov',
        customerEmail: newCustomer.email,
        address: newCustomer.address,
        pinCode: newCustomer.pin,
        stateCode: newCustomer.stateCode,
        gstNumber: newCustomer.gstNumber,
        city: newCustomer.city,
        mobile: newCustomer.mobile,
        exemptionNumber: newCustomer.exemptionCertNumber || '',
        ddoId: parseInt(ddoId, 10),
      };

      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.CUSTOMER_ADD_OR_EDIT,
        payload
      );
      
      if (response && response.status === 'success') {
        toast.success(response.message || t('alert.success'));
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
        
        const updatedResponse = await ApiService.handleGetRequest(`${API_ENDPOINTS.CUSTOMER_ACTIVE_LIST}${ddoId}`);
        if (updatedResponse && updatedResponse.status === 'success') {
          const mappedCustomers = updatedResponse.data.map((customer) => {
            let stateCode = customer.stateCode || '';
            if (customer.gstNumber && customer.gstNumber.length >= 2) {
              const extractedStateCode = getStateCodeFromGSTIN(customer.gstNumber);
              if (extractedStateCode) {
                stateCode = extractedStateCode.toString();
              }
            }
            return {
              id: customer.id,
              name: customer.customerName || '',
              gstNumber: customer.gstNumber || '',
              address: customer.address || '',
              city: customer.city || '',
              stateCode: stateCode,
              pin: customer.pinCode || '',
              customerType: customer.customerType === 'gov' || customer.customerType === 'Govt' ? 'Govt' : 'Non Govt',
              exemptionCertNumber: customer.exemptionNumber || '',
              mobile: customer.mobile || '',
              email: customer.customerEmail || '',
            };
          });
          setCustomers(mappedCustomers);
          if (mappedCustomers && mappedCustomers.length > 0) {
            const newCustomerData = mappedCustomers.find(c => c.gstNumber === newCustomer.gstNumber) || mappedCustomers[mappedCustomers.length - 1];
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
      console.error('Error saving customer:', error);
      toast.error(t('alert.error'));
    }
  };

  const handleAddLineItem = () => {
    const defaultHsn = hsnList.length === 1 ? (hsnList[0].hsnNumber || hsnList[0].hsnCode || hsnList[0].code || '') : '';
    setLineItems([
      ...lineItems,
      { 
        serialNo: lineItems.length + 1, 
        description: '', 
        amount: 0, 
        hsnNumber: defaultHsn, 
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
    if (field === 'quantity') {
      return;
    }
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const handleSaveBill = async () => {
    const validations = [
      validateGSTIN(billDetails.gstinNumber),
      { valid: billDetails.gstAddress?.trim(), message: t('bill.gstAddressRequired') },
      { valid: ddoDetails.ddoCode?.trim(), message: t('bill.ddoCodeRequired') },
      validateBillNumber(invoiceNumber),
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
      setSaving(true);
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
          quantity: 1,
        })),
        taxableValue: gstCalculation?.taxableValue || 0,
        gstAmount: gstCalculation?.gstAmount || 0,
        igst: gstCalculation?.igst || 0,
        cgst: gstCalculation?.cgst || 0,
        sgst: gstCalculation?.sgst || 0,
        finalAmount: invoiceType === 'RCM' ? taxableValue : (gstCalculation?.finalAmount || 0),
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
      setSaving(false);
    }
  };

  const handlePrintBill = () => {
    const logoImg = document.querySelector('#bill-preview-content img');
    const logoSrc = logoImg ? logoImg.src : '/1.png';
    
    const printWindow = window.open('', '_blank');
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${invoiceNumber}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4;
              margin: 1.5cm 1cm;
            }
            
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              background: #fff;
              padding: 0;
            }
            
            .header-section {
              text-align: center;
              margin-bottom: 25px;
              padding: 20px 0;
              border-bottom: 4px solid #2C5F2D;
            }
            
            .logo-container {
              margin-bottom: 20px;
            }
            
            .logo-container img {
              width: 140px;
              height: 140px;
              object-fit: contain;
            }
            
            .org-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #2C5F2D;
              line-height: 1.3;
            }
            
            .org-details {
              font-size: 13px;
              margin-bottom: 5px;
              line-height: 1.2;
            }
            
            .gstin {
              font-size: 14px;
              font-weight: bold;
              margin-top: 12px;
              color: #2C5F2D;
            }
            
            .invoice-title {
              text-align: center;
              font-size: 28px;
              font-weight: bold;
              margin: 30px 0 25px 0;
              padding: 15px 0;
              background: linear-gradient(135deg, #2C5F2D, #4A7C59);
              color: white;
              border-radius: 10px;
            }
            
            .bill-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 25px;
            }
            
            .bill-section {
              border: 2px solid #2C5F2D;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            
            .section-title {
              font-weight: bold;
              margin-bottom: 12px;
              font-size: 14px;
              color: #2C5F2D;
              border-bottom: 1px solid #2C5F2D;
              padding-bottom: 5px;
            }
            
            .section-content {
              font-size: 12px;
              margin-bottom: 6px;
              line-height: 1.3;
            }
            
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin: 25px 0;
              font-size: 11px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .invoice-table th,
            .invoice-table td {
              border: 2px solid #2C5F2D;
              padding: 10px;
              text-align: left;
            }
            
            .invoice-table th {
              background: linear-gradient(135deg, #2C5F2D, #4A7C59);
              color: white;
              font-weight: bold;
              text-align: center;
              font-size: 11px;
            }
            
            .invoice-table td {
              font-size: 11px;
            }
            
            .invoice-table td.text-right {
              text-align: right;
              font-weight: bold;
            }
            
            .invoice-table td.text-center {
              text-align: center;
              font-weight: bold;
            }
            
            .table-footer {
              background: #f0f0f0 !important;
              font-weight: bold;
            }
            
            .gst-calculation {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin: 25px 0;
            }
            
            .calc-section {
              font-size: 11px;
              border: 2px solid #2C5F2D;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            
            .calc-section h4 {
              color: #2C5F2D;
              margin-bottom: 12px;
              font-size: 13px;
              border-bottom: 1px solid #2C5F2D;
              padding-bottom: 5px;
            }
            
            .calc-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 6px 0;
              border-bottom: 1px dotted #666;
            }
            
            .calc-row.border-top {
              border-top: 2px solid #2C5F2D;
              padding-top: 12px;
              margin-top: 12px;
            }
            
            .calc-row.bold {
              font-weight: bold;
            }
            
            .calc-row.total {
              font-weight: bold;
              font-size: 16px;
              background: linear-gradient(135deg, #2C5F2D, #4A7C59);
              color: white;
              padding: 12px;
              margin: 15px -15px -15px -15px;
              border-radius: 0 0 8px 8px;
            }
            
            .signature-row {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 20px;
              margin-top: 15px;
              padding: 15px;
              border: 1px dashed #b2b2b2;
              border-radius: 8px;
              background: #f8fdf8;
            }
            
            .signature-block span {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #2C5F2D;
              font-weight: 600;
            }
            
            .signature-value {
              margin-top: 8px;
              font-size: 13px;
              font-weight: bold;
              color: #1a1a1a;
            }
            
            .signature-line {
              margin-top: 20px;
              border: 2px solid #999;
              height: 40px;
            }
            
            .terms-section {
              margin-top: 25px;
              padding: 20px 0;
              border-top: 3px solid #2C5F2D;
            }
            
            .terms-section h3 {
              font-weight: bold;
              margin-bottom: 12px;
              font-size: 14px;
              color: #2C5F2D;
            }
            
            .terms-section ol {
              margin-left: 20px;
              font-size: 11px;
              line-height: 1.4;
            }
            
            .terms-section li {
              margin-bottom: 6px;
              font-weight: 500;
            }
            
            .bank-section {
              margin-top: 20px;
              padding: 15px 0;
              border-top: 2px solid #2C5F2D;
            }
            
            .bank-section h3 {
              font-weight: bold;
              margin-bottom: 12px;
              font-size: 14px;
              color: #2C5F2D;
            }
            
            .bank-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              font-size: 12px;
            }
            
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #2C5F2D;
              font-size: 11px;
              font-style: italic;
              font-weight: bold;
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
              ${gstDetails?.gstName || ''}
            </div>
            <div class="org-details">${gstDetails?.address || ''}</div>
            <div class="org-details">${gstDetails?.city || ''} - ${gstDetails?.pinCode || ''}</div>
            <div class="org-details">Contact No : ${gstDetails?.mobile || ''} , ${gstDetails?.email || ''}</div>
            <div class="gstin">GSTIN : ${gstDetails?.gstNumber || ''}</div>
          </div>

          <!-- Invoice Title -->
          <div class="invoice-title">TAX INVOICE</div>

          <!-- Bill Details -->
          <div class="bill-details">
            <div class="bill-section">
              <div class="section-title">Details of Service Receiver (BILL TO)</div>
              <div class="section-content"><strong>Customer Type:</strong> <span style="color: #2C5F2D; font-weight: bold;">${customerType}</span></div>
              <div class="section-content"><strong>M/s:</strong> ${selectedCustomer?.customerName || ''}</div>
              <div class="section-content">${selectedCustomer?.address || ''}</div>
              <div class="section-content"><strong>GSTIN:</strong> ${selectedCustomer?.gstNumber || ''}</div>
              ${exemptionNo ? `<div class="section-content"><strong>Exemption No:</strong> ${selectedCustomer?.exemptionNumber || ''}</div>` : ''}
              <div class="section-content"><strong>State Code:</strong> ${selectedCustomer?.stateCode || ''}</div>
              <div class="section-content"><strong>Exempted Service / RCM / FCM:</strong> <span style="color: #2C5F2D; font-weight: bold;">${invoiceType}</span></div>
            </div>
            <div class="bill-section">
              <div class="section-title">Invoice Details</div>
              <div class="section-content"><strong>Invoice No:</strong> ${invoiceNumber}</div>
              <div class="section-content"><strong>Invoice Date:</strong> ${formatDate(billDetails.date)}</div>
              <div class="section-content"><strong>Place of Supply:</strong> ${billDetails.placeOfSupply || 'Bengaluru'}</div>
              <div class="section-content"><strong>DDO Code:</strong> ${ddoDetails.ddoCode}</div>
              <div class="section-content"><strong>DDO Name:</strong> ${ddoDetails.fullName}</div>
              <div class="section-content"><strong>DDO City/District:</strong> ${ddoDetails.city}</div>
            </div>
          </div>

          <!-- Line Items Table -->
          <table class="invoice-table" style="table-layout: fixed; width: 100%;">
            <colgroup>
              <col style="width: 7%;" />
              <col style="width: 38%;" />
              <col style="width: 10%;" />
              <col style="width: 7%;" />
              <col style="width: 7%;" />
              <col style="width: 15%;" />
              <col style="width: 16%;" />
            </colgroup>
            <thead>
              <tr>
                <th>Sl. No</th>
                <th>Item Description</th>
                <th>HSN Code</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Amount (Rs.)</th>
                <th>Taxable Value (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              ${lineItems.map((item, index) => `
                <tr>
                  <td class="text-center">${item.serialNo}</td>
                  <td>${item.description}</td>
                  <td>${item.hsnNumber} - Public Administration</td>
                  <td class="text-center">1</td>
                  <td class="text-center">Nos</td>
                  <td class="text-right">${formatCurrency(item.amount)}</td>
                  <td class="text-right">${formatCurrency(item.amount)}</td>
                </tr>
              `).join('')}
              <tr class="table-footer">
                <td colspan="3" class="text-right">Total Qty</td>
                <td class="text-center">${totalQuantity}</td>
                <td class="text-center">Nos</td>
                <td class="text-right">Total Amt</td>
                <td class="text-right">${formatCurrency(totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <!-- GST Calculation -->
          ${(function() {
            const hasExemption = selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber;
            const isRCMExempted = invoiceType === 'RCM' && hasExemption;
            const isFCMExempted = invoiceType === 'FCM' && hasExemption;
            const showGSTCalculationUI = invoiceType === 'FCM' && !isFCMExempted;
            const showRCMGST = invoiceType === 'RCM' && !isRCMExempted;
    
            let rcmGSTSection = '';
            if (showRCMGST) {
              rcmGSTSection = '<div class="calc-row"><strong>GST Payable Under RCM by the Recipient = </strong><span>IGST: ' + (gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-') + '  CGST: ' + (gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-') + ' SGST: ' + (gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-') + '</span></div>';
            }
    
            let gstCalcSection = '';
            if (showGSTCalculationUI) {
              gstCalcSection = '<div class="calc-section"><h4>GST Calculation</h4><div class="calc-row"><span><strong>Total Taxable Value</strong></span><span><strong>' + formatCurrency(totalAmount) + '</strong></span></div><div class="calc-row"><span><strong>GST Collectable Under FCM</strong></span><span>-</span></div><div class="calc-row"><span><strong>IGST @ 18%</strong></span><span>' + (gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-') + '</span></div><div class="calc-row"><span><strong>CGST @ 9%</strong></span><span><strong>' + (gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-') + '</strong></span></div><div class="calc-row"><span><strong>SGST @ 9%</strong></span><span><strong>' + (gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-') + '</strong></span></div><div class="calc-row border-top"><span><strong>Total GST Amount</strong></span><span><strong>' + formatCurrency(gstCalculation?.gstAmount || 0) + '</strong></span></div><div class="calc-row total"><span><strong>' + t('bill.totalInvoiceAmount') + '</strong></span><span><strong>' + formatCurrency(totalAdviceAmountReceivable) + '</strong></span></div><div class="signature-row"><div class="signature-block"></div><div class="signature-block" style="display: flex; flex-direction: column;"><div class="signature-value">' + (ddoDetails?.fullName || '-') + '</div><span>' + t('bill.signatureOfDdo') + '</span><div class="signature-line"></div></div></div></div>';
            }
    
            return '<div class="gst-calculation"><div class="calc-section"><h4>Additional Information</h4><div class="calc-row"><strong>Tax is Payable on Reverse Charges:</strong> ' + taxPayableReverseCharge + '</div><div class="calc-row"><strong>Invoice Remarks:</strong></div><div class="calc-row" style="margin-left: 15px; margin-bottom: 12px; min-height: 60px;">' + (note || '-') + '</div><div class="calc-row"><strong>Notification Details:</strong></div><div class="calc-row" style="margin-left: 15px; margin-bottom: 12px; min-height: 80px; font-size: 10px;">' + (notificationDetails || '-') + '</div><div class="calc-row"><strong>Total Invoice Value in Words:</strong></div><div class="calc-row" style="margin-left: 15px; margin-bottom: 12px; font-style: italic; min-height: 60px;">' + amountInWords(totalAdviceAmountReceivable) + '</div>' + rcmGSTSection + '</div>' + gstCalcSection + '</div>';
          })()}

          <!-- Bank Details -->
          <div class="bank-section">
            <h3>Bank Details</h3>
            <div class="bank-details">
              <div>
                <strong>Bank Name:</strong> ${bankDetails.bankName}
                ${bankDetails.bankBranch ? ` | <strong>Branch:</strong> ${bankDetails.bankBranch}` : ''}
                ${bankDetails.ifscCode ? ` | <strong>IFSC:</strong> ${bankDetails.ifscCode}` : ''}
                ${bankDetails.accountNumber ? ` | <strong>Account No:</strong> ${bankDetails.accountNumber}` : ''}
                ${bankDetails.accountType ? ` | ${bankDetails.accountType}` : ''}
              </div>
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

  function numberToWords(num) {
    if (num === 0) return "Zero";

    const words = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
      "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
      "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];

    const tens = [
      "", "", "Twenty", "Thirty", "Forty", "Fifty",
      "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    const units = [
      { value: 10000000, str: "Crore" },
      { value: 100000, str: "Lakh" },
      { value: 1000, str: "Thousand" },
      { value: 100, str: "Hundred" }
    ];

    let result = "";

    for (const unit of units) {
      if (num >= unit.value) {
        const quotient = Math.floor(num / unit.value);
        result += numberToWords(quotient) + " " + unit.str + " ";
        num %= unit.value;
      }
    }

    if (num > 0) {
      if (num < 20) {
        result += words[num] + " ";
      } else {
        result += tens[Math.floor(num / 10)] + " ";
        if (num % 10 > 0) result += words[num % 10] + " ";
      }
    }

    return result.trim();
  }

  const amountInWords = (amount) => {
    if (amount === null || amount === undefined || amount === '') {
      return '';
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount)) {
      return '';
    }

    const rupees = Math.floor(numericAmount);
    const paise = Math.round((numericAmount - rupees) * 100);

    let words = numberToWords(rupees) + ' Rupees';

    if (paise > 0) {
      words += ' and ' + numberToWords(paise) + ' Paise';
    }

    return words + ' Only';
  };

  // Calculate totals
  const totalQuantity = lineItems.length;
  const totalAmount = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalAdviceAmountReceivable = invoiceType === 'RCM' ? totalAmount : (gstCalculation?.finalAmount || totalAmount);
  
  const proformaColumns = [
    { key: 'proformaNumber', label: 'Proforma Advice' },
    { 
      key: 'proformaAmount', 
      label: 'Proforma Advice Amount',
      render: (value) => formatCurrency(value || 0),
    },
    { 
      key: 'taxInvoiceAmount', 
      label: 'Tax Invoice',
      render: (value) => value ? formatCurrency(value) : '-', 
    },
    { 
      key: 'differenceAmount', 
      label: 'Difference Amount',
      render: (_, row) => {
        const difference = (row.proformaAmount || 0) - (row.taxInvoiceAmount || 0);
        return formatCurrency(Math.max(difference, 0));
      },
    },
    { key: 'customerName', label: 'Customer Name' },
    { 
      key: 'serviceType', 
      label: 'Service Type',
      render: (value) => value || '-',
    },
    { 
      key: 'proformaDate', 
      label: 'Proforma Advice Date',
      render: (value) => value ? formatDate(value) : '-',
    },
    { 
      key: 'invoiceDate', 
      label: 'Invoice Date',
      render: (value) => value ? formatDate(value) : '-',
    },
  ];

  const renderProformaActions = (row) => (
    <Button
      variant="primary"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        handleCreateInvoiceFromProforma(row);
      }}
      className="px-3 py-1.5 text-xs sm:text-sm"
    >
      Create Invoice
    </Button>
  );

  const renderDDOSignatureSection = () => (
    <div className="mt-4 pt-4 border-t border-dashed border-[var(--color-border)]">
      <div className="flex flex-row gap-4">
        <div className="flex-1">
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
            {ddoDetails?.fullName || '-'}
          </p>
          <p className="text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
            {t('bill.signatureOfDdo')}
          </p>
          <div className="mt-2 h-16 border-2 border-solid border-[var(--color-border)]"></div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout role="ddo">
      <div className="space-y-3">
        {showForm && (
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl font-bold mb-1 text-[var(--color-text-primary)]">
                  {t('nav.generateBill')}
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {t('bill.generateBillSubtitle')}
                </p>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                    {t('bill.invoiceNo')}
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    readOnly
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-[var(--color-muted)]/50 text-[var(--color-primary)] font-semibold min-w-[260px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
                    {t('bill.invoiceDate')}
                  </label>
                  <input
                    type="date"
                    value={billDetails.date}
                    readOnly
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-[var(--color-muted)]/50 text-[var(--color-accent)] font-semibold min-w-[150px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm ? (
          <ProformaAdviceForm
            loading={loading}
            isNavigatingToCustomer={isNavigatingToCustomer}
            setIsNavigatingToCustomer={setIsNavigatingToCustomer}
            customers={customers}
            setCustomers={setCustomers}
            hsnList={hsnList}
            setHsnList={setHsnList}
            showCustomerModal={showCustomerModal}
            setShowCustomerModal={setShowCustomerModal}
            showPreviewModal={showPreviewModal}
            setShowPreviewModal={setShowPreviewModal}
            invoiceNumber={invoiceNumber}
            billDetails={billDetails}
            setBillDetails={setBillDetails}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            gstDetails={gstDetails}
            customerType={customerType}
            setCustomerType={setCustomerType}
            invoiceType={invoiceType}
            setInvoiceType={setInvoiceType}
            taxPayableReverseCharge={taxPayableReverseCharge}
            setTaxPayableReverseCharge={setTaxPayableReverseCharge}
            exemptionNo={exemptionNo}
            setExemptionNo={setExemptionNo}
            newCustomer={newCustomer}
            setNewCustomer={setNewCustomer}
            lineItems={lineItems}
            setLineItems={setLineItems}
            gstCalculation={gstCalculation}
            setGstCalculation={setGstCalculation}
            paidAmount={paidAmount}
            setPaidAmount={setPaidAmount}
            note={note}
            setNote={setNote}
            notificationDetails={notificationDetails}
            setNotificationDetails={setNotificationDetails}
            ddoDetails={ddoDetails}
            bankDetails={bankDetails}
            saving={saving}
            setSaving={setSaving}
            currentLang={currentLang}
            gstinList={gstinList}
            onNavigateToAddCustomer={handleNavigateToAddCustomer}
            onAddCustomer={handleAddCustomer}
            onAddLineItem={handleAddLineItem}
            onRemoveLineItem={handleRemoveLineItem}
            onLineItemChange={handleLineItemChange}
            onSaveBill={handleSaveBill}
            onPrintBill={handlePrintBill}
            formatDate={formatDate}
            numberToWords={numberToWords}
            amountInWords={amountInWords}
            totalQuantity={totalQuantity}
            totalAmount={totalAmount}
            totalAdviceAmountReceivable={totalAdviceAmountReceivable}
            renderDDOSignatureSection={renderDDOSignatureSection}
            onBackToList={() => setShowForm(false)}
          />
        ) : (
          <ProformaAdviceList
            proformaSearchTerm={proformaSearchTerm}
            setProformaSearchTerm={setProformaSearchTerm}
            filteredProformaList={filteredProformaList}
            proformaLoading={proformaLoading}
            onCreateInvoiceFromProforma={handleCreateInvoiceFromProforma}
            onShowForm={() => setShowForm(true)}
          />
        )}

      </div>
    </Layout>
  );
}