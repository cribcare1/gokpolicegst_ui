"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import SignaturePad from '@/components/shared/SignaturePad';
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
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [ddoSignature, setDdoSignature] = useState(null);
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
      description: '', 
      amount: "", 
      hsnNumber: '',
      quantity: 1
    },
    { 
      serialNo: 2, 
      description: '', 
      amount: "", 
      hsnNumber: '',
      quantity: 1
    },
  ]);
  
  // Calculations
  const [gstCalculation, setGstCalculation] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [note, setNote] = useState('');
  const [notificationDetails, setNotificationDetails] = useState('');
  const [ddoDetails, setDdoDetails] = useState('');
  const [bankDetails, setBankDetails] = useState(null);
  
  // RCM specific fields
  const [rcmIgst, setRcmIgst] = useState(0);
  const [rcmCgst, setRcmCgst] = useState(0);
  const [rcmSgst, setRcmSgst] = useState(0);
  // const [loading, setLoading] = useState(true);
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
  const [isInvoiceCreation, setIsInvoiceCreation] = useState(false);

  useEffect(() => {
    fetchProformaAdviceDetails();
    fetchGSTDetails();
    fetchDdoBankData();
    getDdoDetails();
    fetchCustomers();
    fetchHSNList();
    // fetchProformaRecords();
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
    console.log('selectedCustomer changed:', selectedCustomer);
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
    console.log('=== useEffect for GST Calculation Triggered ===');
    console.log('selectedCustomer:', selectedCustomer);
    console.log('lineItems:', lineItems);
    console.log('gstDetails:', gstDetails);
    
    if (selectedCustomer && lineItems.length > 0) {
      console.log('Calling calculateGSTAmount...');
      calculateGSTAmount();
    } else {
      console.log('Conditions not met, clearing GST calculation');
      setGstCalculation(null);
    }
  }, [selectedCustomer, lineItems, billDetails.gstinNumber, invoiceType, customerType, hsnList, gstDetails]);

  useEffect(() => {
    if (lineItems.length === 0) return;
    
    let needsUpdate = false;
    const updated = lineItems.map(item => {
      const newItem = { ...item };
      
      if (hsnList.length === 1) {
        const defaultHsn =  hsnList[0].hsnCode  || '';
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

  // Update RCM IGST, CGST, and SGST fields when gstCalculation changes
  useEffect(() => {
    if (invoiceType === 'RCM' && gstCalculation) {
      setRcmIgst(gstCalculation.igst || 0);
      setRcmCgst(gstCalculation.cgst || 0);
      setRcmSgst(gstCalculation.sgst || 0);
      console.log('RCM Fields Updated:', {
        igst: gstCalculation.igst || 0,
        cgst: gstCalculation.cgst || 0,
        sgst: gstCalculation.sgst || 0
      });
    } else if (invoiceType !== 'RCM') {
      setRcmIgst(0);
      setRcmCgst(0);
      setRcmSgst(0);
    }
  }, [gstCalculation, invoiceType]);

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
        // setLoading(false);
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
        // Don't auto-select any customer - let user choose manually
        // setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      // setLoading(false);
    }
  };

  const fetchDdoBankData = async () => {
      try {
        // setLoading(true);
        const url = `${API_ENDPOINTS.BANK_LIST}?ddoId=` + localStorage.getItem(LOGIN_CONSTANT.USER_ID);
        const response = await ApiService.handleGetRequest(url);
        if (response && response.status === 'success') {
          
            setBankDetails(response.data[0] || null);

        }
      } catch (error) {
        console.log('Error fetching bank data:', error);
      } finally {
       // setLoading(false);
      }
    };
  
  const fetchProformaAdviceDetails = async () => { 
    try {
      setProformaLoading(true);
      const ddoId = parseInt(localStorage.getItem(LOGIN_CONSTANT.USER_ID), 10);
      const gstId = parseInt(localStorage.getItem(LOGIN_CONSTANT.GSTID), 10);
      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        setProformaList([]);
        setFilteredProformaList([]);
        return;
      }

      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.PROFORMA_ADVICE_LIST}${ddoId}&gstId=${gstId}&status=SAVED`);

      // Handle multiple possible shapes from backend
      const okStatus = response && (response.status === 'success' || response.status === 'SUCCESS' || response.status === true);
      let payloadArray = [];

      if (okStatus) {
        if (Array.isArray(response.data)) {
          payloadArray = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          payloadArray = response.data.data;
        } else if (response.data && typeof response.data === 'object') {
          // single object -> wrap
          payloadArray = [response.data];
        }
      } else {
        // Some APIs may return the array directly (without status) or different structure
        if (Array.isArray(response)) {
          payloadArray = response;
        } else if (response && Array.isArray(response.data)) {
          payloadArray = response.data;
        }
      }

      const mappedRecords = (payloadArray || []).map((item) => {
        const items = Array.isArray(item.items) ? item.items : [];
        const proformaAmount = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0) || item.totalAmount || item.grandTotal || 0;

        // Extract complete customer information
        const customerResponse = item.customerResponse || item.customer || {};
        console.log('📊 Raw customer data from API:', customerResponse);
        
        const customerData = {
          id: customerResponse.id || null,
          customerName: customerResponse.name || customerResponse.customerName || customerResponse.customerName || '-',
          gstNumber: customerResponse.gstNumber || customerResponse.gstinNumber || '',
          address: customerResponse.address || '',
          city: customerResponse.city || '',
          stateCode: customerResponse.stateCode || '',
          pin: customerResponse.pinCode || customerResponse.pin || '',
          customerType: customerResponse.customerType || customerResponse.type || 'Govt',
          mobile: customerResponse.mobile || '',
          email: customerResponse.customerEmail || customerResponse.email || '',
          exemptionNumber: customerResponse.exemptionNumber || customerResponse.exemptionCertNumber || ''
        };
        
        console.log('🔧 Mapped customer data:', customerData);

        return {
          id: item.invoiceId || item.id || item.proformaId || null,
          proformaNumber: item.invoiceNumber || item.proformaNumber || `INV-${item.invoiceId || item.id || ''}`,
          invoiceNumber: item.invoiceNumber || item.billNumber || item.proformaNumber || `INV-${item.invoiceId || item.id || ''}`,
          proformaAmount: proformaAmount,
          taxInvoiceAmount: item.paidAmount || item.invoiceAmount || item.paidAmount || 0,
          customerName: customerData.customerName,
          serviceType: item.serviceType || item.invoiceType || '-',
          proformaDate: item.invoiceDate || item.createdAt || item.proformaDate || null,
          invoiceDate: new Date().toISOString(),
          signature: item.signature || (item.ddoSignature && item.ddoSignature.signatureUrl) || null,
          raw: {
            ...item,
            // Ensure customer data is preserved in raw for edit functionality
            customer: customerData,
            customerResponse: customerData
          },
        };
      });

      setProformaList(mappedRecords);
      setFilteredProformaList(mappedRecords);
      setProformaLoading(false);
    } catch (error) {
      console.error('Error fetching proforma advice details:', error);
      setProformaList([]);
      setFilteredProformaList([]);
    } finally {
      setProformaLoading(false);
    }
  };

  const fetchGSTDetails = async () => { 
    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      
      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        // setLoading(false);
        return;
      }

      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.GET_CURRENT_GST_OF_DDO}?ddoId=${ddoId}`);
      if (response) {
        setGstDetails(response || []);
        // setLoading(false);
        fetchInvoiceNumber(response.gstId);
      }
    } catch (error) {
      console.error('Error fetching GST details:', error);
      // setLoading(false);
    }
  };

  const fetchInvoiceNumber = async (gstId) => {
    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      
      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        // setLoading(false);
        return;
      }

      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.GENERATE_INVOICE_NUMBER}?ddoId=${ddoId}&gstId=${gstId}`);
      if (response && response.status === 'success') {
        setInvoiceNumber(response?.invoiceNumber || '');
        // setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching invoice number:', error);
      // setLoading(false);
    }
  };

  const fetchHSNList = async () => {
    console.log('hsn code...........')
    try {
      const url = `${API_ENDPOINTS.HSN_LIST}?gstId=` + localStorage.getItem(LOGIN_CONSTANT.GSTID);
      const response = await ApiService.handleGetRequest(url);
      if (response && response.status === 'success') {
        setHsnList(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching HSN list:', error);
    }
  };

  const fetchProformaRecords = async () => {
    

    // setProformaList(demoRecords);
    // setFilteredProformaList(demoRecords);
    // setProformaLoading(false);

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

       // setProformaList(mappedRecords);
        // setFilteredProformaList(mappedRecords);
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
    
    // Validate that tax invoice amount (paidAmount) is present and non-zero
    const taxInvoiceAmount = (record.taxInvoiceAmount != null && record.taxInvoiceAmount !== '')
      ? Number(record.taxInvoiceAmount)
      : (record.paidAmount != null ? Number(record.paidAmount) : (record.raw && (record.raw.paidAmount || record.raw.invoiceAmount) ? Number(record.raw.paidAmount || record.raw.invoiceAmount) : 0));

    if (!taxInvoiceAmount || Number.isNaN(taxInvoiceAmount) || taxInvoiceAmount <= 0) {
      toast.error('Tax Invoice Amount is required to create an invoice');
      return;
    }

    // Set invoice creation flag first
    setIsInvoiceCreation(true);
    
    // Open the Proforma Advice form with data
    handleOpenEditProforma(record);
    
    toast.success('Opening Proforma Advice form for invoice creation');
  };

  const handleOpenEditProforma = (record) => {
    if (!record) return;
    
    // Prefill paidAmount (tax invoice amount) so the field becomes editable in the form
    const taxInvoiceAmount = (record.taxInvoiceAmount != null && record.taxInvoiceAmount !== '')
      ? Number(record.taxInvoiceAmount)
      : (record.paidAmount != null ? Number(record.paidAmount) : (record.raw && (record.raw.paidAmount || record.raw.invoiceAmount) ? Number(record.raw.paidAmount || record.raw.invoiceAmount) : 0));

    setPaidAmount(Number.isFinite(taxInvoiceAmount) ? Math.floor(taxInvoiceAmount) : 0);
    
    // Set signature data if available
    const signatureData = record.signature || (record.raw && (record.raw.signature || (record.raw.ddoSignature && record.raw.ddoSignature.signatureUrl)));
    if (signatureData) {
      setDdoSignature(signatureData);
    }
    
    // Try to set selected customer if available in raw payload
    if (record.raw && (record.raw.customer || record.raw.customerResponse)) {
      const c = record.raw.customer || record.raw.customerResponse;
      
      console.log('🔍 Customer data found in record:', c);
      console.log('🔍 Available customers list:', customers.length, 'customers');
      
      // First, try to find in customers list by GST or name
      const found = customers.find(x => 
        (x.gstNumber && c.gstNumber && x.gstNumber === c.gstNumber) || 
        (x.customerName && c.customerName && x.customerName === c.customerName) ||
        (x.name && c.name && x.name === c.name)
      );
      
      if (found) {
        console.log('✅ Found customer in customers list:', found);
        setSelectedCustomer(found);
      } else {
        // Create a complete customer object from the preserved data
        const customerObj = { 
          id: c.id || record.id || null, 
          customerName: c.customerName || c.name || record.customerName || '-', 
          gstNumber: c.gstNumber || '', 
          address: c.address || '',
          city: c.city || '',
          stateCode: c.stateCode || '',
          pin: c.pinCode || c.pin || '',
          customerType: c.customerType || c.type || 'Govt',
          mobile: c.mobile || '',
          email: c.email || c.customerEmail || '',
          exemptionNumber: c.exemptionNumber || c.exemptionCertNumber || ''
        };
        console.log('🏗️ Created customer object from raw data:', customerObj);
        setSelectedCustomer(customerObj);
      }
    } else {
      console.log('⚠️ No customer data found in record.raw');
      console.log('🔍 Record raw keys:', Object.keys(record.raw || {}));
    }
    
    // Set line items from raw data if available
    if (record.raw && record.raw.items && Array.isArray(record.raw.items) && record.raw.items.length > 0) {
      const lineItemsData = record.raw.items.map((item, index) => ({
        serialNo: index + 1,
        description: item.serviceName || item.description || '',
        amount: item.amount || item.rate || 0,
        hsnNumber: item.hsnCode || item.hsnNumber || (hsnList.length > 0 ? hsnList[0].hsnCode : ''),
        quantity: item.quantity || 1
      }));
      setLineItems(lineItemsData);
    }
    
    // Set other form data
    if (record.raw) {
      if (record.raw.remarks) setNote(record.raw.remarks);
      if (record.raw.invoiceNumber) setInvoiceNumber(record.raw.invoiceNumber);
      if (record.raw.invoiceDate) {
        setBillDetails(prev => ({
          ...prev,
          date: record.raw.invoiceDate
        }));
      }
      if (record.raw.gstType) setInvoiceType(record.raw.gstType);
    }

    setShowForm(true);
  };

  const handleUpdateProformaInline = (id, updatedFields) => {
    setProformaList(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
    setFilteredProformaList(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
  };

  const calculateGSTAmount = () => {
    console.log('=== calculateGSTAmount called ===');  
    if (!selectedCustomer) {
      setGstCalculation(null);
      return;
    }

    const taxableValue = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    console.log('=== taxableValue called ===',lineItems);
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
    
    // Check if gstDetails stateCode matches selectedCustomer stateCode
    const isSameState = gstDetails?.stateCode.toString() === selectedCustomer?.stateCode.toString();
    
    console.log('=== GST Calculation Debug ===');
    console.log('gstDetails stateCode:', gstDetails?.stateCode);
    console.log('selectedCustomer stateCode:', selectedCustomer?.stateCode);
    console.log('isSameState:', isSameState);
    console.log('invoiceType:', invoiceType);
    console.log('taxableValue:', taxableValue);
    console.log('hsnDetails:', hsnDetails);
    
    // Use CGST and SGST if same state, otherwise use IGST
    let gstRate = hsnDetails?.igst || hsnDetails?.gstRate || 18;
    let cgstRate = 0;
    let sgstRate = 0;
    
    if (isSameState) {
      // Same state - use CGST and SGST from hsnDetails
      cgstRate = hsnDetails?.cgst || (hsnDetails?.gstRate || 18) / 2 || 9;
      sgstRate = hsnDetails?.sgst || (hsnDetails?.gstRate || 18) / 2 || 9;
      gstRate = 0; // No IGST for same state
      console.log('Same State Calculation:');
      console.log('cgstRate:', cgstRate, 'sgstRate:', sgstRate);
    } else {
      // Different state - use IGST from hsnDetails
      gstRate = hsnDetails?.igst || hsnDetails?.gstRate || 18;
      console.log('Different State Calculation:');
      console.log('gstRate (IGST):', gstRate);
    }
    
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
      
      // Ensure RCM fields are populated for display
      if (!isRCMExempted) {
        // The calculation below will populate rcmIgst and rcmCgst via useEffect
        // Make sure the calculation includes all tax components
        console.log('RCM Calculation - will be handled by the calculation logic below');
      }
    } else if (invoiceType === 'FCM') {
      if (selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber) {
        const exemptionNo = selectedCustomer.exemptionNumber || selectedCustomer.exemptionCertNumber;
        setNote('GST is Exempted with Notification');
        setNotificationDetails(`Customer Declared Notification: ${exemptionNo}`);
      } else {
        if (isSameState) {
          const totalRate = (cgstRate || 0) + (sgstRate || 0);
          setNote('Forward Charge Mechanism - Taxable @' + totalRate + '% (CGST @' + cgstRate + '% + SGST @' + sgstRate + '%)');
          setNotificationDetails('Same State - CGST and SGST applicable');
        } else {
          setNote('Forward Charge Mechanism - Taxable @' + gstRate + '% (IGST)');
          setNotificationDetails('Different State - IGST applicable');
        }
      }
    }

    if (invoiceType === 'EXEMPTED' || isRCMExempted || isFCMExempted) {
      console.log('Exempted invoice type');
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
    
    // Calculate GST based on same state or different state
    let calculation;
    if (isSameState) {
      // Same state - calculate CGST and SGST
      const cgstAmount = (taxableValue * cgstRate) / 100;
      const sgstAmount = (taxableValue * sgstRate) / 100;
      const totalGST = cgstAmount + sgstAmount;
      
      calculation = {
        taxableValue,
        gstAmount: totalGST,
        igst: 0,
        cgst: cgstAmount,
        sgst: sgstAmount,
        finalAmount: taxableValue + totalGST,
        isGovernment: false,
        isSameState: true,
        gstApplicable: true,
        invoiceType: invoiceType,
        note: '',
        taxPayableBy: 'supplier',
        gstRate: 0,
        cgstRate,
        sgstRate,
      };
      
      console.log('Same State GST Calculation:');
      console.log('CGST Amount:', cgstAmount);
      console.log('SGST Amount:', sgstAmount);
      console.log('Total GST:', totalGST);
      console.log('Final Amount:', calculation.finalAmount);
    } else {
      // Different state - use the existing calculateGST function with IGST
      calculation = calculateGST(
        supplierGSTIN,
        customerGSTIN,
        customerPAN,
        taxableValue,
        gstRate,
        invoiceType,
        hsnDetails
      ) || {};
      // attach rates so UI/print can show them
      calculation.gstRate = gstRate;
      calculation.cgstRate = cgstRate || 0;
      calculation.sgstRate = sgstRate || 0;
      
      console.log('Different State GST Calculation:');
      console.log('IGST Amount:', calculation.igst);
      console.log('Final Amount:', calculation.finalAmount);
    }
    
    setGstCalculation(calculation);
    
    if (invoiceType !== 'RCM' && invoiceType !== 'FCM' && invoiceType !== 'EXEMPTED') {
      if (calculation.isSameState) {
        setNote('CGST @' + cgstRate + '% + SGST @' + sgstRate + '% = ' + (cgstRate + sgstRate) + '%');
        setNotificationDetails('Same State - CGST and SGST applicable');
      } else {
        setNote(`IGST @${gstRate}% (Different State)`);
        setNotificationDetails('Different State - IGST applicable');
      }
    }
    
    console.log('=== Final Calculation ===');
    console.log(calculation);
    return calculation;
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
    const defaultHsn = hsnList.length === 1 ? ( hsnList[0].hsnCode ||  '') : '';
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
    console.log('handleLineItemChange called:', { index, field, value });
    
    if (field === 'quantity') {
      return;
    }
    const updated = [...lineItems];
    updated[index][field] = value;
    console.log('Updated lineItems:', updated);
    setLineItems(updated);
  };

  const handleSaveBill = async () => {
    console.log('=== handleSaveBill called ===');
    const validations = [
      validateGSTIN(billDetails.gstinNumber),
      { valid: billDetails.gstAddress?.trim(), message: t('bill.gstAddressRequired') },
      { valid: ddoDetails.ddoCode?.trim(), message: t('bill.ddoCodeRequired') },
      validateBillNumber(invoiceNumber),
      validateBillDate(billDetails.date),
      { valid: selectedCustomer, message: t('bill.selectCustomerRequired') },
      { valid: lineItems.length > 0, message: t('bill.addLineItemRequired') },
      { valid: ddoSignature, message: 'Digital signature is required to save Proforma Advice. Please add your signature.' }
    ];

    for (const validation of validations) {
      if (!validation.valid) {
        toast.error(validation.message);
        console.log('Validation failed:', validation.message);
        return;
      }
    }

    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      const descValidation = validateDescription(item.description);
      const amountValidation = validateAmount(item.amount, `${t('bill.lineItem')} ${i + 1} ${t('label.amount')}`);
      
      if (!descValidation.valid) {
        toast.error(`${t('bill.lineItem')} ${i + 1}: ${descValidation.message}`);
        console.log(`Validation failed for line item ${i + 1}: ${descValidation.message}`);
        return;
      }
      if (!amountValidation.valid) {
        toast.error(`${t('bill.lineItem')} ${i + 1}: ${amountValidation.message}`);
        console.log(`Validation failed for line item ${i + 1}: ${amountValidation.message}`);
        return;
      }
    }

    const taxableValue = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    if (taxableValue <= 0) {
      toast.error(t('bill.totalTaxableValueGreater'));
      console.log('Validation failed: Total taxable value must be greater than zero');
      return;
    }

    try {
      setSaving(true);
      
      // Get user ID for ddoId
      const userIdStr = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      const ddoId = userIdStr ? parseInt(userIdStr, 10) : 0;
      
      const totalTaxableValue = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const totalCgst = gstCalculation?.cgst || 0;
      const totalSgst = gstCalculation?.sgst || 0;
      const totalIgst = gstCalculation?.igst || 0;
      const grandTotal = gstCalculation?.finalAmount || totalTaxableValue;
      const balanceAmount = grandTotal - (parseFloat(paidAmount) || 0);

      const billData = {
        invoiceId: null,
        ddoId: ddoId,
        bankId: bankDetails?.id || null,
        gstId: gstDetails?.gstId || gstDetails?.id || null,
        customerId: selectedCustomer?.id || null,
        invoiceNumber: invoiceNumber,
        invoiceDate: billDetails.date,
        gstType: invoiceType,
        invoiceStatus: 'DRAFT',
        remarks: note || '',
        
        totalAmount: totalTaxableValue,
        totalCgst: totalCgst,
        totalSgst: totalSgst,
        totalIgst: totalIgst,
        grandTotal: grandTotal,
        
        // RCM specific fields
        rcmIgst: invoiceType === 'RCM' ? rcmIgst : 0,
        rcmCgst: invoiceType === 'RCM' ? rcmCgst : 0,
        rcmSgst: invoiceType === 'RCM' ? rcmSgst : 0,
        
        paidAmount: parseFloat(paidAmount) || 0,
        balanceAmount: balanceAmount,
        
        items: lineItems.map((item) => {
          const hsnData = hsnList.find(h => 
            h.hsnNumber === item.hsnNumber || 
            h.hsnCode === item.hsnNumber || 
            h.code === item.hsnNumber
          );
          
          return {
            hsnId: hsnData?.id || null,
            serviceName: item.description,
            quantity: 1,
            rate: parseFloat(item.amount) || 0,
            amount: parseFloat(item.amount) || 0,
            cgstRate: gstCalculation?.cgstRate || 0,
            sgstRate: gstCalculation?.sgstRate || 0,
            igstRate: gstCalculation?.gstRate || 0,
          };
        }),
        
        gstSnapshot: {
          gstName: gstDetails?.gstName || '',
          gstNumber: gstDetails?.gstNumber || billDetails.gstinNumber || '',
          stateCode: gstDetails?.stateCode || '',
          gstHolderName: ddoDetails?.fullName || '',
        },
        
        bankSnapshot: bankDetails ? {
          bankName: bankDetails.bankName || '',
          branchName: bankDetails.branchName || bankDetails.bankBranch || '',
          accountNumber: bankDetails.accountNumber || '',
          ifscCode: bankDetails.ifscCode || '',
        } : null,
        
        creditNote: {
          creditNoteNumber: '',
          creditNoteAmount: 0,
          mismatchAmount: 0,
          reason: '',
        },

      };
      
         let signatureFile = null;
      if (ddoSignature) {
        const base64String = ddoSignature.split(',')[1]; // Remove "data:image/png;base64," prefix
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        signatureFile = new File([blob], `signature_${Date.now()}.png`, { type: 'image/png' });
      }
      console.log('Bill Data to be saved:', billData);
      const response = await ApiService.handlePostMultiPartFileRequest(
        API_ENDPOINTS.BILL_ADD,
        billData, signatureFile
      );
      
      if (response && response.status === 'success') {
        toast.success(t('bill.savedSuccessfully'));
        
        // Auto-redirect to Proforma Advice list after successful save
        setTimeout(() => {
          setShowForm(false);
          // Refresh the proforma list to show the newly saved entry
          fetchProformaAdviceDetails();
        }, 1500); // Give user time to see the success message
        
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error(t('alert.error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePrintBill = () => {
    const logoImg = document.querySelector('#bill-preview-content img');
    const logoSrc = logoImg ? logoImg.src : '/1.png';
    
    const printWindow = window.open('', '_blank');
    const latestCalculation = calculateGSTAmount() || gstCalculation;
    
    // Prepare signature for print - ensure it's properly formatted
    let signatureForPrint = '';
    if (ddoSignature) {
      // Verify the signature is a valid base64 data URL
      if (ddoSignature.startsWith('data:image/')) {
        signatureForPrint = ddoSignature;
      } else {
        // If it's not a data URL, convert it to one
        signatureForPrint = `data:image/png;base64,${ddoSignature}`;
      }
    }
    
    console.log('Signature for print:', signatureForPrint ? 'Available' : 'Not available');

    const gstSectionHTML = (function() {
      const hasExemption = selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber;
      const isRCMExempted = invoiceType === 'RCM' && hasExemption;
      const isFCMExempted = invoiceType === 'FCM' && hasExemption;
      const showGSTCalculationUI = invoiceType === 'FCM' && !isFCMExempted;
      const showRCMGST = invoiceType === 'RCM' && !isRCMExempted;

      let rcmGSTSection = '';
      if (showRCMGST) {
        rcmGSTSection = '<div class="calc-row"><strong>GST Payable Under RCM by the Recipient = </strong><span>IGST: ' + (latestCalculation?.igst ? formatCurrency(latestCalculation.igst) : '-') + '  CGST: ' + (latestCalculation?.cgst ? formatCurrency(latestCalculation.cgst) : '-') + ' SGST: ' + (latestCalculation?.sgst ? formatCurrency(latestCalculation.sgst) : '-') + '</span></div>';
      }

      let gstCalcSection = '';
      if (showGSTCalculationUI) {
        const displayGstRate = (latestCalculation && (latestCalculation.gstRate || (latestCalculation.cgstRate && latestCalculation.sgstRate && (latestCalculation.cgstRate + latestCalculation.sgstRate)))) || 18;
        const displayCgstRate = (latestCalculation && (typeof latestCalculation.cgstRate === 'number' ? latestCalculation.cgstRate : undefined)) ?? (displayGstRate / 2);
        const displaySgstRate = (latestCalculation && (typeof latestCalculation.sgstRate === 'number' ? latestCalculation.sgstRate : undefined)) ?? (displayGstRate / 2);

        gstCalcSection = '<div class="calc-section"><h4>GST Calculation</h4>' +
          '<div class="calc-row"><span><strong>Total Taxable Value</strong></span><span><strong>' + formatCurrency(totalAmount) + '</strong></span></div>' +
          '<div class="calc-row"><span><strong>GST Collectable Under FCM</strong></span><span>-</span></div>' +
          '<div class="calc-row"><span><strong>IGST @ ' + displayGstRate + '%</strong></span><span>' + (latestCalculation?.igst ? formatCurrency(latestCalculation.igst) : '-') + '</span></div>' +
          '<div class="calc-row"><span><strong>CGST @ ' + displayCgstRate + '%</strong></span><span><strong>' + (latestCalculation?.cgst ? formatCurrency(latestCalculation.cgst) : '-') + '</strong></span></div>' +
          '<div class="calc-row"><span><strong>SGST @ ' + displaySgstRate + '%</strong></span><span><strong>' + (latestCalculation?.sgst ? formatCurrency(latestCalculation.sgst) : '-') + '</strong></span></div>' +
          '<div class="calc-row border-top"><span><strong>Total GST Amount</strong></span><span><strong>' + formatCurrency(latestCalculation?.gstAmount || 0) + '</strong></span></div>' +
          '<div class="calc-row total"><span><strong>' + t('bill.totalInvoiceAmount') + '</strong></span><span><strong>' + formatCurrency(totalAdviceAmountReceivable) + '</strong></span></div>' +
          '<div class="signature-row"><div class="signature-block"></div><div class="signature-block" style="display: flex; flex-direction: column;"><div class="signature-value">' + (ddoDetails?.fullName || '-') + '</div><span>' + t('bill.signatureOfDdo') + '</span>' + (signatureForPrint ? '<div style="margin-top: 8px;"><img src="' + signatureForPrint + '" alt="DDO Signature" style="max-height: 40px; max-width: 200px; object-fit: contain;" onerror="this.style.display=\'none\'" /></div>' : '<div class="signature-line"></div>') + '</div></div></div>';
      }

      return '<div class="gst-calculation"><div class="calc-section"><h4>Additional Information</h4><div class="calc-row"><strong>Tax is Payable on Reverse Charges:</strong> ' + taxPayableReverseCharge + '</div><div class="calc-row"><strong>Invoice Remarks:</strong></div><div class="calc-row compact-field">' + (note || '-') + '</div><div class="calc-row"><strong>Notification Details:</strong></div><div class="calc-row compact-field-small">' + (notificationDetails || '-') + '</div>' + (invoiceType === 'RCM' ? '<div class="calc-row"><strong>RCM IGST:</strong> <span>₹' + formatCurrency(rcmIgst) + '</span></div><div class="calc-row"><strong>RCM CGST:</strong> <span>₹' + formatCurrency(rcmCgst) + '</span></div>' : '') + '<div class="calc-row"><strong>Total Invoice Value in Words:</strong></div><div class="calc-row compact-field-italic">' + amountInWords(totalAdviceAmountReceivable) + '</div>' + rcmGSTSection + '</div>' + gstCalcSection + '</div>';
    })();

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
              margin: 0.8cm 0.8cm;
            }
            
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12px;
              line-height: 1.3;
              color: #000;
              background: #fff;
              padding: 0;
            }
            
            .header-section {
              display: flex;
              align-items: center;
              justify-content: flex-start;
              margin-bottom: 12px;
              padding: 12px 0 8px 0;
              border-bottom: 3px solid #2C5F2D;
            }
            
            .logo-container {
              margin-right: 16px;
              margin-bottom: 0;
              flex-shrink: 0;
            }
            
            .logo-container img {
              width: 90px;
              height: 90px;
              object-fit: contain;
            }
            
            .org-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #2C5F2D;
              line-height: 1.3;
            }
            
            .header-text {
              flex: 1;
            }
            
            .org-details {
              font-size: 12px;
              margin-bottom: 4px;
              line-height: 1.3;
              text-align: left;
            }
            
            .gstin {
              font-size: 13px;
              font-weight: bold;
              margin-top: 10px;
              color: #2C5F2D;
            }
            
            .invoice-title {
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              margin: 10px 0 14px 0;
              padding: 10px 0;
              background: linear-gradient(135deg, #2C5F2D, #4A7C59);
              color: white;
              border-radius: 6px;
            }
            
            .bill-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 12px;
            }
            
            .bill-section {
              border: 1.5px solid #2C5F2D;
              padding: 8px;
              background: #f8f9fa;
              border-radius: 4px;
            }
            
            .section-title {
              font-weight: bold;
              margin-bottom: 8px;
              font-size: 13px;
              color: #2C5F2D;
              border-bottom: 1px solid #2C5F2D;
              padding-bottom: 4px;
            }
            
            .section-content {
              font-size: 11px;
              margin-bottom: 4px;
              line-height: 1.3;
            }
            
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 11px;
              box-shadow: 0 1px 4px rgba(0,0,0,0.1);
            }
            
            .invoice-table th,
            .invoice-table td {
              border: 1.5px solid #2C5F2D;
              padding: 6px 8px;
              text-align: left;
            }
            
            .invoice-table th {
              background: linear-gradient(135deg, #2C5F2D, #4A7C59);
              color: white;
              font-weight: bold;
              text-align: center;
              font-size: 11px;
              padding: 8px 6px;
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
              gap: 12px;
              margin: 8px 0;
            }
            
            .calc-section {
              font-size: 11px;
              border: 1.5px solid #2C5F2D;
              padding: 10px;
              background: #f8f9fa;
              border-radius: 4px;
            }
            
            .calc-section h4 {
              color: #2C5F2D;
              margin-bottom: 8px;
              font-size: 12px;
              border-bottom: 1px solid #2C5F2D;
              padding-bottom: 4px;
            }
            
            .calc-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              padding: 3px 0;
              border-bottom: 1px dotted #666;
            }
            
            .calc-row.border-top {
              border-top: 1.5px solid #2C5F2D;
              padding-top: 6px;
              margin-top: 6px;
            }
            
            .calc-row.bold {
              font-weight: bold;
            }
            
            .calc-row.total {
              font-weight: bold;
              font-size: 14px;
              background: linear-gradient(135deg, #2C5F2D, #4A7C59);
              color: white;
              padding: 10px;
              margin: 10px -10px -10px -10px;
              border-radius: 0 0 4px 4px;
            }
            
            /* Compact field styles for single page optimization */
            .compact-field {
              margin-left: 15px;
              margin-bottom: 8px;
              min-height: 32px;
              padding: 4px;
              background: #fff;
              border: 1px solid #ddd;
              font-size: 9px;
              line-height: 1.3;
            }
            
            .compact-field-small {
              margin-left: 15px;
              margin-bottom: 8px;
              min-height: 24px;
              padding: 3px;
              background: #fff;
              border: 1px solid #ddd;
              font-size: 8px;
              line-height: 1.2;
            }
            
            .compact-field-italic {
              margin-left: 15px;
              margin-bottom: 8px;
              min-height: 28px;
              padding: 4px;
              background: #fff;
              border: 1px solid #ddd;
              font-size: 9px;
              font-style: italic;
              line-height: 1.3;
            }
            
            .signature-row {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 12px;
              margin-top: 8px;
              padding: 8px;
              border: 1px dashed #b2b2b2;
              border-radius: 4px;
              background: #f8fdf8;
            }
            
            .signature-block span {
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #2C5F2D;
              font-weight: 600;
            }
            
            .signature-value {
              margin-top: 4px;
              font-size: 10px;
              font-weight: bold;
              color: #1a1a1a;
            }
            
            .signature-line {
              margin-top: 12px;
              border: 1.5px solid #999;
              height: 24px;
            }
            
            .bank-section {
              margin-top: 8px;
              padding: 8px 0;
              border-top: 1.5px solid #2C5F2D;
            }
            
            .bank-section h3 {
              font-weight: bold;
              margin-bottom: 8px;
              font-size: 13px;
              color: #2C5F2D;
            }
            
            .bank-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              font-size: 12px;
            }
            
            .footer {
              text-align: center;
              margin-top: 12px;
              padding-top: 8px;
              border-top: 1.5px solid #2C5F2D;
              font-size: 9px;
              font-style: italic;
              font-weight: bold;
            }

            /* Print-specific optimizations for single page */
            @media print {
              .header-section {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                margin-bottom: 8px;
                padding: 8px 0 4px 0;
              }
              
              .logo-container img {
                width: 75px;
                height: 75px;
                margin-right: 15px;
              }
              
              .header-text {
                flex: 1;
                text-align: left;
              }
              
              .org-name {
                font-size: 14px;
                margin-bottom: 6px;
                text-align: left;
              }
              
              .invoice-title {
                font-size: 16px;
                margin: 6px 0 8px 0;
                padding: 6px 0;
              }
              
              .bill-details {
                gap: 8px;
                margin-bottom: 8px;
              }
              
              .bill-section {
                padding: 6px;
              }
              
              .invoice-table {
                margin: 6px 0;
                font-size: 8px;
              }
              
              .invoice-table th,
              .invoice-table td {
                padding: 3px 4px;
              }
              
              .invoice-table th {
                font-size: 8px;
                padding: 4px 3px;
              }
              
              .gst-calculation {
                gap: 8px;
                margin: 6px 0;
              }
              
              .calc-section {
                padding: 6px;
                font-size: 8px;
              }
              
              .calc-section h4 {
                font-size: 9px;
                margin-bottom: 4px;
              }
              
              .calc-row {
                margin-bottom: 3px;
                padding: 2px 0;
              }
              
              .calc-row.total {
                font-size: 11px;
                padding: 6px;
                margin: 6px -6px -6px -6px;
              }
              
              .signature-row {
                margin-top: 6px;
                padding: 6px;
              }
              
              .signature-line {
                height: 20px;
                margin-top: 8px;
              }
              
              .bank-section {
                margin-top: 6px;
                padding: 6px 0;
              }
              
              .footer {
                margin-top: 8px;
                padding-top: 6px;
              }
              
              /* Force single page layout */
              body {
                overflow: hidden;
                height: auto;
              }
              
              .page-break {
                page-break-before: avoid;
                page-break-after: avoid;
                page-break-inside: avoid;
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
            <div class="header-text">
              <div class="org-name">
                ${gstDetails?.gstName || ''}
              </div>
              <div class="org-details">${gstDetails?.address || ''}</div>
              <div class="org-details">${gstDetails?.city || ''} - ${gstDetails?.pinCode || ''}</div>
              <div class="org-details">Contact No : ${gstDetails?.mobile || ''} , ${gstDetails?.email || ''}</div>
              <div class="gstin">GSTIN : ${gstDetails?.gstNumber || ''}</div>
            </div>
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
              // derive display rates from calculation if available
              const displayGstRate = (gstCalculation && (gstCalculation.gstRate || (gstCalculation.cgstRate && gstCalculation.sgstRate && (gstCalculation.cgstRate + gstCalculation.sgstRate)))) || 18;
              const displayCgstRate = (gstCalculation && (typeof gstCalculation.cgstRate === 'number' ? gstCalculation.cgstRate : undefined)) ?? (displayGstRate / 2);
              const displaySgstRate = (gstCalculation && (typeof gstCalculation.sgstRate === 'number' ? gstCalculation.sgstRate : undefined)) ?? (displayGstRate / 2);

              gstCalcSection = '<div class="calc-section"><h4>GST Calculation</h4>' +
                '<div class="calc-row"><span><strong>Total Taxable Value</strong></span><span><strong>' + formatCurrency(totalAmount) + '</strong></span></div>' +
                '<div class="calc-row"><span><strong>GST Collectable Under FCM</strong></span><span>-</span></div>' +
                '<div class="calc-row"><span><strong>IGST @ ' + displayGstRate + '%</strong></span><span>' + (gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-') + '</span></div>' +
                '<div class="calc-row"><span><strong>CGST @ ' + displayCgstRate + '%</strong></span><span><strong>' + (gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-') + '</strong></span></div>' +
                '<div class="calc-row"><span><strong>SGST @ ' + displaySgstRate + '%</strong></span><span><strong>' + (gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-') + '</strong></span></div>' +
                '<div class="calc-row border-top"><span><strong>Total GST Amount</strong></span><span><strong>' + formatCurrency(gstCalculation?.gstAmount || 0) + '</strong></span></div>' +
                '<div class="calc-row total"><span><strong>' + t('bill.totalInvoiceAmount') + '</strong></span><span><strong>' + formatCurrency(totalAdviceAmountReceivable) + '</strong></span></div>' +
                '<div class="signature-row"><div class="signature-block"></div><div class="signature-block" style="display: flex; flex-direction: column;"><div class="signature-value">' + (ddoDetails?.fullName || '-') + '</div><span>' + t('bill.signatureOfDdo') + '</span>' + (signatureForPrint ? '<div style="margin-top: 8px;"><img src="' + signatureForPrint + '" alt="DDO Signature" style="max-height: 40px; max-width: 200px; object-fit: contain;" onerror="this.style.display=\'none\'" /></div>' : '<div class="signature-line"></div>') + '</div></div></div>';
            }
    
            return '<div class="gst-calculation"><div class="calc-section"><h4>Additional Information</h4><div class="calc-row"><strong>Tax is Payable on Reverse Charges:</strong> ' + taxPayableReverseCharge + '</div><div class="calc-row"><strong>Invoice Remarks:</strong></div><div class="calc-row compact-field">' + (note || '-') + '</div><div class="calc-row"><strong>Notification Details:</strong></div><div class="calc-row compact-field-small">' + (notificationDetails || '-') + '</div>' + (invoiceType === 'RCM' ? '<div class="calc-row"><strong>RCM IGST:</strong> <span>₹' + formatCurrency(rcmIgst) + '</span></div><div class="calc-row"><strong>RCM CGST:</strong> <span>₹' + formatCurrency(rcmCgst) + '</span></div>' : '') + '<div class="calc-row"><strong>Total Invoice Value in Words:</strong></div><div class="calc-row compact-field-italic">' + amountInWords(totalAdviceAmountReceivable) + '</div>' + rcmGSTSection + '</div>' + gstCalcSection + '</div>';
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
    <div className="mt-6 pt-4 border-t border-dashed border-[var(--color-border)]">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Left side - Instructions */}
        <div className="lg:flex-1 lg:max-w-xs">
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Digital Signature Required
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Your digital signature is required to authenticate this Proforma Advice document. 
            {ddoSignature ? ' You can change your signature if needed.' : ' Please add your signature to proceed.'}
          </p>
        </div>
        
        {/* Right side - Signature area */}
        <div className="lg:flex-1 lg:flex lg:flex-col lg:items-end">
          <div className="w-full lg:max-w-sm">
            {/* Name and Title */}
            <div className="text-center lg:text-right mb-3">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] break-words">
                {ddoDetails?.fullName || 'DDO Name'}
              </p>
              <p className="text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
                {t('bill.signatureOfDdo')}
              </p>
            </div>
            
            {/* Signature Display Area */}
            <div className="relative">
              <div 
                className={`h-20 border-2 border-dashed rounded-lg bg-white flex items-center justify-center transition-all duration-200 overflow-hidden ${
                  ddoSignature 
                    ? 'border-green-300 bg-green-50/30' 
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)]/20'
                }`}
                onClick={() => setShowSignaturePad(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowSignaturePad(true)}
              >
                {ddoSignature ? (
                  <div className="relative group w-full h-full">
                    <img 
                      src={ddoSignature} 
                      alt="DDO Signature" 
                      className="max-h-full max-w-full object-contain mx-auto p-2 w-full h-full"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Click to change</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-2">
                    <svg className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span className="text-xs text-[var(--color-text-secondary)]">Click to add signature</span>
                  </div>
                )}
              </div>
              
              {/* Success indicator */}
              {ddoSignature && (
                <div className="absolute top-1 right-1">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Button */}
            <button
              onClick={() => setShowSignaturePad(true)}
              className={`w-full mt-3 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                ddoSignature
                  ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90 border border-[var(--color-accent)]'
                  : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90'
              }`}
            >
              {ddoSignature ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Change Signature
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Add Signature
                </div>
              )}
            </button>
            
            {/* Warning message */}
            {!ddoSignature && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2">
                ⚠️ Signature is required to save this Proforma Advice
              </p>
            )}
          </div>
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
                  {isInvoiceCreation ? 'Create Tax Invoice' : t('nav.generateBill')}
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {isInvoiceCreation 
                    ? 'Creating tax invoice from Proforma Advice with pre-filled data'
                    : t('bill.generateBillSubtitle')
                  }
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
            loading={proformaLoading}
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
            rcmIgst={rcmIgst}
            setRcmIgst={setRcmIgst}
            rcmCgst={rcmCgst}
            setRcmCgst={setRcmCgst}
            rcmSgst={rcmSgst}
            setRcmSgst={setRcmSgst}
            ddoDetails={ddoDetails}
            bankDetails={bankDetails}
            saving={saving}
            setSaving={setSaving}
            currentLang={currentLang}
            gstinList={gstinList}
            ddoSignature={ddoSignature}
            isInvoiceCreation={isInvoiceCreation}
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
            onShowForm={handleOpenEditProforma}
            onUpdateProforma={handleUpdateProformaInline}
          />
        )}

        {showSignaturePad && (
          <SignaturePad
            onSignatureSave={(signatureData) => {
              setDdoSignature(signatureData);
              toast.success('Signature saved successfully');
            }}
            onClose={() => setShowSignaturePad(false)}
            initialSignature={ddoSignature}
          />
        )}
      </div>
    </Layout>
  );
}