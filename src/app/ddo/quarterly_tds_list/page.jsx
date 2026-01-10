
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
import { formatCurrency } from '@/lib/gstUtils';

export default function TDSQuarterlyListPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const countrecords = filtered.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`; // Use YYYY-MM-DD for date input
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
          id: item.id,
          fy: item.fiscalYear,
          returnType: item.returnType,
          quarter: item.quarter,
          filingDate: formatDate(item.dateOfFiling),
          receiptNo: item.provisionalReceiptNo,
          deducteeCount: item.deducteeCount,
          challanAmount: item.totalChallanAmount,
          taxDeducted: item.totalTaxDeducted,
          revision: item.anyRevisionFiled ? "Yes" : "No",
          ackFile: item.ackDocument,
          remarks: item.remarks || "",
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

  const handleDelete = async (item) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.QUATERLY_GST_DELETE}${item.id}`,
        {}
      );

      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        fetchRecords();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
    }
  };

  const handleEdit = (row) => {
    // Store the row in sessionStorage
    console.log("row " , row);
    
    sessionStorage.setItem("editRecord", JSON.stringify(row));
    router.push(`/ddo/quarterlytds_submit`);
  };

  const tableActions = (row) => (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
        className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-blue-600 dark:text-blue-400"
        aria-label="Edit"
      >
        <Edit size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row);
        }}
        className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer"
        aria-label="Delete"
      >
        <Trash2 size={18} />
      </button>
    </>
  );

  const columns = [
    { key: "fy", label: "Financial Year", style: { minWidth: "120px" } },
    { key: "returnType", label: "Return Type", style: { minWidth: "100px" } },
    { key: "quarter", label: "Quarter", style: { minWidth: "80px" } },
    { key: "filingDate", label: "Filing Date", style: { minWidth: "120px" } },
    { key: "receiptNo", label: "Receipt No.", style: { minWidth: "150px" } },
    { key: "deducteeCount", label: "Deductee Count", render: (value) => formatCurrency(value || 0), style: { minWidth: "120px" } },
    { key: "challanAmount", label: "Challan Amount", render: (value) => formatCurrency(value || 0), style: { minWidth: "120px" } },
    { key: "taxDeducted", label: "Tax Deducted", render: (value) => formatCurrency(value || 0), style: { minWidth: "120px" } },
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
              <span className="gradient-text">{t("nav.tdsquarterlyreports")}</span>
              <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
                     bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30
                     translate-y-1">
                {countrecords ?? 0}
              </span>
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

        <div className="premium-card overflow-x-auto w-full">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading Quarterly TDS records..." />
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
