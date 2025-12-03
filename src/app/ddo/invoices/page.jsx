"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { canSubmitBill, formatCurrency } from '@/lib/gstUtils';
import { Search, CheckCircle, Clock, FileText, Filter } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';

export default function InvoiceListPage() {
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [selectedBillForCreditNote, setSelectedBillForCreditNote] = useState(null);
  const [creditNoteAmount, setCreditNoteAmount] = useState(0);
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [searchTerm, statusFilter, bills]);

  const fetchBills = async () => {
    // Load demo data immediately for instant UI
    const demoBills = [
      { id: 'BILL-2024-001', billNumber: 'BILL-2024-001', customerName: 'ABC Enterprises', date: new Date().toISOString(), totalAmount: 125000, paidAmount: 125000, status: 'pending' },
      { id: 'BILL-2024-002', billNumber: 'BILL-2024-002', customerName: 'XYZ Corporation', date: new Date(Date.now() - 86400000).toISOString(), totalAmount: 98000, paidAmount: 98000, status: 'submitted' },
      { id: 'BILL-2024-003', billNumber: 'BILL-2024-003', customerName: 'Tech Solutions Pvt Ltd', date: new Date(Date.now() - 172800000).toISOString(), totalAmount: 156750, paidAmount: 150000, status: 'pending' },
      { id: 'BILL-2024-004', billNumber: 'BILL-2024-004', customerName: 'Global Industries', date: new Date(Date.now() - 259200000).toISOString(), totalAmount: 89500, paidAmount: 89500, status: 'submitted' },
      { id: 'BILL-2024-005', billNumber: 'BILL-2024-005', customerName: 'Prime Services', date: new Date(Date.now() - 345600000).toISOString(), totalAmount: 234000, paidAmount: 234000, status: 'submitted' },
      { id: 'BILL-2024-006', billNumber: 'BILL-2024-006', customerName: 'Metro Constructions', date: new Date(Date.now() - 432000000).toISOString(), totalAmount: 345600, paidAmount: 300000, status: 'pending' },
    ];
    
    // Show demo data immediately
    setBills(demoBills);
    setLoading(false);
    
    try {
      setLoading(true);
      const ddoCode = localStorage.getItem('ddoCode') || '';
      
      // Try to fetch real data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${API_ENDPOINTS.BILL_LIST}?ddoCode=${ddoCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken') || ''}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success' && data.data && data.data.length > 0) {
          setBills(data.data);
        }
      }
    } catch (error) {
      // Keep demo data
      console.log('Using demo data');
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    let filtered = bills;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((bill) => bill.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((bill) =>
        bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBills(filtered);
  };

  const handleSelectBill = (bill) => {
    const canSubmit = canSubmitBill(bill.totalAmount || 0, bill.paidAmount || 0);
    
    if (!canSubmit) {
      toast.error(t('alert.billNotReady'));
      setSelectedBillForCreditNote(bill);
      setCreditNoteAmount(bill.totalAmount - bill.paidAmount);
      setShowCreditNoteModal(true);
      return;
    }

    if (selectedBills.includes(bill.id)) {
      setSelectedBills(selectedBills.filter((id) => id !== bill.id));
    } else {
      setSelectedBills([...selectedBills, bill.id]);
    }
  };

  const handleSubmitBills = async () => {
    if (selectedBills.length === 0) {
      toast.error('Please select at least one bill to submit');
      return;
    }

    // Check if it's past the 10th of the month
    const today = new Date();
    const isLate = today.getDate() > 10;

    if (isLate) {
      if (!confirm('You are submitting bills after the 10th deadline. Continue?')) {
        return;
      }
    }

    try {
      setLoading(true);
      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.BILL_SUBMIT,
        { billIds: selectedBills }
      );

      if (response && response.status === 'success') {
        toast.success(`${selectedBills.length} bill(s) submitted successfully!`);
        setSelectedBills([]);
        fetchBills();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCreditNote = async (e) => {
    e.preventDefault();
    
    if (!creditNoteAmount || creditNoteAmount <= 0) {
      toast.error('Please enter a valid credit note amount');
      return;
    }

    if (!creditNoteReason) {
      toast.error('Please enter a reason for the credit note');
      return;
    }

    try {
      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.CREDIT_NOTE_ADD,
        {
          billId: selectedBillForCreditNote.id,
          amount: creditNoteAmount,
          reason: creditNoteReason,
        }
      );

      if (response && response.status === 'success') {
        toast.success('Credit note added successfully');
        setShowCreditNoteModal(false);
        setSelectedBillForCreditNote(null);
        setCreditNoteAmount(0);
        setCreditNoteReason('');
        fetchBills();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
    }
  };

  const columns = [
    {
      key: 'checkbox',
      label: '',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedBills.includes(row.id)}
          onChange={() => handleSelectBill(row)}
          disabled={row.status === 'submitted' || !canSubmitBill(row.totalAmount || 0, row.paidAmount || 0)}
          className="cursor-pointer"
        />
      ),
    },
    {
      key: 'billNumber',
      label: t('label.billNumber'),
    },
    {
      key: 'date',
      label: t('label.date'),
      render: (date) => new Date(date).toLocaleDateString('en-IN'),
    },
    {
      key: 'customerName',
      label: t('label.customer'),
    },
    {
      key: 'totalAmount',
      label: 'Bill Amount',
      render: (amount) => formatCurrency(amount || 0),
    },
    {
      key: 'paidAmount',
      label: 'Received Amount',
      render: (amount) => formatCurrency(amount || 0),
    },
    {
      key: 'gstApplied',
      label: 'GST Applied',
      render: (_, row) => row.gstAmount > 0 ? 'Yes' : 'No',
    },
    {
      key: 'status',
      label: t('label.status'),
      render: (status) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            status === 'submitted'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
          }`}
        >
          {status === 'submitted' ? t('bill.status.submitted') : t('bill.status.pending')}
        </span>
      ),
    },
  ];

  const isLateSubmission = (date) => {
    const billDate = new Date(date);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    if (billDate.getMonth() < currentMonth || billDate.getFullYear() < currentYear) {
      const submissionDeadline = new Date(currentYear, currentMonth, 10);
      return new Date() > submissionDeadline;
    }
    return false;
  };

  return (
    <Layout role="ddo">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">{t('nav.creditNote')}</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              Manage and submit your credit notes
            </p>
          </div>
          {selectedBills.length > 0 && (
            <Button onClick={handleSubmitBills} variant="primary" disabled={loading} className="w-full sm:w-auto">
              <CheckCircle className="mr-2" size={18} />
              Submit {selectedBills.length} Bill(s)
            </Button>
          )}
        </div>

        {/* Submission Progress */}
        {loading && selectedBills.length > 0 && (
          <div className="premium-card p-6">
            <LoadingProgressBar message="Submitting bills..." variant="success" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
            <input
              type="text"
              placeholder="Search by Bill Number or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="premium-input w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="premium-input pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl shadow-sm w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="pending">{t('bill.status.pending')}</option>
              <option value="submitted">{t('bill.status.submitted')}</option>
            </select>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ⚠️ {t('alert.submitBy10')}
          </p>
        </div>

        {/* Table */}
        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading invoices..." variant="primary" />
            </div>
          ) : (
            <Table
              columns={columns}
              data={filteredBills}
              onRowClick={(row) => router.push(`/ddo/invoices/${row.id}`)}
            />
          )}
        </div>

        {/* Credit Note Modal */}
        <Modal
          isOpen={showCreditNoteModal}
          onClose={() => {
            setShowCreditNoteModal(false);
            setSelectedBillForCreditNote(null);
          }}
          title={t('creditNote.title')}
        >
          {selectedBillForCreditNote && (
            <form onSubmit={handleAddCreditNote} className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  Bill: {selectedBillForCreditNote.billNumber}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  Total Amount: {formatCurrency(selectedBillForCreditNote.totalAmount || 0)}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  Paid Amount: {formatCurrency(selectedBillForCreditNote.paidAmount || 0)}
                </p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                  Difference: {formatCurrency((selectedBillForCreditNote.totalAmount || 0) - (selectedBillForCreditNote.paidAmount || 0))}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('creditNote.amount')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={creditNoteAmount}
                  onChange={(e) => setCreditNoteAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                  min="0"
                  max={(selectedBillForCreditNote.totalAmount || 0) - (selectedBillForCreditNote.paidAmount || 0)}
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('creditNote.reason')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={creditNoteReason}
                  onChange={(e) => setCreditNoteReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
                  rows={3}
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreditNoteModal(false);
                    setSelectedBillForCreditNote(null);
                  }}
                >
                  {t('btn.cancel')}
                </Button>
                <Button type="submit" variant="primary">
                  {t('btn.save')}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Layout>
  );
}

