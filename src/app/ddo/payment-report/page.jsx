"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import Modal from '@/components/shared/Modal';
import Table from '@/components/shared/Table';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { Plus, FileText, Download, Eye, Search } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { formatCurrency } from '@/lib/gstUtils';

export default function DDOPaymentReportPage() {
  const [viewMode, setViewMode] = useState('view'); // 'create' or 'view'
  const [paymentReports, setPaymentReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    reportType: 'payment',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    invoiceNumber: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchTerm, paymentReports]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const demoReports = [
        {
          id: '1',
          reportType: 'payment',
          date: '2025-01-15',
          description: 'Payment for Invoice INV-2025-001',
          amount: 826000,
          invoiceNumber: 'INV-2025-001',
          status: 'paid',
        },
        {
          id: '2',
          reportType: 'credit-note',
          date: '2025-01-10',
          description: 'Credit Note for Invoice INV-2024-125',
          amount: 50000,
          invoiceNumber: 'CN-2025-001',
          status: 'processed',
        },
      ];

      setPaymentReports(demoReports);
      setFilteredReports(demoReports);

      const ddoCode = localStorage.getItem('ddoCode');
      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.REPORTS_PAYMENT}?ddoCode=${ddoCode}`);
      if (response?.status === 'success' && response?.data) {
        setPaymentReports(response.data);
        setFilteredReports(response.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...paymentReports];

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  };

  const handleCreate = () => {
    setViewMode('create');
    setFormData({
      reportType: 'payment',
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      invoiceNumber: '',
      status: 'pending',
    });
    setIsModalOpen(true);
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount) {
      toast.error('Description and Amount are required');
      return;
    }

    try {
      const ddoCode = localStorage.getItem('ddoCode');
      const payload = {
        ...formData,
        ddoCode,
        amount: parseFloat(formData.amount),
      };

      const response = await ApiService.handlePostRequest(
        API_ENDPOINTS.REPORTS_PAYMENT_ADD || API_ENDPOINTS.REPORTS_PAYMENT,
        payload
      );

      if (response?.status === 'success') {
        toast.success('Payment report created successfully');
        setIsModalOpen(false);
        fetchReports();
      } else {
        toast.error(response?.message || 'Failed to create payment report');
      }
    } catch (error) {
      toast.error('Error creating payment report');
    }
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (date) => new Date(date).toLocaleDateString('en-IN'),
    },
    { key: 'invoiceNumber', label: 'Invoice/CN Number' },
    { key: 'description', label: 'Description' },
    {
      key: 'amount',
      label: 'Amount',
      render: (amount) => formatCurrency(amount),
    },
    {
      key: 'reportType',
      label: 'Type',
      render: (type) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          type === 'credit-note' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        }`}>
          {type === 'credit-note' ? 'Credit Note' : 'Payment'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'paid' || status === 'processed'
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
        }`}>
          {status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleView(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="View"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {/* Download logic */}}
            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            title="Download"
          >
            <Download size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout role="ddo">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">Payment Report</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              Create and view payment reports and credit notes
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button onClick={handleCreate} variant="primary" className="flex-1 sm:flex-none">
              <Plus className="mr-2" size={18} /> Create
            </Button>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading payment reports..." variant="primary" />
            </div>
          ) : (
            <Table columns={columns} data={filteredReports} />
          )}
        </div>

        {/* Credit Note Report Link */}
        <div className="premium-card p-4 sm:p-6">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Credit Note Report</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            View and manage credit notes
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setViewMode('create');
              setFormData({
                ...formData,
                reportType: 'credit-note',
              });
              setIsModalOpen(true);
            }}
          >
            <FileText className="mr-2" size={18} /> Create Credit Note
          </Button>
        </div>

        {/* Create/View Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setViewMode('view');
            setSelectedReport(null);
          }}
          title={viewMode === 'create' ? 'Create Payment Report' : 'Payment Report Details'}
          size="lg"
        >
          {viewMode === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Report Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                  className="premium-input w-full"
                  required
                >
                  <option value="payment">Payment</option>
                  <option value="credit-note">Credit Note</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="premium-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Invoice/CN Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="premium-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="premium-input w-full"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="premium-input w-full"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-full sm:w-auto">
                  Save
                </Button>
              </div>
            </form>
          ) : selectedReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Date</p>
                  <p className="font-medium">{new Date(selectedReport.date).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Type</p>
                  <p className="font-medium">{selectedReport.reportType === 'credit-note' ? 'Credit Note' : 'Payment'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Invoice/CN Number</p>
                  <p className="font-medium">{selectedReport.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedReport.amount)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-[var(--color-text-secondary)]">Description</p>
                  <p className="font-medium">{selectedReport.description}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Status</p>
                  <p className="font-medium">{selectedReport.status}</p>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </Layout>
  );
}

