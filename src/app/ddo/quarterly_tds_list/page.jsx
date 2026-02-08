
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

export default function TDSQuarterlyListPage() {
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

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

  // ---------------- FILTER LOGIC ----------------
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
      data = data.filter((r) => r.filingDate && new Date(r.filingDate) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter((r) => r.filingDate && new Date(r.filingDate) <= to);
    }

    setFiltered(data);
  }, [searchTerm, fromDate, toDate, records]);

  // ---------------- ACTIONS ----------------
  const handleEdit = (row) => {
    sessionStorage.setItem("editRecord", JSON.stringify(row));
    router.push("/ddo/quarterlytds_submit");
  };

  const handleDelete = async (row) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await ApiService.handlePostRequest(
        `${API_ENDPOINTS.QUATERLY_GST_DELETE}${row.id}`,
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
        className="p-2.5 hover:bg-blue-50 rounded-xl text-blue-600"
      >
        <Edit size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row);
        }}
        className="p-2.5 hover:bg-red-50 rounded-xl text-red-600"
      >
        <Trash2 size={18} />
      </button>
    </>
  );

  // ---------------- TABLE COLUMNS ----------------
  const columns = [
    { key: "fy", label: "Financial Year", style: { minWidth: "120px" } },
    { key: "returnType", label: "Return Type", style: { minWidth: "100px" } },
    { key: "quarter", label: "Quarter", style: { minWidth: "80px" } },
    { key: "filingDate", label: "Filing Date", style: { minWidth: "120px" } },
    { key: "receiptNo", label: "Receipt No.", style: { minWidth: "150px" } },
    {
      key: "deducteeCount",
      label: "Deductee Count",
      render: (v) => formatCurrency(v || 0),
    },
    {
      key: "challanAmount",
      label: "Challan Amount",
      render: (v) => formatCurrency(v || 0),
    },
    {
      key: "taxDeducted",
      label: "Tax Deducted",
      render: (v) => formatCurrency(v || 0),
    },
    { key: "revision", label: "Revision" },
    {
      key: "ackFile",
      label: "Acknowledgement File",
      style: { minWidth: "200px" },
      render: (_, row) =>
        row.ackFile ? (
          <span className="font-medium truncate block max-w-[200px]">
            {row.ackFile}
          </span>
        ) : (
          <span className="text-red-500 italic">No file uploaded</span>
        ),
    },
  ];

  // ---------------- UI ----------------
  return (
    <Layout role="ddo">
      <div className="space-y-6">

        {/* TITLE + FILTERS */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold flex items-center gap-3">
            <span className="gradient-text">
              {t("nav.tdsquarterlyreports")}
            </span>
            <span className="px-3 py-1 text-sm rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              {countrecords}
            </span>
          </h1>

          <div className="flex items-end gap-3">
            <div className="flex flex-col">
              <label className="text-xs mb-1">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs mb-1">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
            </div>

            <Button onClick={() => router.push("/ddo/quarterlytds_submit")}>
              <Plus size={18} className="mr-2" /> Add
            </Button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={20} />
          <input
            type="text"
            placeholder="Search by FY, Return Type, Quarter, or Receipt No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        {/* TABLE */}
        <div className="premium-card overflow-x-auto">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading Quarterly TDS records..." />
            </div>
          ) : (
            <Table columns={columns} data={filtered} actions={tableActions} />
          )}
        </div>
      </div>
    </Layout>
  );
}
