import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
import Button from '@/components/shared/Button';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { t } from '@/lib/localization';
import { formatCurrency } from '@/lib/gstUtils';

export default function CreditNotesList({
  creditNotesSearchTerm,
  setCreditNotesSearchTerm,
  filteredCreditNotesList,
  creditNotesLoading,
  onCreateCreditNote,
  onShowForm,
  onUpdateCreditNote
}) {
  const router = useRouter();
  const [editingRowId, setEditingRowId] = useState(null);
  const [inlineValue, setInlineValue] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const handleCreditNoteClick = (row) => {
    setPreviewData(row);
    setShowPreviewModal(true);
  };

  const creditNotesColumns = [
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
      key: 'invoiceNumber',
      label: 'Invoice Number',
      render: (value) => value || '-',
    },
    {
      key: 'creditNoteNumber',
      label: 'Credit Note Number',
      render: (value, row) => (
        <div 
          className="cursor-pointer text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 hover:underline font-medium flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleCreditNoteClick(row);
          }}
          title="Click to preview details"
        >
          <Eye size={16} />
          {value}
        </div>
      ),
    },
    {
      key: 'creditNoteAmount',
      label: 'Credit Note Amount',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'creditNoteDate',
      label: 'Credit Note Date',
      render: (value) => value ? new Date(value).toLocaleDateString('en-IN') : '-',
    },
    {
      key: 'invoiceAmount',
      label: 'Invoice Amount',
      render: (value) => formatCurrency(value || 0),
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
        const difference = (row.invoiceAmount || 0) - (row.creditNoteAmount || 0);
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

  const renderCreditNotesActions = (row) => (
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
          onCreateCreditNote(row);
        }}
        className="px-3 py-1.5 text-xs sm:text-sm"
      >
        Create Credit Note
      </Button>
    </div>
  );

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-blue-400">
            Invoice List
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Search existing Invoice entries and quickly jump back to the creation form.
          </p>
        </div>
        <Button
          onClick={onShowForm}
          variant="primary"
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2" size={18} />
          Credit Note
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
        <input
          type="text"
          value={creditNotesSearchTerm}
          onChange={(e) => setCreditNotesSearchTerm(e.target.value)}
          placeholder="Search by invoice number, customer, or credit note..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div className="premium-card overflow-hidden">
        {creditNotesLoading ? (
          <div className="p-8 sm:p-16">
            <LoadingProgressBar message="Loading invoices..." variant="primary" />
          </div>
        ) : (
          <Table
            columns={creditNotesColumns}
            data={filteredCreditNotesList}
            actions={renderCreditNotesActions}
            itemsPerPage={5}
          />
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`Invoice Details - ${previewData?.invoiceNumber || ''}`}
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
                  Invoice Number
                </label>
                <p className="text-[var(--color-primary)] font-bold">{previewData.invoiceNumber || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Credit Note Number
                </label>
                <p className="text-[var(--color-primary)] font-bold">{previewData.creditNoteNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Credit Note Amount
                </label>
                <p className="text-[var(--color-text-primary)] font-medium">{formatCurrency(previewData.creditNoteAmount || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Invoice Amount
                </label>
                <p className="text-[var(--color-text-primary)] font-medium">{formatCurrency(previewData.invoiceAmount || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Credit Note Date
                </label>
                <p className="text-[var(--color-text-primary)] font-medium">
                  {previewData.creditNoteDate ? new Date(previewData.creditNoteDate).toLocaleDateString('en-IN') : '-'}
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
                {formatCurrency(Math.max((previewData.invoiceAmount || 0) - (previewData.creditNoteAmount || 0), 0))}
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