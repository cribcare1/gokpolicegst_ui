
"use client";
import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import { formatCurrency } from '@/lib/gstUtils';
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import ApiService from "@/components/api/api_service";
import { toast } from 'sonner';
import { LoadingProgressBar } from "@/components/shared/ProgressBar"; 

export default function ProformaAdvicePage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [receiptsData, setReceiptsData] = useState([]);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [editedValues, setEditedValues] = useState({});
  const [loading, setLoading] = useState(false); 


  const countrecords = receiptsData.length;

  useEffect(() => {
    setFromDate("");
    setToDate("");
    fetchCustomers();
    fetchInvoices();
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

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      const storedProfileRaw = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);
      let gstId = 0;

      if (storedProfileRaw) {
        const storedProfile = JSON.parse(storedProfileRaw);
        if (Array.isArray(storedProfile) && storedProfile.length > 0) {
          gstId = storedProfile[0].gstId;
        } else if (typeof storedProfile === "object" && storedProfile.gstId) {
          gstId = storedProfile.gstId;
        }
      }

      if (!gstId) return;

      const status = "SAVED";
      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.PROFORMA_ADVICE_LIST}${ddoId}&gstId=${gstId}&status=${status}`
      );

      if (response && response.success === "success") {
        const invoices = (response.data || []).map((invoice) => ({
          id: invoice.invoiceId,
          paNo: invoice.invoiceNumber,
          customerName: invoice.customerResponse?.name || "",
          amountPayable: invoice.grandTotal,
          amountReceived: 0,
          paymentMode: "Bank",

          paymentRef: "",
          paymentDate: invoice.invoiceDate,
        }));

        setReceiptsData(invoices);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReceipt = (id, checked) => {
    if (checked) {
      setSelectedReceipts((prev) => [...prev, id]);
      setEditedValues((prev) => ({
        ...prev,
        [id]: {
          amountReceived: prev[id]?.amountReceived ?? 0,
          paymentMode: prev[id]?.paymentMode ?? "Bank",
          paymentRef: prev[id]?.paymentRef ?? "",
          paymentDate: prev[id]?.paymentDate ?? receiptsData.find(r => r.id === id)?.paymentDate,
        },
      }));
    } else {
      setSelectedReceipts((prev) => prev.filter((x) => x !== id));
      setEditedValues((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const updateField = (id, field, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleClear = () => {
    setSelectedReceipts([]);
    setEditedValues({});
  };

  const handleSaveAndGenerate = async () => {
    if (selectedReceipts.length === 0) {
      alert("Please select at least one receipt to save.");
      return;
    }

    const receiptsPayload = selectedReceipts.map((id) => {
      const original = receiptsData.find((r) => r.id === id);
      const edited = editedValues[id] || {};
      return {
        invoiceId: original.id,
        type: edited.paymentMode === "Cash" ? "CASH" : "BANK_TRANSFER",
        referenceNumber: edited.paymentRef || "",
        amountPaid: parseFloat(edited.amountReceived ?? 0),
        paymentDate: edited.paymentDate || original.paymentDate,
      };
    });

    const payload = { receipts: receiptsPayload };

    try {
      setLoading(true);
      const apiUrl = `${API_ENDPOINTS.CREATE_RECIEPT}`;
      const response = await ApiService.handlePostRequest(apiUrl, payload);

      toast.success("Receipts saved successfully!");

      fetchInvoices();
      handleClear();
    } catch (error) {
      console.error("Error saving receipts:", error);
      toast.error("Failed to save receipts.");
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receiptsData.filter((r) => {
    const matchesCustomer = selectedCustomer ? r.customerName === selectedCustomer.customerName : true;
    const paymentDate = new Date(r.paymentDate);
    const matchesFrom = fromDate ? paymentDate >= new Date(fromDate) : true;
    const matchesTo = toDate ? paymentDate <= new Date(toDate) : true;
    return matchesCustomer && matchesFrom && matchesTo;
  });

  const receiptColumns = [
    {
      key: "select",
      label: "Select",
      render: (v, row) => (
        <input
          type="checkbox"
          checked={selectedReceipts.includes(row.id)}
          onChange={(e) => handleSelectReceipt(row.id, e.target.checked)}
        />
      ),
    },
    { key: "paNo", label: "Proforma Advice Number" },
    { key: "customerName", label: "Customer Name" },
    { key: "amountPayable", label: "Amount Payable", render: (v) => formatCurrency(v) },
    {
      key: "amountReceived",
      label: "Amount Received",
      render: (v, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.amountReceived ?? v;
        if (!isChecked) return <span>{formatCurrency(v)}</span>;

        return (
          <input
            type="number"
            min="0"
            step="1"
            className="border rounded px-2 py-1 w-28"
            value={edited}
            onChange={(e) => updateField(row.id, "amountReceived", parseFloat(e.target.value) || 0)}
          />
        );
      },
    },
      {
      key: "difference",
      label: "Difference",
      render: (v, row) => {
        const received = editedValues[row.id]?.amountReceived ?? row.amountReceived;
        const diff = row.amountPayable - received;
        return (
          <span className={diff === 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(diff)}
          </span>
        );
      },
    },
   {
  key: "differencereson",
  label: "Difference Reason",
  render: (v, row) => {
    const isChecked = selectedReceipts.includes(row.id);
    const edited = editedValues[row.id]?.differencereson ?? "";

    if (!isChecked) return <span>{v || "-"}</span>;

    return (
      <select
        className="border rounded px-2 py-1"
        value={edited}
        onChange={(e) => updateField(row.id, "differencereson", e.target.value)}
      >
        <option value="">Select</option>
        <option value="Shortfall Payment">Shortfall Payment</option>
        <option value="Discount Payment">Discount Payment</option>
      </select>
    );
  },
}
,
    {
      key: "paymentMode",
      label: "Payment Mode",
      render: (v, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.paymentMode ?? v;
        if (!isChecked) return <span>{v}</span>;

        return (
          <select
            className="border rounded px-2 py-1"
            value={edited}
            onChange={(e) => updateField(row.id, "paymentMode", e.target.value)}
          >
            <option>Bank/ DD/ Cheque</option>
            <option>Other</option>
          </select>
        );
      },
    },
    {
      key: "paymentRef",
      label: "Payment Ref No",
      render: (v, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.paymentRef ?? v;
        if (!isChecked) return <span>{v || "-"}</span>;

        return (
          <input
            type="text"
            className="border rounded px-2 py-1 w-32"
            value={edited}
            onChange={(e) => updateField(row.id, "paymentRef", e.target.value)}
          />
        );
      },
    },
   {
  key: "paymentDate",
  label: "Payment Date",
  render: (v, row) => {
    const isChecked = selectedReceipts.includes(row.id);
    const edited = editedValues[row.id]?.paymentDate ?? v;

    // Format date to DD-MM-YYYY
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const [y, m, d] = dateStr.split("-");
      return `${d}-${m}-${y}`;
    };

    if (!isChecked) {
      return <span>{formatDate(v)}</span>;
    }

    return (
      <input
        type="date"
        className="border rounded px-2 py-1"
        value={edited} // must stay in YYYY-MM-DD for the input
        onChange={(e) => updateField(row.id, "paymentDate", e.target.value)}
      />
    );
  },
}
,
  
  ];

  return (
    <Layout role="ddo">
      <div className="space-y-6">

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* <h1 className="text-2xl font-bold">Receipts & Payment Entry</h1> */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
              <span className="gradient-text">Receipts & Payment Entry</span>
              <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
                     bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30
                     translate-y-1">
                {countrecords ?? 0}
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
                className="flex-1 px-3 py-2 border rounded-lg bg-white"
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

        {/* Table with same loading design as GST-TDS page */}
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

          {/* Action Buttons */}
          {!loading && (
            <div className="flex justify-end gap-4 mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleSaveAndGenerate}
              >
                Save & Generate Invoice
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
