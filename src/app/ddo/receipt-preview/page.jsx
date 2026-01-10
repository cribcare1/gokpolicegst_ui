

// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Layout from "@/components/shared/Layout";
// import Table from "@/components/shared/Table";
// import { formatCurrency } from "@/lib/gstUtils";
// import ApiService from "@/components/api/api_service";
// import { API_ENDPOINTS } from "@/components/api/api_const";
// import { toast } from "sonner";

// export default function ReceiptPreviewPage() {
//   const router = useRouter();
//   const [data, setData] = useState([]);
//   const [editedValues, setEditedValues] = useState({});
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const storedData = localStorage.getItem("shortfallData");

//     if (!storedData) {
//       router.push("/ddo/shortfall_payment_list");
//       return;
//     }

//     try {
//       const parsed = JSON.parse(storedData);
//       setData(parsed);

//       const initialEdits = {};
//       parsed.forEach((item) => {
//         initialEdits[item.invoiceId] = {
//           amountReceived: item.amountReceived,
//           differenceReason: item.differenceReason || "",
//           paymentMode: item.paymentMode || "Select",
//           paymentRef: item.paymentRef || "",
//           paymentDate: item.paymentDate || "",
//         };
//       });
//       setEditedValues(initialEdits);
//     } catch (error) {
//       toast.error("Invalid receipt data");
//       router.push("/ddo/shortfall_payment_list");
//     }
//   }, []);

//   const updateField = (id, field, value) => {
//     setEditedValues((prev) => {
//       const updated = { ...prev, [id]: { ...prev[id], [field]: value } };

//       if (field === "amountReceived") {
//         const row = data.find((r) => r.invoiceId === id);
//         const diff = row.amountPayable - value;
//         if (diff <= 0) {
//           updated[id].differenceReason = "";
//         }
//       }

//       return updated;
//     });
//   };

//   const columns = [
//     { key: "paNo", label: "Proforma Number", render: (v) => v || "-" },
//     {
//       key: "amountReceived",
//       label: "Amount Received",
//       render: (v, row) => (
//         <input
//           type="number"
//           min="0"
//           className="border rounded px-2 py-1 w-28"
//           value={editedValues[row.invoiceId]?.amountReceived ?? v}
//           onChange={(e) =>
//             updateField(row.invoiceId, "amountReceived", parseFloat(e.target.value) || 0)
//           }
//         />
//       ),
//     },
//     {
//       key: "difference",
//       label: "Difference",
//       render: (v, row) => {
//         const received = editedValues[row.invoiceId]?.amountReceived ?? v;
//         const diff = row.amountPayable - received;
//         return (
//           <span className={diff === 0 ? "text-green-600" : "text-red-600"}>
//             {formatCurrency(diff, true)}
//           </span>
//         );
//       },
//     },
//     {
//       key: "differenceReason",
//       label: "Difference Reason",
//       render: (v, row) => {
//         const received = editedValues[row.invoiceId]?.amountReceived ?? row.amountReceived;
//         const diff = row.amountPayable - received;

//         if (diff > 0) {
//           const selectedReason = editedValues[row.invoiceId]?.differenceReason || "";
//           const isMandatoryEmpty = selectedReason === "";

