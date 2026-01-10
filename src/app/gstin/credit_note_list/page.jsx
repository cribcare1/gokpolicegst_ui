"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";

import { Plus, Search } from "lucide-react";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";
import Button from "@/components/shared/Button";
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
        // Map API data to table format
        const tableData = response.data.map((cn) => ({
          id: cn.id,
          creditNoteDate: cn.creditNoteDate,
          creditNoteNo: cn.creditNoteNumber,
          customerName: cn.customerName || "N/A", // <-- use customerName directly
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
     TABLE COLUMNS
  ----------------------------- */
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
  ];

  return (
    <Layout role="gstin">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
              <span className="gradient-text">Credit Note List</span>
              <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
                     bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30
                     translate-y-1">
               {filtered.length}
              </span>
            </h1>
            <p className="text-sm text-gray-500">
           View generated credit notes and e-invoice status
            </p>
          </div>

          {/* <Button
            onClick={() => router.push("/ddo/credit_note_create")}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2" size={18} />
            Add
          </Button> */}
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
    </Layout>
  );
}
