
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import Button from "@/components/shared/Button";
import { Plus, Search } from "lucide-react";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";
import { toast } from "sonner";
import { t } from "@/lib/localization";
import { formatCurrency } from "@/lib/gstUtils";

export default function AdminTDSQuarterlyListPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const countrecords = filtered.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const adminID = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!adminID) {
        toast.error(LOGIN_CONSTANT.DDO_ID_NOTFOUND);
        return;
      }

      const response = await ApiService.handleGetRequest(
        "https://api.gokpolicegst.com:8443/tds/quarterly-income-tax/all"
      );

      if (response?.status === "success") {
        const mapped = response.data.map((item) => {
          const challanAmount = Number(item.totalChallanAmount || 0);
          const taxDeducted = Number(item.totalTaxDeducted || 0);
          const difference = challanAmount - taxDeducted;

          return {
            fy: item.fiscalYear,
            returnType: item.returnType,
            quarter: item.quarter,
            filingDate: formatDate(item.dateOfFiling),
            receiptNo: item.provisionalReceiptNo,
            deducteeCount: item.deducteeCount,
            challanAmount,
            taxDeducted,
            difference,
            remarks:
              difference === 0 ? "Fully Compliance" : "Partial Compliance",
            revision: item.anyRevisionFiled ? "Yes" : "No",
            ackFile: item.ackDocument,
          };
        });

        setRecords(mapped);
        setFiltered(mapped);
      } else {
        toast.error(response?.message || "Failed to fetch quarterly TDS records");
        setRecords([]);
        setFiltered([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading Quarterly TDS report");
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
          r.receiptNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.fy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.returnType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.quarter?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (fromDate) {
      const from = new Date(fromDate);
      data = data.filter((r) => {
        if (!r.filingDate) return false;
        const [dd, mm, yyyy] = r.filingDate.split("-");
        return new Date(`${yyyy}-${mm}-${dd}`) >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter((r) => {
        if (!r.filingDate) return false;
        const [dd, mm, yyyy] = r.filingDate.split("-");
        return new Date(`${yyyy}-${mm}-${dd}`) <= to;
      });
    }

    setFiltered(data);
  }, [searchTerm, fromDate, toDate, records]);

  const columns = [
    { key: "fy", label: "Financial Year", style: { minWidth: "120px" } },
    { key: "returnType", label: "Return Type", style: { minWidth: "100px" } },
    { key: "quarter", label: "Quarter", style: { minWidth: "80px" } },
    { key: "filingDate", label: "Filing Date", style: { minWidth: "120px" } },
    { key: "receiptNo", label: "Receipt No.", style: { minWidth: "160px" } },
    {
      key: "deducteeCount",
      label: "Deductee Count",
      render: (v) => formatCurrency(v),
    },
    {
      key: "challanAmount",
      label: "Total Challan Amount",
      render: (v) => formatCurrency(v),
    },
    {
      key: "taxDeducted",
      label: "Total Tax Deducted",
      render: (v) => formatCurrency(v),
    },
    {
      key: "difference",
      label: "Difference in Reporting",
      style: { textAlign: "right" },
      render: (v) => (
        <span
          className={`font-semibold ${
            v === 0 ? "text-black" : "text-red-600"
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
          className={`px-3 py-1 rounded text-sm font-semibold whitespace-nowrap ${
            v === "Fully Compliance"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {v}
        </span>
      ),
    },
    { key: "revision", label: "Any Revision Filed" },
    {
      key: "ackFile",
      label: "Acknowledgement File",
      render: (v) =>
        v ? (
          <span className="font-medium truncate block max-w-[200px]">
            {v}
          </span>
        ) : (
          <span className="italic text-gray-500">No file uploaded</span>
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
              <span className="gradient-text">
                {t("nav.tdsquarterlyreports")}
              </span>
              <span
                className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
                bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 translate-y-1"
              >
                {countrecords ?? 0}
              </span>
            </h1>
            <p className="text-sm text-gray-500">
              View all submitted quarterly TDS filings and acknowledgement documents
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
            placeholder="Search by FY, Return Type, Quarter, or Receipt No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Table */}
        <div className="premium-card overflow-x-auto">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading Quarterly TDS records..." />
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
