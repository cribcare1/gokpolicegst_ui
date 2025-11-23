"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t, getLanguage } from '@/lib/localization';
import { calculateGST, validateBillDate, formatCurrency, validateGSTIN, validateEmail, validateMobile, validatePIN, validateBillNumber, validateAmount, validateDescription, validateName, validateAddress, validateCity, validateStateCode, isGovernmentGSTIN, isGovernmentPAN } from '@/lib/gstUtils';
import { getAllStates, getStateCodeFromGSTIN } from '@/lib/stateCodes';
import { Plus, Trash2, X, Download, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { IndeterminateProgressBar, LoadingProgressBar } from '@/components/shared/ProgressBar';
import { useGstinList } from '@/hooks/useGstinList';
import { LOGIN_CONSTANT } from '@/components/utils/constant';

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
  const [customerType, setCustomerType] = useState('Govt'); // Govt or Non Govt
  const [invoiceType, setInvoiceType] = useState('FCM'); // RCM, FCM, or EXEMPTED
  const [taxPayableReverseCharge, setTaxPayableReverseCharge] = useState('YES'); // YES, NO, NA
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const { gstinList } = useGstinList();

  useEffect(() => {
    fetchGSTDetails();
    getDdoDetails();
    fetchCustomers();
    fetchHSNList();
    // loadDDOInfo();
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
  function Ddo(){
    
  }

  useEffect(() => {
    if (selectedCustomer) {
      // Determine customer type from GSTIN or customer data
      const isGovt = selectedCustomer.customerType === 'Govt' || 
                     selectedCustomer.customerType === 'Government' ||
                     (selectedCustomer.gstNumber && isGovernmentGSTIN(selectedCustomer.gstNumber)) ||
                     (selectedCustomer.pan && isGovernmentPAN(selectedCustomer.pan));
      setCustomerType(isGovt ? 'Govt' : 'Non Govt');
      
      // Determine invoice type based on customer's serviceType first, then fallback to old logic
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

  // Auto-set HSN code if only one exists and ensure quantity is always 1
  useEffect(() => {
    if (lineItems.length === 0) return;
    
    let needsUpdate = false;
    const updated = lineItems.map(item => {
      const newItem = { ...item };
      
      // Auto-set HSN if only one exists and item doesn't have one
      if (hsnList.length === 1) {
        const defaultHsn = hsnList[0].hsnNumber || hsnList[0].hsnCode || hsnList[0].code || '';
        if (item.hsnNumber !== defaultHsn) {
          newItem.hsnNumber = defaultHsn;
          needsUpdate = true;
        }
      }
      
      // Ensure quantity is always 1 (handle undefined, null, empty string, or any other value)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hsnList.length, hsnList, lineItems.length]);


  function  getDdoDetails() {
    const storedProfile = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);
          console.log("storedprfole", storedProfile);
          if (storedProfile) {
            try {
              // Check if the value looks like JSON (starts with { or [)
              const trimmedValue = storedProfile.trim();
              if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
                const userProfile = JSON.parse(storedProfile);
                console.log("userProfile", userProfile);
                // If data exists and not empty
                if (userProfile && typeof userProfile === 'object' && Object.keys(userProfile).length > 0) {
                  console.log("userProfile=====called");
                  setDdoDetails(userProfile);
                  return;
                }
              }
              // If not valid JSON or empty, fetch from API
              // fetchProfileData();
            } catch (error) {
              // If JSON parsing fails, fetch from API
              console.error('Error parsing stored profile data:', error);
              // fetchProfileData();
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
        // Extract state code from GSTIN for each customer
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
        // Auto-select first customer for demo
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
      console.error('Error fetching customers:', error);
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

      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.GENERATE_INVOICE_NUMBER}?ddoId=${ddoId}&gstId=${gstId}`); //invoices/generate-number?ddoId=16&gstId=5
      if (response && response.status === 'success') {
        setInvoiceNumber(response?.invoiceNumber || '');
        // Auto-select first customer for demo
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
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

    // Check if customer has exemption (RCM/FCM Exempted case)
    const hasExemption = selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber;
    const isRCMExempted = invoiceType === 'RCM' && hasExemption;
    const isFCMExempted = invoiceType === 'FCM' && hasExemption;

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
    
    // Update note and notification details based on invoice type and customer data
    // This needs to be set BEFORE the early return for EXEMPTED cases
    if (invoiceType === 'EXEMPTED') {
      // For Exempted: Show customer notification if available
      if (selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber) {
        const exemptionNo = selectedCustomer.exemptionNumber || selectedCustomer.exemptionCertNumber;
        setNote('GST is Exempted with Notification');
        setNotificationDetails(`Notification No. ${exemptionNo} - GST is Exempted`);
      } else {
        setNote('GST is Exempted with Notification');
        setNotificationDetails('Entry 6 of Notification No. 12/2017-CT (Rate) - Exempted from GST');
      }
    } else if (invoiceType === 'RCM') {
      // For RCM: Show notification and GST will be calculated in backend
      setNote('Reverse Charge Mechanism - Tax payable by recipient');
      // Check if customer has exemption (RCM Exempted case)
      if (selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber) {
        const exemptionNo = selectedCustomer.exemptionNumber || selectedCustomer.exemptionCertNumber;
        setNotificationDetails(`Customer Declared Notification: ${exemptionNo}`);
      } else {
        setNotificationDetails('Notification No. 13/2017-CT (Rate) Sl. No. 5 - Services supplied by the Central Government, State Government, Union Territory, or local authority to a business entity');
      }
    } else if (invoiceType === 'FCM') {
      // For FCM: Check if customer has exemption (FCM Exempted case)
      if (selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber) {
        const exemptionNo = selectedCustomer.exemptionNumber || selectedCustomer.exemptionCertNumber;
        setNote('GST is Exempted with Notification');
        setNotificationDetails(`Customer Declared Notification: ${exemptionNo}`);
      } else {
        setNote('Forward Charge Mechanism - Taxable @18%');
        setNotificationDetails('Section 7 of the CGST Act, 2017. Taxable @18% Refer: Sl. No. 5, Notif. 13/2017 + Sec. 9(1) of CGST Act on Bandobast/Security charges');
      }
    }

    // For Exempted or RCM/FCM Exempted: Don't calculate GST
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
    
    // Call calculateGST with proper parameters
    // For RCM, GST is calculated in backend but we still calculate here to show values below notification
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
    
    // Update note and notification details for non-exempted, non-RCM, non-FCM cases
    // Only update if invoiceType is not RCM or FCM (those already have their notification details set above)
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

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    // Validate Name
    const nameValidation = validateName(newCustomer.name, 'Customer Name');
    if (!nameValidation.valid) {
      toast.error(nameValidation.message);
      return;
    }
    
    // Validate GSTIN
    const gstValidation = validateGSTIN(newCustomer.gstNumber);
    if (!gstValidation.valid) {
      toast.error(gstValidation.message);
      return;
    }
    
    // Validate Address
    const addressValidation = validateAddress(newCustomer.address);
    if (!addressValidation.valid) {
      toast.error(addressValidation.message);
      return;
    }
    
    // Validate City
    const cityValidation = validateCity(newCustomer.city);
    if (!cityValidation.valid) {
      toast.error(cityValidation.message);
      return;
    }
    
    // Validate State Code
    const stateCodeValidation = validateStateCode(newCustomer.stateCode);
    if (!stateCodeValidation.valid) {
      toast.error(stateCodeValidation.message);
      return;
    }
    
    // Validate PIN
    const pinValidation = validatePIN(newCustomer.pin);
    if (!pinValidation.valid) {
      toast.error(pinValidation.message);
      return;
    }
    
    // Validate Customer Type
    if (!newCustomer.customerType || newCustomer.customerType.trim() === '') {
      toast.error('Customer Type is required');
      return;
    }
    
    // Validate Email
    const emailValidation = validateEmail(newCustomer.email);
    if (!emailValidation.valid) {
      toast.error(emailValidation.message);
      return;
    }
    
    // Validate Mobile
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

      // Map form data to API payload format
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
        // Refresh customers list and select the newly added customer
        const updatedResponse = await ApiService.handleGetRequest(`${API_ENDPOINTS.CUSTOMER_ACTIVE_LIST}${ddoId}`);
        if (updatedResponse && updatedResponse.status === 'success') {
          const mappedCustomers = updatedResponse.data.map((customer) => {
            // Extract state code from GSTIN if available
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
          // Select the newly added customer (it should be the last one or match by GSTIN)
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
    // Auto-set HSN if only one exists
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
    // Prevent quantity changes - always keep it as 1
    if (field === 'quantity') {
      return;
    }
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const handleSaveBill = async () => {
    // Validate all required fields
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
      setSaving(false);
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
        <head>billNumber
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
              {gstDetails.gstName}
            </div>
            <div class="org-details">{gstDetails.address}</div>
            <div class="org-details">{gstDetails.city} - {gstDetails.pinCode}</div>
            <div class="org-details">Contact No : {gstDetails.mobile} , {gstDetails.email}</div>
            <div class="gstin">GSTIN : {gstDetails.gstNumber}</div>
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
              rcmGSTSection = `
                <div class="calc-row"><strong>GST Payable Under RCM by the Recipient:</strong></div>
                <div class="calc-row" style="margin-left: 15px;">
                  <strong>IGST:</strong> ${gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'} |
                  <strong>CGST:</strong> ${gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'} |
                  <strong>SGST:</strong> ${gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}
                </div>
              `;
            }
            
            let gstCalcSection = '';
            if (showGSTCalculationUI) {
              gstCalcSection = `
              <div class="calc-section">
                <h4>GST Calculation</h4>
                <div class="calc-row">
                  <span><strong>Total Taxable Value</strong></span>
                  <span><strong>${formatCurrency(totalAmount)}</strong></span>
                </div>
                <div class="calc-row">
                  <span><strong>GST Collectable Under FCM</strong></span>
                  <span>-</span>
                </div>
                <div class="calc-row">
                  <span><strong>IGST @ 18%</strong></span>
                  <span>${gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
                </div>
                <div class="calc-row">
                  <span><strong>CGST @ 9%</strong></span>
                  <span><strong>${gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</strong></span>
                </div>
                <div class="calc-row">
                  <span><strong>SGST @ 9%</strong></span>
                  <span><strong>${gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</strong></span>
                </div>
                <div class="calc-row border-top">
                  <span><strong>Total GST Amount</strong></span>
                  <span><strong>${formatCurrency(gstCalculation?.gstAmount || 0)}</strong></span>
                </div>
                <div class="calc-row total">
                  <span><strong>Total Invoice Amount</strong></span>
                  <span><strong>${formatCurrency(gstCalculation?.finalAmount || totalAmount)}</strong></span>
                </div>
              </div>
              `;
            }
            
            return `
            <div class="gst-calculation">
              <div class="calc-section">
                <h4>Additional Information</h4>
                <div class="calc-row"><strong>Tax is Payable on Reverse Charges:</strong> ${taxPayableReverseCharge}</div>
                <div class="calc-row"><strong>Invoice Remarks:</strong></div>
                <div class="calc-row" style="margin-left: 15px; margin-bottom: 12px; min-height: 60px;">${note || '-'}</div>
                <div class="calc-row"><strong>Notification Details:</strong></div>
                <div class="calc-row" style="margin-left: 15px; margin-bottom: 12px; min-height: 80px; font-size: 10px;">${notificationDetails || '-'}</div>
                <div class="calc-row"><strong>Total Invoice Value in Words:</strong></div>
                <div class="calc-row" style="margin-left: 15px; margin-bottom: 12px; font-style: italic; min-height: 60px;">${amountInWords(gstCalculation?.finalAmount || totalAmount)}</div>
                ${rcmGSTSection}
              </div>
              ${gstCalcSection}
            </div>
            `;
          })()}

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
    console.log("amount-------", amount);
  // If amount is null, undefined, empty string → return empty
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }

  // Convert string to number safely
  const numericAmount = Number(amount);

  // If not a valid number → return empty
  if (isNaN(numericAmount)) {
    return '';
  }

  const rupees = Math.floor(numericAmount);
  const paise = Math.round((numericAmount - rupees) * 100);

  // Convert rupees
  let words = numberToWords(rupees) + ' Rupees';

  // Convert paise only if exists
  if (paise > 0) {
    words += ' and ' + numberToWords(paise) + ' Paise';
  }

  return words + ' Only';
};


  // Calculate totals - quantity is always 1 per item
  const totalQuantity = lineItems.length;
  const totalAmount = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <Layout role="ddo">
      <div className="space-y-3">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-1.5 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-lg">
                <FileText className="text-[var(--color-primary)]" size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold mb-0.5">
                  <span className="gradient-text">{t('nav.generateBill')}</span>
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {t('bill.generateBillSubtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-end gap-4 flex-shrink-0">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                  {t('bill.invoiceNo')}
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  readOnly
                  className="premium-input px-4 py-2 text-sm bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded-lg font-bold text-[var(--color-primary)] shadow-inner min-w-[200px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                  {t('bill.invoiceDate')}
                </label>
                <input
                  type="date"
                  value={billDetails.date}
                  readOnly
                  className="premium-input px-4 py-2 text-sm bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded-lg font-bold text-[var(--color-accent)] shadow-inner min-w-[150px]"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="premium-card p-8 sm:p-16">
            <LoadingProgressBar message="Loading bill data..." variant="primary" />
          </div>
        ) : (
        <div className="premium-card p-6 sm:p-8 space-y-8 bg-gradient-to-br from-[var(--color-background)] via-[var(--color-background)] to-[var(--color-muted)]/5 shadow-xl border border-[var(--color-border)]/50">
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

          {/* Bill To Section - Enhanced Layout */}
          <div>
            {/* Bill To Section */}
            <div className="bg-gradient-to-br from-[var(--color-background)] to-[var(--color-muted)]/30 border border-[var(--color-border)] rounded-xl p-6 shadow-lg space-y-4 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-primary)]/30">
                <div className="p-2 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-lg">
                  <FileText size={20} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{t('bill.serviceReceiver')} (BILL TO)</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Service receiver details and information</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Select Customer */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)] flex items-center gap-2">
                    <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></span>
                    {t('bill.selectCustomer')}
                  </label>
                  <div className="flex items-center gap-3">
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
                      className="premium-input flex-1 px-4 py-3 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-medium shadow-sm"
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
                      onClick={() => router.push('/ddo/customers?add=true')}
                      className="px-4 py-3 text-sm shadow-lg hover:shadow-xl transition-all whitespace-nowrap bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 hover:from-[var(--color-accent)]/20 hover:to-[var(--color-primary)]/20 border border-[var(--color-accent)]/30"
                    >
                      <Plus className="mr-2" size={14} />
                      {t('bill.addNewCustomer')}
                    </Button>
                  </div>
                </div>

                {/* Right Column - Customer Information */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)] flex items-center gap-2">
                    <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full"></span>
                    Customer Information
                  </label>
                  <div className="bg-gradient-to-br from-[var(--color-muted)]/20 to-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]/50 space-y-2">
                    {/* First Line: Name | GSTIN | State | Type */}
                    <div className="text-sm">
                      <span className="font-semibold text-[var(--color-text-primary)]">Name: </span>
                      <span className="text-[var(--color-text-secondary)]">{selectedCustomer ? `M/s ${selectedCustomer.customerName}` : 'Not selected'}</span>
                      {selectedCustomer?.gstNumber && (
                        <>
                          <span className="text-[var(--color-text-primary)] mx-2">|</span>
                          <span className="font-semibold text-[var(--color-text-primary)]">GSTIN: </span>
                          <span className="text-[var(--color-text-secondary)]">{selectedCustomer.gstNumber}</span>
                        </>
                      )}
                      {selectedCustomer?.stateCode && (
                        <>
                          <span className="text-[var(--color-text-primary)] mx-2">|</span>
                          <span className="font-semibold text-[var(--color-text-primary)]">State: </span>
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
                    
                    {/* Second Line: Address */}
                    {selectedCustomer?.address && (
                      <div className="text-sm">
                        <span className="font-semibold text-[var(--color-text-primary)]">Address: </span>
                        <span className="text-[var(--color-text-secondary)]">{selectedCustomer.address}</span>
                      </div>
                    )}
                    
                    {/* Third Line: Notification */}
                    {notificationDetails && (
                      <div className="text-sm">
                        <span className="font-semibold text-[var(--color-text-primary)]">Notification: </span>
                        <span className="text-[var(--color-text-secondary)]">{notificationDetails}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Divider */}
          <div className="flex items-center justify-center my-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-[var(--color-primary)]/50"></div>
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
              <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-[var(--color-accent)]/50"></div>
            </div>
          </div>
          
          {/* Section Header */}
          {/* <div className="text-center mb-3">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 px-4 py-2 rounded-lg inline-block border border-[var(--color-primary)]/30">
              {t('bill.lineItemsAndDetails')}
            </h3>
          </div> */}

          {/* Line Items Section */}
          <div className="bg-gradient-to-br from-[var(--color-background)] to-[var(--color-muted)]/30 border border-[var(--color-border)] rounded-xl p-6 shadow-lg space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-primary)]/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-lg">
                  <FileText size={20} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Line Items</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Add and manage bill line items</p>
                </div>
              </div>
              <Button 
                onClick={handleAddLineItem} 
                variant="secondary" 
                className="px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 hover:from-[var(--color-accent)]/20 hover:to-[var(--color-primary)]/20 border border-[var(--color-accent)]/30"
              >
                <Plus className="mr-2" size={16} />
                {t('bill.addLineItem')}
              </Button>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto bg-[var(--color-background)] rounded-lg border border-[var(--color-border)] shadow-inner">
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
                  <tr className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary)]/90 to-[var(--color-accent)] text-white shadow-lg">
                    <th className="border border-[var(--color-primary)] p-4 text-center font-bold text-sm">{t('bill.serialNo')}</th>
                    <th className="border border-[var(--color-primary)] p-4 text-left font-bold text-sm">{t('bill.itemDescription')}</th>
                    <th className="border border-[var(--color-primary)] p-4 text-center font-bold text-sm">{t('bill.hsnCode')}</th>
                    <th className="border border-[var(--color-primary)] p-4 text-center font-bold text-sm">{t('bill.quantity')}</th>
                    <th className="border border-[var(--color-primary)] p-4 text-center font-bold text-sm">Unit</th>
                    <th className="border border-[var(--color-primary)] p-4 text-center font-bold text-sm">{t('bill.amount')}</th>
                    <th className="border border-[var(--color-primary)] p-4 text-center font-bold text-sm">{t('bill.taxableValueRs')}</th>
                    <th className="border border-[var(--color-primary)] p-4 text-center font-bold text-sm">{t('bill.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className="hover:bg-[var(--color-muted)]/20 transition-all duration-200 border-b border-[var(--color-border)]/50">
                      <td className="border border-[var(--color-border)] p-4 text-sm text-center font-bold bg-gradient-to-br from-[var(--color-muted)]/20 to-[var(--color-background)]">
                        <div className="flex items-center justify-center">
                          <span className="w-8 h-8 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center font-bold text-sm">
                            {item.serialNo}
                          </span>
                        </div>
                      </td>
                      <td className="border border-[var(--color-border)] p-4 text-sm">
                        <textarea
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                          className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-sm resize-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all leading-relaxed"
                          rows="2"
                          placeholder="Enter item description..."
                        />
                      </td>
                      <td className="border border-[var(--color-border)] p-4 text-sm text-center">
                        <input
                          type="text"
                          value={item.hsnNumber || (hsnList[0]?.hsnNumber || hsnList[0]?.hsnCode || hsnList[0]?.code || '')}
                          readOnly
                          className="premium-input w-full px-3 py-2 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded-lg text-sm font-semibold text-center text-[var(--color-primary)]"
                        />
                      </td>
                      <td className="border border-[var(--color-border)] p-4 text-sm text-center">
                        <div className="w-full px-3 py-2 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded-lg text-sm font-bold text-center text-[var(--color-accent)]">
                          1
                        </div>
                      </td>
                      <td className="border border-[var(--color-border)] p-4 text-sm text-center font-bold bg-gradient-to-br from-[var(--color-muted)]/20 to-[var(--color-background)] text-[var(--color-text-primary)]">
                        Nos
                      </td>
                      <td className="border border-[var(--color-border)] p-4 text-sm text-center">
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                          className="premium-input w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-center font-semibold"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="border border-[var(--color-border)] p-4 text-sm text-center font-bold bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-[var(--color-primary)]">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="border border-[var(--color-border)] p-4 text-sm text-center">
                        {lineItems.length > 1 && (
                          <button
                            onClick={() => handleRemoveLineItem(index)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 transition-all inline-flex items-center justify-center hover:scale-110 transform duration-200 shadow-sm hover:shadow-md"
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
                  <tr className="bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-accent)]/20 to-[var(--color-primary)]/20 font-bold">
                    <td colSpan="3" className="border border-[var(--color-border)] p-4 text-sm font-bold text-right text-[var(--color-text-primary)]">
                      {t('bill.totalQty')}
                    </td>
                    <td className="border border-[var(--color-border)] p-4 text-sm font-bold text-center text-[var(--color-text-primary)]">
                      {totalQuantity}
                    </td>
                    <td className="border border-[var(--color-border)] p-4 text-sm font-bold text-center text-[var(--color-text-primary)]">
                      Nos
                    </td>
                    <td className="border border-[var(--color-border)] p-4 text-sm font-bold text-right text-[var(--color-text-primary)]">
                      {t('bill.totalAmt')}
                    </td>
                    <td className="border border-[var(--color-border)] p-4 text-sm font-bold text-right text-[var(--color-primary)] text-lg bg-gradient-to-r from-[var(--color-primary)]/30 to-[var(--color-accent)]/30">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="border border-[var(--color-border)] p-4"></td>
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
          </div>

          {/* Section Divider */}
          <div className="flex items-center justify-center my-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-[var(--color-primary)]/50"></div>
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
              <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-[var(--color-accent)]/50"></div>
            </div>
          </div>
          
          {/* Section Header */}
          {/* <div className="text-center mb-3">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 px-4 py-2 rounded-lg inline-block border border-[var(--color-primary)]/30">
              {t('bill.gstCalculation')}
            </h3>
          </div> */}

          {/* GST Calculation Section */}
          {(() => {
            // Determine if GST calculation UI should be shown
            const isExempted = invoiceType === 'EXEMPTED';
            const hasExemption = selectedCustomer?.exemptionNumber || selectedCustomer?.exemptionCertNumber;
            const isRCMExempted = invoiceType === 'RCM' && hasExemption;
            const isFCMExempted = invoiceType === 'FCM' && hasExemption;
            const showGSTCalculationUI = invoiceType === 'FCM' && !isFCMExempted;
            const showRCMGST = invoiceType === 'RCM' && !isRCMExempted;

            return (
              <div className={`grid grid-cols-1 ${showGSTCalculationUI ? 'lg:grid-cols-2' : ''} gap-4`}>
                <div className="space-y-3">
                  {/* Two-column layout: 50% - 50% */}
                 <div className="grid grid-cols-2 gap-3">
  
  {/* ---------------- Left Column ---------------- */}
  <div className="space-y-3">

    

    {/* Invoice Remarks */}
    <div className="bg-gradient-to-br from-[var(--color-background)] to-[var(--color-muted)]/30 
                    border border-[var(--color-border)] rounded-lg p-3 shadow-sm">
      <label className="block text-xs font-semibold mb-1 text-[var(--color-text-primary)]">
        {t('bill.invoiceRemarks')}
      </label>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="premium-input w-full px-3 py-2 text-sm bg-[var(--color-background)] 
                   border border-[var(--color-border)] rounded-lg resize-none
                   focus:border-[var(--color-primary)] focus:ring-1 
                   focus:ring-[var(--color-primary)]/20 transition-all"
        rows="2"
        placeholder={t('bill.invoiceRemarksPlaceholder')}
        readOnly={isExempted || isRCMExempted || isFCMExempted}
      />
    </div>
    {/* Tax Payable on Reverse Charge */}
    {selectedCustomer?.serviceType?.toString().trim().toUpperCase() === 'RCM' && (
  <div className="flex items-center gap-3">
    <label className="text-xs font-semibold text-[var(--color-text-primary)] whitespace-nowrap flex-shrink-0">
      {t('bill.taxPayableReverse')}
    </label>

    <span className="premium-input flex-1 px-3 py-2 text-sm bg-[var(--color-muted)]/50 
                     border border-[var(--color-border)] rounded-lg font-medium">
      YES
    </span>
  </div>
)}

  </div>

  {/* ---------------- Right Column ---------------- */}
  <div className="space-y-3">
     
    {/* Notification Details */}
    <div className="bg-gradient-to-br from-[var(--color-background)] to-[var(--color-muted)]/30 
                    border border-[var(--color-border)] rounded-lg p-3 shadow-sm">
      <label className="block text-xs font-semibold mb-1 text-[var(--color-text-primary)]">
        {t('bill.notificationDetails')}
      </label>

      <div className="premium-input w-full px-3 py-2 bg-[var(--color-muted)]/50 
                      border border-[var(--color-border)] rounded-lg text-xs 
                      min-h-[65px] leading-relaxed">
        {notificationDetails || '-'}
      </div>
    </div>
     {/* Total Invoice Value in Words */}
    <div className="bg-gradient-to-br from-[var(--color-background)] to-[var(--color-muted)]/30 
                border border-[var(--color-border)] rounded-lg p-3 shadow-sm">

        <div className="flex items-center gap-3">

          <label className="text-xs font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
            {t('bill.totalInvoiceValueWords')}
          </label>

          <div
            className="premium-input px-3 py-2 bg-[var(--color-muted)]/50 
                      border border-[var(--color-border)] rounded-lg italic text-xs 
                      leading-relaxed font-bold flex-1 whitespace-nowrap overflow-x-auto"
          >
            {amountInWords(gstCalculation?.finalAmount || totalAmount)}
          </div>


        </div>
    </div>
  

    </div>

</div>


                  {/* Show RCM GST values below notification only for RCM (not exempted) */}
                  {showRCMGST && (
                    <div className="bg-gradient-to-br from-[var(--color-background)] to-[var(--color-muted)]/30 border border-[var(--color-border)] rounded-lg p-3 shadow-sm">
                      <div>
                        <label className="block text-xs font-semibold mb-2 text-[var(--color-text-primary)]">{t('bill.gstPayableRCM')}</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-[var(--color-text-primary)]">IGST:</label>
                            <input
                              type="text"
                              value={gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}
                              readOnly
                              className="premium-input w-full px-2 py-1.5 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded text-xs text-center font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-[var(--color-text-primary)]">CGST:</label>
                            <input
                              type="text"
                              value={gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}
                              readOnly
                              className="premium-input w-full px-2 py-1.5 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded text-xs text-center font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-[var(--color-text-primary)]">SGST:</label>
                            <input
                              type="text"
                              value={gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}
                              readOnly
                              className="premium-input w-full px-2 py-1.5 bg-[var(--color-muted)]/50 border border-[var(--color-border)] rounded text-xs text-center font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Show GST Calculation UI only for FCM (not exempted) */}
                {showGSTCalculationUI && (
                  <div>
                    <div className="bg-gradient-to-br from-[var(--color-background)] to-[var(--color-muted)]/30 border border-[var(--color-border)] rounded-lg p-4 shadow-md">
                      <div className="bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-primary)]/5 to-[var(--color-accent)]/10 rounded-lg p-3 border border-[var(--color-primary)]/20">
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-3 pb-2 border-b border-[var(--color-primary)]/30">{t('bill.gstCalculation')}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">{t('bill.totalTaxableValue')}</span>
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">{formatCurrency(totalAmount)}</span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">{t('bill.gstCollectableFCM')}</span>
                            <span className="text-xs text-[var(--color-text-muted)] font-medium">-</span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">{t('bill.igst18')}</span>
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">{t('bill.cgst9')}</span>
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">{t('bill.sgst9')}</span>
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-t border-[var(--color-primary)]/50 mt-2">
                            <span className="text-sm font-bold text-[var(--color-text-primary)]">{t('bill.totalGstAmount')}</span>
                            <span className="text-sm font-bold text-[var(--color-primary)]">
                              {formatCurrency(gstCalculation?.gstAmount || 0)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/90 rounded-lg px-4 -mx-3 -mb-3 mt-3 text-white shadow-md">
                            <span className="text-base font-extrabold">{t('bill.totalInvoiceAmount')}</span>
                            <span className="text-base font-extrabold">
                              {formatCurrency(gstCalculation?.finalAmount || totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Section Divider */}
          <div className="flex items-center justify-center my-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-[var(--color-primary)]/50"></div>
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
              <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-[var(--color-accent)]/50"></div>
            </div>
          </div>
          
          {/* Section Header */}
          {/* <div className="text-center mb-3">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 px-4 py-2 rounded-lg inline-block border border-[var(--color-primary)]/30">
              {t('bill.termsAndBankDetails')}
            </h3>
          </div> */}

          {/* Bank Details Section */}
          <div className="bg-gradient-to-br from-[var(--color-background)] to-[var(--color-muted)]/30 border border-[var(--color-border)] rounded-xl p-6 shadow-lg">
            {/* Section Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-primary)]/30 mb-4">
              <div className="p-2 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-lg">
                <FileText size={20} className="text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{t('bill.bankDetails')}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Bank information for payment processing</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[var(--color-muted)]/20 to-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]/50">
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)] flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></span>
                  {t('bill.bankName')}
                </label>
                <input
                  type="text"
                  value="Union Bank of India-Current Account"
                  readOnly
                  className="premium-input w-full px-4 py-3 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg font-semibold text-[var(--color-text-primary)]"
                />
              </div>
              <div className="bg-gradient-to-br from-[var(--color-muted)]/20 to-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]/50">
                <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)] flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full"></span>
                  {t('bill.bankBranch')}
                </label>
                <input
                  type="text"
                  value="Banaswadi"
                  readOnly
                  className="premium-input w-full px-4 py-3 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg font-semibold text-[var(--color-text-primary)]"
                />
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-[var(--color-primary)]/20">
            <Button 
              variant="secondary" 
              onClick={() => setShowPreviewModal(true)} 
              className="min-w-[140px] px-6 py-3 text-sm shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 hover:from-[var(--color-accent)]/20 hover:to-[var(--color-primary)]/20 border border-[var(--color-accent)]/30 font-semibold"
            >
              <FileText className="mr-2" size={16} />
              {t('bill.preview')}
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveBill} 
              disabled={saving} 
              className="min-w-[140px] px-6 py-3 text-sm shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:from-[var(--color-primary)]/90 hover:to-[var(--color-accent)]/90 text-white font-bold transform hover:scale-105"
            >
              {saving ? (
                <>
                  <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        )}

        {/* Add Customer Modal */}
        <Modal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          title={t('bill.addNewCustomer')}
          size="lg"
        >
          <form onSubmit={handleAddCustomer} className="space-y-4">
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
                  
                  // Extract state code from first 2 characters
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
                    <col style={{ width: '7%' }} /> {/* Serial No */}
                    <col style={{ width: '38%' }} /> {/* Item Description - Bigger */}
                    <col style={{ width: '10%' }} /> {/* HSN Code - Smaller */}
                    <col style={{ width: '7%' }} /> {/* Qty - Smaller */}
                    <col style={{ width: '7%' }} /> {/* Unit */}
                    <col style={{ width: '15%' }} /> {/* Amount */}
                    <col style={{ width: '16%' }} /> {/* Taxable Value */}
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
                          <p className="bg-white p-3 rounded border italic font-semibold min-h-[60px] leading-relaxed">{amountInWords(gstCalculation?.finalAmount || totalAmount)}</p>
                        </div>
                        {showRCMGST && (
                          <div>
                            <p className="font-semibold mb-2"><strong>{t('bill.gstPayableRCM')}</strong></p>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="bg-white p-2 rounded border text-center"><strong>IGST:</strong><br/>{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</div>
                              <div className="bg-white p-2 rounded border text-center"><strong>CGST:</strong><br/>{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</div>
                              <div className="bg-white p-2 rounded border text-center"><strong>SGST:</strong><br/>{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</div>
                            </div>
                          </div>
                        )}
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
                            <span className="font-semibold">{t('bill.igst18')}</span>
                            <span className="font-semibold">{gstCalculation?.igst ? formatCurrency(gstCalculation.igst) : '-'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-300">
                            <span className="font-semibold">{t('bill.cgst9')}</span>
                            <span className="font-bold text-lg">{gstCalculation?.cgst ? formatCurrency(gstCalculation.cgst) : '-'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-300">
                            <span className="font-semibold">{t('bill.sgst9')}</span>
                            <span className="font-bold text-lg">{gstCalculation?.sgst ? formatCurrency(gstCalculation.sgst) : '-'}</span>
                          </div>
                          <div className="flex justify-between items-center py-3 border-t-2 border-[#2C5F2D]">
                            <span className="font-bold text-lg">{t('bill.totalGstAmount')}</span>
                            <span className="font-bold text-lg text-[#2C5F2D]">{formatCurrency(gstCalculation?.gstAmount || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center py-4 bg-[#2C5F2D] text-white rounded-lg px-4 -mx-4">
                            <span className="font-bold text-xl">{t('bill.totalInvoiceAmount')}</span>
                            <span className="font-bold text-xl">{formatCurrency(gstCalculation?.finalAmount || totalAmount)}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                  <div>
                    <p><strong className="text-gray-700">{t('bill.bankName')}:</strong> <span className="font-semibold">Union Bank of India-Current Account</span></p>
                  </div>
                  <div>
                    <p><strong className="text-gray-700">{t('bill.bankBranch')}:</strong> <span className="font-semibold">Banaswadi</span></p>
                  </div>
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
              <Button variant="primary" onClick={handlePrintBill} className="px-6 py-3 bg-[#2C5F2D] hover:bg-[#1e4d1f]">
                <Printer className="mr-2" size={18} />
                {t('bill.print')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}