//           return (
//             <select
//               className={`border rounded px-2 py-1 ${isMandatoryEmpty ? "border-red-500" : ""}`}
//               value={selectedReason}
//               onChange={(e) =>
//                 updateField(row.invoiceId, "differenceReason", e.target.value)
//               }
//             >
//               <option value="">Select</option>
//               <option value="Shortfall Payment">Shortfall Payment</option>
//               <option value="Discount Payment">Waver Amount</option>
//             </select>
//           );
//         } else {
//           return "-";
//         }
//       },
//     },
//     {
//       key: "paymentMode",
//       label: "Payment Mode",
//       render: (v, row) => (
//         <select
//           className="border rounded px-2 py-1"
//           value={editedValues[row.invoiceId]?.paymentMode || "Select"}
//           onChange={(e) =>
//             updateField(row.invoiceId, "paymentMode", e.target.value)
//           }
//         >
//           <option value="Select">Select</option>
//           <option value="Bank/ DD/ Cheque">Bank/ DD/ Cheque</option>
//           <option value="Other">Other</option>
//         </select>
//       ),
//     },
//     {
//       key: "paymentRef",
//       label: "Payment Ref No",
//       render: (v, row) => {
//         const paymentMode = editedValues[row.invoiceId]?.paymentMode || "Select";
//         const isMandatory = true;
//         return (
//           <input
//             type="text"
//             className={`border rounded px-2 py-1 w-32 ${
//               isMandatory && !editedValues[row.invoiceId]?.paymentRef?.trim()
//                 ? "border-red-500"
//                 : ""
//             }`}
//             placeholder={isMandatory ? "Required" : "Optional"}
//             value={editedValues[row.invoiceId]?.paymentRef || v || ""}
//             onChange={(e) =>
//               updateField(row.invoiceId, "paymentRef", e.target.value)
//             }
//           />
//         );
//       },
//     },
//     {
//       key: "paymentDate",
//       label: "Payment Date",
//       render: (v, row) => (
//         <input
//           type="date"
//           className="border rounded px-2 py-1"
//           value={editedValues[row.invoiceId]?.paymentDate || v || ""}
//           onChange={(e) =>
//             updateField(row.invoiceId, "paymentDate", e.target.value)
//           }
//         />
//       ),
//     },
//   ];

//  const isFormValid = () => {
//   return data.every((item) => {
//     const edited = editedValues[item.invoiceId];
//     if (!edited) return false;

//     const diff = item.amountPayable - edited.amountReceived;

//     // Payment Ref ALWAYS mandatory
//     if (!edited.paymentRef || !edited.paymentRef.trim()) return false;

//     // Payment mode mandatory
//     if (!edited.paymentMode || edited.paymentMode === "Select") return false;

//     // Payment date mandatory
//     if (!edited.paymentDate) return false;

//     // Difference reason mandatory if diff > 0
//     if (diff > 0 && !edited.differenceReason?.trim()) return false;

//     return true;
//   });
// };



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
//     console.log("temi=========",data);
//     const payload = {
      
//       receipts: data.map((item) => ({
        
       
//         invoiceId: item.invoiceId,
//         type:
//           editedValues[item.invoiceId]?.paymentMode??"Other" 
//            ,
//         referenceNumber: editedValues[item.invoiceId]?.paymentRef || "",
//         amountPaid: Number(editedValues[item.invoiceId]?.amountReceived) || 0,
//         paymentDate: editedValues[item.invoiceId]?.paymentDate || "",
//         differenceAmount: Number(item?.difference) || 0,
//         differenceReason: editedValues[item.invoiceId]?.differenceReason || "",
//       })),
//     };

//     try {
//       setLoading(true);
//       await ApiService.handlePostRequest(API_ENDPOINTS.CREATE_RECIEPT, payload);
//       toast.success("Receipts saved & invoice generated");
//       router.replace("/ddo/credit-notes");
//     } catch (error) {
//       toast.error("Failed to save receipts");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Layout role="ddo">
//       <div className="space-y-6">
//         <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
//           <span className="gradient-text">Receipt Preview</span>
//           <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
//               bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 translate-y-1">
//             {data.length}
//           </span>
//         </h1>

//         <div className="premium-card">
//           <Table columns={columns} data={data} itemsPerPage={10} />
//         </div>

//         <div className="flex justify-end gap-4">
//           <button
//             className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
//             onClick={() => router.back()}
//           >
//             Back
//           </button>

//           {/* <button
//             disabled={loading}
//             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//             onClick={() => {
//     if (window.confirm('Are you sure you want to save and generate the invoice?')) {
//       handleSaveAndGenerate();
//     }
//   }}
//           >
//             Save & Generate Invoice
//           </button> */}

