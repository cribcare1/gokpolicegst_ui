import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
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

  const handleProformaClick = (row) => {
    setPreviewData(row);
    setShowPreviewModal(true);
  };

  const proformaColumns = [
    { key: 'customerName', label: 'Customer Name' },
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
    { key: 'invoiceNumber', label: 'Invoice No' },
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
        // Inline editable cell for tax invoice amount
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
                  onUpdateProforma(row.id, { taxInvoiceAmount: intVal, paidAmount: intVal, raw: { ...(row.raw || {}), paidAmount: intVal } });
                  setEditingRowId(null);
                } else if (e.key === 'Escape') {
                  setEditingRowId(null);
                }
              }}
              onBlur={() => {
                const intVal = inlineValue === '' ? 0 : parseInt(inlineValue, 10);
                onUpdateProforma(row.id, { taxInvoiceAmount: intVal, paidAmount: intVal, raw: { ...(row.raw || {}), paidAmount: intVal } });
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
              const v = (row.taxInvoiceAmount != null && row.taxInvoiceAmount !== '') ? String(Math.floor(Number(row.taxInvoiceAmount) || 0)) : ((row.paidAmount != null) ? String(Math.floor(Number(row.paidAmount) || 0)) : '');
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

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`Proforma Advice Details - ${previewData?.proformaNumber || ''}`}
      >
        {previewData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Customer Name
                </label>
                <p className="text-[var(--color-text-primary)] font-medium">{previewData.customerName || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Service Type
                </label>
                <p className="text-[var(--color-text-primary)] font-medium">{previewData.serviceType || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Proforma Advice Number
                </label>
                <p className="text-[var(--color-primary)] font-bold">{previewData.proformaNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Invoice Number
                </label>
                <p className="text-[var(--color-primary)] font-bold">{previewData.invoiceNumber || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Proforma Amount
                </label>
                <p className="text-[var(--color-text-primary)] font-medium">{formatCurrency(previewData.proformaAmount || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Tax Invoice Amount
                </label>
                <p className="text-[var(--color-text-primary)] font-medium">{formatCurrency(previewData.taxInvoiceAmount || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Proforma Date
                </label>
                <p className="text-[var(--color-text-primary)] font-medium">
                  {previewData.proformaDate ? new Date(previewData.proformaDate).toLocaleDateString('en-IN') : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Invoice Date
                </label>
                <p className="text-[var(--color-text-primary)] font-medium">
                  {previewData.invoiceDate ? new Date(previewData.invoiceDate).toLocaleDateString('en-IN') : '-'}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Difference Amount
              </label>
              <p className="text-lg font-bold text-[var(--color-accent)]">
                {formatCurrency(Math.max((previewData.proformaAmount || 0) - (previewData.taxInvoiceAmount || 0), 0))}
              </p>
            </div>
            <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
              <Button
                onClick={() => setShowPreviewModal(false)}
                variant="secondary"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}