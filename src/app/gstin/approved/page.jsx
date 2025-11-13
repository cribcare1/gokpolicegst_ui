"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { formatCurrency } from '@/lib/gstUtils';
import { Search, CheckCircle, Eye, Download } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import Link from 'next/link';

export default function GstinApprovedBillsPage() {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
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
        id: '1',
        invoiceNumber: '1ZB/PO0032/0001',
        date: '2025-01-10',
        ddoCode: '0200PO0032',
        ddoName: 'DCP CAR HQ',
        customerName: 'Karnataka Education Board',
        amount: 700000,
        gstAmount: 126000,
        totalAmount: 826000,
        status: 'approved',
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
          bill => bill.gstinNumber === gstinNumber && (bill.status === 'approved' || bill.status === 'submitted')
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
            onClick={() => {/* Download logic */}}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-green-600 hover:underline rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
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
              <span className="gradient-text">{t('nav.approvedBills')}</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              View all approved bills
            </p>
          </div>
        </div>

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

        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading approved bills..." variant="primary" />
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="p-8 sm:p-16 text-center">
              <CheckCircle className="mx-auto text-[var(--color-text-secondary)] mb-4" size={48} />
              <p className="text-[var(--color-text-secondary)]">No approved bills</p>
            </div>
          ) : (
            <Table columns={columns} data={filteredBills} />
          )}
        </div>
      </div>
    </Layout>
  );
}

