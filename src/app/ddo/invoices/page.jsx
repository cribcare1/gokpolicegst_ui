

"use client";

import { useState, useEffect, useRef } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import Modal from "@/components/shared/Modal";
import Image from "next/image";
import { Eye,Plus, Search, X, Download, Printer } from "lucide-react";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";
import Button from "@/components/shared/Button";
import { useRouter } from "next/navigation";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";

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

export default function CreditNoteListPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const previewRef = useRef(null);

  const router = useRouter();

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) return;

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.GET_CREDIT_NOTES}${ddoId}`
      );

      // if (response?.status === "success") {
      //   const tableData = response.data.map((cn) => ({
      //     id: cn.id,
      //     creditNoteDate: cn.creditNoteDate,
      //     creditNoteNo: cn.creditNoteNumber,
      //     customerName: cn.customerName || "N/A",
      //     creditNoteAmount: cn.creditNoteAmount ?? 0,
      //     eInvoiceStatus: cn.einvoiceStatus || "Pending",
      //     irnStatus: cn.irnStatus || "Pending",
      //     eInvoicePreview: cn.einvoicePreView || "Pending",
      //   }));

      //   setRecords(tableData);
      //   setFiltered(tableData);
      // }


      if (response?.status === "success") {

  // ✅ STORE FINAL INVOICE NUMBERS IN LOCAL STORAGE
  const usedInvoiceNumbers = response.data
    .map((cn) => cn.finalInvoiceNumber)
    .filter(Boolean);
    console.log(usedInvoiceNumbers ,"usedInvoiceNumbers");
    

  localStorage.setItem(
    "USED_CREDIT_NOTE_INVOICES",
    JSON.stringify(usedInvoiceNumbers)
  );

  const tableData = response.data.map((cn) => ({
    id: cn.id,
    creditNoteDate: cn.creditNoteDate,
    creditNoteNo: cn.creditNoteNumber,
    customerName: cn.customerName || "N/A",
    creditNoteAmount: cn.creditNoteAmount ?? cn.baseAmount ?? 0,
    eInvoiceStatus: cn.einvoiceStatus || "Pending",
    irnStatus: cn.irnStatus || "Pending",
    eInvoicePreview: cn.einvoicePreView || "Pending",
  }));

  setRecords(tableData);
  setFiltered(tableData);
}

    } catch (err) {
      console.error("Failed to fetch credit notes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFiltered(records);
    } else {
      const term = searchTerm.toLowerCase();
      setFiltered(
        records.filter(
          (r) =>
            r.creditNoteNo.toLowerCase().includes(term) ||
            r.customerName.toLowerCase().includes(term) ||
            r.eInvoiceStatus.toLowerCase().includes(term) ||
            r.irnStatus.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, records]);

  const columns = [
    { key: "creditNoteDate", label: "Credit Note Date", style: { minWidth: "150px" } },
    { key: "creditNoteNo", label: "Credit Note No", style: { minWidth: "160px" } },
    { key: "customerName", label: "Customer Name", style: { minWidth: "220px" } },
    {
      key: "creditNoteAmount",
      label: "Credit Note Amount",
      style: { minWidth: "150px", textAlign: "right" },
      render: (v) => `₹ ${Number(v).toFixed(2)}`,
    },
    {
      key: "eInvoiceStatus",
      label: "e-Invoice Status",
      style: { minWidth: "150px" },
      render: (v) => (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">
          {v}
        </span>
      ),
    },
    {
      key: "irnStatus",
      label: "IRN Status",
      style: { minWidth: "120px" },
      render: (v) => (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">
          {v}
        </span>
      ),
    },
    {
      key: "eInvoicePreview",
      label: "e-Invoice Preview",
      style: { minWidth: "160px" },
      render: (v) => (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">
          {v}
        </span>
      ),
    },
    {
      key: "previewBtn",
      label: "Preview",
      render: (_, row) => (
        <button
          onClick={() => {
            setPreviewData(row);
            setPreviewOpen(true);
          }}
          className="text-blue-600 hover:text-blue-800"
          aria-label="Preview Credit Note"
        >
           <Eye size={16} />
        </button>
      ),
    },
  ];

  const downloadPDF = async () => {
    if (!previewRef.current || !previewData) return;
    const html2pdf = (await import("html2pdf.js")).default;

    html2pdf()
      .set({
        margin: [5, 5, 5, 5],
        filename: `CreditNote-${previewData.creditNoteNo}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(previewRef.current.cloneNode(true))
      .save();
  };

  const printPreview = () => window.print();

  return (
    <Layout role="ddo">
      <PrintStyles />
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
              <span className="gradient-text">Credit Note List</span>
              <span
                className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full
                     bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30
                     translate-y-1"
              >
                {filtered.length}
              </span>
            </h1>
            <p className="text-sm text-gray-500">View generated credit notes and e-invoice status</p>
          </div>

          <Button
            onClick={() => router.push("/ddo/credit_note_create")}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2" size={18} />
            Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]"
            size={20}
          />
          <input
            type="text"
            placeholder="Search Credit Note No, Customer, Status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Table */}
        <div className="premium-card overflow-x-auto w-full">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading Credit Notes..." />
            </div>
          ) : (
            <div className="min-w-max">
              <Table columns={columns} data={filtered} />
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} size="full">
        <div className="flex justify-between p-4 border-b bg-white sticky top-0 z-10">
          <h2 className="font-bold">Credit Note Preview</h2>
          <div className="flex gap-3">
            <button onClick={downloadPDF} className="p-3 bg-blue-600 text-white rounded-xl">
              <Download size={18} />
            </button>
            <button onClick={printPreview} className="p-3 bg-green-600 text-white rounded-xl">
              <Printer size={18} />
            </button>
            <button onClick={() => setPreviewOpen(false)} className="p-3 bg-red-500 text-white rounded-xl">
              <X size={18} />
            </button>
          </div>
        </div>

        {previewData && (
          <div className="preview-wrapper">
            <div className="a4-sheet" ref={previewRef}>
              {/* HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #000", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <Image src="/1.png" alt="Logo" width={56} height={56} />
                  <div>
                    <h3>E WINGS SERVICE INDIA PRIVATE LTD</h3>
                    <p>DDO Name: Amar</p>
                    <p>Address: Electronic city , Bengaluru</p>
                    <p>GSTIN: 01AMQPP1138R1Z2</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>Credit Note</strong>
                  <p>No: {previewData.creditNoteNo}</p>
                  <p>Date: {new Date(previewData.creditNoteDate).toLocaleDateString("en-GB")}</p>
                </div>
              </div>

              {/* TABLE */}
              <table>
                <thead>
                  <tr>
                    {columns.filter((c) => c.key !== "previewBtn").map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {columns.filter((c) => c.key !== "previewBtn").map((c) => (
                      <td key={c.key}>
                        {c.render ? c.render(previewData[c.key], previewData) : previewData[c.key]}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <p className="footer">* This is a system generated Credit Note</p>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
