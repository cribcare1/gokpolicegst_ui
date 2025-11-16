// GST calculation and validation utilities
import { getStateCodeFromGSTIN, isSameState } from './stateCodes';

/**
 * Validates GSTIN format
 * GSTIN format: 15 characters, alphanumeric
 * First 2 digits: State code (29 for Karnataka)
 * 4th character can be 'G' for government entities
 * Format explanation:
 * - First 2 digits: State code
 * - Next 10 characters: PAN number (5 Alpha, 4 Numbers, 1 Alpha)
 * - 13th character: Number indicating count of GSTIN allocated
 * - 14th character: Common Check Digit (Z)
 * - 15th character: Alpha/Number Digit randomly allotted
 */
export const validateGSTIN = (gstin) => {
  if (!gstin) return { valid: false, message: 'GSTIN is required' };
  
  // Remove spaces and convert to uppercase
  const cleaned = gstin.trim().toUpperCase().replace(/\s/g, '');
  
  // Basic length check
  if (cleaned.length !== 15) {
    return { valid: false, message: 'GSTIN must be 15 characters long' };
  }
  
  // Alphanumeric check
  if (!/^[0-9A-Z]{15}$/.test(cleaned)) {
    return { valid: false, message: 'GSTIN must be alphanumeric' };
  }
  
  return { valid: true, cleaned };
};

/**
 * Checks if GSTIN is a government entity
 * Government GSTIN: 4th character (index 3) is 'G'
 */
export const isGovernmentGSTIN = (gstin) => {
  if (!gstin || gstin.length < 4) return false;
  const cleaned = gstin.trim().toUpperCase().replace(/\s/g, '');
  return cleaned[3] === 'G';
};

/**
 * Checks if PAN is a government entity
 * Government PAN: 4th character (index 3) is 'G'
 */
export const isGovernmentPAN = (pan) => {
  if (!pan || pan.length < 4) return false;
  const cleaned = pan.trim().toUpperCase().replace(/\s/g, '');
  return cleaned[3] === 'G';
};

/**
 * Checks if GSTIN is from Karnataka (starts with "29")
 */
export const isKarnatakaGSTIN = (gstin) => {
  if (!gstin || gstin.length < 2) return false;
  const cleaned = gstin.trim().toUpperCase().replace(/\s/g, '');
  return cleaned.startsWith('29');
};

/**
 * Calculates GST based on customer GSTIN, supplier GSTIN, taxable value, and invoice type
 * Rules based on invoice logic:
 * - Exempted Services: No GST for Govt customers (when 4th char of PAN is 'G')
 * - RCM (Reverse Charge Mechanism): Tax payable by recipient
 * - FCM (Forward Charge Mechanism): Tax payable by supplier
 * - Same State: CGST + SGST
 * - Different State: IGST
 * 
 * @param {string} supplierGSTIN - Supplier's GSTIN
 * @param {string} customerGSTIN - Customer's GSTIN (optional for exempted)
 * @param {string} customerPAN - Customer's PAN (to check if Govt)
 * @param {number} taxableValue - Taxable amount
 * @param {number} gstRate - GST rate (default 18%)
 * @param {string} invoiceType - 'RCM', 'FCM', or 'EXEMPTED'
 * @param {object} hsnDetails - HSN code details with IGST, CGST, SGST rates
 */
