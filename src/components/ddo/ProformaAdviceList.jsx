import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { Plus, Search, Eye, Printer, FileText, Edit } from 'lucide-react';
import Button from '@/components/shared/Button';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { t } from '@/lib/localization';
import { formatCurrency } from '@/lib/gstUtils';
import Image from 'next/image';

export default function ProformaAdviceList({
  proformaSearchTerm,
  setProformaSearchTerm,
  filteredProformaList,
  proformaLoading,
  onCreateInvoiceFromProforma,
  onShowForm,
  onUpdateProforma
}) {
  const router = useRouter();
  const [editingRowId, setEditingRowId] = useState(null);
  const [inlineValue, setInlineValue] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [printOptimizedView, setPrintOptimizedView] = useState(false);
  const printRef = useRef();

  const handleProformaClick = (row) => {
    setPreviewData(row);
    setShowPreviewModal(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('proforma-preview-content');
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Get current date for display
    const currentDate = previewData?.proformaDate ? new Date(previewData.proformaDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    const invoiceDate = previewData?.invoiceDate ? new Date(previewData.invoiceDate).toLocaleDateString('en-IN') : '-';
    
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
                      <img src="/1.png" alt="Logo" style="max-width: 60px; max-height: 60px;" onerror="this.style.display='none'">
                    </div>
                  </td>
                  <td style="border: none; width: 60%; vertical-align: top; padding-left: 10px;">
                    <h1 style="margin: 0; font-size: 14px; font-weight: bold; color: #000;">
                      GOVERNMENT OF KARNATAKA POLICE DEPARTMENT
                    </h1>
                    <p style="margin: 2px 0; font-size: 10px;">Police Headquarters, Bangalore</p>
                    <p style="margin: 2px 0; font-size: 10px;">GSTIN: 29AAAAA0000A1Z5</p>
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
                  <td>DDO001</td>
                  <td style="font-weight: bold;">Department</td>
                  <td>Karnataka Police Department</td>
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
                  <td style="width: 25%;">State Bank of India</td>
                  <td style="width: 25%; font-weight: bold;">Branch</td>
                  <td style="width: 25%;">Bangalore Main</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">IFSC Code</td>
                  <td>SBIN0001234</td>
                  <td style="font-weight: bold;">Account No</td>
                  <td>1234567890</td>
                </tr>
              </table>
            </div>
            
            <!-- Amount in Words -->
            <div class="print-section">
              <div class="amount-in-words">
                <strong>Amount in Words:</strong> ${numberToWords(previewData?.proformaAmount || 0)} Only
              </div>
            </div>
            
            <!-- Signature Section -->
            <div class="signature-section">
              <div class="signature-box">
                ${previewData?.signature || (previewData?.raw && previewData.raw.signature) 
                  ? `<img src="${previewData.signature || previewData.raw.signature}" 
                       alt="DDO Signature" 
                       class="signature-image"
                       onerror="this.style.display='none'; this.parentElement.innerHTML+='<div style=\'height:40px; width:150px; border-bottom:1px solid #000; margin-bottom:5px;\'></div>'">`
                  : `<div style="height: 40px; width: 150px; border-bottom: 1px solid #000; margin-bottom: 5px;"></div>`
                }
                <div style="font-weight: bold; font-size: 11px;">Signature of DDO</div>
                <div style="font-size: 10px;">Karnataka Police Department</div>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 20px; font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 5px;">
              This is a computer generated document and does not require signature
            </div>
          </div>
          
          <script>
            // Helper function to convert number to words
            function numberToWords(num) {
              const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                           'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
              const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
              
              if (num === 0) return 'Zero';
              
              function convertLessThanOneThousand(n) {
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
              }
              
              let result = '';
              const crore = Math.floor(num / 10000000);
              if (crore > 0) {
                result += convertLessThanOneThousand(crore) + ' Crore ';
                num %= 10000000;
              }
              
              const lakh = Math.floor(num / 100000);
              if (lakh > 0) {
                result += convertLessThanOneThousand(lakh) + ' Lakh ';
                num %= 100000;
              }
              
              const thousand = Math.floor(num / 1000);
              if (thousand > 0) {
                result += convertLessThanOneThousand(thousand) + ' Thousand ';
                num %= 1000;
              }
              
              if (num > 0) {
                result += convertLessThanOneThousand(num);
              }
              
              return result.trim() + ' Rupees';
            }
            
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

  // Helper function for number to words conversion
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    function convertLessThanOneThousand(n) {
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
    }
    
    let result = '';
    const crore = Math.floor(num / 10000000);
    if (crore > 0) {
      result += convertLessThanOneThousand(crore) + ' Crore ';
      num %= 10000000;
    }
    
    const lakh = Math.floor(num / 100000);
    if (lakh > 0) {
      result += convertLessThanOneThousand(lakh) + ' Lakh ';
      num %= 100000;
    }
    
    const thousand = Math.floor(num / 1000);
    if (thousand > 0) {
      result += convertLessThanOneThousand(thousand) + ' Thousand ';
      num %= 1000;
    }
    
    if (num > 0) {
      result += convertLessThanOneThousand(num);
    }
    
    return result.trim() + ' Rupees';
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
        }
        .no-print {
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
      key: 'taxInvoiceAmount',
      label: 'Tax Invoice',
      render: (value, row) => {
        const isEditing = editingRowId === row.id;
        const display = (value || value === 0) ? formatCurrency(value) : '-';
        
        if (!onUpdateProforma) {
          return display;
        }

        if (isEditing) {
          return (
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inlineValue}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setInlineValue(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const intVal = inlineValue === '' ? 0 : parseInt(inlineValue, 10);
                      onUpdateProforma(row.id, { 
                        taxInvoiceAmount: intVal, 
                        paidAmount: intVal, 
                        raw: { ...(row.raw || {}), paidAmount: intVal } 
                      });
                      setEditingRowId(null);
                    } else if (e.key === 'Escape') {
                      setEditingRowId(null);
                    }
                  }}
                  onBlur={() => {
                    const intVal = inlineValue === '' ? 0 : parseInt(inlineValue, 10);
                    onUpdateProforma(row.id, { 
                      taxInvoiceAmount: intVal, 
                      paidAmount: intVal, 
                      raw: { ...(row.raw || {}), paidAmount: intVal } 
                    });
                    setEditingRowId(null);
                  }}
                  className="w-28 px-3 py-2 border-2 border-[var(--color-primary)] rounded-lg bg-white text-right shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 font-medium"
                  placeholder="Enter amount"
                  autoFocus
                />
              </div>
            </div>
          );
        }

        return (
          <div
            className="cursor-pointer select-none p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            onClick={() => {
              setEditingRowId(row.id);
              const v = (row.taxInvoiceAmount != null && row.taxInvoiceAmount !== '') 
                ? String(Math.floor(Number(row.taxInvoiceAmount) || 0)) 
                : ((row.paidAmount != null) 
                    ? String(Math.floor(Number(row.paidAmount) || 0)) 
                    : '');
              setInlineValue(v);
            }}
            title="Click to edit invoice amount"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-700">
                {display}
              </span>
              <Edit size={14} className="text-gray-500" />
            </div>
          </div>
        );
      },
    },
    {
      key: 'invoiceDate',
      label: 'Invoice Date',
      render: (value) => value ? new Date(value).toLocaleDateString('en-IN') : '-',
    },
    {
      key: 'differenceAmount',
      label: 'Difference Amount',
      render: (_, row) => {
        const difference = (row.proformaAmount || 0) - (row.taxInvoiceAmount || 0);
        return (
          <div className={`font-semibold ${difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(Math.max(difference, 0))}
          </div>
        );
      },
    },
    {
      key: 'signature',
      label: 'Signature',
      render: (_, row) => {
        const hasSignature = row.signature || (row.raw && row.raw.signature);
        return hasSignature ? (
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-12 border border-gray-300 bg-white flex items-center justify-center overflow-hidden">
              <img 
                src={row.signature || row.raw.signature} 
                alt="DDO Signature" 
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="text-red-500 text-xs text-center p-1">
                      <svg class="w-4 h-4 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      Image Error
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
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
      <Button
        variant="primary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onCreateInvoiceFromProforma(row);
        }}
        className="px-3 py-1.5 text-xs sm:text-sm"
      >
        Create Invoice
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
          onClick={onShowForm}
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
        title="Proforma Advice Preview"
        size="full"
      >
        <div className="flex flex-col h-full">
          {/* Preview Controls */}
          <div className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/20 p-4 flex justify-between items-center no-print mobile-stack mobile-space-y-2">
            <div className="flex items-center gap-3 mobile-stack mobile-space-y-2">
              <Button
                variant={printOptimizedView ? "primary" : "outline"}
                size="sm"
                onClick={() => setPrintOptimizedView(!printOptimizedView)}
                className="px-4 py-2 mobile-full mobile-text-sm"
              >
                {printOptimizedView ? 'Normal View' : 'Print Optimized'}
              </Button>
              <span className="text-sm text-[var(--color-text-secondary)] mobile-text-sm">
                {printOptimizedView ? 'Optimized for one-page printing' : 'Normal preview'}
              </span>
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] mobile-text-sm mobile-hidden">
              Click Print for best results
            </div>
          </div>

          {/* Preview Content - Optimized for One-Page Print */}
          {previewData && (
            <div 
              id="proforma-preview-content"
              ref={printRef}
              className={`flex-1 overflow-auto p-6 ${printOptimizedView ? 'print-optimized bg-white text-black' : 'bg-[var(--color-background)] text-[var(--color-text-primary)]'}`}
            >
              {/* Header Section */}
              <div className={`${printOptimizedView ? 'print-header' : 'border-b border-gray-300 pb-4 mb-4'}`}>
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
                      <h1 className={`font-bold ${printOptimizedView ? 'text-13px' : 'text-base'}`}>
                        GOVERNMENT OF KARNATAKA POLICE DEPARTMENT
                      </h1>
                      <p className={`${printOptimizedView ? 'text-10px mt-1' : 'text-sm mt-1'}`}>
                        Police Headquarters, Bangalore
                      </p>
                      <p className={`${printOptimizedView ? 'text-10px' : 'text-sm'}`}>
                        GSTIN: 29AAAAA0000A1Z5
                      </p>
                      <p className={`${printOptimizedView ? 'text-10px' : 'text-sm'}`}>
                        Email: police@karnataka.gov.in
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className={`font-bold ${printOptimizedView ? 'text-14px text-[#2C5F2D]' : 'text-lg text-[#2C5F2D]'}`}>
                      PROFORMA ADVICE
                    </h2>
                    <p className={`font-semibold ${printOptimizedView ? 'text-11px mt-1' : 'text-sm mt-1'}`}>
                      Advice No: {previewData.proformaNumber}
                    </p>
                    <p className={printOptimizedView ? 'text-10px' : 'text-sm'}>
                      Date: {previewData.proformaDate ? new Date(previewData.proformaDate).toLocaleDateString('en-IN') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className={`mb-4 ${printOptimizedView ? 'print-section' : ''}`}>
                <table className={`w-full ${printOptimizedView ? '' : 'border border-gray-300'}`}>
                  <thead>
                    <tr className={`${printOptimizedView ? 'bg-[#2C5F2D] text-white' : 'bg-gray-800 text-white'}`}>
                      <th colSpan="4" className={`p-2 ${printOptimizedView ? 'text-11px' : 'text-sm'}`}>
                        SERVICE RECEIVER DETAILS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`} style={{width: '25%'}}>Name</td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`} colSpan="3">
                        M/s {previewData.customerName || 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>GSTIN</td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        {previewData.customerGstin || 'Not provided'}
                      </td>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>Service Type</td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        {previewData.serviceType || 'Not specified'}
                      </td>
                    </tr>
                    <tr>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>DDO Code</td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>DDO001</td>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>Department</td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>Karnataka Police Department</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Amount Details */}
              <div className={`mb-4 ${printOptimizedView ? 'print-section' : ''}`}>
                <table className={`w-full ${printOptimizedView ? '' : 'border border-gray-300'}`}>
                  <thead>
                    <tr className={`${printOptimizedView ? 'bg-[#2C5F2D] text-white' : 'bg-gray-800 text-white'}`}>
                      <th colSpan="2" className={`p-2 ${printOptimizedView ? 'text-11px' : 'text-sm'}`}>
                        AMOUNT DETAILS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`} style={{width: '70%'}}>Description</td>
                      <td className={`p-2 font-semibold text-right ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`} style={{width: '30%'}}>
                        Amount (₹)
                      </td>
                    </tr>
                    <tr>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        Proforma Advice Amount
                      </td>
                      <td className={`p-2 text-right ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        {formatCurrency(previewData.proformaAmount || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        Tax Invoice Amount
                      </td>
                      <td className={`p-2 text-right ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        {formatCurrency(previewData.taxInvoiceAmount || 0)}
                      </td>
                    </tr>
                    <tr className={`${printOptimizedView ? 'bg-gray-100' : 'bg-gray-100'}`}>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        Difference Amount
                      </td>
                      <td className={`p-2 text-right font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'} ${(previewData.proformaAmount || 0) - (previewData.taxInvoiceAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Math.max((previewData.proformaAmount || 0) - (previewData.taxInvoiceAmount || 0), 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Date Information */}
              <div className={`mb-4 ${printOptimizedView ? 'print-section' : ''}`}>
                <table className={`w-full ${printOptimizedView ? '' : 'border border-gray-300'}`}>
                  <thead>
                    <tr className={`${printOptimizedView ? 'bg-[#2C5F2D] text-white' : 'bg-gray-800 text-white'}`}>
                      <th colSpan="2" className={`p-2 ${printOptimizedView ? 'text-11px' : 'text-sm'}`}>
                        DATE INFORMATION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`} style={{width: '50%'}}>
                        Proforma Date
                      </td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        {previewData.proformaDate ? new Date(previewData.proformaDate).toLocaleDateString('en-IN') : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        Invoice Date
                      </td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        {previewData.invoiceDate ? new Date(previewData.invoiceDate).toLocaleDateString('en-IN') : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bank Details */}
              <div className={`mb-4 ${printOptimizedView ? 'print-section' : ''}`}>
                <table className={`w-full ${printOptimizedView ? '' : 'border border-gray-300'}`}>
                  <thead>
                    <tr className={`${printOptimizedView ? 'bg-[#2C5F2D] text-white' : 'bg-gray-800 text-white'}`}>
                      <th colSpan="4" className={`p-2 ${printOptimizedView ? 'text-11px' : 'text-sm'}`}>
                        BANK DETAILS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`} style={{width: '25%'}}>
                        Bank Name
                      </td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`} style={{width: '25%'}}>
                        State Bank of India
                      </td>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`} style={{width: '25%'}}>
                        Branch
                      </td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`} style={{width: '25%'}}>
                        Bangalore Main
                      </td>
                    </tr>
                    <tr>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        IFSC Code
                      </td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        SBIN0001234
                      </td>
                      <td className={`p-2 font-semibold ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        Account No
                      </td>
                      <td className={`p-2 ${printOptimizedView ? 'text-10px border' : 'text-sm border border-gray-300'}`}>
                        1234567890
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Amount in Words */}
              <div className={`mb-4 p-3 bg-gray-50 border border-gray-300 ${printOptimizedView ? 'text-10px' : 'text-sm'}`}>
                <strong>Amount in Words:</strong> {numberToWords(previewData.proformaAmount || 0)} Only
              </div>

              {/* Signature Section */}
              <div className={`mt-8 ${printOptimizedView ? 'print-section' : ''}`}>
                <div className="flex justify-end">
                  <div className="text-center">
                    {previewData.signature || (previewData.raw && previewData.raw.signature) ? (
                      <div className="mb-2">
                        <img 
                          src={previewData.signature || previewData.raw.signature} 
                          alt="DDO Signature" 
                          className={`mx-auto ${printOptimizedView ? 'h-16 max-w-40' : 'h-20 max-w-48'}`}
                          style={{ imageRendering: 'crisp-edges' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="h-20 border-b-2 border-gray-400 w-48 mx-auto mb-2"></div>
                            `;
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`${printOptimizedView ? 'h-16 w-40' : 'h-20 w-48'} border-b-2 border-gray-400 mx-auto mb-2`}></div>
                    )}
                    <p className={`font-semibold ${printOptimizedView ? 'text-11px' : 'text-sm'}`}>Signature of DDO</p>
                    <p className={printOptimizedView ? 'text-10px' : 'text-sm'}>Karnataka Police Department</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`text-center mt-8 pt-4 border-t border-gray-300 ${printOptimizedView ? 'text-9px text-gray-600' : 'text-xs text-gray-600'}`}>
                This is a computer generated document and does not require signature
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-background)] p-4 flex justify-end gap-3 no-print mobile-btn-group">
            <Button variant="outline" onClick={() => setShowPreviewModal(false)} className="mobile-full mobile-text-sm">
              Close
            </Button>
            <Button variant="primary" onClick={handlePrint} className="bg-[#2C5F2D] hover:bg-[#1e4d1f] mobile-full mobile-text-sm">
              <Printer className="mr-2 inline" size={14} />
              Print
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}