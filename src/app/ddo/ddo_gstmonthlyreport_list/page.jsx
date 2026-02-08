"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import Button from "@/components/shared/Button";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";
import { toast } from "sonner";
import { t } from "@/lib/localization";
import { formatCurrency } from "@/lib/gstUtils";

export default function GstTdsMonthlyReportPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const countrecords = filtered.length;

  // ---------------- FETCH RECORDS ----------------
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) {
        toast.error(LOGIN_CONSTANT.DDO_ID_NOTFOUND);
        return;
      }

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.GST_TDS_MONTHLY_REPORT}${ddoId}`
      );

      if (response?.status === "success") {
        const mapped = response.data.map((item) => ({
          id: item.id,
          month: item.filingMonth,
          arnNo: item.arnNo,
          arnDate: item.arnDate,
          tdsDeclared: item.declaredAmount,
          tdsPaid: item.paidAmount,
          penalty: item.penaltyAmount,
          ackDocument: item.ackDocument,
        }));

        setRecords(mapped);
        setFiltered(mapped);
      } else {
        toast.error(response?.message || "Failed to fetch report");
        setRecords([]);
        setFiltered([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading GST-TDS report");
      setRecords([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FILTER LOGIC ----------------
  useEffect(() => {
    let data = [...records];

    if (searchTerm) {
      data = data.filter(
        (r) =>
          r.arnNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.month?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (fromDate) {
      const from = new Date(fromDate);
      data = data.filter((r) => r.arnDate && new Date(r.arnDate) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter((r) => r.arnDate && new Date(r.arnDate) <= to);
    }

    setFiltered(data);
  }, [searchTerm, fromDate, toDate, records]);

  // ---------------- ACTIONS ----------------
  const handleEdit = (row) => {
    sessionStorage.setItem("gstTdsRow", JSON.stringify(row));
    router.push("/ddo/gstmonthlycreate");
  };

  const handleDelete = async (row) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.MONTHLY_GST_DELETE}${row.id}`,
        {}
      );

      if (response?.status === "success") {
        toast.success(t("alert.success"));
        fetchRecords();
      } else {
        toast.error(response?.message || t("alert.error"));
      }
    } catch {
      toast.error(t("alert.error"));
    }
  };

  const tableActions = (row) => (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
        className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-blue-600"
        aria-label="Edit"
      >
        <Edit size={18} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row);
        }}
        className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-red-600"
        aria-label="Delete"
      >
        <Trash2 size={18} />
      </button>
    </>
  );

  // ---------------- TABLE COLUMNS ----------------
  const columns = [
    { key: "month", label: "Month of Filing", style: { minWidth: "150px" } },
    { key: "arnNo", label: "ARN No", style: { minWidth: "180px" } },
    { key: "arnDate", label: "ARN Date", style: { minWidth: "160px" } },
    {
      key: "tdsDeclared",
      label: "GST-TDS Declared",
      render: (v) => formatCurrency(v || 0),
    },
    {
      key: "tdsPaid",
      label: "GST-TDS Paid",
      render: (v) => formatCurrency(v || 0),
    },
    {
      key: "penalty",
      label: "Penalty & Interest",
      render: (v) => formatCurrency(v || 0),
    },
    {
      key: "ackDocument",
      label: "Acknowledgement File",
      style: { minWidth: "200px" },
      render: (_, row) =>
        row.ackDocument ? (
          <span className="text-black-700 font-medium whitespace-nowrap truncate block max-w-[200px]">
            {row.ackDocument}
          </span>
        ) : (
          <span className="text-red-500 italic whitespace-nowrap">
            No file uploaded
          </span>
        ),
    },
  ];

  return (
    <Layout role="ddo">
      <div className="space-y-4 sm:space-y-6 w-full">
        {/* Top row: Title + Filters + Add button */}
        <div className="flex flex-wrap items-end justify-between gap-4 w-full">
          {/* Title + Count */}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold flex items-center gap-3 whitespace-nowrap">
              <span className="gradient-text">{t("nav.gstmonthlyreports")}</span>
              <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 translate-y-1">
                {countrecords ?? 0}
              </span>
            </h1>
          </div>

          {/* From/To Filters + Add button */}
          <div className="flex flex-wrap items-end gap-3">
            {/* From Date */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg"
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg"
              />
            </div>

            {/* Add Button at far right */}
            <Button
              onClick={() => router.push("/ddo/gstmonthlycreate")}
              variant="primary"
            >
              <Plus className="mr-2" size={18} /> Add
            </Button>
          </div>
        </div>

        {/* Second row: Search bar full width */}
        <div className="w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
            <input
              type="text"
              placeholder="Search ARN NO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="premium-card overflow-x-auto w-full">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading GST-TDS report..." />
            </div>
          ) : (
            <div className="min-w-max">
              <Table columns={columns} data={filtered} actions={tableActions} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
