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

  const handlePrint = () => {
    if (!previewData) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    const currentDate = previewData?.proformaDate ? 
      new Date(previewData.proformaDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : 
      new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    
    const invoiceDate = previewData?.invoiceDate ? 
      new Date(previewData.invoiceDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : '-';
    
    const signatureUrl = getSignatureUrl(previewData?.signature || (previewData?.raw?.signature));
    
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
          <title>Proforma Advice - ${previewData?.proformaNumber || ''}</title>
          <style>
            @page {
              margin: 10mm;
              size: A4 portrait;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 11px;
              line-height: 1.3;
              color: black;
              background: white;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-container {
              width: 190mm;
              min-height: 267mm;
              margin: 0 auto;
              padding: 5mm;
              box-sizing: border-box;
            }
            
            .print-header {
              border-bottom: 1.5px solid #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            
            .print-section {
              margin-bottom: 8px;
              page-break-inside: avoid;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
              font-size: 10px;
            }
            
            th, td {
              border: 1px solid #000;
              padding: 4px 6px;
              text-align: left;
              vertical-align: top;
            }
            
            th {
              background-color: #2C5F2D !important;
              color: white !important;
              font-weight: bold;
            }
            
            .total-row {
              background-color: #f5f5f5 !important;
              font-weight: bold;
            }
            
            .signature-section {
              margin-top: 20px;
              text-align: right;
            }
            
            .signature-box {
              display: inline-block;
              text-align: center;
              margin-top: 20px;
            }
            
            .signature-image {
              max-height: 50px;
              max-width: 150px;
              object-fit: contain;
              margin-bottom: 5px;
            }
            
            .amount-in-words {
              font-style: italic;
              padding: 5px;
              background-color: #f9f9f9;
              border: 1px solid #ddd;
              margin: 5px 0;
            }
            
            .header-logo {
              max-width: 60px;
              max-height: 60px;
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
              
              .no-print {
                display: none !important;
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
                      <img src="/1.png" alt="Logo" class="header-logo" onerror="this.style.display='none'">
                    </div>
                  </td>
                  <td style="border: none; width: 60%; vertical-align: top; padding-left: 10px;">
                    <h1 style="margin: 0; font-size: 14px; font-weight: bold; color: #000;">
                      ${defaultGstDetails.gstName}
                    </h1>
                    <p style="margin: 2px 0; font-size: 10px;">${defaultGstDetails.address}</p>
                    <p style="margin: 2px 0; font-size: 10px;">GSTIN: ${defaultGstDetails.gstNumber}</p>
                    <p style="margin: 2px 0; font-size: 10px;">Email: police@karnataka.gov.in</p>
                  </td>
                  <td style="border: none; width: 20%; vertical-align: top; text-align: right;">
                    <h2 style="margin: 0; font-size: 14px; font-weight: bold; color: #2C5F2D;">PROFORMA ADVICE</h2>
                    <p style="margin: 2px 0; font-size: 10px; font-weight: bold;">Advice No: ${previewData?.proformaNumber || 'N/A'}</p>
                    <p style="margin: 2px 0; font-size: 10px;">Date: ${currentDate}</p>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Customer Details -->
            <div class="print-section">
              <table>
                <tr>
                  <th colspan="4" style="background-color: #2C5F2D; color: white;">SERVICE RECEIVER DETAILS</th>
                </tr>
                <tr>
                  <td style="width: 25%; font-weight: bold;">Name</td>
                  <td style="width: 75%;" colspan="3">M/s ${previewData?.customerName || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">GSTIN</td>
                  <td>${previewData?.customerGstin || 'Not provided'}</td>
                  <td style="font-weight: bold;">Service Type</td>
                  <td>${previewData?.serviceType || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">DDO Code</td>
                  <td>${defaultDdoDetails.ddoCode}</td>
                  <td style="font-weight: bold;">Department</td>
                  <td>${defaultDdoDetails.fullName}</td>
                </tr>
              </table>
            </div>
            
            <!-- Amount Details -->
            <div class="print-section">
              <table>
                <tr>
                  <th colspan="2" style="background-color: #2C5F2D; color: white;">AMOUNT DETAILS</th>
                </tr>
                <tr>
                  <td style="width: 70%; font-weight: bold;">Description</td>
                  <td style="width: 30%; font-weight: bold; text-align: right;">Amount (₹)</td>
                </tr>
                <tr>
                  <td>Proforma Advice Amount</td>
                  <td style="text-align: right;">${formatCurrency(previewData?.proformaAmount || 0)}</td>
                </tr>
                <tr>
                  <td>Tax Invoice Amount</td>
                  <td style="text-align: right;">${formatCurrency(previewData?.taxInvoiceAmount || 0)}</td>
                </tr>
                <tr class="total-row">
                  <td style="font-weight: bold;">Difference Amount</td>
                  <td style="text-align: right; font-weight: bold; ${(previewData?.proformaAmount || 0) - (previewData?.taxInvoiceAmount || 0) > 0 ? 'color: red;' : 'color: green;'}">
                    ${formatCurrency(Math.max((previewData?.proformaAmount || 0) - (previewData?.taxInvoiceAmount || 0), 0))}
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Date Information -->
            <div class="print-section">
              <table>
                <tr>
                  <th colspan="2" style="background-color: #2C5F2D; color: white;">DATE INFORMATION</th>
                </tr>
                <tr>
                  <td style="width: 50%; font-weight: bold;">Proforma Date</td>
                  <td style="width: 50%;">${currentDate}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">Invoice Date</td>
                  <td>${invoiceDate}</td>
                </tr>
              </table>
            </div>
            
            <!-- Bank Details -->
            <div class="print-section">
              <table>
                <tr>
                  <th colspan="4" style="background-color: #2C5F2D; color: white;">BANK DETAILS</th>
                </tr>
                <tr>
                  <td style="width: 25%; font-weight: bold;">Bank Name</td>
                  <td style="width: 25%;">${defaultBankDetails.bankName}</td>
                  <td style="width: 25%; font-weight: bold;">Branch</td>
                  <td style="width: 25%;">${defaultBankDetails.bankBranch}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">IFSC Code</td>
                  <td>${defaultBankDetails.ifscCode}</td>
                  <td style="font-weight: bold;">Account No</td>
                  <td>${defaultBankDetails.accountNumber}</td>
                </tr>
              </table>
            </div>
            
            <!-- Amount in Words -->
            <div class="print-section">
              <div class="amount-in-words">
                <strong>Amount in Words:</strong> ${convertToWords(previewData?.proformaAmount || 0)}
              </div>
            </div>
            
            <!-- Signature Section -->
            <div class="signature-section">
              <div class="signature-box">
                ${signatureUrl 
                  ? `<img src="${signatureUrl}" 
                       alt="DDO Signature" 
                       class="signature-image"
                       onerror="this.style.display='none'; this.parentElement.innerHTML+='<div style=\'height:40px; width:150px; border-bottom:1px solid #000; margin-bottom:5px;\'></div>'">`
                  : `<div style="height: 40px; width: 150px; border-bottom: 1px solid #000; margin-bottom: 5px;"></div>`
                }
                <div style="font-weight: bold; font-size: 11px;">Signature of DDO</div>
                <div style="font-size: 10px;">${defaultDdoDetails.fullName}</div>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 20px; font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 5px;">
              This is a computer generated document and does not require signature
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
            <Button variant="primary" onClick={() => window.print()} className="p-2 bg-[#2C5F2D] hover:bg-[#1e4d1f]">
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
          {/* Preview Content - Optimized for One-Page Print */}
          {previewData && (
            <div 
              id="proforma-preview-content"
              ref={printRef}
              className={`flex-1 overflow-auto p-4 sm:p-6 ${printOptimizedView ? 'print-optimized bg-white text-black' : 'bg-white text-black'}`}
              style={{ maxWidth: '210mm', margin: '0 auto' }}
            >
              {/* Header Section */}
              <div className="border-b border-gray-300 pb-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="relative w-14 h-14">
                      <Image
                        src="/1.png"
                        alt="Organization Logo"
                        width={56}
                        height={56}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h1 className="text-sm font-bold">
                        {defaultGstDetails.gstName}
                      </h1>
                      <p className="text-xs mt-1">{defaultGstDetails.address}</p>
                      <p className="text-xs">GSTIN: {defaultGstDetails.gstNumber}</p>
                      <p className="text-xs">Email: police@karnataka.gov.in</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-[#2C5F2D]">
                      PROFORMA ADVICE
                    </h2>
                    <p className="text-sm font-semibold mt-1">
                      Advice No: {previewData.proformaNumber}
                    </p>
                    <p className="text-sm">
                      Date: {formatDateLocal(previewData.proformaDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-4">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-[#2C5F2D] text-white">
                      <th colSpan="4" className="p-2 text-sm">
                        SERVICE RECEIVER DETAILS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-semibold text-sm border border-gray-300" style={{width: '25%'}}>Name</td>
                      <td className="p-2 text-sm border border-gray-300" colSpan="3">
                        M/s {previewData.customerName || 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold text-sm border border-gray-300">GSTIN</td>
                      <td className="p-2 text-sm border border-gray-300">
                        {previewData.customerGstin || 'Not provided'}
                      </td>
                      <td className="p-2 font-semibold text-sm border border-gray-300">Service Type</td>
                      <td className="p-2 text-sm border border-gray-300">
                        {previewData.serviceType || 'Not specified'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold text-sm border border-gray-300">DDO Code</td>
                      <td className="p-2 text-sm border border-gray-300">{defaultDdoDetails.ddoCode}</td>
                      <td className="p-2 font-semibold text-sm border border-gray-300">Department</td>
                      <td className="p-2 text-sm border border-gray-300">{defaultDdoDetails.fullName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Amount Details */}
              <div className="mb-4">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-[#2C5F2D] text-white">
                      <th colSpan="2" className="p-2 text-sm">
                        AMOUNT DETAILS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-semibold text-sm border border-gray-300" style={{width: '70%'}}>Description</td>
                      <td className="p-2 font-semibold text-sm border border-gray-300 text-right" style={{width: '30%'}}>
                        Amount (₹)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 text-sm border border-gray-300">
                        Proforma Advice Amount
                      </td>
                      <td className="p-2 text-sm border border-gray-300 text-right">
                        {formatCurrency(previewData.proformaAmount || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 text-sm border border-gray-300">
                        Tax Invoice Amount
                      </td>
                      <td className="p-2 text-sm border border-gray-300 text-right">
                        {formatCurrency(previewData.taxInvoiceAmount || 0)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td className="p-2 font-semibold text-sm border border-gray-300">
                        Difference Amount
                      </td>
                      <td className={`p-2 text-sm border border-gray-300 text-right font-semibold ${(previewData.proformaAmount || 0) - (previewData.taxInvoiceAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Math.max((previewData.proformaAmount || 0) - (previewData.taxInvoiceAmount || 0), 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Date Information */}
              <div className="mb-4">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-[#2C5F2D] text-white">
                      <th colSpan="2" className="p-2 text-sm">
                        DATE INFORMATION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-semibold text-sm border border-gray-300" style={{width: '50%'}}>
                        Proforma Date
                      </td>
                      <td className="p-2 text-sm border border-gray-300">
                        {formatDateLocal(previewData.proformaDate)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold text-sm border border-gray-300">
                        Invoice Date
                      </td>
                      <td className="p-2 text-sm border border-gray-300">
                        {formatDateLocal(previewData.invoiceDate)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bank Details */}
              <div className="mb-4">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-[#2C5F2D] text-white">
                      <th colSpan="4" className="p-2 text-sm">
                        BANK DETAILS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-semibold text-sm border border-gray-300" style={{width: '25%'}}>
                        Bank Name
                      </td>
                      <td className="p-2 text-sm border border-gray-300" style={{width: '25%'}}>
                        {defaultBankDetails.bankName}
                      </td>
                      <td className="p-2 font-semibold text-sm border border-gray-300" style={{width: '25%'}}>
                        Branch
                      </td>
                      <td className="p-2 text-sm border border-gray-300" style={{width: '25%'}}>
                        {defaultBankDetails.bankBranch}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold text-sm border border-gray-300">
                        IFSC Code
                      </td>
                      <td className="p-2 text-sm border border-gray-300">
                        {defaultBankDetails.ifscCode}
                      </td>
                      <td className="p-2 font-semibold text-sm border border-gray-300">
                        Account No
                      </td>
                      <td className="p-2 text-sm border border-gray-300">
                        {defaultBankDetails.accountNumber}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Amount in Words */}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-300 text-sm">
                <strong>Amount in Words:</strong> {numberToWordsEnhanced(previewData.proformaAmount || 0)}
              </div>

              {/* Signature Section */}
              <div className="mt-8">
                <div className="flex justify-end">
                  <div className="text-center">
                    {(() => {
                      const signaturePath = previewData.signature || (previewData.raw && previewData.raw.signature);
                      const signatureUrl = getSignatureUrl(signaturePath);
                      
                      return signatureUrl ? (
                        <div className="mb-2 p-2 border border-gray-300 bg-white">
                          <img 
                            src={signatureUrl} 
                            alt="DDO Signature" 
                            className="h-20 max-w-48 object-contain mx-auto"
                            style={{ imageRendering: 'crisp-edges' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div class="h-20 w-48 border-b-2 border-gray-400 mx-auto mb-2"></div>
                              `;
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-48 border-b-2 border-gray-400 mx-auto mb-2"></div>
                      );
                    })()}
                    <p className="text-sm font-semibold">Signature of DDO</p>
                    <p className="text-sm">{defaultDdoDetails.fullName}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600">
                This is a computer generated document and does not require signature
              </div>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}