"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import { Search } from "lucide-react";
import ApiService from "@/components/api/api_service";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";
import { toast } from "sonner";
import { t } from "@/lib/localization";
import { formatCurrency } from "@/lib/gstUtils";
import Button from "@/components/shared/Button";

export default function GstTdsMonthlyReportPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState(""); // ➕ added
  const [toDate, setToDate] = useState("");     // ➕ added
  const [loading, setLoading] = useState(true);

  const countrecords = filtered.length;

  // Format date DD-MM-YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

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
        "https://api.gokpolicegst.com:8443/tds/monthly-gst-filing/all"
      );

      if (response?.status === "success") {
        const mapped = response.data.map((item) => {
          const declared = Number(item.declaredAmount || 0);
          const paid = Number(item.paidAmount || 0);
          const penaltyAmount = Number(item.penaltyAmount || 0);
          const difference = paid - declared;

          return {
            id: item.id,
            month: item.filingMonth,
            arnNo: item.arnNo,
            arnDate: formatDate(item.arnDate),
            tdsDeclared: declared,
            tdsPaid: paid,
            penaltyAmount,
            difference,
            remarks:
              difference === 0 ? "Fully Compliance" : "Partial Compliance",
            ackDocument: item.ackDocument,
          };
        });

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

  // 🔍 Search + 📅 Date filter
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
      data = data.filter((r) => {
        if (!r.arnDate) return false;
        const [dd, mm, yyyy] = r.arnDate.split("-");
        return new Date(`${yyyy}-${mm}-${dd}`) >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter((r) => {
        if (!r.arnDate) return false;
        const [dd, mm, yyyy] = r.arnDate.split("-");
        return new Date(`${yyyy}-${mm}-${dd}`) <= to;
      });
    }

    setFiltered(data);
  }, [searchTerm, fromDate, toDate, records]);

  const columns = [
    {
      key: "month",
      label: "Month of Filing",
      style: { minWidth: "160px", whiteSpace: "nowrap" },
    },
    {
      key: "arnNo",
      label: "ARN No",
      style: { minWidth: "200px", whiteSpace: "nowrap" },
    },
    {
      key: "arnDate",
      label: "ARN Date",
      style: { minWidth: "160px", whiteSpace: "nowrap" },
    },
    {
      key: "tdsDeclared",
      label: "GST-TDS Declared",
      style: { minWidth: "180px", textAlign: "right", whiteSpace: "nowrap" },
      render: (v) => <span className="block w-full text-right">{formatCurrency(v)}</span>,
    },
    {
      key: "tdsPaid",
      label: "GST-TDS Paid",
      style: { minWidth: "180px", textAlign: "right", whiteSpace: "nowrap" },
      render: (v) => <span className="block w-full text-right">{formatCurrency(v)}</span>,
    },
    {
      key: "penaltyAmount",
      label: "Penalty",
      style: { minWidth: "160px", textAlign: "right", whiteSpace: "nowrap" },
      render: (v) => (
        <span className="block w-full text-right font-medium">
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      key: "difference",
      label: "Difference",
      style: { minWidth: "200px", textAlign: "right", whiteSpace: "nowrap" },
      render: (value) => (
        <span
          className={`block w-full text-right font-semibold ${
            value >= 0 ? "text-black-600" : "text-red-600"
          }`}
        >
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: "remarks",
      label: "Status",
      style: { minWidth: "220px", whiteSpace: "nowrap" },
      render: (value) => (
        <span
          className={`px-3 py-1 rounded text-sm font-semibold ${
            value === "Fully Compliance"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "ackDocument",
      label: "Acknowledgement File",
      style: { minWidth: "240px", whiteSpace: "nowrap" },
      render: (_, row) =>
        row.ackDocument ? (
          <span className="font-medium truncate block max-w-[220px]">
            {row.ackDocument}
          </span>
        ) : (
          <span className="text-red-500 italic">No file uploaded</span>
        ),
    },
  ];

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
              <span className="gradient-text">{t("nav.gstmonthlyreports")}</span>
              <span
                className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
                bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 translate-y-1"
              >
                {countrecords ?? 0}
              </span>
            </h1>
            <p className="text-sm text-gray-500">
              View monthly GST-TDS filings and acknowledgement documents
            </p>
          </div>

          {/* 📅 Date Filter – RIGHT SIDE */}
          <div className="flex items-end gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-[var(--color-surface)]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-[var(--color-surface)]"
              />
            </div>

            {(fromDate || toDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]"
            size={20}
          />
          <input
            type="text"
            placeholder="Search ARN NO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Table */}
        <div className="premium-card overflow-x-auto">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading GST-TDS report..." />
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
