import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Search, Eye, Printer, FileText } from 'lucide-react';
import Button from '@/components/shared/Button';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { t } from '@/lib/localization';
import { formatCurrency } from '@/lib/gstUtils';

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

  const handleProformaClick = (row) => {
    setPreviewData(row);
    setShowPreviewModal(true);
  };

  const handlePrintPreview = () => {
    const printContent = document.getElementById('proforma-preview-content');
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proforma Advice - ${previewData?.proformaNumber || ''}</title>
          <style>
            @media print {
              @page {
                margin: 8mm;
                size: A4 portrait;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: 'Arial', sans-serif;
                font-size: 11px;
                line-height: 1.1;
                color: black;
                background: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-container {
                width: 100%;
                height: 100%;
                padding: 0;
                margin: 0;
              }
              .print-header {
                border-bottom: 1.5px solid #000;
                margin-bottom: 8px;
                padding-bottom: 6px;
              }
              .print-section {
                margin-bottom: 8px;
                page-break-inside: avoid;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                font-size: 9px;
                margin-bottom: 6px;
              }
              th, td {
                border: 1px solid #000;
                padding: 3px 4px;
                text-align: left;
              }
              th {
                background-color: #2C5F2D !important;
                color: white !important;
                font-weight: bold;
              }
              .bg-primary {
                background-color: #2C5F2D !important;
                color: white !important;
              }
              .text-primary {
                color: #2C5F2D !important;
              }
              .no-print {
                display: none !important;
              }
              .compact-view {
                transform: scale(0.95);
                transform-origin: top center;
              }
            }
            
            /* Base styles */
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.1;
              color: black;
              background: white;
              margin: 0;
              padding: 8mm;
            }
            .print-container {
              width: 194mm;
              min-height: 277mm;
            }
            .print-header {
              border-bottom: 1.5px solid #000;
              margin-bottom: 8px;
              padding-bottom: 6px;
            }
            .print-section {
              margin-bottom: 8px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              font-size: 9px;
              margin-bottom: 6px;
            }
            th, td {
              border: 1px solid #000;
              padding: 3px 4px;
              text-align: left;
            }
            th {
              background-color: #2C5F2D;
              color: white;
              font-weight: bold;
            }
            .bg-primary {
              background-color: #2C5F2D;
              color: white;
              padding: 4px 6px;
            }
            .text-primary {
              color: #2C5F2D;
            }
            .border-section {
              border: 1px solid #ccc;
              padding: 6px;
              margin-bottom: 6px;
              border-radius: 2px;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 180px;
              margin-top: 30px;
            }
            
            /* Signature image styles for print window */
            .signature-image {
              max-height: 60px !important;
              max-width: 200px !important;
              object-fit: contain !important;
              image-rendering: -webkit-optimize-contrast !important;
              image-rendering: crisp-edges !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container compact-view">
            ${printContent.innerHTML.replace(
              /<div class="signature-line"><\/div>/g,
              (previewData.signature || (previewData.raw && previewData.raw.signature)) 
                ? `<div class="mb-2">
                     <img 
                       src="${previewData.signature || previewData.raw.signature}" 
                       alt="DDO Signature" 
                       class="signature-image"
                       style="image-rendering: crisp-edges"
                     />
                   </div>`
                : `<div class="signature-line"></div>`
            )}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
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
        .no-print {
          display: none !important;
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
          <Eye size={24} />
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
            <input
              type="text"
              inputMode="numeric"
              value={inlineValue}
              onChange={(e) => setInlineValue(e.target.value.replace(/[^0-9]/g, ''))}
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
              className="w-28 px-3 py-2 border-2 border-[var(--color-primary)] rounded-lg text-right bg-[var(--color-primary)]/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              placeholder="₹0"
              autoFocus
            />
          );
        }

        return (
          <div
            className="cursor-pointer select-none"
            onClick={() => {
              setEditingRowId(row.id);
              const v = (row.taxInvoiceAmount != null && row.taxInvoiceAmount !== '') 
                ? String(Math.floor(Number(row.taxInvoiceAmount) || 0)) 
                : ((row.paidAmount != null) 
                    ? String(Math.floor(Number(row.paidAmount) || 0)) 
                    : '');
              setInlineValue(v);
            }}
            title="Click to edit"
          >
            {display}
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
        return formatCurrency(Math.max(difference, 0));
      },
    },
    {
      key: 'signature',
      label: 'Signature',
      render: (_, row) => {
        const hasSignature = row.signature || (row.raw && row.raw.signature);
        return hasSignature ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-green-700 font-medium">Signed</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">Pending</span>
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

      {/* Print Styles */}
      <PrintStyles />

      {/* Enhanced Preview Modal */}
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
          <div className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/20 p-4 flex justify-between items-center no-print">
            <div className="flex items-center gap-3">
              <Button
                variant={printOptimizedView ? "primary" : "outline"}
                size="sm"
                onClick={() => setPrintOptimizedView(!printOptimizedView)}
                className="px-4 py-2"
              >
                {printOptimizedView ? 'Normal View' : 'Compact View'}
              </Button>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {printOptimizedView ? 'Optimized for one-page printing' : 'Normal preview'}
              </span>
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              Click Print for best results
            </div>
          </div>

          {/* Preview Content */}
          {previewData && (
            <div 
              id="proforma-preview-content" 
              className={`flex-1 overflow-auto bg-white text-black p-4 print-content ${
                printOptimizedView ? 'print-optimized' : ''
              }`}
              style={{ 
                maxWidth: '210mm', 
                margin: '0 auto',
                minHeight: '297mm'
              }}
            >
              {/* Print Header - More Compact */}
              <div className="print-header mb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="relative w-12 h-12 mt-1">
                      <img
                        src="/1.png"
                        alt="Organization Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-sm font-bold text-gray-800 leading-tight">
                        Government of Karnataka Police Department
                      </h1>
                      <p className="text-xs text-gray-600 leading-tight">Police Headquarters, Bangalore</p>
                      <p className="text-xs text-gray-600">GSTIN: 29AAAAA0000A1Z5</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-[#2C5F2D]">PROFORMA NUMBER</h2>
                    <p className="text-sm font-semibold">Advice No: {previewData.proformaNumber}</p>
                    <p className="text-sm">Date: {previewData.proformaDate ? new Date(previewData.proformaDate).toLocaleDateString('en-IN') : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Customer and Invoice Details - More Compact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 print-section">
                <div className="border-section">
                  <h3 className="font-bold mb-1 text-gray-800 border-b pb-1 text-xs">Service Receiver Details</h3>
                  <div className="space-y-1 text-xs">
                    <p><strong>Name:</strong> M/s {previewData.customerName || ''}</p>
                    <p><strong>Service Type:</strong> {previewData.serviceType || 'Not specified'}</p>
                    <p><strong>Advice Number:</strong> {previewData.proformaNumber}</p>
                  </div>
                </div>

                <div className="border-section">
                  <h3 className="font-bold mb-1 text-gray-800 border-b pb-1 text-xs">Advice Details</h3>
                  <div className="space-y-1 text-xs">
                    <p><strong>DDO Code:</strong> DDO001</p>
                    <p><strong>Department:</strong> Karnataka Police Department</p>
                    <p><strong>Place of Supply:</strong> Bengaluru</p>
                  </div>
                </div>
              </div>

              {/* Amount Details Table - More Compact */}
              <div className="mb-3 print-section">
                <table>
                  <thead>
                    <tr className="bg-primary">
                      <th className="text-xs p-1">Description</th>
                      <th className="text-xs p-1 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-xs p-1">Proforma Advice Amount</td>
                      <td className="text-xs p-1 text-right">{formatCurrency(previewData.proformaAmount || 0)}</td>
                    </tr>
                    <tr>
                      <td className="text-xs p-1">Tax Invoice Amount</td>
                      <td className="text-xs p-1 text-right">{formatCurrency(previewData.taxInvoiceAmount || 0)}</td>
                    </tr>
                    <tr className="bg-gray-100 font-bold">
                      <td className="text-xs p-1">Difference Amount</td>
                      <td className="text-xs p-1 text-right">
                        {formatCurrency(Math.max((previewData.proformaAmount || 0) - (previewData.taxInvoiceAmount || 0), 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Additional Information - More Compact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 print-section">
                <div className="border-section">
                  <h3 className="font-bold mb-1 text-gray-800 border-b pb-1 text-xs">Date Information</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Proforma Date:</span>
                      <span className="font-semibold">
                        {previewData.proformaDate ? new Date(previewData.proformaDate).toLocaleDateString('en-IN') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Invoice Date:</span>
                      <span className="font-semibold">
                        {previewData.invoiceDate ? new Date(previewData.invoiceDate).toLocaleDateString('en-IN') : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-section">
                  <h3 className="font-bold mb-1 text-gray-800 border-b pb-1 text-xs">Summary</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Total Advice Amount:</span>
                      <span className="font-semibold">{formatCurrency(previewData.proformaAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Invoice Amount:</span>
                      <span className="font-semibold">{formatCurrency(previewData.taxInvoiceAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1 bg-primary rounded px-2 mt-1 font-bold text-xs">
                      <span>Pending Amount:</span>
                      <span>{formatCurrency(Math.max((previewData.proformaAmount || 0) - (previewData.taxInvoiceAmount || 0), 0))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details - More Compact */}
              <div className="border-section mb-3 print-section">
                <h3 className="font-bold mb-1 text-gray-800 border-b pb-1 text-xs">Bank Details</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><strong>Bank:</strong> State Bank of India</div>
                  <div><strong>Branch:</strong> Bangalore Main</div>
                  <div><strong>IFSC:</strong> SBIN0001234</div>
                  <div><strong>Account No:</strong> 1234567890</div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="signature-section print-section mt-4">
                <div className="flex justify-end">
                  <div className="text-center">
                    {/* Display actual signature if available, otherwise show signature line */}
                    {(previewData.signature || (previewData.raw && previewData.raw.signature)) ? (
                      <div className="mb-2">
                        <img 
                          src={previewData.signature || previewData.raw.signature} 
                          alt="DDO Signature" 
                          className="h-12 max-w-36 object-contain mx-auto"
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                      </div>
                    ) : (
                      <div className="h-12 border-b border-gray-400 mb-2 w-36"></div>
                    )}
                    <p className="text-xs font-semibold mt-1">Signature of DDO</p>
                    <p className="text-xs">Karnataka Police Department</p>
                  </div>
                </div>

                <div className="text-center mt-4 pt-2 border-t border-gray-300">
                  <p className="text-xs text-gray-600 italic">This is a computer generated document</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-background)] p-4 flex justify-end gap-3 no-print">
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handlePrintPreview} className="bg-[#2C5F2D] hover:bg-[#1e4d1f]">
              <Printer className="mr-2 inline" size={14} />
              Print
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}