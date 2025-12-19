"use client";
import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import { formatCurrency } from '@/lib/gstUtils';
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import ApiService from "@/components/api/api_service";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";

export default function ReceiptListPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [receiptsData, setReceiptsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const recordCount = receiptsData.length;
  useEffect(() => {
    fetchCustomers();
    fetchReceipts();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) return;

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.CUSTOMER_ACTIVE_LIST}${ddoId}`
      );

      if (response && response.status === "success") {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);

      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=RECEIPT`
      );

      if (response && response.success === "success") {
        const list = (response.data || []).map((invoice) => ({
          id: invoice.invoiceId,
          receiptNo: invoice.receiptInvoiceNumber,
          receiptDate: invoice.receiptInvoiceDate,
          paNumber: invoice.invoiceNumber,
          customerName: invoice.customerResponse?.name || "",
          amountPayable: invoice.grandTotal,
          amountReceived: invoice.paidAmount,
          balance: invoice.balanceAmount,
          paymentMode: invoice.paymentType,
          paymentRef: invoice.paymentReferenceNumber || "-",
          status :invoice.status
        }));

        setReceiptsData(list);
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receiptsData.filter((r) => {
    const matchesCustomer = selectedCustomer
      ? r.customerName === selectedCustomer.customerName
      : true;

    const receiptDate = new Date(r.receiptDate);
    const matchesFrom = fromDate ? receiptDate >= new Date(fromDate) : true;
    const matchesTo = toDate ? receiptDate <= new Date(toDate) : true;

    return matchesCustomer && matchesFrom && matchesTo;
  });

  // const receiptColumns = [
  //   { key: "receiptNo", label: "Receipt Number" },
  //   { key: "receiptDate", label: "Receipt Date" },
  //   // { key: "paNumber", label: "Proforma Advice No" },
  //   { key: "customerName", label: "Customer Name" },
  //   { key: "amountPayable", label: "Amount Payable", render: v => formatCurrency(v) },
  //   { key: "amountReceived", label: "Amount Received", render: v => formatCurrency(v) },
  //   { key: "balance", label: "Balance", render: v => formatCurrency(v) },
  //   { key: "paymentMode", label: "Payment Mode" },
  //   { key: "paymentRef", label: "Reference No" }
  // ];
const receiptColumns = [
  { key: "receiptNo", label: "Invoice Number" },
  {
    key: "receiptDate",
    label: "Invoice Date",
    render: (v) => {
      if (!v) return "-";
      const date = new Date(v);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },
  },
  // { key: "paNumber", label: "Proforma Advice No" },
  { key: "customerName", label: "Customer Name" },
  { key: "amountReceived", label: "Amount Payable", render: (v) => formatCurrency(v , true) },
  { key: "amountReceived", label: "Amount Received", render: (v) => formatCurrency(v , true) },
  // { key: "balance", label: "Balance", render: (v) => formatCurrency(v) },
  { key: "paymentMode", label: "Payment Mode" },
  { key: "paymentRef", label: "Reference No" },
 {
    key: "status",
    label: "Status",
  render: (status) => {
  const statusMap = {
    generated: {
      label: "Generated" || "generated",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    pending: {
      label: "Pending" || "pending",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    },
    failed: {
      label: "Failed",
      className:
        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
  };

  const config = statusMap[status] || {
    label: status || "Unknown",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
},


  },
];

  return (
    <Layout role="ddo">
      <div className="space-y-6">

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* <h1 className="text-2xl font-bold">
            Invoice List</h1> */}
  {/* <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
              <span className="gradient-text"> Invoice List</span>
            </h1> */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
              <span className="gradient-text">Invoice List</span>
              <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
                     bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30
                     translate-y-1">
                {recordCount ?? 0}
              </span>
            </h1>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border px-3 py-2 rounded"
              />
            </div>

            <div className="flex flex-col">
              <label>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border px-3 py-2 rounded"
              />
            </div>

            <div className="flex flex-col">
              <label>Select Customer</label>
              <select
                value={selectedCustomer?.id || ""}
                onChange={(e) => {
                  const customer = customers.find((c) => String(c.id) === e.target.value);
                  setSelectedCustomer(customer || null);
                }}
                className="px-3 py-2 border rounded bg-white"
              >
                <option value="">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* List Table */}
        <div className="premium-card overflow-x-auto w-full">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading receipts..." />
            </div>
          ) : (
            <div className="min-w-max">
              <Table columns={receiptColumns} data={filteredReceipts} itemsPerPage={10} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
