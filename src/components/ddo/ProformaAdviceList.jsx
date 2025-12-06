import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Eye, Printer, FileText, Edit, Download, X } from 'lucide-react';
import Button from '@/components/shared/Button';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { t } from '@/lib/localization';
import { formatCurrency } from '@/lib/gstUtils';
import Image from 'next/image';
import { API_ENDPOINTS } from '@/components/api/api_const';

export default function ProformaAdviceList({
  proformaSearchTerm,
  setProformaSearchTerm,
  filteredProformaList,
  proformaLoading,
  onShowForm,
  onUpdateProforma,
  // New required props for consistent preview
  gstDetails = {},
  ddoDetails = {},
  bankDetails = {},
  numberToWords,
  formatDate
}) {
  const router = useRouter();
  const [editingRowId, setEditingRowId] = useState(null);
  const [inlineValue, setInlineValue] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [printOptimizedView, setPrintOptimizedView] = useState(false);
  const printRef = useRef();

  // Set default values if props are not provided
  const defaultGstDetails = {
    gstName: 'Government of Karnataka Police Department',
    address: 'Police Headquarters, Bangalore',
    gstNumber: '29AAAAA0000A1Z5',
    ...gstDetails
  };

  const defaultDdoDetails = {
    ddoCode: 'DDO001',
    fullName: 'Karnataka Police Department',
    city: 'Bengaluru',
    ...ddoDetails
  };

  const defaultBankDetails = {
    bankName: 'State Bank of India',
    bankBranch: 'Bangalore Main',
    ifscCode: 'SBIN0001234',
    accountNumber: '1234567890',
    ...bankDetails
  };

  const handleProformaClick = (row) => {
    setPreviewData(row);
    setShowPreviewModal(true);
  };

  // Fix signature URL
  const getSignatureUrl = (signaturePath) => {
    if (!signaturePath) return null;
    if (signaturePath.startsWith('http')) return signaturePath;
    if (signaturePath.startsWith('/')) return signaturePath;
    return API_ENDPOINTS.IMAGE_BASE_URL + signaturePath;
  };

  // Extract data from previewData to match Form format
  const extractPreviewData = () => {
    if (!previewData) return null;
    
    const raw = previewData.raw || previewData;
    const items = raw.items || [];
    const customerResponse = raw.customerResponse || raw.customer || {};
    
    // Extract line items
    const lineItems = items.map((item, index) => ({
      serialNo: index + 1,
      description: item.description || '',
      hsnNumber: item.hsnCode || item.hsnNumber || '',
      amount: parseFloat(item.amount) || 0
    }));
    
    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const totalQuantity = lineItems.length;
    
    return {
      lineItems,
      totalAmount,
      totalQuantity,
      customer: {
        customerName: customerResponse.name || customerResponse.customerName || previewData.customerName || '',
        gstNumber: customerResponse.gstNumber || customerResponse.gstin || previewData.customerGstin || '',
        address: customerResponse.address || '',
        stateCode: customerResponse.stateCode || ''
      },
      invoiceType: raw.invoiceType || raw.serviceType || 'EXEMPTED',
      note: raw.note || raw.invoiceRemarks || '',
      notificationDetails: raw.notificationDetails || '',
      gstCalculation: raw.gstCalculation || null,
      billDetails: {
        date: raw.date || previewData.proformaDate || new Date().toISOString().split('T')[0],
        placeOfSupply: raw.placeOfSupply || 'Bengaluru'
      },
      invoiceNumber: previewData.proformaNumber || raw.invoiceNumber || '',
      signature: previewData.signature || raw.signature || '',
      rcmIgst: raw.rcmIgst || 0,
      rcmCgst: raw.rcmCgst || 0,
      rcmSgst: raw.rcmSgst || 0,
      totalAdviceAmountReceivable: raw.totalAdviceAmountReceivable || raw.grandTotal || totalAmount
    };
  };

  const handlePrint = () => {
    if (!previewData) return;
    
    const data = extractPreviewData();
    if (!data) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    const currentDate = formatDateLocal(previewData.proformaDate || data.billDetails.date);
    const signatureUrl = getSignatureUrl(data.signature);
    
    // Get logo source
    const logoImg = document.querySelector('#proforma-preview-content img');
    const logoSrc = logoImg ? logoImg.src : '/1.png';
    
    // Build line items HTML
    const lineItemsHTML = data.lineItems.map((item) => `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${item.serialNo}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px;">${item.description || ''}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${item.hsnNumber || ''}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">1</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">Nos</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${formatCurrency(item.amount)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('');
    
    // Format percent helper
    const formatPercent = (val) => {
      if (val === null || val === undefined) return '';
      const num = Number(val);
      if (Number.isNaN(num)) return String(val);
      let s = num.toString();
      if (!/e/i.test(s) && s.includes('.')) {
        s = Number(num.toFixed(6)).toString();
      }
      s = s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/, '');
      return s;
    };
    
    // Calculate display rates
    const gstCalc = data.gstCalculation || {};
    const displayGstRate = gstCalc.gstRate || gstCalc.igst || 18;
    const displayCgstRate = gstCalc.cgstRate || (displayGstRate / 2);
    const displaySgstRate = gstCalc.sgstRate || (displayGstRate / 2);
    
    // GST Calculation HTML
    let gstCalcHTML = '';
    if (data.invoiceType === 'FCM' && gstCalc) {
      gstCalcHTML = `
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #ddd; font-size: 10px;">
          <span>IGST @ ${formatPercent(displayGstRate)}%:</span>
          <span>${gstCalc?.igst ? formatCurrency(gstCalc.igst) : '-'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #ddd; font-size: 10px;">
          <span>CGST @ ${formatPercent(displayCgstRate)}%:</span>
          <span>${gstCalc?.cgst ? formatCurrency(gstCalc.cgst) : '-'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #ddd; font-size: 10px;">
          <span>SGST @ ${formatPercent(displaySgstRate)}%:</span>
          <span>${gstCalc?.sgst ? formatCurrency(gstCalc.sgst) : '-'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #ddd; font-size: 10px; font-weight: bold;">
          <span>Total GST:</span>
          <span>${formatCurrency(gstCalc?.gstAmount || 0)}</span>
        </div>
      `;
    }
    
    // RCM Tax Details
    let rcmHTML = '';
    if (data.invoiceType === 'RCM') {
      rcmHTML = `
        <div style="margin-top: 6px;">
          <p style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">RCM Tax Details:</p>
          <div style="padding: 6px; background-color: #f9f9f9; border: 1px solid #ddd; font-size: 10px;">
            <p style="font-weight: bold; margin-bottom: 2px;">GST Payable Under RCM by the Recipient</p>
            <p style="font-weight: bold;">IGST : ${formatCurrency(data.rcmIgst)} &nbsp;&nbsp; CGST : ${formatCurrency(data.rcmCgst)}/- &nbsp;&nbsp; SGST: ${formatCurrency(data.rcmSgst)}/-</p>
          </div>
        </div>
      `;
    }
    
    // Amount in words
    const amountInWords = numberToWordsEnhanced(data.totalAdviceAmountReceivable);
    
    // Enhanced number to words function
    const convertToWords = (num) => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                   'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      
      if (num === 0) return 'Zero';
      if (num > 9999999999999) return 'Number too large';
      
      const convertLessThanOneThousand = (n) => {
        if (n === 0) return '';
        
        let result = '';
        
        if (n >= 100) {
          result += ones[Math.floor(n / 100)] + ' Hundred ';
          n %= 100;
        }
        
        if (n >= 20) {
          result += tens[Math.floor(n / 10)] + ' ';
          n %= 10;
        }
        
        if (n > 0) {
          result += ones[n] + ' ';
        }
        
        return result.trim();
      };
      
      let result = '';
      let remaining = Math.floor(num);
      
      // Handle Crores
      const crore = Math.floor(remaining / 10000000);
      if (crore > 0) {
        result += convertLessThanOneThousand(crore) + ' Crore ';
        remaining %= 10000000;
      }
      
      // Handle Lakhs
      const lakh = Math.floor(remaining / 100000);
      if (lakh > 0) {
        result += convertLessThanOneThousand(lakh) + ' Lakh ';
        remaining %= 100000;
      }
      
      // Handle Thousands
      const thousand = Math.floor(remaining / 1000);
      if (thousand > 0) {
        result += convertLessThanOneThousand(thousand) + ' Thousand ';
        remaining %= 1000;
      }
      
      // Handle Hundreds and below
      if (remaining > 0) {
        result += convertLessThanOneThousand(remaining);
      }
      
      // Handle decimal part (paise)
      const decimal = Math.round((num - Math.floor(num)) * 100);
      if (decimal > 0) {
        result += ' and ' + convertLessThanOneThousand(decimal) + ' Paise';
      }
      
      return result.trim() + (decimal === 0 ? ' Only' : '');
    };
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proforma Advice - ${data.invoiceNumber}</title>
          <style>
            @page {
              margin: 8mm;
              size: A4 portrait;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 10px;
              line-height: 1.3;
              color: black;
              background: white;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-container {
              width: 194mm;
              margin: 0 auto;
              padding: 3mm;
              box-sizing: border-box;
            }
            
            .print-header {
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            
            .print-section {
              margin-bottom: 8px;
              page-break-inside: avoid;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
              font-size: 10px;
            }
            
            th, td {
              border: 1px solid #000;
              padding: 4px;
              text-align: left;
            }
            
            th {
              background-color: #2C5F2D !important;
              color: white !important;
              font-weight: bold;
              text-align: center;
            }
            
            .total-row {
              background-color: #f5f5f5 !important;
              font-weight: bold;
            }
            
            .signature-section {
              margin-top: 15px;
              text-align: right;
            }
            
            .signature-box {
              display: inline-block;
              text-align: center;
            }
            
            .signature-image {
              max-height: 50px;
              max-width: 150px;
              object-fit: contain;
              margin-bottom: 4px;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              
              .print-container {
                width: 100%;
                min-height: 100%;
                padding: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <!-- Header Section -->
            <div class="print-header">
              <table style="border: none; margin-bottom: 5px;">
                <tr>
                  <td style="border: none; width: 20%; vertical-align: top;">
                    <div style="text-align: center;">
                      <img src="${logoSrc}" alt="Logo" style="max-width: 60px; max-height: 60px;" onerror="this.style.display='none'">
                    </div>
                  </td>
                  <td style="border: none; width: 60%; vertical-align: top; padding-left: 10px;">
                    <h1 style="margin: 0; font-size: 13px; font-weight: bold; color: #000;">
                      ${defaultGstDetails.gstName}
                    </h1>
                    <p style="margin: 1px 0; font-size: 10px;">${defaultGstDetails.address}</p>
                    <p style="margin: 1px 0; font-size: 10px;">GSTIN: ${defaultGstDetails.gstNumber}</p>
                  </td>
                  <td style="border: none; width: 20%; vertical-align: top; text-align: right;">
                    <h2 style="margin: 0; font-size: 15px; font-weight: bold; color: #2C5F2D;">PROFORMA ADVISE</h2>
                    <p style="margin: 3px 0; font-size: 10px; font-weight: bold;">Proforma No: ${data.invoiceNumber}</p>
                    <p style="margin: 1px 0; font-size: 10px;">Date: ${currentDate}</p>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Customer and Advice Details -->
            <div class="print-section">
              <table style="border: none; margin-bottom: 10px;">
                <tr>
                  <td style="border: 1px solid #000; width: 50%; padding: 6px; vertical-align: top;">
                    <h3 style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px;">Service Receiver Details</h3>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>Name:</strong> M/s ${data.customer.customerName || ''}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>GSTIN:</strong> ${data.customer.gstNumber || 'Not provided'}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>Address:</strong> ${data.customer.address || ''}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>State Code:</strong> ${data.customer.stateCode || ''}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>Type:</strong> ${data.invoiceType}</p>
                  </td>
                  <td style="border: 1px solid #000; width: 50%; padding: 6px; vertical-align: top;">
                    <h3 style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px;">Advice Details</h3>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>DDO Code:</strong> ${defaultDdoDetails.ddoCode}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>DDO Name:</strong> ${defaultDdoDetails.fullName}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>Place of Supply:</strong> ${data.billDetails.placeOfSupply || 'Bengaluru'}</p>
                    <p style="margin: 1px 0; font-size: 10px;"><strong>City/District:</strong> ${defaultDdoDetails.city}</p>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Line Items Table -->
            <div class="print-section">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Description</th>
                    <th>HSN Code</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th style="text-align: right;">Amount (₹)</th>
                    <th style="text-align: right;">Taxable Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsHTML}
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right; font-weight: bold;">Total</td>
                    <td style="text-align: center; font-weight: bold;">${data.totalQuantity}</td>
                    <td style="text-align: center; font-weight: bold;">Nos</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(data.totalAmount)}</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(data.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Additional Information and Calculation Summary -->
            <div class="print-section">
              <table style="border: none;">
                <tr>
                  <td style="border: 1px solid #000; width: 50%; padding: 6px; vertical-align: top;">
                    <h3 style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px;">Additional Information</h3>
                    <div style="margin-bottom: 6px;">
                      <p style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">Invoice Remarks:</p>
                      <p style="padding: 4px; background-color: #f9f9f9; border: 1px solid #ddd; font-size: 10px; margin: 0;">${data.note || '-'}</p>
                    </div>
                    <div style="margin-bottom: 6px;">
                      <p style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">Notification Details:</p>
                      <p style="padding: 4px; background-color: #f9f9f9; border: 1px solid #ddd; font-size: 10px; margin: 0; min-height: 30px;">${data.notificationDetails || '-'}</p>
                    </div>
                    ${rcmHTML}
                    <div style="margin-top: 6px;">
                      <p style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">Amount in Words:</p>
                      <p style="padding: 4px; background-color: #f9f9f9; border: 1px solid #ddd; font-size: 10px; margin: 0; font-style: italic;">${amountInWords}</p>
                    </div>
                  </td>
                  <td style="border: 1px solid #000; width: 50%; padding: 6px; vertical-align: top;">
                    <h3 style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px;">Calculation Summary</h3>
                    <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #ddd; font-size: 10px;">
                      <span>Total Taxable Value:</span>
                      <span style="font-weight: bold;">${formatCurrency(data.totalAmount)}</span>
                    </div>
                    ${gstCalcHTML}
                    <div style="display: flex; justify-content: space-between; padding: 6px; background-color: #2C5F2D; color: white; border-radius: 3px; margin-top: 8px; font-weight: bold; font-size: 10px;">
                      <span>Total amount payable:</span>
                      <span>${formatCurrency(data.totalAdviceAmountReceivable)}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Bank Details and Signature on same page -->
            <div class="print-section" style="page-break-inside: avoid;">
              <table style="border: none; margin-bottom: 10px;">
                <tr>
                  <td style="border: 1px solid #000; padding: 6px; width: 60%;">
                    <h3 style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px;">Bank Details</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px;">
                      <div><strong>Bank:</strong> ${defaultBankDetails.bankName}</div>
                      <div><strong>Branch:</strong> ${defaultBankDetails.bankBranch}</div>
                      <div><strong>IFSC:</strong> ${defaultBankDetails.ifscCode}</div>
                      <div><strong>Account No:</strong> ${defaultBankDetails.accountNumber}</div>
                    </div>
                  </td>
                  <td style="border: none; width: 40%; vertical-align: top; text-align: right; padding-left: 10px;">
                    <div class="signature-box" style="display: inline-block; text-align: center;">
                      ${signatureUrl 
                        ? `<img src="${signatureUrl}" 
                             alt="DDO Signature" 
                             class="signature-image"
                             style="max-height: 50px; max-width: 150px; object-fit: contain; margin-bottom: 4px;"
                             onerror="this.style.display='none'; this.parentElement.innerHTML+='<div style=\'height:35px; width:140px; border-bottom:1px solid #000; margin-bottom:4px;\'></div>'">`
                        : `<div style="height: 35px; width: 140px; border-bottom: 1px solid #000; margin-bottom: 4px;"></div>`
                      }
                      <div style="font-weight: bold; font-size: 10px;">Signature of DDO</div>
                      <div style="font-size: 10px;">${defaultDdoDetails.fullName}</div>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <div style="text-align: center; margin-top: 8px; font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 4px;">
                This is a computer generated document
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Enhanced number to words function
  const numberToWordsEnhanced = (num) => {
    if (numberToWords) return numberToWords(num);
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    if (num > 9999999999999) return 'Number too large';
    
    const convertLessThanOneThousand = (n) => {
      if (n === 0) return '';
      
      let result = '';
      
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      
      if (n > 0) {
        result += ones[n] + ' ';
      }
      
      return result.trim();
    };
    
    let result = '';
    let remaining = Math.floor(num);
    
    // Handle Crores
    const crore = Math.floor(remaining / 10000000);
    if (crore > 0) {
      result += convertLessThanOneThousand(crore) + ' Crore ';
      remaining %= 10000000;
    }
    
    // Handle Lakhs
    const lakh = Math.floor(remaining / 100000);
    if (lakh > 0) {
      result += convertLessThanOneThousand(lakh) + ' Lakh ';
      remaining %= 100000;
    }
    
    // Handle Thousands
    const thousand = Math.floor(remaining / 1000);
    if (thousand > 0) {
      result += convertLessThanOneThousand(thousand) + ' Thousand ';
      remaining %= 1000;
    }
    
    // Handle Hundreds and below
    if (remaining > 0) {
      result += convertLessThanOneThousand(remaining);
    }
    
    // Handle decimal part (paise)
    const decimal = Math.round((num - Math.floor(num)) * 100);
    if (decimal > 0) {
      result += ' and ' + convertLessThanOneThousand(decimal) + ' Paise';
    }
    
    return result.trim() + (decimal === 0 ? ' Only' : '');
  };

  // Print-specific styles for modal preview
  const PrintStyles = () => (
    <style jsx global>{`
      @media print {
        body * {
          visibility: hidden;
        }
        #proforma-preview-content,
        #proforma-preview-content * {
          visibility: visible;
        }
        #proforma-preview-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white;
          color: black;
        }
        .no-print {
          display: none !important;
        }
        .modal-header {
          display: none !important;
        }
      }
      
      /* Print optimized view */
      .print-optimized {
        max-width: 210mm !important;
        margin: 0 auto !important;
        padding: 15mm !important;
        background: white !important;
        color: black !important;
        font-size: 11px !important;
        line-height: 1.3 !important;
      }
      
      .print-optimized .print-header {
        border-bottom: 1.5px solid #000;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      
      .print-optimized table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 10px;
      }
      
      .print-optimized th {
        background-color: #2C5F2D !important;
        color: white !important;
        font-weight: bold;
        padding: 6px 8px;
      }
      
      .print-optimized td {
        border: 1px solid #000;
        padding: 4px 6px;
      }
      
      .print-optimized .signature-section {
        margin-top: 30px;
        text-align: right;
      }
      
      /* Mobile Responsive Styles */
      @media (max-width: 768px) {
        .mobile-stack {
          flex-direction: column;
        }
        .mobile-full {
          width: 100%;
        }
        .mobile-p-2 {
          padding: 0.5rem;
        }
        .mobile-text-sm {
          font-size: 0.875rem;
        }
        .mobile-text-xs {
          font-size: 0.75rem;
        }
        .mobile-grid-1 {
          grid-template-columns: 1fr;
        }
        .mobile-space-y-2 > * + * {
          margin-top: 0.5rem;
        }
        .mobile-hidden {
          display: none;
        }
        .mobile-btn-group {
          flex-direction: column;
          gap: 0.5rem;
        }
        .mobile-btn-group button {
          width: 100%;
        }
      }
    `}</style>
  );

  // Format date function
  const formatDateLocal = (dateString) => {
    if (formatDate) return formatDate(dateString);
    
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const proformaColumns = [
    { 
      key: 'customerName', 
      label: 'Customer Name' 
    },
    {
      key: 'serviceType',
      label: 'Service Type',
      render: (value) => value || '-',
    },
    {
      key: 'proformaNumber',
      label: 'Proforma Advice',
      render: (value, row) => (
        <div 
          className="cursor-pointer text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 hover:underline font-medium flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleProformaClick(row);
          }}
          title="Click to preview details"
        >
          <Eye size={16} />
          {value}
        </div>
      ),
    },
    {
      key: 'proformaAmount',
      label: 'Proforma Advice Amount',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'proformaDate',
      label: 'Proforma Advice Date',
      render: (value) => value ? new Date(value).toLocaleDateString('en-IN') : '-',
    },
    {
      key: 'signature',
      label: 'Signature',
      render: (_, row) => {
        const signaturePath = row.signature || (row.raw && row.raw.signature);
        const signatureUrl = getSignatureUrl(signaturePath);
        
        return signatureUrl ? (
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-12 border border-gray-300 bg-white flex items-center justify-center overflow-hidden p-1">
              <img 
                src={signatureUrl} 
                alt="DDO Signature" 
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="text-red-500 text-xs text-center p-1">
                      <svg class="w-4 h-4 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      Signature
                    </div>
                  `;
                }}
              />
            </div>
            <span className="text-xs text-green-700 font-medium">Signed</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-12 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
              <span className="text-xs text-gray-500">No Signature</span>
            </div>
            <span className="text-xs text-gray-500">Not Signed</span>
          </div>
        );
      },
    },
  ];

  const renderProformaActions = (row) => (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onShowForm && onShowForm(row);
        }}
        className="px-3 py-1.5 text-xs sm:text-sm"
      >
        <Edit size={14} className="mr-1" />
        Edit
      </Button>
    </div>
  );

  return (
    <section className="space-y-4 sm:space-y-6">
      <PrintStyles />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-blue-400">
            Proforma Advice List
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Search existing Proforma Advice entries and quickly jump back to the creation form.
          </p>
        </div>
        <Button
          onClick={() => onShowForm(null)}
          variant="primary"
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2" size={18} />
          Proforma Advice
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
        <input
          type="text"
          value={proformaSearchTerm}
          onChange={(e) => setProformaSearchTerm(e.target.value)}
          placeholder="Search by advice number, customer, or invoice..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div className="premium-card overflow-hidden">
        {proformaLoading ? (
          <div className="p-8 sm:p-16">
            <LoadingProgressBar message="Loading proforma advices..." variant="primary" />
          </div>
        ) : (
          <Table
            columns={proformaColumns}
            data={filteredProformaList}
            actions={renderProformaActions}
            itemsPerPage={5}
          />
        )}
      </div>

      {/* Enhanced Preview Modal with One-Page Print Format */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPrintOptimizedView(false);
        }}
        size="full"
      >
        {/* Custom Header - Title on left, Icons + Close on right */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-muted)] flex-shrink-0 sticky top-0 z-10 no-print modal-header">
          <h2 className="text-lg sm:text-2xl font-bold gradient-text truncate flex-1 pr-2">
            Proforma Advice Preview
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="p-2 hover:bg-blue-50 hover:text-blue-600">
              <Download size={18} />
            </Button>
            <Button variant="primary" onClick={handlePrint} className="p-2 bg-[#2C5F2D] hover:bg-[#1e4d1f]">
              <Printer size={18} />
            </Button>
            <button
              onClick={() => {
                setShowPreviewModal(false);
                setPrintOptimizedView(false);
              }}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 hover:rotate-90 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col h-full">
          {/* Preview Content - Same as Form */}
          {previewData && (() => {
            const data = extractPreviewData();
            if (!data) return null;
            
            return (
              <div 
                id="proforma-preview-content"
                ref={printRef}
                className={`flex-1 overflow-auto bg-white text-black p-6 print-content ${
                  printOptimizedView ? 'print-optimized' : ''
                }`}
                style={{ 
                  maxWidth: '210mm', 
                  margin: '0 auto',
                  minHeight: '297mm',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                {/* Print Header */}
                <div className="print-header mb-4 pb-3 border-b-2 border-gray-400">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="relative w-14 h-14 mt-1">
                        <Image
                          src="/1.png"
                          alt="Organization Logo"
                          width={56}
                          height={56}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <h1 className="font-bold text-gray-800 leading-tight" style={{ fontSize: '14px' }}>
                          {defaultGstDetails.gstName}
                        </h1>
                        <p className="text-gray-600 leading-tight" style={{ fontSize: '11px', marginTop: '2px' }}>{defaultGstDetails.address}</p>
                        <p className="text-gray-600" style={{ fontSize: '11px', marginTop: '2px' }}>GSTIN: {defaultGstDetails.gstNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="font-bold text-[#2C5F2D]" style={{ fontSize: '16px' }}>PROFORMA ADVISE</h2>
                      <p className="font-semibold" style={{ fontSize: '11px', marginTop: '4px' }}>Proforma No: {data.invoiceNumber}</p>
                      <p style={{ fontSize: '11px', marginTop: '2px' }}>Date: {formatDateLocal(previewData.proformaDate || data.billDetails.date)}</p>
                    </div>
                  </div>
                </div>

                {/* Customer and Invoice Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print-section">
                  <div className="border border-gray-300 p-3 rounded">
                    <h3 className="font-bold mb-2 text-gray-800 border-b pb-1" style={{ fontSize: '12px' }}>Service Receiver Details</h3>
                    <div className="space-y-1" style={{ fontSize: '11px' }}>
                      <p><strong>Name:</strong> M/s {data.customer.customerName || ''}</p>
                      <p><strong>GSTIN:</strong> {data.customer.gstNumber || 'Not provided'}</p>
                      <p><strong>Address:</strong> {data.customer.address || ''}</p>
                      <p><strong>State Code:</strong> {data.customer.stateCode || ''}</p>
                      <p><strong>Type:</strong> {data.invoiceType}</p>
                    </div>
                  </div>

                  <div className="border border-gray-300 p-3 rounded">
                    <h3 className="font-bold mb-2 text-gray-800 border-b pb-1" style={{ fontSize: '12px' }}>Advice Details</h3>
                    <div className="space-y-1" style={{ fontSize: '11px' }}>
                      <p><strong>DDO Code:</strong> {defaultDdoDetails.ddoCode}</p>
                      <p><strong>DDO Name:</strong> {defaultDdoDetails.fullName}</p>
                      <p><strong>Place of Supply:</strong> {data.billDetails.placeOfSupply || 'Bengaluru'}</p>
                      <p><strong>City/District:</strong> {defaultDdoDetails.city}</p>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-3 print-section">
                  <table className="w-full border-collapse border border-gray-400" style={{ fontSize: '11px' }}>
                    <thead>
                      <tr className="bg-[#2C5F2D] text-white">
                        <th className="border border-gray-400 p-2 text-center font-bold" style={{ fontSize: '11px' }}>S.No</th>
                        <th className="border border-gray-400 p-2 text-left font-bold" style={{ fontSize: '11px' }}>Description</th>
                        <th className="border border-gray-400 p-2 text-center font-bold" style={{ fontSize: '11px' }}>HSN Code</th>
                        <th className="border border-gray-400 p-2 text-center font-bold" style={{ fontSize: '11px' }}>Qty</th>
                        <th className="border border-gray-400 p-2 text-center font-bold" style={{ fontSize: '11px' }}>Unit</th>
                        <th className="border border-gray-400 p-2 text-right font-bold" style={{ fontSize: '11px' }}>Amount (₹)</th>
                        <th className="border border-gray-400 p-2 text-right font-bold" style={{ fontSize: '11px' }}>Taxable Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>{item.serialNo}</td>
                          <td className="border border-gray-400 p-2" style={{ fontSize: '11px' }}>{item.description}</td>
                          <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>{item.hsnNumber}</td>
                          <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>1</td>
                          <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>Nos</td>
                          <td className="border border-gray-400 p-2 text-right" style={{ fontSize: '11px' }}>{formatCurrency(item.amount)}</td>
                          <td className="border border-gray-400 p-2 text-right" style={{ fontSize: '11px' }}>{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold">
                        <td colSpan="3" className="border border-gray-400 p-2 text-right" style={{ fontSize: '11px' }}>Total</td>
                        <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>{data.totalQuantity}</td>
                        <td className="border border-gray-400 p-2 text-center" style={{ fontSize: '11px' }}>Nos</td>
                        <td className="border border-gray-400 p-2 text-right" style={{ fontSize: '11px' }}>{formatCurrency(data.totalAmount)}</td>
                        <td className="border border-gray-400 p-2 text-right" style={{ fontSize: '11px' }}>{formatCurrency(data.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Calculation and Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print-section">
                  <div className="border border-gray-300 p-3 rounded">
                    <h3 className="font-bold mb-2 text-gray-800 border-b pb-1" style={{ fontSize: '12px' }}>Additional Information</h3>
                    <div className="space-y-2" style={{ fontSize: '11px' }}>
                      <div>
                        <p className="font-semibold">Invoice Remarks:</p>
                        <p className="mt-1 p-2 bg-gray-50 rounded border" style={{ fontSize: '11px' }}>{data.note || '-'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Notification Details:</p>
                        <p className="mt-1 p-2 bg-gray-50 rounded border min-h-[40px]" style={{ fontSize: '11px' }}>{data.notificationDetails || '-'}</p>
                      </div>
                      
                      {/* RCM specific fields in preview */}
                      {data.invoiceType === 'RCM' && (
                        <div>
                          <p className="font-semibold">RCM Tax Details:</p>
                          <div className="mt-1 p-2 bg-gray-50 rounded border" style={{ fontSize: '11px' }}>
                            <span className="font-medium">GST Payable Under RCM by the Recipient</span>
                            <div className="mt-1 font-semibold">
                              IGST : {formatCurrency(data.rcmIgst)}          CGST : {formatCurrency(data.rcmCgst)}/-          SGST: {formatCurrency(data.rcmSgst)}/-
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">Amount in Words:</p>
                        <p className="mt-1 p-2 bg-gray-50 rounded border italic" style={{ fontSize: '11px' }}>{numberToWordsEnhanced(data.totalAdviceAmountReceivable)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-300 p-3 rounded">
                    <h3 className="font-bold mb-2 text-gray-800 border-b pb-1" style={{ fontSize: '12px' }}>Calculation Summary</h3>
                    <div className="space-y-1" style={{ fontSize: '11px' }}>
                      <div className="flex justify-between border-b py-1">
                        <span>Total Taxable Value:</span>
                        <span className="font-semibold">{formatCurrency(data.totalAmount)}</span>
                      </div>
                      
                      {data.invoiceType === 'FCM' && data.gstCalculation && (() => {
                        const gstCalc = data.gstCalculation;
                        const displayGstRate = gstCalc.gstRate || gstCalc.igst || 18;
                        const displayCgstRate = gstCalc.cgstRate || (displayGstRate / 2);
                        const displaySgstRate = gstCalc.sgstRate || (displayGstRate / 2);
                        const formatPercent = (val) => {
                          if (val === null || val === undefined) return '';
                          const num = Number(val);
                          if (Number.isNaN(num)) return String(val);
                          let s = num.toString();
                          if (!/e/i.test(s) && s.includes('.')) {
                            s = Number(num.toFixed(6)).toString();
                          }
                          s = s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/, '');
                          return s;
                        };
                        
                        return (
                          <>
                            <div className="flex justify-between border-b py-1">
                              <span>IGST @ {formatPercent(displayGstRate)}%:</span>
                              <span>{gstCalc?.igst ? formatCurrency(gstCalc.igst) : '-'}</span>
                            </div>
                            <div className="flex justify-between border-b py-1">
                              <span>CGST @ {formatPercent(displayCgstRate)}%:</span>
                              <span>{gstCalc?.cgst ? formatCurrency(gstCalc.cgst) : '-'}</span>
                            </div>
                            <div className="flex justify-between border-b py-1">
                              <span>SGST @ {formatPercent(displaySgstRate)}%:</span>
                              <span>{gstCalc?.sgst ? formatCurrency(gstCalc.sgst) : '-'}</span>
                            </div>
                            <div className="flex justify-between border-b py-1 font-semibold">
                              <span>Total GST:</span>
                              <span>{formatCurrency(gstCalc?.gstAmount || 0)}</span>
                            </div>
                          </>
                        );
                      })()}

                      <div className="flex justify-between py-2 bg-[#2C5F2D] text-white rounded px-3 mt-3 font-bold" style={{ fontSize: '11px' }}>
                        <span>Total amount payable:</span>
                        <span>{formatCurrency(data.totalAdviceAmountReceivable)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Details and Signature */}
                <div className="border border-gray-300 p-3 rounded mb-3 print-section" style={{ pageBreakInside: 'avoid' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold mb-2 text-gray-800 border-b pb-1" style={{ fontSize: '12px' }}>Bank Details</h3>
                      <div className="grid grid-cols-2 gap-3" style={{ fontSize: '11px' }}>
                        <div><strong>Bank:</strong> {defaultBankDetails.bankName}</div>
                        <div><strong>Branch:</strong> {defaultBankDetails.bankBranch}</div>
                        <div><strong>IFSC:</strong> {defaultBankDetails.ifscCode}</div>
                        <div><strong>Account No:</strong> {defaultBankDetails.accountNumber}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-center inline-block">
                        {(() => {
                          const signaturePath = data.signature || (previewData.raw && previewData.raw.signature);
                          const signatureUrl = getSignatureUrl(signaturePath);
                          
                          return signatureUrl ? (
                            <div className="mb-2 p-2 border border-gray-300 bg-white inline-block">
                              <img 
                                src={signatureUrl} 
                                alt="DDO Signature" 
                                className="h-20 max-w-48 object-contain mx-auto"
                                style={{ imageRendering: 'crisp-edges', maxHeight: '80px', maxWidth: '200px' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `
                                    <div class="text-red-500 text-center py-4" style="font-size: 10px;">
                                      Signature Image Not Available
                                    </div>
                                  `;
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-20 border-2 border-dashed border-gray-400 mb-2 w-48 flex items-center justify-center inline-block">
                              <span className="text-gray-500" style={{ fontSize: '10px' }}>No Signature Available</span>
                            </div>
                          );
                        })()}
                        <p className="font-semibold mt-1" style={{ fontSize: '11px' }}>Signature of DDO</p>
                        <p style={{ fontSize: '11px' }}>{defaultDdoDetails.fullName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-6 pt-2 border-t border-gray-300">
                    <p className="text-gray-600 italic" style={{ fontSize: '10px' }}>This is a computer generated document</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </Modal>
    </section>
  );
}