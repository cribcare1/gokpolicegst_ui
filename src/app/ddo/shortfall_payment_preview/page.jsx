

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
          paymentMode: item.paymentMode || "Select",
          paymentRef: item.paymentRef || "",
          paymentDate: item.paymentDate || "",
        };
      });
      setEditedValues(initialEdits);
    } catch (error) {
      toast.error("Invalid receipt data");
      router.push("/ddo/shortfall_payment_list");
    }
  }, []);

  const updateField = (id, field, value) => {
    setEditedValues((prev) => {
      const updated = { ...prev, [id]: { ...prev[id], [field]: value } };

      if (field === "amountReceived") {
        const row = data.find((r) => r.invoiceId === id);
        const diff = row.amountPayable - value;
        if (diff <= 0) {
          updated[id].differenceReason = "";
        }
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
          className="border rounded px-2 py-1 w-28"
          value={editedValues[row.invoiceId]?.amountReceived ?? v}
          onChange={(e) =>
            updateField(row.invoiceId, "amountReceived", parseFloat(e.target.value) || 0)
          }
        />
      ),
    },
    {
      key: "difference",
      label: "Difference",
      render: (v, row) => {
        const received = editedValues[row.invoiceId]?.amountReceived ?? v;
        const diff = row.amountPayable - received;
        return (
          <span className={diff === 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(diff, true)}
          </span>
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
          const selectedReason = editedValues[row.invoiceId]?.differenceReason || "";
          const isMandatoryEmpty = selectedReason === "";

          return (
            <select
              className={`border rounded px-2 py-1 ${isMandatoryEmpty ? "border-red-500" : ""}`}
              value={selectedReason}
              onChange={(e) =>
                updateField(row.invoiceId, "differenceReason", e.target.value)
              }
            >
              <option value="">Select</option>
              <option value="Shortfall Payment">Shortfall Payment</option>
              <option value="Discount Payment">Waver Amount</option>
            </select>
          );
        } else {
          return "-";
        }
      },
    },
    {
      key: "paymentMode",
      label: "Payment Mode",
      render: (v, row) => (
        <select
          className="border rounded px-2 py-1"
          value={editedValues[row.invoiceId]?.paymentMode || "Select"}
          onChange={(e) =>
            updateField(row.invoiceId, "paymentMode", e.target.value)
          }
        >
          <option value="Select">Select</option>
          <option value="Bank/ DD/ Cheque">Bank/ DD/ Cheque</option>
          <option value="Other">Other</option>
        </select>
      ),
    },
    {
      key: "paymentRef",
      label: "Payment Ref No",
      render: (v, row) => {
        const paymentMode = editedValues[row.invoiceId]?.paymentMode || "Select";
        const isMandatory = paymentMode === "Bank/ DD/ Cheque";
        return (
          <input
            type="text"
            className={`border rounded px-2 py-1 w-32 ${
              isMandatory && !editedValues[row.invoiceId]?.paymentRef?.trim()
                ? "border-red-500"
                : ""
            }`}
            placeholder={isMandatory ? "Required" : "Optional"}
            value={editedValues[row.invoiceId]?.paymentRef || v || ""}
            onChange={(e) =>
              updateField(row.invoiceId, "paymentRef", e.target.value)
            }
          />
        );
      },
    },
    {
      key: "paymentDate",
      label: "Payment Date",
      render: (v, row) => (
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={editedValues[row.invoiceId]?.paymentDate || v || ""}
          onChange={(e) =>
            updateField(row.invoiceId, "paymentDate", e.target.value)
          }
        />
      ),
    },
  ];

  const handleSaveAndGenerate = async () => {
  // validations (keep if required)
  for (let item of data) {
    const edited = editedValues[item.invoiceId];

    if (!edited || edited.amountReceived <= 0) {
      toast.error(`Amount is required for invoice ${item.paNo}`);
      return;
    }
  }

  // 🔹 EXACT payload format as required by backend
  // const payload = data.map((item) => ({
  //   invoiceId: item.invoiceId,
  //   amount: Number(editedValues[item.invoiceId]?.amountReceived) || 0,
  // }));

  const payload = {
      
    receipts: data.map((item) => ({
      
     
      invoiceId: item.invoiceId,
      type:
        editedValues[item.invoiceId]?.paymentMode??"Other" 
         ,
      referenceNumber: editedValues[item.invoiceId]?.paymentRef || "",
      amountPaid: Number(editedValues[item.invoiceId]?.amountReceived) || 0,
      paymentDate: editedValues[item.invoiceId]?.paymentDate || "",
      differenceAmount: Number(item?.difference) || 0,
      differenceReason: editedValues[item.invoiceId]?.differenceReason || "",
    })),
  };
  try {
    setLoading(true);
    await ApiService.handlePostRequest(
      API_ENDPOINTS.CREATE_RECIEPT,
      payload
    );
    toast.success("Shortfall invoice generated successfully");
    router.push("/ddo/shortfall_payment_list");
  } catch (error) {
    toast.error("Failed to generate shortfall invoice");
  } finally {
    setLoading(false);
  }
};


//   const handleSaveAndGenerate = async () => {
//     for (let item of data) {
//       const edited = editedValues[item.invoiceId];
//       const diff = item.amountPayable - edited.amountReceived;

//       if (edited.paymentMode === "Bank/ DD/ Cheque" && !edited.paymentRef?.trim()) {
//         toast.error(`Payment Ref No is required for invoice ${item.paNo}`);
//         return;
//       }

//       if (diff > 0 && !edited.differenceReason?.trim()) {
//         toast.error(`Difference Reason is required for invoice ${item.paNo}`);
//         return;
//       }
//     }

//     const payload = {
//       receipts: data.map((item) => ({
//         invoiceId: item.invoiceId,
//         type:
//           editedValues[item.invoiceId]?.paymentMode === "Cash"
//             ? "CASH"
//             : "BANK_TRANSFER",
//         referenceNumber: editedValues[item.invoiceId]?.paymentRef || "",
//         amountPaid: Number(editedValues[item.invoiceId]?.amountReceived) || 0,
//         paymentDate: editedValues[item.invoiceId]?.paymentDate || "",
//         differenceReason: editedValues[item.invoiceId]?.differenceReason || "",
//       })),
//     };

//     try {
//       setLoading(true);
//       await ApiService.handlePostRequest(API_ENDPOINTS.CREATE_RECIEPT, payload);
//       toast.success("Receipts saved & invoice generated");
//       router.push("/ddo/shortfall_payment_list");
//     } catch (error) {
//       toast.error("Failed to save receipts");
//     } finally {
//       setLoading(false);
//     }
//   };

  return (
    <Layout role="ddo">
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
          <span className="gradient-text">Shortfall Preview</span>
          <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
              bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 translate-y-1">
            {data.length}
          </span>
        </h1>

        <div className="premium-card">
          <Table columns={columns} data={data} itemsPerPage={10} />
        </div>

        <div className="flex justify-end gap-4">
          <button
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            onClick={() => router.back()}
          >
            Back
          </button>

          <button
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleSaveAndGenerate}
          >
            Save & Generate Invoice
          </button>
        </div>
      </div>
    </Layout>
  );
}
