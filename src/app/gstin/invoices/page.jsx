

"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import { formatCurrency } from "@/lib/gstUtils";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import ApiService from "@/components/api/api_service";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";
import { Upload } from "lucide-react";

/* ----------------------------- STATUS + UPLOAD ----------------------------- */
const StatusWithUpload = ({ status = "Pending", onClick }) => {
  const isCompleted = status?.toLowerCase() === "completed";

  return (
    <div className="flex items-center justify-center gap-2">
      <span
        className={`px-2 py-0.5 rounded text-xs font-semibold
          ${
            isCompleted
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
      >
        {status}
      </span>

      <button
        onClick={onClick}
        className="p-1.5 rounded-md border bg-blue-50 text-blue-600 hover:bg-blue-100"
        title="Upload"
      >
        <Upload size={14} />
      </button>
    </div>
  );
};

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

  /* ----------------------------- FETCH CUSTOMERS ----------------------------- */
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) return;

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.CUSTOMER_ACTIVE_LIST}${ddoId}`
      );

      if (response?.status === "success") {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- FETCH INVOICES ----------------------------- */
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.INVOICE_LIST_GSTIN}${ddoId}&status=SUBMITTED`
      );

      if (response?.success === "success") {
        const list = (response.data || []).map((invoice) => ({
          id: invoice.invoiceId,
          receiptNo: invoice.receiptInvoiceNumber,
          receiptDate: invoice.receiptInvoiceDate,
          customerName: invoice.customerResponse?.name || "",
          amountPayable: invoice.grandTotal,
          amountReceived: invoice.paidAmount,
          balance: invoice.balanceAmount,
          paymentMode: invoice.paymentType,
          paymentRef: invoice.paymentReferenceNumber || "-",
          status: invoice.status,

          // Status columns (same as Credit Note List)
          eInvoiceStatus: invoice.einvoiceStatus || "Pending",
          irnStatus: invoice.irnStatus || "Pending",
          eInvoicePreview: invoice.einvoicePreView || "Pending",
        }));

        setReceiptsData(list);
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- FILTER DATA ----------------------------- */
  const filteredReceipts = receiptsData.filter((r) => {
    const matchesCustomer = selectedCustomer
      ? r.customerName === selectedCustomer.customerName
      : true;

    const receiptDate = new Date(r.receiptDate);
    const matchesFrom = fromDate ? receiptDate >= new Date(fromDate) : true;
    const matchesTo = toDate ? receiptDate <= new Date(toDate) : true;

    return matchesCustomer && matchesFrom && matchesTo;
  });

  /* ----------------------------- TABLE COLUMNS ----------------------------- */
  const receiptColumns = [
    { key: "receiptNo", label: "Invoice Number" },
    {
      key: "receiptDate",
      label: "Invoice Date",
      render: (v) => {
        if (!v) return "-";
        const d = new Date(v);
        return `${String(d.getDate()).padStart(2, "0")}/${String(
          d.getMonth() + 1
        ).padStart(2, "0")}/${d.getFullYear()}`;
      },
    },
    { key: "customerName", label: "Customer Name" },
    {
      key: "amountPayable",
      label: "Amount Payable",
      render: (v) => formatCurrency(v, true),
    },
    {
      key: "amountReceived",
      label: "Amount Received",
      render: (v) => formatCurrency(v, true),
    },
    { key: "paymentMode", label: "Payment Mode" },
    { key: "paymentRef", label: "Reference No" },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
          {status}
        </span>
      ),
    },
    {
      key: "eInvoiceStatus",
      label: "e-Invoice",
      style: { minWidth: "180px", textAlign: "center" },
      render: (v, row) => (
        <StatusWithUpload
          status={v}
          onClick={() => console.log("Upload e-Invoice", row.id)}
        />
      ),
    },
    {
      key: "irnStatus",
      label: "IRN",
      style: { minWidth: "150px", textAlign: "center" },
      render: (v, row) => (
        <StatusWithUpload
          status={v}
          onClick={() => console.log("Upload IRN", row.id)}
        />
      ),
    },
    {
      key: "eInvoicePreview",
      label: "Preview",
      style: { minWidth: "180px", textAlign: "center" },
      render: (v, row) => (
        <StatusWithUpload
          status={v}
          onClick={() => console.log("Upload Preview", row.id)}
        />
      ),
    },
  ];

  /* ----------------------------- UI ----------------------------- */
  return (
    <Layout role="gstin">
      <div className="space-y-6">
        {/* HEADER + FILTERS (SAME ROW) */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          {/* LEFT: TITLE */}
          <div className="flex items-center gap-3 whitespace-nowrap">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              <span className="gradient-text">Invoice List</span>
            </h1>
            <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              {recordCount}
            </span>
          </div>

          {/* RIGHT: FILTERS */}
          <div className="flex flex-wrap items-end gap-4 justify-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border px-3 py-2 rounded min-w-[160px]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border px-3 py-2 rounded min-w-[160px]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium">Select Customer</label>
              <select
                value={selectedCustomer?.id || ""}
                onChange={(e) => {
                  const customer = customers.find(
                    (c) => String(c.id) === e.target.value
                  );
                  setSelectedCustomer(customer || null);
                }}
                className="border px-3 py-2 rounded bg-white min-w-[200px]"
              >
                <option value="">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="premium-card overflow-x-auto">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading invoices..." />
            </div>
          ) : (
            <Table
              columns={receiptColumns}
              data={filteredReceipts}
              itemsPerPage={10}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
