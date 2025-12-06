

"use client";
import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import { formatCurrency } from '@/lib/gstUtils';
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import ApiService from "@/components/api/api_service";
import { toast } from 'sonner';
export default function ProformaAdvicePage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [receiptsData, setReceiptsData] = useState([]);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [editedValues, setEditedValues] = useState({});

  useEffect(() => {
    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 86400000);
    setFromDate(monthAgo.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
    fetchCustomers();
    fetchInvoices();
  }, []);

  const fetchCustomers = async () => {
    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) return;

      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.CUSTOMER_ACTIVE_LIST}${ddoId}`);
      if (response && response.status === "success") {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchInvoices = async () => {
    try {
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
      const apiUrl =  `${API_ENDPOINTS.CREATE_RECIEPT}`;
      const response = await ApiService.handlePostRequest(apiUrl, payload);

      console.log("Bulk Receipts Response:", response);
      // alert("Receipts saved successfully!");
       toast.success("Receipts saved successfully!");
      fetchInvoices();
      handleClear();
    } catch (error) {
      console.error("Error saving receipts:", error);
      // alert("Failed to save receipts. Check console for details.");
      toast.error("Failed to save receipts. Check console for details.");
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
    { key: "paNo", label: "PA No" },
    { key: "customerName", label: "Customer Name" },
    { key: "amountPayable", label: "Amount Payable", render: (v) => formatCurrency(v) },
    {
      key: "amountReceived",
      label: "Amount Received",
      render: (value, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.amountReceived ?? value;
        if (isChecked) {
          return (
            <input
              type="number"
              min="0"
              step="1"
              className="border rounded px-2 py-1 w-28"
              value={edited}
              onChange={(e) =>
                updateField(row.id, "amountReceived", parseFloat(e.target.value) || 0)
              }
            />
          );
        }
        return <span>{formatCurrency(value)}</span>;
      },
    },
    {
      key: "paymentMode",
      label: "Payment Mode",
      render: (value, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.paymentMode ?? value;
        if (!isChecked) return <span>{value}</span>;
        return (
          <select
            className="border rounded px-2 py-1"
            value={edited}
            onChange={(e) => updateField(row.id, "paymentMode", e.target.value)}
          >
            <option>Bank</option>
            <option>Cash</option>
          </select>
        );
      },
    },
    {
      key: "paymentRef",
      label: "Payment Ref No",
      render: (value, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.paymentRef ?? value;
        if (!isChecked) return <span>{value || "-"}</span>;
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
      render: (value, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.paymentDate ?? value;
        if (!isChecked) return <span>{value}</span>;
        return (
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={edited}
            onChange={(e) => updateField(row.id, "paymentDate", e.target.value)}
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
  ];

  return (
    <Layout role="ddo">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Receipts & Payment Entry</h1>

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
                className="flex-1 px-3 py-2 border rounded-lg bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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

        {/* Table */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Receipts Details</h2>
          <Table columns={receiptColumns} data={filteredReceipts} itemsPerPage={10} />

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
        </div>
      </div>
    </Layout>
  );
}
