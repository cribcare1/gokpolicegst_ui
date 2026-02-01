

"use client";

import { useState, useMemo } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Pie } from "react-chartjs-2";

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/* ================= DUMMY DATA ================= */
const dummyData = [
  {
    receiptInvoiceNumber: "INV-1001",
    receiptInvoiceDate: "2026-01-30",
    customerResponse: { name: "ABC Logistics" },
    grandTotal: 50000,
    paidAmount: 30000,
    balanceAmount: 20000,
    paymentType: "Online",
    eInvoiceStatus: "Generated",
    type: "Proforma",
  },
  {
    receiptInvoiceNumber: "INV-1002",
    receiptInvoiceDate: "2026-01-25",
    customerResponse: { name: "XYZ Industries" },
    grandTotal: 75000,
    paidAmount: 75000,
    balanceAmount: 0,
    paymentType: "Cash",
    eInvoiceStatus: "Settled",
    type: "Invoice",
  },
  {
    receiptInvoiceNumber: "INV-1003",
    receiptInvoiceDate: "2026-01-28",
    customerResponse: { name: "Global Traders" },
    grandTotal: 60000,
    paidAmount: 0,
    balanceAmount: 60000,
    paymentType: "Cheque",
    eInvoiceStatus: "Pending",
    type: "Receipt",
  },
  {
    receiptInvoiceNumber: "INV-1004",
    receiptInvoiceDate: "2026-01-29",
    customerResponse: { name: "Tech Solutions" },
    grandTotal: 40000,
    paidAmount: 0,
    balanceAmount: 40000,
    paymentType: "Online",
    eInvoiceStatus: "Pending",
    type: "Credit Note",
  },
];

/* ================= TABLE COLUMNS ================= */
const LIST_COLUMNS = [
  { key: "receiptInvoiceNumber", label: "Invoice No" },
  {
    key: "receiptInvoiceDate",
    label: "Invoice Date",
    render: (v) => new Date(v).toLocaleDateString("en-GB"),
  },
  {
    key: "customerName",
    label: "Customer Name",
    render: (_, row) => row?.customerResponse?.name || "-",
  },
  {
    key: "grandTotal",
    label: "Amount Payable",
    render: (v) => `₹${v.toLocaleString()}`,
  },
  {
    key: "paidAmount",
    label: "Amount Received",
    render: (v) => `₹${v.toLocaleString()}`,
  },
  {
    key: "balanceAmount",
    label: "Balance Amount",
    render: (v) => `₹${v.toLocaleString()}`,
  },
  { key: "paymentType", label: "Payment Mode" },
  {
    key: "eInvoiceStatus",
    label: "e-Invoice Status",
    render: (v) => <StatusBadge status={v} />,
  },
  { key: "type", label: "Type" },
];