//           <button
//   disabled={loading || !isFormValid()}
//   className={`px-4 py-2 rounded text-white
//     ${loading || !isFormValid()
//       ? "bg-gray-400 cursor-not-allowed"
//       : "bg-blue-600 hover:bg-blue-700"}
//   `}
//   onClick={() => {
//     if (window.confirm("Receipt has been saved. Do you want to generate the invoice?")) {
//       handleSaveAndGenerate();
//     }
//   }}
// >
//   Save & Generate Invoice
// </button>

//         </div>
//       </div>
//     </Layout>
//   );
// }
// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Layout from "@/components/shared/Layout";
// import Table from "@/components/shared/Table";
// import { formatCurrency } from "@/lib/gstUtils";
// import ApiService from "@/components/api/api_service";
// import { API_ENDPOINTS } from "@/components/api/api_const";
// import { toast } from "sonner";

// export default function ReceiptPreviewPage() {
//   const router = useRouter();
//   const [data, setData] = useState([]);
//   const [editedValues, setEditedValues] = useState({});
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const storedData = localStorage.getItem("shortfallData");

//     if (!storedData) {
//       router.push("/ddo/shortfall_payment_list");
//       return;
//     }

//     try {
//       const parsed = JSON.parse(storedData);
//       setData(parsed);

//       const initialEdits = {};
//       parsed.forEach((item) => {
//         initialEdits[item.invoiceId] = {
//           amountReceived: item.amountReceived,
//           differenceReason: item.differenceReason || "",
//           paymentMode: item.paymentMode || "Select",
//           paymentRef: item.paymentRef || "",
//           paymentDate: item.paymentDate || "",
//         };
//       });
//       setEditedValues(initialEdits);
//     } catch (error) {
//       toast.error("Invalid receipt data");
//       router.push("/ddo/shortfall_payment_list");
//     }
//   }, [router]);

//   const updateField = (id, field, value) => {
//     setEditedValues((prev) => {
//       const updated = { ...prev, [id]: { ...prev[id], [field]: value } };

//       if (field === "amountReceived") {
//         const row = data.find((r) => r.invoiceId === id);
//         const diff = row.amountPayable - value;
//         if (diff <= 0) {
//           updated[id].differenceReason = "";
//         }
//       }
//       return updated;
//     });
//   };

//   const columns = [
//     { key: "paNo", label: "Proforma Number", render: (v) => v || "-" },

//     {
//       key: "amountReceived",
//       label: "Amount Received",
//       render: (v, row) => (
//         <input
//           type="number"
//           min="0"
//           className="border rounded px-2 py-1 w-28"
//           value={editedValues[row.invoiceId]?.amountReceived ?? v}
//           onChange={(e) =>
//             updateField(
//               row.invoiceId,
//               "amountReceived",
//               Number(e.target.value) || 0
//             )
//           }
//         />
//       ),
//     },

//     {
//       key: "difference",
//       label: "Difference",
//       render: (v, row) => {
//         const received =
//           editedValues[row.invoiceId]?.amountReceived ?? row.amountReceived;
//         const diff = row.amountPayable - received;
//         return (
//           <span className={diff === 0 ? "text-green-600" : "text-red-600"}>
//             {formatCurrency(diff, true)}
//           </span>
//         );
//       },
//     },

//     {
//       key: "differenceReason",
//       label: "Difference Reason",
//       render: (v, row) => {
//         const received =
//           editedValues[row.invoiceId]?.amountReceived ?? row.amountReceived;
//         const diff = row.amountPayable - received;

//         if (diff > 0) {
//           const selected = editedValues[row.invoiceId]?.differenceReason || "";
//           return (
//             <select
//               className={`border rounded px-2 py-1 ${
//                 !selected ? "border-red-500" : ""
//               }`}
//               value={selected}
//               onChange={(e) =>
//                 updateField(
//                   row.invoiceId,
//                   "differenceReason",
//                   e.target.value
//                 )
//               }
//             >
//               <option value="">Select</option>
//               <option value="Shortfall Payment">Shortfall Payment</option>
//               <option value="Discount Payment">Waiver Amount</option>
//             </select>
//           );
//         }
//         return "-";
//       },
//     },

