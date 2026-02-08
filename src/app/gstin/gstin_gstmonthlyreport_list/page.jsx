
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

export default function GstTdsMonthlyReportPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
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

  // Parse DD-MM-YYYY → Date
  const parseDisplayDate = (dateStr) => {
    if (!dateStr) return null;
    const [dd, mm, yyyy] = dateStr.split("-");
    return new Date(`${yyyy}-${mm}-${dd}`);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const gstInID = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!gstInID) {
        toast.error(LOGIN_CONSTANT.DDO_ID_NOTFOUND);
        return;
      }

      const response = await ApiService.handleGetRequest(
        `https://api.gokpolicegst.com:8443/tds/monthly-gst-filing/getMonthlyGstFilingByGSTId/${gstInID}`
      );

      if (response?.status === "success") {
        const mapped = response.data.map((item) => {
          const declared = Number(item.declaredAmount || 0);
          const paid = Number(item.paidAmount || 0);
          const penaltyAmount = Number(item.penaltyAmount || 0);
          const difference = paid - declared;

          return {
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
      data = data.filter((r) => {
        const d = parseDisplayDate(r.arnDate);
        return d && d >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter((r) => {
        const d = parseDisplayDate(r.arnDate);
        return d && d <= to;
      });
    }

    setFiltered(data);
  }, [searchTerm, fromDate, toDate, records]);

  const columns = [
    { key: "month", label: "Month of Filing", style: { minWidth: "160px" } },
    { key: "arnNo", label: "ARN No", style: { minWidth: "200px" } },
    { key: "arnDate", label: "ARN Date", style: { minWidth: "160px" } },
    {
      key: "tdsDeclared",
      label: "GST-TDS Declared",
      render: (v) => <span className="block w-full text-right">{formatCurrency(v)}</span>,
    },
    {
      key: "tdsPaid",
      label: "GST-TDS Paid",
      render: (v) => <span className="block w-full text-right">{formatCurrency(v)}</span>,
    },
    {
      key: "penaltyAmount",
      label: "Penalty",
      render: (v) => (
        <span className="block w-full text-right text-red-600 font-medium">
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      key: "difference",
      label: "Difference",
      render: (v) => (
        <span
          className={`block w-full text-right font-semibold ${
            v >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      key: "remarks",
      label: "Status",
      render: (v) => (
        <span
          className={`px-3 py-1 rounded text-sm font-semibold ${
            v === "Fully Compliance"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {v}
        </span>
      ),
    },
    {
      key: "ackDocument",
      label: "Acknowledgement File",
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
    <Layout role="gstin">
      <div className="space-y-6">
        {/* Header with Date Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold flex items-center gap-3">
              <span className="gradient-text">
                {t("nav.gstmonthlyreports")}
              </span>
              <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
                bg-[var(--color-primary)]/10 text-[var(--color-primary)]
                border border-[var(--color-primary)]/30 translate-y-1">
                {countrecords ?? 0}
              </span>
            </h1>
            <p className="text-sm text-gray-500">
              View monthly GST-TDS filings and acknowledgement documents
            </p>
          </div>

          {/* Date filters beside title */}
          <div className="flex gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg"
              />
            </div>

            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="text-sm text-red-500 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Full-width Search */}
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search ARN No or Month..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
