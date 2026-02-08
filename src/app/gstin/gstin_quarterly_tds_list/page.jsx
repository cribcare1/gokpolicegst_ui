

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import { Search } from "lucide-react";
import ApiService from "@/components/api/api_service";
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

  // Format date as DD-MM-YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  // Parse DD-MM-YYYY to Date
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
      const gstinId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!gstinId) {
        toast.error(LOGIN_CONSTANT.DDO_ID_NOTFOUND);
        return;
      }

      const response = await ApiService.handleGetRequest(
        `https://api.gokpolicegst.com:8443/tds/quarterly-income-tax/getByGSTIn/${gstinId}`
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
      toast.error("Error loading Quarterly TDS report");
      setRecords([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  // Filters
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
        const d = parseDisplayDate(r.filingDate);
        return d && d >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter((r) => {
        const d = parseDisplayDate(r.filingDate);
        return d && d <= to;
      });
    }

    setFiltered(data);
  }, [searchTerm, fromDate, toDate, records]);

  const columns = [
    { key: "fy", label: "Financial Year" },
    { key: "returnType", label: "Return Type" },
    { key: "quarter", label: "Quarter" },
    { key: "filingDate", label: "Filing Date" },
    { key: "receiptNo", label: "Receipt No." },
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
    { key: "revision", label: "Any Revision Filed" },
    {
      key: "difference",
      label: "Difference in Reporting",
      render: (v) => (
        <span className={v === 0 ? "text-green-600" : "text-red-600"}>
          {formatCurrency(v)}
        </span>
      ),
    },
    { key: "remarks", label: "Status" },
    { key: "ackFile", label: "Acknowledgement File" },
  ];

  return (
    <Layout role="gstin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <span className="gradient-text">
                {t("nav.tdsquarterlyreports")}
              </span>
              <span className="px-3 py-1 text-sm font-semibold rounded-full 
                bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                {countrecords ?? 0}
              </span>
            </h1>
            <p className="text-sm text-gray-500">
              View all submitted quarterly TDS filings
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
                className="px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border rounded-lg"
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by FY, Return Type, Quarter, Receipt No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg
                       bg-[var(--color-surface)]
                       border-[var(--color-border)]
                       focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Table */}
        <div className="premium-card overflow-x-auto">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading Quarterly TDS records..." />
            </div>
          ) : (
            <Table columns={columns} data={filtered} />
          )}
        </div>
      </div>
    </Layout>
  );
}
