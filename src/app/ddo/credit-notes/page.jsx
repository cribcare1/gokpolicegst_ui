
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import Modal from "@/components/shared/Modal";
import { formatCurrency } from "@/lib/gstUtils";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";
import { Eye, Printer, Download, X, Search } from "lucide-react";

/* ================= SAFE PRINT / PDF STYLES ================= */
const PrintStyles = () => (
  <style jsx global>{`
    .preview-wrapper {
      background: #e5e7eb;
      min-height: calc(100vh - 80px);
      padding: 24px;
      display: flex;
      justify-content: center;
    }
    .a4-sheet {
      background: #ffffff;
      width: 190mm;
      min-height: 287mm;
      padding: 10mm;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #000000;
    }
    .a4-sheet table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .a4-sheet th,
    .a4-sheet td {
      border: 1px solid #000;
      padding: 5px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .a4-sheet th {
      background-color: #166534 !important;
      color: #fff !important;
      font-weight: bold;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .summary {
      width: 280px;
      margin-left: auto;
      margin-top: 16px;
      border: 1px solid #000;
      padding: 8px;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      margin-top: 16px;
      color: #6b7280;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      .a4-sheet,
      .a4-sheet * {
        visibility: visible;
      }
      .a4-sheet {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        box-sizing: border-box;
      }
    }
  `}</style>
);

/* ================= LIST COLUMNS (FIXED) ================= */
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
    render: (v) => formatCurrency(v, true),
  },
  {
    key: "paidAmount",
    label: "Amount Received",
    render: (v) => formatCurrency(v, true),
  },
  {
    key: "balanceAmount",
    label: "Balance Amount",
    render: (v) => formatCurrency(Math.max(0, Number(v || 0)), true),
  },
  { key: "paymentType", label: "Payment Mode" },
];

export default function ReceiptListPage() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const receiptRef = useRef(null);

  const [ddoInfo, setDdoInfo] = useState({
    ddoCode: "",
    gstId: "",
    officeName: "",
    ddoname: "",
  });

  /* ================= FETCH DDO FROM LOCAL STORAGE ================= */
  useEffect(() => {
    const storedProfile = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setDdoInfo({
        ddoCode: profile.ddoCode || "",
        gstId: profile.gstNumber || profile.gstId || "",
        officeName: profile.address || "",
        ddoname: profile.fullName || "",
      });
    }
  }, []);

  /* ================= FETCH RECEIPTS ================= */
  useEffect(() => {
    const fetchReceipts = async () => {
      setLoading(true);
      try {
        const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
        const res = await ApiService.handleGetRequest(
          `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
        );
        if (res?.success === "success") {
          setData(res.data || []);
          setFiltered(res.data || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);

  /* ================= SEARCH FILTER ================= */
  useEffect(() => {
    if (!searchTerm) {
      setFiltered(data);
    } else {
      const term = searchTerm.toLowerCase();
      setFiltered(
        data.filter(
          (r) =>
            r.receiptInvoiceNumber?.toLowerCase().includes(term) ||
            r.customerResponse?.name?.toLowerCase().includes(term) ||
            r.paymentType?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, data]);

  /* ================= PDF DOWNLOAD ================= */
  const downloadPDF = async () => {
    if (!receiptRef.current || !previewData) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const element = receiptRef.current.cloneNode(true);

    html2pdf()
      .set({
        margin: [5, 5, 5, 5],
        filename: `Receipt-${previewData.receiptInvoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  const printReceipt = () => window.print();

  return (
    <Layout role="ddo">
      <PrintStyles />

      {/* ================= HEADER & SEARCH ================= */}
      <div className="space-y-4 sm:space-y-6 mb-4">
        {/* Title & count */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
              <span className="gradient-text">Receipt List</span>
              <span
                className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full
                     bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30
                     translate-y-1"
              >
                {filtered.length}
              </span>
            </h1>
            <p className="text-sm text-gray-500">
              View submitted invoices and payment status
            </p>
          </div>
        </div>

        {/* Search box full width with label */}
        <div className="flex flex-col w-full">
         
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              id="receipt-search"
              type="text"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="premium-card">
        {loading ? (
          <LoadingProgressBar />
        ) : (
          <Table
            columns={[
              ...LIST_COLUMNS,
              {
                key: "preview",
                label: "Preview",
                render: (_, row) => (
                  <button
                    onClick={() => {
                      setPreviewData(row);
                      setPreviewOpen(true);
                    }}
                  >
                    <Eye size={16} />
                  </button>
                ),
              },
            ]}
            data={filtered}
            itemsPerPage={10}
          />
        )}
      </div>

      {/* ================= PREVIEW MODAL ================= */}
      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} size="full">
        <div className="flex justify-between p-4 border-b bg-white sticky top-0 z-10">
          <h2 className="font-bold">Invoice Preview</h2>
          <div className="flex gap-3">
            <button onClick={downloadPDF} className="p-3 bg-blue-600 text-white rounded-xl">
              <Download size={18} />
            </button>
            <button onClick={printReceipt} className="p-3 bg-green-600 text-white rounded-xl">
              <Printer size={18} />
            </button>
            <button onClick={() => setPreviewOpen(false)} className="p-3 bg-red-500 text-white rounded-xl">
              <X size={18} />
            </button>
          </div>
        </div>

        {previewData && (
          <div className="preview-wrapper">
            <div className="a4-sheet" ref={receiptRef}>
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #000",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "12px" }}>
                  <Image src="/1.png" alt="Logo" width={56} height={56} />
                  <div>
                    <h3>E WINGS SERVICE INDIA PRIVATE LTD</h3>
                    <p>DDO Name: {ddoInfo.ddoname}</p>
                    <p>Address: {ddoInfo.officeName}</p>
                    <p>GSTIN: {ddoInfo.gstId}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>Invoice</strong>
                  <p>No: {previewData.receiptInvoiceNumber}</p>
                  <p>Date: {new Date(previewData.receiptInvoiceDate).toLocaleDateString("en-GB")}</p>
                </div>
              </div>

              {/* TABLE */}
              <table>
                <thead>
                  <tr>
                    {LIST_COLUMNS.map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {LIST_COLUMNS.map((c) => (
                      <td key={c.key}>
                        {c.render ? c.render(previewData[c.key], previewData) : previewData[c.key]}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* SUMMARY */}
              <div className="summary">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span>{formatCurrency(previewData.grandTotal, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Received</span>
                  <span>{formatCurrency(previewData.paidAmount, true)}</span>
                </div>
                <div className="flex justify-between border-t font-bold mt-1 pt-1">
                  <span>Balance</span>
                  <span>{formatCurrency(previewData.balanceAmount, true)}</span>
                </div>
              </div>

              <p className="footer">* This is a system generated Invoice</p>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
