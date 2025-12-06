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

export default function GstTdsMonthlyReportPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Format date DD-MM-YYYY
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
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) {
        toast.error(LOGIN_CONSTANT.DDO_ID_NOTFOUND);
        setLoading(false);
        return;
      }

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.GST_TDS_MONTHLY_REPORT}${ddoId}`
      );

      if (response?.status === "success") {
        const mapped = response.data.map((item) => ({
          month: item.filingMonth,
          arnNo: item.arnNo,
          arnDate: formatDate(item.arnDate),
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

  useEffect(() => {
    if (searchTerm) {
      setFiltered(
        records.filter(
          (r) =>
            r.arnNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.month?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFiltered(records);
    }
  }, [searchTerm, records]);

  const columns = [
    { key: "month", label: "Month of Filing", style: { minWidth: "150px" } },
    { key: "arnNo", label: "ARN No", style: { minWidth: "180px" } },
    { key: "arnDate", label: "ARN Date", style: { minWidth: "180px" } },
    { key: "tdsDeclared", label: "GST-TDS Declared", style: { minWidth: "140px" } },
    { key: "tdsPaid", label: "GST-TDS Paid", style: { minWidth: "140px" } },
    { key: "penalty", label: "Penalty & Interest", style: { minWidth: "140px" } },
    {
      key: "ackDocument",
      label: "Acknowledgement File",
      style: { minWidth: "200px" },
      render: (_, row) =>
        row.ackDocument ? (
          <span className="text-green-700 font-medium whitespace-nowrap truncate block max-w-[200px]">
            {row.ackDocument}
          </span>
        ) : (
          <span className="text-red-500 italic whitespace-nowrap">No file uploaded</span>
        ),
    },
  ];

  return (
    <Layout role="ddo">
      <div className="space-y-4 sm:space-y-6">

        {/* Page Title + Add Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">{t("nav.gstmonthlyreports")} {t("nav.reports")}</span>
            </h1>
            <p className="text-sm text-gray-500">
              View monthly GST-TDS filings and acknowledgement documents
            </p>
          </div>

          <Button
            onClick={() => router.push("/ddo/gstmonthlycreate")}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2" size={18} />
            Add
          </Button>
        </div>

        {/* Search Bar */}
           <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
          <input
            type="text"
            placeholder="Search ARN NO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Table with horizontal scroll */}
        <div className="premium-card overflow-x-auto w-full">
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
