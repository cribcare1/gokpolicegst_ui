// GST calculation and validation utilities

/**
 * Validates GSTIN format
 * GSTIN format: 15 characters, alphanumeric
 * First 2 digits: State code (29 for Karnataka)
 * 4th character can be 'G' for government entities
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
 * Checks if GSTIN is a government entity (Karnataka)
 * Government GSTIN: starts with "29" and 4th character is 'G'
 */
export const isGovernmentGSTIN = (gstin) => {
  if (!gstin || gstin.length < 4) return false;
  const cleaned = gstin.trim().toUpperCase().replace(/\s/g, '');
  return cleaned.startsWith('29') && cleaned[3] === 'G';
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
 * Calculates GST based on customer GSTIN and taxable value
 * Rules:
 * - If govt GSTIN (29*G*): GST = 0
 * - If Karnataka non-govt (29*): CGST 9% + SGST 9% = 18% total
 * - Otherwise: Standard GST rate (default 18%)
 */
export const calculateGST = (customerGSTIN, taxableValue, gstRate = 18) => {
  if (!customerGSTIN || !taxableValue || taxableValue <= 0) {
    return {
      taxableValue: 0,
      gstAmount: 0,
      cgst: 0,
      sgst: 0,
      finalAmount: 0,
      isGovernment: false,
      isKarnataka: false,
      gstApplicable: true,
      note: '',
    };
  }
  
  const cleanedGSTIN = customerGSTIN.trim().toUpperCase().replace(/\s/g, '');
  const isGovt = isGovernmentGSTIN(cleanedGSTIN);
  const isKarnataka = isKarnatakaGSTIN(cleanedGSTIN);
  
  if (isGovt) {
    // Government entity - No GST
    return {
      taxableValue,
      gstAmount: 0,
      cgst: 0,
      sgst: 0,
      finalAmount: taxableValue,
      isGovernment: true,
      isKarnataka: true,
      gstApplicable: false,
      note: 'GST Not Applicable - Government Entity (Karnataka)',
    };
  }
  
  if (isKarnataka) {
    // Karnataka non-government - CGST 9% + SGST 9%
    const cgst = (taxableValue * 9) / 100;
    const sgst = (taxableValue * 9) / 100;
    const gstAmount = cgst + sgst;
    
    return {
      taxableValue,
      gstAmount,
      cgst,
      sgst,
      finalAmount: taxableValue + gstAmount,
      isGovernment: false,
      isKarnataka: true,
      gstApplicable: true,
      note: 'CGST @9% + SGST @9% = 18% (Karnataka)',
    };
  }
  
  // Other states/entities - Standard GST rate
  const gstAmount = (taxableValue * gstRate) / 100;
  const cgst = gstAmount / 2; // Split equally for CGST and SGST (for standard rate)
  const sgst = gstAmount / 2;
  
  return {
    taxableValue,
    gstAmount,
    cgst,
    sgst,
    finalAmount: taxableValue + gstAmount,
    isGovernment: false,
    isKarnataka: false,
    gstApplicable: true,
    note: `GST @${gstRate}% (Standard Rate)`,
  };
};

/**
 * Validates mobile number (10 digits)
 */
export const validateMobile = (mobile) => {
  if (!mobile) return { valid: false, message: 'Mobile number is required' };
  const cleaned = mobile.trim().replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return { valid: false, message: 'Mobile number must be 10 digits' };
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
  return { valid: true, cleaned };
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