export const calculateGST = (
  supplierGSTIN,
  customerGSTIN,
  customerPAN,
  taxableValue,
  gstRate = 18,
  invoiceType = 'FCM',
  hsnDetails = null
) => {
  if (!taxableValue || taxableValue <= 0) {
    return {
      taxableValue: 0,
      gstAmount: 0,
      igst: 0,
      cgst: 0,
      sgst: 0,
      finalAmount: 0,
      isGovernment: false,
      isSameState: false,
      gstApplicable: false,
      invoiceType: invoiceType,
      note: '',
      taxPayableBy: 'supplier',
    };
  }

  // Check if customer is Government entity (4th character of PAN is 'G')
  const isGovtCustomer = customerPAN ? isGovernmentPAN(customerPAN) : false;
  
  // Check if customer GSTIN indicates Government
  const isGovtFromGSTIN = customerGSTIN ? isGovernmentGSTIN(customerGSTIN) : false;
  const isGovt = isGovtCustomer || isGovtFromGSTIN;

  // Exempted Services for Government customers
  if (invoiceType === 'EXEMPTED' || (isGovt && invoiceType !== 'RCM' && invoiceType !== 'FCM')) {
    return {
      taxableValue,
      gstAmount: 0,
      igst: 0,
      cgst: 0,
      sgst: 0,
      finalAmount: taxableValue,
      isGovernment: true,
      isSameState: false,
      gstApplicable: false,
      invoiceType: 'EXEMPTED',
      note: 'Exempted Services - No GST (Government Entity)',
      taxPayableBy: 'none',
    };
  }

  // Determine if supplier and customer are from same state
  let isSameStateFlag = false;
  if (supplierGSTIN && customerGSTIN) {
    isSameStateFlag = isSameState(supplierGSTIN, customerGSTIN);
  }

  // Get GST rates from HSN details if available
  let igstRate = gstRate;
  let cgstRate = gstRate / 2;
  let sgstRate = gstRate / 2;
  
  if (hsnDetails) {
    igstRate = hsnDetails.igst || gstRate;
    cgstRate = hsnDetails.cgst || gstRate / 2;
    sgstRate = hsnDetails.sgst || gstRate / 2;
  }

  // Calculate GST based on state
  let igst = 0;
  let cgst = 0;
  let sgst = 0;
  let note = '';

  if (isSameStateFlag) {
    // Same State: CGST + SGST
    cgst = (taxableValue * cgstRate) / 100;
    sgst = (taxableValue * sgstRate) / 100;
    note = `CGST @${cgstRate}% + SGST @${sgstRate}% (Same State)`;
  } else {
    // Different State: IGST
    igst = (taxableValue * igstRate) / 100;
    note = `IGST @${igstRate}% (Different State)`;
  }

  const gstAmount = igst + cgst + sgst;

  return {
    taxableValue,
    gstAmount,
    igst,
    cgst,
    sgst,
    finalAmount: taxableValue + gstAmount,
    isGovernment: isGovt,
    isSameState: isSameStateFlag,
    gstApplicable: true,
    invoiceType: invoiceType,
    note: `${note} - ${invoiceType === 'RCM' ? 'Reverse Charge' : invoiceType === 'FCM' ? 'Forward Charge' : 'Exempted'}`,
    taxPayableBy: invoiceType === 'RCM' ? 'recipient' : 'supplier',
  };
};

/**
 * Validates mobile number (10 digits)
 */
export const validateMobile = (mobile) => {
  console.log(mobile);
  if (mobile === undefined || mobile === null) {
    return { valid: false, message: 'Mobile number is required' };
  }

  const cleaned = String(mobile).normalize('NFKC').trim().replace(/[^0-9]/g, '');
  console.log("Cleaned:", cleaned, "Length:", cleaned.length);
  if (cleaned.length !== 10) {
    return { valid: false, message: 'Mobile number must be 10 digits' };
  }

  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(cleaned)) {
    return { valid: false, message: 'Invalid mobile number format' };
  }

  return { valid: true, cleaned };
};



/**
 * Validates PIN code (6 digits)
 */
export const validatePIN = (pin) => {
  if (!pin) return { valid: false, message: 'PIN code is required' };
  const cleaned = pin.trim().replace(/\D/g, '');
  if (cleaned.length !== 6) {
    return { valid: false, message: 'PIN code must be 6 digits' };
  }
  return { valid: true, cleaned };
};

/**
 * Validates email format
 */
export const validateEmail = (email) => {
  if (!email) return { valid: false, message: 'Email is required' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: 'Invalid email format' };
  }
  return { valid: true, cleaned: email.trim() };
};

/**
 * Validates PAN format (10 characters: 5 letters, 4 digits, 1 letter)
 * Last alphabet should not be 'O'
 */
