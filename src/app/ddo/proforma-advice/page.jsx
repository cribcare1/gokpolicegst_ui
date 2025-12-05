"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Button from '@/components/shared/Button';
import { Plus, Search, Calendar, FileText, AlertCircle, X, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/gstUtils';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { LOGIN_CONSTANT } from '@/components/utils/constant';

export default function ProformaAdvicePage() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('receipts');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('');
  const [showPaymentEntry, setShowPaymentEntry] = useState(true);
  
  // State for payment entry
  const [paymentMode, setPaymentMode] = useState('Bank / Cash');
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [differenceAmount, setDifferenceAmount] = useState(0);
  const [differenceReason, setDifferenceReason] = useState('Shortfall Payment/ Discount Payment');
  
  // Selected receipts for payment processing
  const [selectedReceipts, setSelectedReceipts] = useState([]); 
  const [receiptsData, setReceiptsData] = useState([]);
  const [allReceiptsData, setAllReceiptsData] = useState([]); // Store all data for filtering
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [ddoId, setDdoId] = useState(null);
  const [customers, setCustomers] = useState([]);

  // Function to fetch customers from API
  const fetchCustomers = async () => {
    try {
      const userId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!userId) return;
      
      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.CUSTOMER_ACTIVE_LIST}${userId}`);
      if (response && response.status === 'success') {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Function to fetch receipts data from API (same as Proforma Advice)
  const fetchReceiptsData = async () => {
    if (!ddoId) return;
    
    setReceiptsLoading(true);
    try {
      console.log('Fetching receipts data for DDO ID:', ddoId);
      const gstId = localStorage.getItem(LOGIN_CONSTANT.GSTID) || '';
      const apiUrl = `${API_ENDPOINTS.PROFORMA_ADVICE_LIST}${ddoId}&gstId=${gstId}&status=SAVED`;
      console.log('API URL:', apiUrl);
      
      const response = await ApiService.handleGetRequest(apiUrl);
      console.log('Full API Response:', JSON.stringify(response, null, 2));
      
      // Handle multiple possible shapes from backend (same as generate-bill page)
      const okStatus = response && (response.status === 'success' || response.status === 'SUCCESS' || response.status === true);
      let payloadArray = [];

      if (okStatus) {
        if (Array.isArray(response.data)) {
          payloadArray = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          payloadArray = response.data.data;
        } else if (response.data && typeof response.data === 'object') {
          payloadArray = [response.data];
        }
      } else {
        if (Array.isArray(response)) {
          payloadArray = response;
        } else if (response && Array.isArray(response.data)) {
          payloadArray = response.data;
        }
      }

      console.log('Payload Array:', payloadArray);

      // Transform API response to match receipts table structure
      const transformedData = (payloadArray || []).map((item) => {
        console.log('Processing item:', item);
        
        const items = Array.isArray(item.items) ? item.items : [];
        const proformaAmount = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0) || item.totalAmount || item.grandTotal || 0;
        const paidAmount = item.paidAmount || item.invoiceAmount || 0;
        const difference = proformaAmount - paidAmount;

        // Get customer info from various possible locations in API response
        const customerResponse = item.customerResponse || item.customer || {};
        console.log('Customer Response:', customerResponse);
        
        const customerName = customerResponse.name || customerResponse.customerName || item.customerName || 'N/A';
        const customerId = customerResponse.id || item.customerId || null;

        return {
          id: item.invoiceId || item.id || item.proformaId || null,
          paNo: item.invoiceNumber || item.proformaNumber || `INV-${item.invoiceId || item.id || ''}`,
          customerName: customerName,
          customerId: customerId,
          amountPayable: proformaAmount,
          select: true,
          amountReceived: paidAmount,
          difference: Math.max(difference, 0),
          status: difference > 0 ? 'shortfall' : 'full'
        };
      });
      
      console.log('Transformed data:', transformedData);
      
      setAllReceiptsData(transformedData);
      setReceiptsData(transformedData);
      setSelectedReceipts(transformedData.map(item => item.id));
    } catch (error) {
      console.error('Error fetching receipts data:', error);
      toast.error('Failed to load receipts data');
      setReceiptsData([]);
      setAllReceiptsData([]);
    } finally {
      setReceiptsLoading(false);
    }
  };

  const paymentModes = ['Bank / Cash', 'Cheque', 'Credit Card', 'Debit Card', 'Online Transfer'];
  const differenceReasons = [
    'Shortfall Payment/ Discount Payment',
    'Advance Payment',
    'Part Payment',
    'Other'
  ];

  useEffect(() => {
    // Set default date range
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    
    // Set payment date to today
    setPaymentDate(today.toISOString().split('T')[0]);

    // Get DDO ID from localStorage and fetch data
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const currentDdoId = parsedUser.id || parsedUser.ddoId;
        if (currentDdoId) {
          setDdoId(currentDdoId);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // Fetch customers
    fetchCustomers();
  }, []);

  // Fetch receipts data when DDO ID is available
  useEffect(() => {
    if (ddoId) {
      fetchReceiptsData();
    }
  }, [ddoId]);

  // Filter receipts based on viewMode and selectedCustomerFilter
  useEffect(() => {
    if (viewMode === 'all') {
      setReceiptsData(allReceiptsData);
    } else if (viewMode === 'customer' && selectedCustomerFilter) {
      const selectedCustomerData = customers.find(c => String(c.id) === String(selectedCustomerFilter));
      const customerName = selectedCustomerData?.customerName || selectedCustomerData?.name || '';
      
      console.log('Filtering by customer:', selectedCustomerFilter, customerName);
      console.log('All receipts data:', allReceiptsData);
      console.log('Receipts customer names:', allReceiptsData.map(r => ({ id: r.customerId, name: r.customerName })));
      
      const filtered = allReceiptsData.filter(receipt => {
        // Match by customerId
        const matchById = receipt.customerId && String(receipt.customerId) === String(selectedCustomerFilter);
        // Match by customerName (exact or partial, case-insensitive)
        const matchByName = customerName && receipt.customerName && (
          receipt.customerName.toLowerCase() === customerName.toLowerCase() ||
          receipt.customerName.toLowerCase().includes(customerName.toLowerCase()) ||
          customerName.toLowerCase().includes(receipt.customerName.toLowerCase())
        );
        
        console.log(`Receipt ${receipt.paNo}: customerId=${receipt.customerId}, customerName=${receipt.customerName}, matchById=${matchById}, matchByName=${matchByName}`);
        
        return matchById || matchByName;
      });
      
      console.log('Filtered receipts:', filtered);
      
      setReceiptsData(filtered);
    } else {
      setReceiptsData(allReceiptsData);
    }
  }, [viewMode, selectedCustomerFilter, allReceiptsData, customers]);

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
  };

  const handlePushToGST = () => {
    toast.success('Pushed to GST Portal for E-Invoicing');
  };

  const handleSaveAndGenerate = () => {
    toast.success('Saved and Generated Successfully');
  };

  const handleExit = () => {
    setShowPaymentEntry(false);
  };

  const handleShowPaymentEntry = () => {
    setShowPaymentEntry(true);
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
      label: 'PROFORMA NUMBER',
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
      render: (value) => (
        <div className="font-semibold">{formatCurrency(value)}</div>
      )
    },
    { 
      key: 'difference', 
      label: 'Difference Amount',
      render: (value) => (
        <div className={`font-bold ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(Math.abs(value))}
        </div>
      )
    }
  ];



  const totals = calculateTotals();

  return (
    <Layout role="ddo">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              Receipts & Payment Entry
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Manage receipts, payment entries, and generate tax invoices
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleShowPaymentEntry}
            >
              <FileText size={16} />
              Show Payment Entry
            </Button>
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
                  value={selectedCustomerFilter}
                  onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">All Customers</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerName || customer.name}
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
                setSelectedCustomerFilter('');
                setViewMode('all');
                setReceiptsData(allReceiptsData);
              }}
            >
              <RefreshCw size={16} />
              Reset
            </Button>
          </div>
        </div>



        {/* Receipts Table */}
        <div className="premium-card overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Receipts Details
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {receiptsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading receipts...</p>
                </div>
              </div>
            ) : (
              <Table
                columns={receiptColumns}
                data={receiptsData}
                itemsPerPage={10}
                className="min-w-[1000px]"
              />
            )}
          </div>
          
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
                  <div className="text-sm text-[var(--color-text-secondary)]">Difference Amount</div>
                </div>
                <div className="w-40"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Entry Section - PA Details और Receipts Details के नीचे */}
        {showPaymentEntry && (
          <div className="premium-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Payment Entry
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExit}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Ref No */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Payment Ref No
                </label>
                <input
                  type="text"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="Enter reference number"
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
                  placeholder="Enter difference amount"
                />
              </div>

              {/* Difference Reason */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Difference Reason
                </label>
                <select
                  value={differenceReason}
                  onChange={(e) => setDifferenceReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {differenceReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                className="px-6 py-2.5"
                onClick={handleExit}
              >
                Exit
              </Button>
              <Button
                variant="primary"
                className="px-6 py-2.5"
                onClick={handleSaveAndGenerate}
              >
                Save and Generate Invoice
              </Button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}