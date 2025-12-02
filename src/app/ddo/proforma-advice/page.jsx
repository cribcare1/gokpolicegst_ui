"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Button from '@/components/shared/Button';
import { Plus, Search, Calendar, FileText, AlertCircle, X, Eye, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/gstUtils';

export default function ProformaAdvicePage() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('receipts');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [showPaymentEntry, setShowPaymentEntry] = useState(false);
  const [showShortfall, setShowShortfall] = useState(false);
  
  // State for payment entry
  const [paymentMode, setPaymentMode] = useState('Bank / Cash');
  const [paymentRefNo, setPaymentRefNo] = useState('UTR31352');
  const [paymentDate, setPaymentDate] = useState('2025-06-25');
  const [differenceAmount, setDifferenceAmount] = useState(1000);
  const [differenceReason, setDifferenceReason] = useState('Shortfall Payment/ Discount Payment');
  
  // Selected receipts for payment processing
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  
  // Demo data matching the image structure
  const [receiptsData] = useState([
    {
      id: '1',
      paNo: '1ZC******',
      customerName: 'adadas',
      amountPayable: 1000,
      select: false,
      amountReceived: 1000,
      difference: 0,
      status: 'full'
    },
    {
      id: '2',
      paNo: '1ZC******',
      customerName: 'adadas',
      amountPayable: 2500,
      select: true,
      amountReceived: 2000,
      difference: 500,
      status: 'shortfall',
      taxInvoiceGenerated: false
    },
    {
      id: '3',
      paNo: '1ZC******',
      customerName: 'adadas',
      amountPayable: 2500,
      select: true,
      amountReceived: 2000,
      difference: 500,
      status: 'shortfall',
      taxInvoiceGenerated: false
    }
  ]);

  const [stepsData] = useState([
    {
      step: 'PA',
      description: 'Proforma Advice',
      code: '12X0032/25/PA001',
      gs: 'GS',
      policeDdoCode: '0200P00032'
    },
    {
      step: 'PR',
      description: 'Payment Receipts',
      code: '12X0032/25/PR001',
      gs: '',
      policeDdoCode: '0200P00040'
    },
    {
      step: 'TI',
      description: 'Tax Invoice',
      code: '12X0032/25/IN001',
      gs: '',
      policeDdoCode: '0200P00047',
      pushToGST: true,
      irnStatus: 'Pending'
    },
    {
      step: 'CN',
      description: 'Credit Note',
      code: '12X0032/25/CN001',
      gs: '',
      policeDdoCode: '0200P00062'
    }
  ]);

  const [customers] = useState([
    { id: '1', name: 'adadas' },
    { id: '2', name: 'ABC Corporation' },
    { id: '3', name: 'XYZ Ltd' }
  ]);

  useEffect(() => {
    // Set default date range
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  }, []);

  const handleSelectReceipt = (id, checked) => {
    if (checked) {
      setSelectedReceipts(prev => [...prev, id]);
    } else {
      setSelectedReceipts(prev => prev.filter(item => item !== id));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedReceipts(receiptsData.map(item => item.id));
    } else {
      setSelectedReceipts([]);
    }
  };

  const handleGenerateTaxInvoice = (id) => {
    toast.success(`Generating Tax Invoice for Receipt ${id}`);
    // API call to generate tax invoice
  };

  const handlePushToGST = () => {
    toast.success('Pushed to GST Portal for E-Invoicing');
    // API call to push to GST portal
  };

  const handleSaveAndGenerate = () => {
    toast.success('Saved and Generated Successfully');
    setShowPaymentEntry(false);
    setShowShortfall(false);
  };

  const handleExit = () => {
    setShowPaymentEntry(false);
    setShowShortfall(false);
  };

  const calculateTotals = () => {
    const totals = receiptsData.reduce((acc, receipt) => {
      if (selectedReceipts.includes(receipt.id) && receipt.select) {
        acc.amountPayable += receipt.amountPayable;
        acc.amountReceived += receipt.amountReceived;
        acc.difference += receipt.difference;
      }
      return acc;
    }, { amountPayable: 0, amountReceived: 0, difference: 0 });
    
    return totals;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Receipts Table Columns
  const receiptColumns = [
    {
      key: 'select',
      label: 'Select',
      render: (value, row) => (
        <input
          type="checkbox"
          checked={selectedReceipts.includes(row.id)}
          onChange={(e) => handleSelectReceipt(row.id, e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      )
    },
    { 
      key: 'paNo', 
      label: 'PA no',
      render: (value) => (
        <div className="font-medium text-blue-600">{value}</div>
      )
    },
    { 
      key: 'customerName', 
      label: 'Customer Name',
      render: (value) => (
        <div className="font-medium">{value}</div>
      )
    },
    { 
      key: 'amountPayable', 
      label: 'Amount Payable',
      render: (value) => (
        <div className="font-semibold">{formatCurrency(value)}</div>
      )
    },
    { 
      key: 'amountReceived', 
      label: 'Amount Received',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <span className="font-semibold">{formatCurrency(value)}</span>
          {row.select && <Check className="w-4 h-4 text-green-600" />}
        </div>
      )
    },
    { 
      key: 'difference', 
      label: 'Difference',
      render: (value) => (
        <div className={`font-bold ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(Math.abs(value))}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          {row.difference > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1"
              onClick={() => handleGenerateTaxInvoice(row.id)}
            >
              Generate Tax Invoice
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1"
            onClick={() => toast.info(`View details for ${row.paNo}`)}
          >
            <Eye size={14} />
          </Button>
        </div>
      )
    }
  ];

  // Steps Table Columns
  const stepsColumns = [
    { key: 'step', label: 'Steps' },
    { key: 'description', label: 'Description' },
    { 
      key: 'gs', 
      label: 'GS',
      render: (value) => value || '-'
    },
    { key: 'code', label: 'Code' },
    { 
      key: 'policeDdoCode', 
      label: 'Police DDO Code',
      render: (value) => (
        <div className="font-mono">{value}</div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          {row.step === 'TI' && row.pushToGST && (
            <>
              <Button
                variant="primary"
                size="sm"
                className="text-xs px-3 py-1"
                onClick={handlePushToGST}
              >
                Push
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-3 py-1"
                onClick={() => toast.info('View IRN Details')}
              >
                IRN
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-3 py-1"
                onClick={() => toast.success('Auto Store Completed')}
              >
                Auto Store
              </Button>
              <Button
                variant="success"
                size="sm"
                className="text-xs px-3 py-1"
                onClick={() => toast.success('Tax Invoice Approved')}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const totals = calculateTotals();

  return (
    <Layout role="ddo">
      <div className="space-y-6">
        {/* Header with Tabs */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              Receipts & Payment Entry
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Manage receipts, payment entries, and generate tax invoices
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-[var(--color-muted)] p-1 rounded-lg">
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'receipts' 
                  ? 'bg-white shadow-sm text-[var(--color-primary)]' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              onClick={() => setActiveTab('receipts')}
            >
              Receipts
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'payment' 
                  ? 'bg-white shadow-sm text-[var(--color-primary)]' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              onClick={() => setActiveTab('payment')}
            >
              Payment Entry
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'shortfall' 
                  ? 'bg-white shadow-sm text-[var(--color-primary)]' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              onClick={() => setActiveTab('shortfall')}
            >
              Shortfall PA
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="premium-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* From Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                <Calendar size={16} className="inline mr-1" />
                Form Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                <Calendar size={16} className="inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                View All / Customer Name
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="all">View All</option>
                <option value="customer">Customer Name</option>
              </select>
            </div>

            {/* Customer Filter */}
            {viewMode === 'customer' && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Select Customer
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">All Customers</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
              <input
                type="text"
                placeholder="Search by PA number, customer name..."
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setSelectedCustomer('');
                setViewMode('all');
              }}
            >
              <RefreshCw size={16} />
              Reset
            </Button>
          </div>
        </div>

        {/* Receipts Table with Totals */}
        <div className="premium-card overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Receipts Details
            </h2>
          </div>
          
          {/* Table */}
          <Table
            columns={receiptColumns}
            data={receiptsData}
            itemsPerPage={10}
          />
          
          {/* Totals Row */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/20 p-4">
            <div className="flex justify-between items-center">
              <div className="font-semibold">Total</div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(totals.amountPayable)}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Amount Payable</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{formatCurrency(totals.amountReceived)}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Amount Received</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-red-600">{formatCurrency(totals.difference)}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Difference</div>
                </div>
                <div className="w-40"></div> {/* Spacer for actions column */}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Entry Section */}
        {activeTab === 'payment' && selectedReceipts.length > 0 && (
          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              Payment Entry Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option>Bank / Cash</option>
                  <option>Online Transfer</option>
                  <option>Cheque</option>
                  <option>UPI</option>
                </select>
              </div>

              {/* Payment Ref No */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Payment Ref/No
                </label>
                <input
                  type="text"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="Enter UTR/Reference number"
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              {/* Difference Amount */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Difference Amount
                </label>
                <input
                  type="number"
                  value={differenceAmount}
                  onChange={(e) => setDifferenceAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              {/* Difference Reason */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Difference Reason
                </label>
                <select
                  value={differenceReason}
                  onChange={(e) => setDifferenceReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option>Shortfall Payment/ Discount Payment</option>
                  <option>Advance Payment</option>
                  <option>Partial Payment</option>
                  <option>Full Payment</option>
                  <option>Over Payment</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                onClick={handleExit}
                className="px-6"
              >
                Exit
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAndGenerate}
                className="px-6"
              >
                Save and Generate
              </Button>
            </div>
          </div>
        )}

        {/* Tax Invoice Generation Steps */}
        <div className="premium-card overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Tax Invoice Generation Steps
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Complete workflow from Proforma Advice to Tax Invoice
            </p>
          </div>
          
          <Table
            columns={stepsColumns}
            data={stepsData}
            itemsPerPage={10}
          />
          
          {/* GST Portal Integration Section */}
          <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-muted)]/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  Tax Invoice by the DDO User after Receipts
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Generate Invoice transferred to GSTIN admin for E-Invoicing
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Tax Invoice: <span className="font-mono font-semibold">12X0032/25/IN001</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handlePushToGST}
                >
                  Push to GST Portal
                </Button>
                <div className="text-xs text-[var(--color-text-secondary)] bg-white px-3 py-1 rounded border">
                  IRN: Pending
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shortfall PA Section */}
        {activeTab === 'shortfall' && (
          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              Shortfall Payment Advice Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Total Shortfall Amount
                  </label>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(totals.difference)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Number of Shortfall Receipts
                  </label>
                  <div className="text-2xl font-bold">
                    {receiptsData.filter(r => r.difference > 0).length}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Shortfall Receipts Requiring Action</h3>
                <div className="space-y-2">
                  {receiptsData
                    .filter(r => r.difference > 0)
                    .map(receipt => (
                      <div key={receipt.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{receipt.paNo}</div>
                          <div className="text-sm text-[var(--color-text-secondary)]">{receipt.customerName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">Difference: {formatCurrency(receipt.difference)}</div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleGenerateTaxInvoice(receipt.id)}
                          >
                            Generate Tax Invoice
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}