export const validatePAN = (pan) => {
  if (!pan) return { valid: false, message: 'PAN is required' };
  const cleaned = pan.trim().toUpperCase().replace(/\s/g, '');
  if (cleaned.length !== 10) {
    return { valid: false, message: 'PAN must be 10 characters long' };
  }
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(cleaned)) {
    return { valid: false, message: 'Invalid PAN format' };
  }
  // Check if last alphabet is 'O'
  if (cleaned[9] === 'O') {
    return { valid: false, message: 'PAN last alphabet cannot be O' };
  }
  return { valid: true, cleaned: pan.trim() };
};

/**
 * Validates IFSC code format (11 characters: 4 letters, 0, 6 alphanumeric)
 */
export const validateIFSC = (ifsc) => {
  if (!ifsc) return { valid: false, message: 'IFSC code is required' };
  const cleaned = ifsc.trim().toUpperCase().replace(/\s/g, '');
  if (cleaned.length !== 11) {
    return { valid: false, message: 'IFSC code must be 11 characters long' };
  }
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(cleaned)) {
    return { valid: false, message: 'Invalid IFSC format' };
  }
  return { valid: true, cleaned };
};

/**
 * Validates that bill date is not in the future
 */
export const validateBillDate = (date) => {
  if (!date) return { valid: false, message: 'Date is required' };
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  if (selectedDate > today) {
    return { valid: false, message: 'Bill date cannot be in the future' };
  }
  return { valid: true };
};

/**
 * Checks if bill can be submitted
 * Rule: Total Bill Amount must equal Received Amount
 */
export const canSubmitBill = (totalAmount, receivedAmount) => {
  const difference = Math.abs(totalAmount - receivedAmount);
  const tolerance = 0.01; // Allow small floating point differences
  
  return difference <= tolerance;
};

/**
 * Formats currency for display
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Validates MICR code format (9 digits)
 */
export const validateMICR = (micr) => {
  if (!micr) return { valid: false, message: 'MICR code is required' };
  const cleaned = micr.trim().replace(/\D/g, '');
  if (cleaned.length !== 9) {
    return { valid: false, message: 'MICR code must be 9 digits' };
  }
  return { valid: true, cleaned };
};

/**
 * Validates account number (minimum 9 digits, maximum 18 digits)
 */
export const validateAccountNumber = (accountNumber) => {
  if (!accountNumber) return { valid: false, message: 'Account number is required' };
  const cleaned = accountNumber.trim().replace(/\D/g, '');
  if (cleaned.length < 9 || cleaned.length > 18) {
    return { valid: false, message: 'Account number must be between 9 and 18 digits' };
  }
  return { valid: true, cleaned };
};

/**
 * Validates name field (minimum 2 characters, only letters, spaces, and common punctuation)
 */
