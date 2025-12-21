/**
 * Formats a date as DD-MM-YYYY
 * @param {string|Date|number} date - The date to format
 * @returns {string} Formatted date or 'N/A' if invalid
 */
export function formatDateDDMMYYYY(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return ''; // invalid date check

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}



export function formatDateYYYYMMDD(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return ''; // invalid date check

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${year}-${month}-${day}`;
}
