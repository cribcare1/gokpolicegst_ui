import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import Button from '@/components/shared/Button';
import Table from '@/components/shared/Table';
import LoadingProgressBar from '@/components/shared/ProgressBar';
import { t } from '@/lib/localization';
import { formatCurrency } from '@/lib/gstUtils';

export default function ProformaAdviceList({
  proformaSearchTerm,
  setProformaSearchTerm,
  filteredProformaList,
  proformaLoading,
  onCreateInvoiceFromProforma,
  onShowForm
}) {
  const router = useRouter();

  const proformaColumns = [
    { key: 'customerName', label: 'Customer Name' },
    {
      key: 'serviceType',
      label: 'Service Type',
      render: (value) => value || '-',
    },
    { key: 'proformaNumber', label: 'Proforma Advice' },
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
      render: (value) => value ? formatCurrency(value) : '-',
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
  ];

  const renderProformaActions = (row) => (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onShowForm();
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
    </section>
  );
}