export const validateName = (name, fieldName = 'Name') => {
  if (!name) return { valid: false, message: `${fieldName} is required` };
  const cleaned = name.trim();
  if (cleaned.length < 2) {
    return { valid: false, message: `${fieldName} must be at least 2 characters` };
  }
  if (cleaned.length > 200) {
    return { valid: false, message: `${fieldName} must be less than 200 characters` };
  }
  // Allow letters, spaces, hyphens, apostrophes, and common punctuation
  if (!/^[a-zA-Z\s\-'.,()&]+$/.test(cleaned)) {
    return { valid: false, message: `${fieldName} contains invalid characters` };
  }
  return { valid: true, cleaned };
};

/**
 * Validates address field (minimum 10 characters)
 */
export const validateAddress = (address) => {
  if (!address) return { valid: false, message: 'Address is required' };
  const cleaned = address.trim();
  if (cleaned.length < 10) {
    return { valid: false, message: 'Address must be at least 10 characters' };
  }
  if (cleaned.length > 500) {
    return { valid: false, message: 'Address must be less than 500 characters' };
  }
  return { valid: true, cleaned };
};

/**
 * Validates city name
 */
export const validateCity = (city) => {
  if (!city) return { valid: false, message: 'City is required' };
  const cleaned = city.trim();
  if (cleaned.length < 2) {
    return { valid: false, message: 'City must be at least 2 characters' };
  }
  if (cleaned.length > 100) {
    return { valid: false, message: 'City must be less than 100 characters' };
  }
  if (!/^[a-zA-Z\s\-']+$/.test(cleaned)) {
    return { valid: false, message: 'City contains invalid characters' };
  }
  return { valid: true, cleaned };
};

/**
 * Validates state code (1-99)
 */
export const validateStateCode = (stateCode) => {
  if (!stateCode) return { valid: false, message: 'State code is required' };
  const code = parseInt(stateCode);
  if (isNaN(code) || code < 1 || code > 99) {
    return { valid: false, message: 'State code must be between 1 and 99' };
  }
  return { valid: true, cleaned: code.toString() };
};

/**
 * Validates DDO code format
 */
export const validateDDOCode = (ddoCode) => {
  if (!ddoCode) return { valid: false, message: 'DDO Code is required' };
  const cleaned = ddoCode.trim().toUpperCase();
  if (cleaned.length < 3) {
    return { valid: false, message: 'DDO Code must be at least 3 characters' };
  }
  if (cleaned.length > 20) {
    return { valid: false, message: 'DDO Code must be less than 20 characters' };
  }
  return { valid: true, cleaned };
};

/**
 * Validates HSN code (4-8 digits)
 */
export const validateHSN = (hsn) => {
  if (!hsn) return { valid: false, message: 'HSN code is required' };
  const cleaned = hsn.trim().replace(/\D/g, '');
  if (cleaned.length < 4 || cleaned.length > 8) {
    return { valid: false, message: 'HSN code must be between 4 and 8 digits' };
  }
  return { valid: true, cleaned };
};

/**
 * Validates GST rate (0-100)
 */
export const validateGSTRate = (rate) => {
  if (rate === undefined || rate === null || rate === '') {
    return { valid: false, message: 'GST rate is required' };
  }
  const numRate = parseFloat(rate);
  if (isNaN(numRate) || numRate < 0 || numRate > 100) {
    return { valid: false, message: 'GST rate must be between 0 and 100' };
  }
  return { valid: true, cleaned: numRate };
};

/**
 * Validates password (minimum 6 characters, at least one letter and one number)
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters` };
  }
  if (password.length > 50) {
    return { valid: false, message: 'Password must be less than 50 characters' };
  }
  // Optional: Check for at least one letter and one number
  // if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
  //   return { valid: false, message: 'Password must contain at least one letter and one number' };
  // }
  return { valid: true };
};

/**
 * Validates bill number
 */
export const validateBillNumber = (billNumber) => {
  if (!billNumber) return { valid: false, message: 'Bill number is required' };
  const cleaned = billNumber.trim();
  if (cleaned.length < 3) {
    return { valid: false, message: 'Bill number must be at least 3 characters' };
  }
  if (cleaned.length > 50) {
    return { valid: false, message: 'Bill number must be less than 50 characters' };
  }
  return { valid: true, cleaned };
};

/**
 * Validates amount (must be positive number)
 */
export const validateAmount = (amount, fieldName = 'Amount') => {
  if (amount === undefined || amount === null || amount === '') {
    return { valid: false, message: `${fieldName} is required` };
  }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    return { valid: false, message: `${fieldName} must be a positive number` };
  }
  return { valid: true, cleaned: numAmount };
};

/**
 * Validates description field
 */
export const validateDescription = (description) => {
  if (!description) return { valid: false, message: 'Description is required' };
  const cleaned = description.trim();
  if (cleaned.length < 3) {
    return { valid: false, message: 'Description must be at least 3 characters' };
  }
  if (cleaned.length > 500) {
    return { valid: false, message: 'Description must be less than 500 characters' };
  }
  return { valid: true, cleaned };
};

/**
 * Validates exemption certificate number (alphanumeric, optional)
 */
export const validateExemptionCert = (certNumber) => {
  if (!certNumber || certNumber.trim() === '') {
    return { valid: true, cleaned: '' }; // Optional field
  }
  const cleaned = certNumber.trim().toUpperCase();
  if (cleaned.length < 3) {
    return { valid: false, message: 'Exemption certificate number must be at least 3 characters' };
  }
  if (cleaned.length > 50) {
    return { valid: false, message: 'Exemption certificate number must be less than 50 characters' };
  }
  if (!/^[A-Z0-9\-/]+$/.test(cleaned)) {
    return { valid: false, message: 'Exemption certificate number contains invalid characters' };
  }
  return { valid: true, cleaned };
};

