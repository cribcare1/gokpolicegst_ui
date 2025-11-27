// Indian States and Union Territories with GST Codes
export const STATE_CODES = {
  1: 'Jammu & Kashmir',
  2: 'Himachal Pradesh',
  3: 'Punjab',
  4: 'Chandigarh',
  5: 'Uttarakhand',
  6: 'Haryana',
  7: 'Delhi',
  8: 'Rajasthan',
  9: 'Uttar Pradesh',
  10: 'Bihar',
  11: 'Sikkim',
  12: 'Arunachal Pradesh',
  13: 'Nagaland',
  14: 'Manipur',
  15: 'Mizoram',
  16: 'Tripura',
  17: 'Meghalaya',
  18: 'Assam',
  19: 'West Bengal',
  20: 'Jharkhand',
  21: 'Odisha',
  22: 'Chhattisgarh',
  23: 'Madhya Pradesh',
  24: 'Gujarat',
  25: 'Daman & Diu',
  26: 'Dadra & Nagar Haveli',
  27: 'Maharashtra',
  28: 'Andhra Pradesh (Old)',
  29: 'Karnataka',
  30: 'Goa',
  31: 'Lakshadweep',
  32: 'Kerala',
  33: 'Tamil Nadu',
  34: 'Puducherry',
  35: 'Andaman & Nicobar Islands',
  36: 'Telangana',
  37: 'Andhra Pradesh (Newly Added)',
  38: 'Ladakh (Newly Added)',
  97: 'Others Territory',
  99: 'Center Jurisdiction',
};

// Reverse mapping: State name to code
export const STATE_NAME_TO_CODE = {};
Object.entries(STATE_CODES).forEach(([code, name]) => {
  STATE_NAME_TO_CODE[name] = parseInt(code);
});

/**
 * Get state name from GST code
 */
export const getStateName = (code) => {
  return STATE_CODES[code] || 'Unknown';
};

/**
 * Get GST code from state name
 */
export const getStateCode = (stateName) => {
  return STATE_NAME_TO_CODE[stateName] || null;
};

/**
 * Extract state code from GSTIN (first 2 digits)
 */
export const getStateCodeFromGSTIN = (gstin) => {
  if (!gstin || gstin.length < 2) return null;
  const code = parseInt(gstin.substring(0, 2));
  return code || null;
};

/**
 * Check if two GSTINs are from same state
 */
export const isSameState = (gstin1, gstin2) => {
  console.log(gstin1,gstin1);
  console.log(gstin2,gstin2);
  const code1 = getStateCodeFromGSTIN(gstin1);
  const code2 = getStateCodeFromGSTIN(gstin2);
  return code1 && code2 && code1 === code2;
};

/**
 * Get all states as array for dropdown
 */
export const getAllStates = () => {
  return Object.entries(STATE_CODES).map(([code, name]) => ({
    code: parseInt(code),
    name,
  })).sort((a, b) => a.code - b.code);
};