//     {
//       key: "paymentMode",
//       label: "Payment Mode",
//       render: (v, row) => {
//         const selected = editedValues[row.invoiceId]?.paymentMode || "Select";
//         return (
//           <select
//             className={`border rounded px-2 py-1 ${
//               selected === "Select" ? "border-red-500" : ""
//             }`}
//             value={selected}
//             onChange={(e) =>
//               updateField(row.invoiceId, "paymentMode", e.target.value)
//             }
//           >
//             <option value="Select">Select</option>
//             <option value="Bank/ DD/ Cheque">Bank/ DD/ Cheque</option>
//             <option value="Other">Other</option>
//           </select>
//         );
//       },
//     },

//     {
//       key: "paymentRef",
//       label: "Payment Ref No",
//       render: (v, row) => (
//         <input
//           type="text"
//           className={`border rounded px-2 py-1 w-32 ${
//             !editedValues[row.invoiceId]?.paymentRef?.trim()
//               ? "border-red-500"
//               : ""
//           }`}
//           placeholder="Required"
//           value={editedValues[row.invoiceId]?.paymentRef || ""}
//           onChange={(e) =>
//             updateField(row.invoiceId, "paymentRef", e.target.value)
//           }
//         />
//       ),
//     },

//     {
//       key: "paymentDate",
//       label: "Payment Date",
//       render: (v, row) => (
//         <input
//           type="date"
//           className={`border rounded px-2 py-1 ${
//             !editedValues[row.invoiceId]?.paymentDate
//               ? "border-red-500"
//               : ""
//           }`}
//           value={editedValues[row.invoiceId]?.paymentDate || ""}
//           onChange={(e) =>
//             updateField(row.invoiceId, "paymentDate", e.target.value)
//           }
//         />
//       ),
//     },
//   ];

//   const isFormValid = () =>
//     data.every((item) => {
//       const edited = editedValues[item.invoiceId];
//       if (!edited) return false;

//       const diff = item.amountPayable - edited.amountReceived;

//       if (!edited.paymentMode || edited.paymentMode === "Select") return false;
//       if (!edited.paymentRef?.trim()) return false;
//       if (!edited.paymentDate) return false;
//       if (diff > 0 && !edited.differenceReason?.trim()) return false;

//       return true;
//     });

//   const handleSaveAndGenerate = async () => {
//     for (let item of data) {
//       const edited = editedValues[item.invoiceId];
//       const diff = item.amountPayable - edited.amountReceived;

//       if (!edited.paymentMode || edited.paymentMode === "Select") {
//         toast.error(`Payment Mode is required for invoice ${item.paNo}`);
//         return;
//       }
//       if (!edited.paymentRef?.trim()) {
//         toast.error(`Payment Ref No is required for invoice ${item.paNo}`);
//         return;
//       }
//       if (!edited.paymentDate) {
//         toast.error(`Payment Date is required for invoice ${item.paNo}`);
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
//         type: editedValues[item.invoiceId].paymentMode,
//         referenceNumber: editedValues[item.invoiceId].paymentRef,
//         amountPaid: Number(editedValues[item.invoiceId].amountReceived),
//         paymentDate: editedValues[item.invoiceId].paymentDate,
//         differenceAmount:
//           item.amountPayable -
//           Number(editedValues[item.invoiceId].amountReceived),
//         differenceReason:
//           editedValues[item.invoiceId].differenceReason || "",
//       })),
//     };

//     try {
//       setLoading(true);
//       await ApiService.handlePostRequest(
//         API_ENDPOINTS.CREATE_RECIEPT,
//         payload
//       );
//       toast.success("Receipts saved & invoice generated");
//       router.replace("/ddo/credit-notes");
//     } catch (error) {
//       toast.error("Failed to save receipts");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Layout role="ddo">
//       <div className="space-y-6">
//         <h1 className="text-3xl font-extrabold">
//           <span className="gradient-text">Receipt Preview</span>
//         </h1>

//         <div className="premium-card">
//           <Table columns={columns} data={data} itemsPerPage={10} />
//         </div>