/* ================= MAIN COMPONENT ================= */
export default function ConsolidatedReportPage() {
  const [data] = useState(dummyData);

  // Date filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Type & e-Invoice filters
  const [filterType, setFilterType] = useState("");
  const [filterEInvoice, setFilterEInvoice] = useState("");

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter((d) => {
      const invoiceDate = new Date(d.receiptInvoiceDate);

      const inRange =
        (!startDate || invoiceDate >= new Date(startDate)) &&
        (!endDate || invoiceDate <= new Date(endDate));

      const typeMatch = filterType ? d.type === filterType : true;
      const eInvoiceMatch = filterEInvoice ? d.eInvoiceStatus === filterEInvoice : true;

      return inRange && typeMatch && eInvoiceMatch;
    });
  }, [data, startDate, endDate, filterType, filterEInvoice]);

  // KPI summary
  const summary = filteredData.reduce(
    (acc, r) => {
      acc.totalPayable += r.grandTotal;
      acc.totalReceived += r.paidAmount;
      acc.totalBalance += r.balanceAmount;
      if (r.eInvoiceStatus === "Generated") acc.generated += 1;
      if (r.eInvoiceStatus === "Settled") acc.settled += 1;
      if (r.eInvoiceStatus === "Pending") acc.pending += 1;
      if (r.eInvoiceStatus === "Error") acc.error += 1;
      return acc;
    },
    { totalPayable: 0, totalReceived: 0, totalBalance: 0, generated: 0, settled: 0, pending: 0, error: 0 }
  );

  /* ================= CHART DATA ================= */
  const eInvoiceChartData = {
    labels: ["Generated", "Settled", "Pending", "Error"],
    datasets: [
      {
        data: [summary.generated, summary.settled, summary.pending, summary.error],
        backgroundColor: ["#34D399", "#10B981", "#FBBF24", "#F87171"],
      },
    ],
  };

  const monthlyCollectionData = {
    labels: ["Jan", "Feb", "Mar", "Apr"],
    datasets: [
      {
        label: "Total Collection",
        data: [summary.totalReceived, summary.totalReceived, summary.totalReceived, summary.totalReceived],
        backgroundColor: "#3B82F6",
      },
    ],
  };

  return (
    <Layout role="ddo">
      <div className="min-h-screen bg-gray-50 p-6 space-y-6">

        {/* HEADER + FILTERS */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Left: Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Financial Consolidated Report
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Proforma • Receipt • Shortfall • Invoice • Credit Note • e-Invoice Status
            </p>
          </div>

          {/* Right: Filters */}
          <div className="flex gap-4 items-end flex-wrap lg:flex-nowrap mt-2 lg:mt-0">
            {/* Type Filter */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-500 mb-1">Type</label>
              <select
                className="border rounded p-2"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All</option>
                <option value="Proforma">Proforma</option>
                <option value="Receipt">Receipt</option>
                <option value="Invoice">Invoice</option>
                <option value="Credit Note">Credit Note</option>
              </select>
            </div>

            {/* e-Invoice Status Filter */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-500 mb-1">e-Invoice Status</label>
              <select
                className="border rounded p-2"
                value={filterEInvoice}
                onChange={(e) => setFilterEInvoice(e.target.value)}
              >
                <option value="">All</option>
                <option value="Generated">Generated</option>
                <option value="Settled">Settled</option>
                <option value="Pending">Pending</option>
                <option value="Error">Error</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                className="border rounded p-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                className="border rounded p-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <KPI title="Total Payable" value={`₹${summary.totalPayable.toLocaleString()}`} />
          <KPI title="Amount Received" value={`₹${summary.totalReceived.toLocaleString()}`} positive />
          <KPI title="Balance Amount" value={`₹${summary.totalBalance.toLocaleString()}`} negative />
          {/* <KPI title="Generated e-Invoice" value={summary.generated} positive /> */}
          <KPI title="Settled e-Invoice" value={summary.settled} positive />
          <KPI title="Pending e-Invoice" value={summary.pending} negative />
        </div>

        {/* CHARTS */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2">e-Invoice Status Distribution</h3>
            <Pie data={eInvoiceChartData} />
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2">Monthly Collection</h3>
            <Bar data={monthlyCollectionData} />
          </div>
        </div> */}

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow p-4">
          <Table
            columns={LIST_COLUMNS}
            data={filteredData}
            itemsPerPage={10}
          />
        </div>
      </div>
    </Layout>
  );
}

/* ---------------- COMPONENTS ---------------- */
function KPI({ title, value, positive, negative }) {
  return (
    <div
      className={`rounded-xl p-4 shadow-sm border bg-white
        ${positive ? "border-green-200" : ""}
        ${negative ? "border-red-200" : ""}`}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${positive ? "text-green-600" : ""} ${negative ? "text-red-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}

/* ---------------- STATUS BADGE ---------------- */
function StatusBadge({ status }) {
  const styles =
    status === "Settled" || status === "Generated"
      ? "bg-green-100 text-green-700"
      : status === "Pending"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles}`}>
      {status}
    </span>
  );
}
