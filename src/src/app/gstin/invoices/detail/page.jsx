"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { formatCurrency } from '@/lib/gstUtils';
import { ArrowLeft, Download, Printer, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';

function GstinInvoiceDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      fetchBillDetails(id);
    } else {
      setLoading(false);
      toast.error('Invoice ID not provided');
      router.push('/gstin/invoices');
    }
  }, [searchParams, router]);

  const fetchBillDetails = async (id) => {
    try {
      setLoading(true);
      
      // Demo data
      const demoBill = {
        id: id,
        invoiceNumber: '1ZB/PO0032/0001',
        date: '2025-01-10',
        ddoCode: '0200PO0032',
        ddoName: 'DCP CAR HQ',
        customerName: 'Karnataka Education Board',
        customerAddress: 'O/o GOK Education Board, IST FLOOR, Bengaluru 560016',
        amount: 700000,
        gstAmount: 126000,
        cgst: 63000,
        sgst: 63000,
        totalAmount: 826000,
        status: 'approved',
      };
      
      setBill(demoBill);
      setLoading(false);
      
      // Try to fetch from API
      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.BILL_GET || API_ENDPOINTS.BILL_LIST}/${id}`
      );
      
      if (response && response.status === 'success') {
        setBill(response.data);
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
      // Keep demo data
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info('Download functionality coming soon');
  };

  if (loading) {
    return (
      <Layout role="gstin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-md">
            <LoadingProgressBar message="Loading bill details..." variant="primary" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!bill) {
    return (
      <Layout role="gstin">
        <div className="text-center py-12">
          <p className="text-[var(--color-text-secondary)]">Bill not found</p>
          <Button variant="secondary" onClick={() => router.push('/gstin/invoices')} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="gstin">
      <div className="space-y-6">
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
                <span className="gradient-text">Invoice Details</span>
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)]">
                {bill.invoiceNumber || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={handlePrint}
              className="w-full sm:w-auto"
            >
              <Printer className="mr-2" size={18} />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleDownload}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2" size={18} />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Invoice Number</h3>
              <p className="text-lg font-medium text-[var(--color-text-primary)]">{bill.invoiceNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Date</h3>
              <p className="text-lg font-medium text-[var(--color-text-primary)]">
                {new Date(bill.date).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">DDO Code</h3>
              <p className="text-lg font-medium text-[var(--color-text-primary)]">{bill.ddoCode}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">DDO Name</h3>
              <p className="text-lg font-medium text-[var(--color-text-primary)]">{bill.ddoName}</p>
            </div>
            <div className="sm:col-span-2">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Customer</h3>
              <p className="text-lg font-medium text-[var(--color-text-primary)]">{bill.customerName}</p>
              {bill.customerAddress && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{bill.customerAddress}</p>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Taxable Amount:</span>
                <span className="font-medium">{formatCurrency(bill.amount)}</span>
              </div>
              {bill.cgst > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">CGST:</span>
                  <span className="font-medium">{formatCurrency(bill.cgst)}</span>
                </div>
              )}
              {bill.sgst > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">SGST:</span>
                  <span className="font-medium">{formatCurrency(bill.sgst)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-[var(--color-primary)]">{formatCurrency(bill.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Status:</span>
              {bill.status === 'approved' || bill.status === 'submitted' ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-sm font-medium flex items-center gap-2">
                  <CheckCircle size={16} />
                  Approved
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-sm font-medium flex items-center gap-2">
                  <Clock size={16} />
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function GstinInvoiceDetailPage() {
  return (
    <Suspense fallback={
      <Layout role="gstin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-md">
            <LoadingProgressBar message="Loading..." variant="primary" />
          </div>
        </div>
      </Layout>
    }>
      <GstinInvoiceDetailContent />
    </Suspense>
  );
}