//         <div className="flex justify-end gap-4">
//           <button
//             className="bg-gray-300 px-4 py-2 rounded"
//             onClick={() => router.back()}
//           >
//             Back
//           </button>

//           <button
//             disabled={loading || !isFormValid()}
//             className={`px-4 py-2 rounded text-white ${
//               loading || !isFormValid()
//                 ? "bg-gray-400 cursor-not-allowed"
//                 : "bg-blue-600 hover:bg-blue-700"
//             }`}
//             onClick={() => {
//               if (
//                 window.confirm(
//                   "Receipt has been saved. Do you want to generate the invoice?"
//                 )
//               ) {
//                 handleSaveAndGenerate();
//               }
//             }}
//           >
//             Save & Generate Invoice
//           </button>
//         </div>
//       </div>
//     </Layout>
//   );
// }
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
          paymentMode: "", // ✅ EMPTY → shows Select
          paymentRef: "",
          paymentDate: "",
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
          className="border rounded px-2 py-1 w-28"
          value={editedValues[row.invoiceId]?.amountReceived ?? v}
          onChange={(e) =>
            updateField(
              row.invoiceId,
              "amountReceived",
              Number(e.target.value) || 0
            )
          }
        />
      ),
    },

    {
      key: "difference",
      label: "Difference",
      render: (v, row) => {
        const received =
          editedValues[row.invoiceId]?.amountReceived ?? row.amountReceived;
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
        const received =
          editedValues[row.invoiceId]?.amountReceived ?? row.amountReceived;
        const diff = row.amountPayable - received;

        if (diff > 0) {
          const selected =
            editedValues[row.invoiceId]?.differenceReason || "";
          return (
            <select
              className={`border rounded px-2 py-1 ${
                !selected ? "border-red-500" : ""
              }`}
              value={selected}
              onChange={(e) =>
                updateField(
                  row.invoiceId,
                  "differenceReason",
                  e.target.value
                )
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
            !editedValues[row.invoiceId]?.paymentMode
              ? "border-red-500"
              : ""
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
            !editedValues[row.invoiceId]?.paymentRef?.trim()
              ? "border-red-500"
              : ""
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
            !editedValues[row.invoiceId]?.paymentDate
              ? "border-red-500"
              : ""
          }`}
          value={editedValues[row.invoiceId]?.paymentDate}
          onChange={(e) =>
            updateField(row.invoiceId, "paymentDate", e.target.value)
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
      if (diff > 0 && !edited.differenceReason?.trim()) return false;

      return true;
    });
  };

  const handleSaveAndGenerate = async () => {
    for (let item of data) {
      const edited = editedValues[item.invoiceId];
      const diff = item.amountPayable - edited.amountReceived;

      if (!edited.paymentMode) {
        toast.error(`Payment Mode is required for invoice ${item.paNo}`);
        return;
      }
      if (!edited.paymentRef?.trim()) {
        toast.error(`Payment Ref No is required for invoice ${item.paNo}`);
        return;
      }
      if (!edited.paymentDate) {
        toast.error(`Payment Date is required for invoice ${item.paNo}`);
        return;
      }
      if (diff > 0 && !edited.differenceReason?.trim()) {
        toast.error(`Difference Reason is required for invoice ${item.paNo}`);
        return;
      }
    }

    const payload = {
      receipts: data.map((item) => ({
        invoiceId: item.invoiceId,
        type: editedValues[item.invoiceId].paymentMode,
        referenceNumber: editedValues[item.invoiceId].paymentRef,
        amountPaid: Number(editedValues[item.invoiceId].amountReceived),
        paymentDate: editedValues[item.invoiceId].paymentDate,
        differenceAmount:
          item.amountPayable -
          Number(editedValues[item.invoiceId].amountReceived),
        differenceReason:
          editedValues[item.invoiceId].differenceReason || "",
      })),
    };

    try {
      setLoading(true);
      await ApiService.handlePostRequest(
        API_ENDPOINTS.CREATE_RECIEPT,
        payload
      );
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
