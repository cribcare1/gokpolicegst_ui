"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { formatCurrency } from '@/lib/gstUtils';
import { ArrowLeft, Download, Printer, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';

export default function InvoiceDetailClient() {
  const router = useRouter();
  const params = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchBillDetails();
    }
  }, [params.id]);

  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.BILL_DETAIL}${params.id}`
      );
      
      if (response && response.status === 'success') {
        setBill(response.data);
      } else {
        toast.error(t('alert.error'));
        router.push('/ddo/invoices');
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
      toast.error(t('alert.error'));
      router.push('/ddo/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate PDF or download logic here
    toast.info('Download functionality coming soon');
  };

  if (loading) {
    return (
      <Layout role="ddo">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-md">
            <LoadingProgressBar message="Loading bill details..." variant="primary" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!bill) {
    return null;
  }

  return (
    <Layout role="ddo">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="group"
            >
              <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />
              Back
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
                <span className="gradient-text">Bill Details</span>
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)]">
                {bill.billNumber || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={handlePrint}
              className="flex-1 sm:flex-none"
            >
              <Printer className="mr-2" size={18} />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownload}
              className="flex-1 sm:flex-none"
            >
              <Download className="mr-2" size={18} />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>

        {/* Bill Information Card */}
        <div className="premium-card p-6 sm:p-8 space-y-6">
          {/* Bill Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-[var(--color-border)]">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                {bill.billNumber}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Date: {new Date(bill.date).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  bill.status === 'submitted'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                }`}
              >
                {bill.status === 'submitted' ? (
                  <>
                    <CheckCircle className="inline mr-1" size={16} />
                    {t('bill.status.submitted')}
                  </>
                ) : (
                  <>
                    <Clock className="inline mr-1" size={16} />
                    {t('bill.status.pending')}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Company & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Info */}
            <div className="p-6 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-muted)] rounded-xl border border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 pb-2 border-b border-[var(--color-border)]">
                Bill From
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {bill.gstinNumber || 'N/A'}
                </p>
                <p className="text-[var(--color-text-secondary)]">
                  {bill.gstAddress || 'N/A'}
                </p>
                <p className="text-[var(--color-text-secondary)]">
                  DDO Code: {bill.ddoCode || 'N/A'}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="p-6 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-muted)] rounded-xl border border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 pb-2 border-b border-[var(--color-border)]">
                Bill To
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {bill.customerName || 'N/A'}
                </p>
                <p className="text-[var(--color-text-secondary)]">
                  {bill.customerGstin || 'N/A'}
                </p>
                <p className="text-[var(--color-text-secondary)]">
                  {bill.customerAddress || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {bill.lineItems && bill.lineItems.length > 0 ? (
              bill.lineItems.map((item, index) => (
                <div key={index} className="premium-card p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">S. No:</span>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.serialNo || index + 1}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Description:</span>
                    <span className="text-sm text-[var(--color-text-primary)] text-right flex-1 ml-2">{item.description || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">HSN:</span>
                    <span className="text-sm text-[var(--color-text-primary)]">{item.hsnNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Amount:</span>
                    <span className="text-base font-bold text-[var(--color-primary)]">{formatCurrency(item.amount || 0)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-[var(--color-text-secondary)]">No line items found</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)]">
                  <th className="px-4 py-3 text-left border-b-2 border-[var(--color-border)] font-bold text-sm uppercase tracking-wide">S. No.</th>
                  <th className="px-4 py-3 text-left border-b-2 border-[var(--color-border)] font-bold text-sm uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-left border-b-2 border-[var(--color-border)] font-bold text-sm uppercase tracking-wide">HSN</th>
                  <th className="px-4 py-3 text-right border-b-2 border-[var(--color-border)] font-bold text-sm uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.lineItems && bill.lineItems.length > 0 ? (
                  bill.lineItems.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold">{item.serialNo || index + 1}</td>
                      <td className="px-4 py-3">{item.description || 'N/A'}</td>
                      <td className="px-4 py-3">{item.hsnNumber || 'N/A'}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(item.amount || 0)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
                      No line items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pt-6 border-t-2 border-[var(--color-border)]">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-secondary)] font-medium">Taxable Value:</span>
                <strong className="text-lg text-[var(--color-text-primary)]">
                  {formatCurrency(bill.taxableValue || 0)}
                </strong>
              </div>
              {bill.gstAmount > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)] font-medium">CGST:</span>
                    <strong className="text-[var(--color-text-primary)]">
                      {formatCurrency(bill.cgst || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)] font-medium">SGST:</span>
                    <strong className="text-[var(--color-text-primary)]">
                      {formatCurrency(bill.sgst || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[var(--color-text-secondary)] font-medium">GST Amount:</span>
                    <strong className="text-lg text-[var(--color-primary)]">
                      {formatCurrency(bill.gstAmount || 0)}
                    </strong>
                  </div>
                </>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold gradient-text">Final Amount:</span>
                <strong className="text-2xl font-extrabold text-[var(--color-primary)]">
                  {formatCurrency(bill.finalAmount || 0)}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-secondary)] font-medium">Paid Amount:</span>
                <strong className="text-lg text-[var(--color-text-primary)]">
                  {formatCurrency(bill.paidAmount || 0)}
                </strong>
              </div>
              {(bill.finalAmount || 0) - (bill.paidAmount || 0) > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)] font-medium">Balance:</span>
                  <strong className="text-lg text-[var(--color-warning)]">
                    {formatCurrency((bill.finalAmount || 0) - (bill.paidAmount || 0))}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {bill.note && (
            <div className="pt-6 border-t border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Notes:</h3>
              <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">
                {bill.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

