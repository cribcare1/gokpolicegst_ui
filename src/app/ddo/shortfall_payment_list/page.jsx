
"use client";
import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import { formatCurrency } from "@/lib/gstUtils";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import ApiService from "@/components/api/api_service";
import { toast } from "sonner";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";
import { useRouter } from "next/navigation";

export default function ShortfallPaymentPage() {
  const router = useRouter();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [receiptsData, setReceiptsData] = useState([]);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [editedValues, setEditedValues] = useState({});
  const [loading, setLoading] = useState(false);

  const countrecords = receiptsData.length;

  useEffect(() => {
    setFromDate("");
    setToDate("");
    fetchCustomers();
    if (Object.keys(editedValues).length === 0) {
      fetchInvoices();
    }
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) return;

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.CUSTOMER_ACTIVE_LIST}${ddoId}`
      );

      if (response && response.status === "success") {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      const storedProfileRaw = localStorage.getItem(
        LOGIN_CONSTANT.USER_PROFILE_DATA
      );
      let gstId = 0;

      if (storedProfileRaw) {
        const storedProfile = JSON.parse(storedProfileRaw);
        if (Array.isArray(storedProfile) && storedProfile.length > 0) {
          gstId = storedProfile[0].gstId;
        } else if (typeof storedProfile === "object" && storedProfile.gstId) {
          gstId = storedProfile.gstId;
        }
      }

      if (!gstId) return;

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.FETCH_INVOICE_LIST}${ddoId}`
      );

      if (response && response.success === "success") {
        const invoices = (response.data || []).map((invoice) => ({
          id: invoice.invoiceId,
          paNo: invoice.invoiceNumber,
          customerName: invoice.customerResponse?.name || "",
          amountPayable: invoice.grandTotal,
          amountReceived: 0,
          paymentMode: "Bank",
          paymentRef: "",
          paymentDate: invoice.invoiceDate,
        }));

        setReceiptsData(invoices);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReceipt = (id, checked) => {
    if (checked) {
      setSelectedReceipts((prev) => [...prev, id]);
      setEditedValues((prev) => ({
        ...prev,
        [id]: {
          amountReceived: prev[id]?.amountReceived ?? 0,
          paymentMode: prev[id]?.paymentMode ?? "Bank",
          paymentRef: prev[id]?.paymentRef ?? "",
          paymentDate:
            prev[id]?.paymentDate ??
            receiptsData.find((r) => r.id === id)?.paymentDate,
        },
      }));
    } else {
      setSelectedReceipts((prev) => prev.filter((x) => x !== id));
      setEditedValues((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const updateField = (id, field, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleClear = () => {
    setSelectedReceipts([]);
    setEditedValues({});
  };

  const handleNext = () => {
    if (selectedReceipts.length === 0) {
      toast.error("Please select at least one receipt");
      return;
    }

    for (const id of selectedReceipts) {
      const edited = editedValues[id] || {};
      const original = receiptsData.find((r) => r.id === id);

      if (
        edited.amountReceived === undefined ||
        edited.amountReceived === null ||
        edited.amountReceived === ""
      ) {
        toast.error(
          `Amount Received is required for PA No: ${original.paNo}`
        );
        return;
      }

      if (!edited.paymentDate) {
        toast.error(
          `Payment Date is required for PA No: ${original.paNo}`
        );
        return;
      }

      if (!edited.paymentMode) {
        toast.error(
          `Payment Mode is required for PA No: ${original.paNo}`
        );
        return;
      }
    }

    const selectedData = selectedReceipts.map((id) => {
      const original = receiptsData.find((r) => r.id === id);
      const edited = editedValues[id] || {};

      return {
        invoiceId: original.id,
        paNo: original.paNo,
        customerName: original.customerName,
        amountPayable: original.amountPayable,
        amountReceived: edited.amountReceived,
        difference: original.amountPayable - edited.amountReceived,
        differenceReason: edited.differencereson || "",
        paymentMode: edited.paymentMode,
        paymentRef: edited.paymentRef || "",
        paymentDate: edited.paymentDate,
        remarks: edited.remarks || "",
      };
    });

    localStorage.setItem("shortfallData", JSON.stringify(selectedData));
    router.push("/ddo/shortfall_payment_preview");
  };

  const filteredReceipts = receiptsData.filter((r) => {
    const matchesCustomer = selectedCustomer
      ? r.customerName === selectedCustomer.customerName
      : true;
    const paymentDate = new Date(r.paymentDate);
    const matchesFrom = fromDate
      ? paymentDate >= new Date(fromDate)
      : true;
    const matchesTo = toDate ? paymentDate <= new Date(toDate) : true;
    return matchesCustomer && matchesFrom && matchesTo;
  });

  const receiptColumns = [
    {
      key: "select",
      label: "Select",
      render: (v, row) => (
        <input
          type="checkbox"
          checked={selectedReceipts.includes(row.id)}
          onChange={(e) =>
            handleSelectReceipt(row.id, e.target.checked)
          }
        />
      ),
    },
    { key: "paNo", label: "Proforma Number" },
    { key: "customerName", label: "Customer Name" },
    {
      key: "amountPayable",
      label: "Amount Payable",
      render: (v) => (
        <div className="text-right">{formatCurrency(v, true)}</div>
      ),
    },
    {
      key: "amountReceived",
      label: "Amount Received",
      render: (v, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.amountReceived ?? v;

        if (!isChecked) {
          return (
            <div className="text-right">{formatCurrency(v, true)}</div>
          );
        }

        return (
          <input
            type="number"
            min="0"
            step="1"
            className="border rounded px-2 py-1 w-full text-right appearance-none"
            value={edited === 0 ? "" : edited}
            onChange={(e) => {
              const value = e.target.value;

              if (value === "") {
                updateField(row.id, "amountReceived", "");
                return;
              }

              const numericValue = Number(value);

              // ⛔ RESTRICT: cannot exceed payable (NO auto adjust)
              if (numericValue > row.amountPayable) {
                return;
              }

              updateField(row.id, "amountReceived", numericValue);
            }}
          />
        );
      },
    },
    {
      key: "difference",
      label: "Difference",
      render: (v, row) => {
        const received =
          editedValues[row.id]?.amountReceived ?? row.amountReceived;
        const diff = row.amountPayable - received;

        return (
          <div
            className={`text-right ${
              diff === 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(diff, true)}
          </div>
        );
      },
    },
  ];

  return (
    <Layout role="ddo">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
            <span className="gradient-text">Shortfall List</span>
            <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
              bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30
              translate-y-1">
              {countrecords ?? 0}
            </span>
          </h1>
        </div>

        <div className="premium-card overflow-x-auto w-full">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading receipts..." />
            </div>
          ) : (
            <Table
              columns={receiptColumns}
              data={filteredReceipts}
              itemsPerPage={10}
            />
          )}
        </div>

        <div className="flex justify-end gap-4 mt-4">
          {!loading && (
            <>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleNext}
              >
                Next
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                onClick={handleClear}
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
