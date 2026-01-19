

"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";

import { Search, Upload } from "lucide-react";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";
import { useRouter } from "next/navigation";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";

export default function CreditNoteListPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  /* -----------------------------
     FETCH CREDIT NOTES
  ----------------------------- */
  useEffect(() => {
    fetchCreditNotes();
  }, []);

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) return;

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.GET_GSTINCREDIT_NOTES}${ddoId}`
      );

      if (response?.status === "success") {
        const tableData = response.data.map((cn) => ({
          id: cn.id,
          creditNoteDate: cn.creditNoteDate,
          creditNoteNo: cn.creditNoteNumber,
          customerName: cn.customerName || "N/A",
          creditNoteAmount: cn.creditNoteAmount ?? 0,
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

  /* -----------------------------
     SEARCH FILTER
  ----------------------------- */
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

  /* -----------------------------
     STATUS + UPLOAD COMPONENT
  ----------------------------- */
  const StatusWithUpload = ({ status, onClick }) => {
    const isCompleted = status.toLowerCase() === "completed";

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
          className="p-1.5 rounded-md border
            bg-blue-50 text-blue-600 hover:bg-blue-100"
          title="Upload"
        >
          <Upload size={14} />
        </button>
      </div>
    );
  };

  /* -----------------------------
     TABLE COLUMNS
  ----------------------------- */
  const columns = [
    {
      key: "creditNoteDate",
      label: "Credit Note Date",
      style: { minWidth: "150px" },
    },
    {
      key: "creditNoteNo",
      label: "Credit Note No",
      style: { minWidth: "160px" },
    },
    {
      key: "customerName",
      label: "Customer Name",
      style: { minWidth: "220px" },
    },
    {
      key: "creditNoteAmount",
      label: "Credit Note Amount",
      style: { minWidth: "150px", textAlign: "right" },
      render: (v) => `₹ ${Number(v).toFixed(2)}`,
    },

    /* -------- Status + Upload -------- */
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

  return (
    <Layout role="gstin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className="gradient-text">Credit Note List</span>
            <span className="px-3 py-1 text-sm font-semibold rounded-full 
              bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              {filtered.length}
            </span>
          </h1>
          <p className="text-sm text-gray-500">
            View generated credit notes and e-invoice status
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search Credit Note No, Customer, Status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="premium-card overflow-x-auto">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading Credit Notes..." />
            </div>
          ) : (
            <Table columns={columns} data={filtered} />
          )}
        </div>
      </div>
    </Layout>
  );
}
