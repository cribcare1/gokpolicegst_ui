
// "use client";

// import { useEffect, useState } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import Layout from "@/components/shared/Layout";
// import Table from "@/components/shared/Table";
// import { formatCurrency } from "@/lib/gstUtils";
// import ApiService from "@/components/api/api_service";
// import { API_ENDPOINTS } from "@/components/api/api_const";
// import { toast } from "sonner";

// export default function ReceiptPreviewPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();

//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Read data from query params
//   useEffect(() => {
//     const paramData = searchParams.get("data");

//     if (!paramData) {
//       router.push("/ddo/proforma-advice");
//       return;
//     }

//     try {
//       const parsed = JSON.parse(decodeURIComponent(paramData));
//       setData(parsed);
//     } catch (error) {
//       toast.error("Invalid receipt data");
//       router.push("/ddo/proforma-advice");
//     }
//   }, []);

//   // Format date as DD-MM-YYYY
//   const formatDate = (dateStr) => {
//     if (!dateStr) return "-";

//     const date = new Date(dateStr);
//     if (isNaN(date)) return dateStr;

//     const day = String(date.getDate()).padStart(2, "0");
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const year = date.getFullYear();

//     return `${day}-${month}-${year}`;
//   };

//   // Table columns
//   const columns = [
//     { key: "paNo", label: "Proforma Number" },
//     {
//       key: "amountPayable",
//       label: "Amount Payable",
//       render: (v) => formatCurrency(v),
//     },
//     {
//       key: "amountReceived",
//       label: "Amount Received",
//       render: (v) => formatCurrency(v),
//     },
//     {
//       key: "difference",
//       label: "Difference",
//       render: (v) => (
//         <span className={v === 0 ? "text-green-600" : "text-red-600"}>
//           {formatCurrency(v)}
//         </span>
//       ),
//     },
//     { key: "differenceReason", label: "Difference Reason" },
//     { key: "paymentMode", label: "Payment Mode" },
//     { key: "paymentRef", label: "Payment Ref No" },
//     {
//       key: "paymentDate",
//       label: "Payment Date",
//       render: (v) => <span>{formatDate(v)}</span>,
//     },
//   ];

//   // Save & Generate Invoice
//   const handleSaveAndGenerate = async () => {
//     const payload = {
//       receipts: data.map((item) => ({
//         invoiceId: item.invoiceId,
//         type: item.paymentMode === "Cash" ? "CASH" : "BANK_TRANSFER",
//         referenceNumber: item.paymentRef,
//         amountPaid: Number(item.amountReceived),
//         paymentDate: item.paymentDate,
//         differenceReason: item.differenceReason,
//       })),
//     };

//     try {
//       setLoading(true);

//       await ApiService.handlePostRequest(
//         API_ENDPOINTS.CREATE_RECIEPT,
//         payload
//       );

//       toast.success("Receipts saved & invoice generated");
//       router.push("/ddo/proforma-advice");
//     } catch (error) {
//       toast.error("Failed to save receipts");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Layout role="ddo">
//       <div className="space-y-6">
//         {/* Title with count */}
//         <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
//           <span className="gradient-text">Receipt Preview</span>

//           <span
//             className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
//               bg-[var(--color-primary)]/10 
//               text-[var(--color-primary)] 
//               border border-[var(--color-primary)]/30
//               translate-y-1"
//           >
//             {data.length}
//           </span>
//         </h1>

//         {/* Table */}
//         <div className="premium-card">
//           <Table columns={columns} data={data} itemsPerPage={10} />
//         </div>

//         {/* Action Buttons */}
//         <div className="flex justify-end gap-4">
//           <button
//             className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
//             onClick={() => router.back()}
//           >
//             Back
//           </button>

//           <button
//             disabled={loading}
//             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//             onClick={handleSaveAndGenerate}
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
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import { formatCurrency } from "@/lib/gstUtils";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { toast } from "sonner";

export default function ReceiptPreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Read data from query params
  useEffect(() => {
    const paramData = searchParams.get("data");

    if (!paramData) {
      router.push("/ddo/proforma-advice");
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(paramData));
      setData(parsed);
    } catch (error) {
      toast.error("Invalid receipt data");
      router.push("/ddo/proforma-advice");
    }
  }, []);

  // Format date as DD-MM-YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";

    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Table columns with fallback "-"
  const columns = [
    { key: "paNo", label: "Proforma Number", render: (v) => v || "-" },
    {
      key: "amountPayable",
      label: "Amount Payable",
      render: (v) => (v !== undefined && v !== null ? formatCurrency(v) : "-"),
    },
    {
      key: "amountReceived",
      label: "Amount Received",
      render: (v) => (v !== undefined && v !== null ? formatCurrency(v) : "-"),
    },
    {
      key: "difference",
      label: "Difference",
      render: (v) =>
        v !== undefined && v !== null ? (
          <span className={v === 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(v)}
          </span>
        ) : (
          "-"
        ),
    },
    {
      key: "differenceReason",
      label: "Difference Reason",
      render: (v) => v || "-",
    },
    {
      key: "paymentMode",
      label: "Payment Mode",
      render: (v) => v || "-",
    },
    {
      key: "paymentRef",
      label: "Payment Ref No",
      render: (v) => v || "-",
    },
    {
      key: "paymentDate",
      label: "Payment Date",
      render: (v) => (v ? formatDate(v) : "-"),
    },
  ];

  // Save & Generate Invoice
  const handleSaveAndGenerate = async () => {
    const payload = {
      receipts: data.map((item) => ({
        invoiceId: item.invoiceId,
        type: item.paymentMode === "Cash" ? "CASH" : "BANK_TRANSFER",
        referenceNumber: item.paymentRef || "",
        amountPaid: Number(item.amountReceived) || 0,
        paymentDate: item.paymentDate || "",
        differenceReason: item.differenceReason || "",
      })),
    };

    try {
      setLoading(true);

      await ApiService.handlePostRequest(
        API_ENDPOINTS.CREATE_RECIEPT,
        payload
      );

      toast.success("Receipts saved & invoice generated");
      router.push("/ddo/proforma-advice");
    } catch (error) {
      toast.error("Failed to save receipts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="ddo">
      <div className="space-y-6">
        {/* Title with count */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
          <span className="gradient-text">Receipt Preview</span>

          <span
            className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
              bg-[var(--color-primary)]/10 
              text-[var(--color-primary)] 
              border border-[var(--color-primary)]/30
              translate-y-1"
          >
            {data.length}
          </span>
        </h1>

        {/* Table */}
        <div className="premium-card">
          <Table columns={columns} data={data} itemsPerPage={10} />
        </div>

        {/* Action Buttons */}
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
