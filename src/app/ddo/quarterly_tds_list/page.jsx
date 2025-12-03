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

export default function TDSQuarterlyListPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        `${API_ENDPOINTS.TDS_QUARTERLY_LIST}${ddoId}`
      );

      if (response?.status === "success") {
        const mapped = response.data.map((item) => ({
          fy: item.fy,
          returnType: item.returnType,
          quarter: item.quarter,
          filingDate: formatDate(item.filingDate),
          receiptNo: item.receiptNo,
          deducteeCount: item.deducteeCount,
          challanAmount: item.challanAmount,
          taxDeducted: item.taxDeducted,
          revision: item.revision,
          ackFile: item.ackFile,
        }));
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
            r.receiptNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.fy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.returnType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.quarter?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFiltered(records);
    }
  }, [searchTerm, records]);

  const columns = [
    { key: "fy", label: "Financial Year", style: { minWidth: "120px" } },
    { key: "returnType", label: "Return Type", style: { minWidth: "100px" } },
    { key: "quarter", label: "Quarter", style: { minWidth: "80px" } },
    { key: "filingDate", label: "Filing Date", style: { minWidth: "120px" } },
    { key: "receiptNo", label: "Receipt No.", style: { minWidth: "150px" } },
    { key: "deducteeCount", label: "Deductee Count", style: { minWidth: "120px" } },
    { key: "challanAmount", label: "Challan Amount", style: { minWidth: "120px" } },
    { key: "taxDeducted", label: "Tax Deducted", style: { minWidth: "120px" } },
    { key: "revision", label: "Revision", style: { minWidth: "100px" } },
    {
      key: "ackFile",
      label: "Acknowledgement File",
      style: { minWidth: "200px" },
      render: (_, row) =>
        row.ackFile ? (
          <span className="text-green-700 font-medium whitespace-nowrap truncate block max-w-[200px]">
            {row.ackFile}
          </span>
        ) : (
          <span className="text-red-500 italic">No file uploaded</span>
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
              <span className="gradient-text">Quarterly TDS Reports</span>
            </h1>
            <p className="text-sm text-gray-500">
              View all submitted quarterly TDS filings and acknowledgement documents
            </p>
          </div>

          <Button
            onClick={() => router.push("/ddo/quarterlytds_submit")}
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
            placeholder="Search by FY, Return Type, Quarter, or Receipt No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Table */}
        <div className="premium-card overflow-x-auto w-full">
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
