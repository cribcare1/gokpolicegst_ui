
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import { formatCurrency } from "@/lib/gstUtils";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { toast } from "sonner";

export default function ReceiptPreviewPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [editedValues, setEditedValues] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem("shortfallData");

    if (!storedData) {
      router.push("/ddo/shortfall_payment_list");
      return;
    }

    try {
      const parsed = JSON.parse(storedData);
      setData(parsed);

      const initialEdits = {};
      parsed.forEach((item) => {
        initialEdits[item.invoiceId] = {
          amountReceived: item.amountReceived,
          differenceReason: item.differenceReason || "",
          paymentMode: "",
          paymentRef: "",
          paymentDate: "",
          remarks: "",
        };
      });
      setEditedValues(initialEdits);
    } catch {
      toast.error("Invalid receipt data");
      router.push("/ddo/shortfall_payment_list");
    }
  }, [router]);

  const updateField = (id, field, value) => {
    setEditedValues((prev) => {
      const updated = { ...prev, [id]: { ...prev[id], [field]: value } };
      if (field === "amountReceived") {
        const row = data.find((r) => r.invoiceId === id);
        const diff = row.amountPayable - value;
        if (diff <= 0) updated[id].differenceReason = "";
      }
      return updated;
    });
  };

  const columns = [
    { key: "paNo", label: "Proforma Number", render: (v) => v || "-" },
    {
      key: "amountReceived",
      label: "Amount Received",
      render: (v, row) => (
        <input
          type="number"
          min="0"
          className={`border rounded px-2 py-1 w-28 text-right ${
            (editedValues[row.invoiceId]?.amountReceived || 0) <= 0
              ? "border-red-500"
              : ""
          }`}
          value={editedValues[row.invoiceId]?.amountReceived ?? v}
          onChange={(e) =>
            updateField(row.invoiceId, "amountReceived", Number(e.target.value) || 0)
          }
        />
      ),
    },
    {
      key: "difference",
      label: "Difference",
      render: (v, row) => {
        const received = editedValues[row.invoiceId]?.amountReceived ?? row.amountReceived;
        const diff = row.amountPayable - received;
        return (
          <div
        style={{ textAlign: "right" }} // ensures alignment
        className={diff === 0 ? "text-green-600" : "text-red-600"}
      >
        {formatCurrency(diff, true)}
      </div>
        );
      },
    },
    {
      key: "differenceReason",
      label: "Difference Reason",
      render: (v, row) => {
        const received = editedValues[row.invoiceId]?.amountReceived ?? row.amountReceived;
        const diff = row.amountPayable - received;
        if (diff > 0) {
          const selected = editedValues[row.invoiceId]?.differenceReason || "";
          return (
            <select
              className={`border rounded px-2 py-1 ${!selected ? "border-red-500" : ""}`}
              value={selected}
              onChange={(e) =>
                updateField(row.invoiceId, "differenceReason", e.target.value)
              }
            >
              <option value="">Select</option>
              <option value="Shortfall Payment">Shortfall Payment</option>
              <option value="Discount Payment">Waiver Amount</option>
            </select>
          );
        }
        return "-";
      },
    },
    {
      key: "paymentMode",
      label: "Payment Mode",
      render: (v, row) => (
        <select
          className={`border rounded px-2 py-1 ${
            !editedValues[row.invoiceId]?.paymentMode ? "border-red-500" : ""
          }`}
          value={editedValues[row.invoiceId]?.paymentMode}
          onChange={(e) =>
            updateField(row.invoiceId, "paymentMode", e.target.value)
          }
        >
          <option value="">Select</option>
          <option value="Bank/ DD/ Cheque">Bank/ DD/ Cheque</option>
          <option value="Other">Other</option>
        </select>
      ),
    },
    {
      key: "paymentRef",
      label: "Payment Ref No",
      render: (v, row) => (
        <input
          type="text"
          className={`border rounded px-2 py-1 w-32 ${
            !editedValues[row.invoiceId]?.paymentRef?.trim() ? "border-red-500" : ""
          }`}
          value={editedValues[row.invoiceId]?.paymentRef}
          onChange={(e) =>
            updateField(row.invoiceId, "paymentRef", e.target.value)
          }
        />
      ),
    },
    {
      key: "paymentDate",
      label: "Payment Date",
      render: (v, row) => (
        <input
          type="date"
          className={`border rounded px-2 py-1 ${
            !editedValues[row.invoiceId]?.paymentDate ? "border-red-500" : ""
          }`}
          value={editedValues[row.invoiceId]?.paymentDate}
          onChange={(e) =>
            updateField(row.invoiceId, "paymentDate", e.target.value)
          }
        />
      ),
    },
    {
      key: "remarks",
      label: "Remarks",
      render: (v, row) => (
        <input
          type="text"
          className="border rounded px-2 py-1 w-40"
          placeholder="Enter remarks"
          value={editedValues[row.invoiceId]?.remarks || ""}
          onChange={(e) =>
            updateField(row.invoiceId, "remarks", e.target.value)
          }
        />
      ),
    },
  ];

  const isFormValid = () => {
    if (!data.length) return false;

    return data.every((item) => {
      const edited = editedValues[item.invoiceId];
      if (!edited) return false;
      const diff = item.amountPayable - edited.amountReceived;

      if (!edited.paymentMode) return false;
      if (!edited.paymentRef?.trim()) return false;
      if (!edited.paymentDate) return false;
      if ((diff > 0 && !edited.differenceReason?.trim()) || edited.amountReceived <= 0)
        return false;

      return true;
    });
  };

  const handleSaveAndGenerate = async () => {
    const payload = {
      receipts: data.map((item) => ({
        invoiceId: item.invoiceId,
        type: editedValues[item.invoiceId].paymentMode,
        referenceNumber: editedValues[item.invoiceId].paymentRef,
        amountPaid: Number(editedValues[item.invoiceId].amountReceived),
        paymentDate: editedValues[item.invoiceId].paymentDate,
        differenceAmount:
          item.amountPayable - Number(editedValues[item.invoiceId].amountReceived),
        differenceReason: editedValues[item.invoiceId].differenceReason || "",
        remarks: editedValues[item.invoiceId].remarks || "",
      })),
    };

    try {
      setLoading(true);
      await ApiService.handlePostRequest(API_ENDPOINTS.CREATE_RECIEPT, payload);
      toast.success("Receipts saved & invoice generated");
      router.replace("/ddo/credit-notes");
    } catch {
      toast.error("Failed to save receipts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="ddo">
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold gradient-text">
          Receipt Preview
        </h1>

        <div className="premium-card">
          <Table columns={columns} data={data} itemsPerPage={10} />
        </div>

        <div className="flex justify-end gap-4">
          <button
            className="bg-gray-300 px-4 py-2 rounded"
            onClick={() => router.back()}
          >
            Back
          </button>

          <button
            disabled={loading || !isFormValid()}
            className={`px-4 py-2 rounded text-white ${
              loading || !isFormValid()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={() => {
              if (
                window.confirm(
                  "Receipt has been saved. Do you want to generate the invoice?"
                )
              ) {
                handleSaveAndGenerate();
              }
            }}
          >
            Save & Generate Invoice
          </button>
        </div>
      </div>
    </Layout>
  );
}
