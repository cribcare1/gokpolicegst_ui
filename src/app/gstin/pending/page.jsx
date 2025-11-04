"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { formatCurrency } from '@/lib/gstUtils';
import { Search, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';
import Link from 'next/link';

export default function GstinPendingBillsPage() {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [searchTerm, bills]);

  const fetchBills = async () => {
    // Demo data - show immediately
    const demoBills = [
      {
        id: '2',
        invoiceNumber: '1ZB/PO0033/0001',
        date: '2025-01-11',
        ddoCode: '0200PO0033',
        ddoName: 'DCP South',
        customerName: 'ABC Corporation',
        amount: 500000,
        gstAmount: 90000,
        totalAmount: 590000,
        status: 'pending',
      },
    ];
    
    // Show demo data immediately - UI ready instantly
    setBills(demoBills);
    setFilteredBills(demoBills);
    setLoading(false);
    
    // Fetch real data in background (non-blocking)
    try {
      // Try to fetch from API with timeout
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.BILL_LIST, 1500);
      if (response?.status === 'success' && response?.data && !response.timeout) {
        const gstinNumber = localStorage.getItem('gstinNumber');
        const filtered = response.data.filter(
          bill => bill.gstinNumber === gstinNumber && bill.status === 'pending'
        );
        if (filtered.length > 0) {
          setBills(filtered);
          setFilteredBills(filtered);
        }
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      // Keep demo data on error
    }
  };

  const filterBills = () => {
    let filtered = [...bills];

    if (searchTerm) {
      filtered = filtered.filter(
        (bill) =>
          bill.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bill.ddoName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBills(filtered);
  };

  const handleApprove = async (billId) => {
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.BILL_APPROVE || API_ENDPOINTS.BILL_UPDATE}/${billId}`,
        { status: 'approved' }
      );

      if (response?.status === 'success') {
        toast.success('Bill approved successfully');
        fetchBills();
      } else {
        toast.error(response?.message || 'Failed to approve bill');
      }
    } catch (error) {
      toast.error('Failed to approve bill');
    }
  };

  const handleReject = async (billId) => {
    if (!confirm('Are you sure you want to reject this bill?')) return;
    
    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.BILL_REJECT || API_ENDPOINTS.BILL_UPDATE}/${billId}`,
        { status: 'rejected' }
      );

      if (response?.status === 'success') {
        toast.success('Bill rejected');
        fetchBills();
      } else {
        toast.error(response?.message || 'Failed to reject bill');
      }
    } catch (error) {
      toast.error('Failed to reject bill');
    }
  };

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice Number',
      render: (invoiceNumber) => (
        <span className="font-medium text-[var(--color-text-primary)]">{invoiceNumber}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (date) => new Date(date).toLocaleDateString('en-IN'),
    },
    {
      key: 'ddoName',
      label: 'DDO Name',
    },
    {
      key: 'customerName',
      label: 'Customer',
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (amount) => formatCurrency(amount),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Link
            href={`/gstin/invoices/detail?id=${row.id}`}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-[var(--color-primary)] hover:underline rounded-lg hover:bg-[var(--color-muted)]"
          >
            <Eye size={14} />
            <span className="hidden sm:inline">View</span>
          </Link>
          <button
            onClick={() => handleApprove(row.id)}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-green-600 hover:underline rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <CheckCircle size={14} />
            <span className="hidden sm:inline">Approve</span>
          </button>
          <button
            onClick={() => handleReject(row.id)}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:underline rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <XCircle size={14} />
            <span className="hidden sm:inline">Reject</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout role="gstin">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">{t('nav.pendingBills')}</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              Review and approve pending bills
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="premium-card p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading pending bills..." variant="primary" />
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="p-8 sm:p-16 text-center">
              <Clock className="mx-auto text-[var(--color-text-secondary)] mb-4" size={48} />
              <p className="text-[var(--color-text-secondary)]">No pending bills</p>
            </div>
          ) : (
            <Table columns={columns} data={filteredBills} />
          )}
        </div>
      </div>
    </Layout>
  );
}

