// "use client";
// import { useState, useEffect } from "react";
// import Layout from "@/components/shared/Layout";
// import Table from "@/components/shared/Table";
// import { formatCurrency } from '@/lib/gstUtils';
// import ApiService from "@/components/api/api_service";
// import { toast } from 'sonner';
// import { LoadingProgressBar } from "@/components/shared/ProgressBar"; 
// import { useRouter } from "next/navigation";

// export default function ShortfallPaymentPage() {
//   const router = useRouter();
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [customers, setCustomers] = useState([]);
//   const [receiptsData, setReceiptsData] = useState([]);
//   const [selectedReceipts, setSelectedReceipts] = useState([]);
//   const [editedValues, setEditedValues] = useState({});
//   const [loading, setLoading] = useState(false);

//   const countrecords = receiptsData.length;

//   useEffect(() => {
//     fetchCustomers();
//     fetchShortfallInvoices();
//   }, []);

//   // Fetch active customers
//   const fetchCustomers = async () => {
//     try {
//       setLoading(true);
//       const response = await ApiService.handleGetRequest(
//         `/tds/customers/active` // replace with your actual customer API
//       );

//       if (response && response.status === "success") {
//         setCustomers(response.data || []);
//       }
//     } catch (error) {
//       console.error("Error fetching customers:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch shortfall invoices
//   const fetchShortfallInvoices = async () => {
//     try {
//       setLoading(true);
//       const response = await ApiService.handleGetRequest(
//         "https://api.gokpolicegst.com:8443/tds/invoices/invoiceListDetails?isShortfall=true&status=SAVED"
//       );

//       if (response && response.success === "success") {
//         const invoices = (response.data || []).map((invoice) => ({
//           id: invoice.invoiceId,
//           paNo: invoice.invoiceNumber,
//           customerName: invoice.customerResponse?.name || "-",
//           amountPayable: invoice.grandTotal ?? 0,
//           amountReceived: invoice.paidAmount ?? 0,
//           paymentMode: invoice.paymentType || "Bank",
//           paymentRef: invoice.paymentReferenceNumber || "",
//           paymentDate: invoice.invoiceDate,
//         }));

//         setReceiptsData(invoices);
//       }
//     } catch (error) {
//       console.error("Error fetching shortfall invoices:", error);
//       toast.error("Failed to fetch shortfall payments");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSelectReceipt = (id, checked) => {
//     if (checked) {
//       setSelectedReceipts((prev) => [...prev, id]);
//       setEditedValues((prev) => ({
//         ...prev,
//         [id]: {
//           amountReceived: prev[id]?.amountReceived ?? 0,
//           paymentMode: prev[id]?.paymentMode ?? "Bank",
//           paymentRef: prev[id]?.paymentRef ?? "",
//           paymentDate: prev[id]?.paymentDate ?? receiptsData.find(r => r.id === id)?.paymentDate,
//         },
//       }));
//     } else {
//       setSelectedReceipts((prev) => prev.filter((x) => x !== id));
//       setEditedValues((prev) => {
//         const updated = { ...prev };
//         delete updated[id];
//         return updated;
//       });
//     }
//   };

//   const updateField = (id, field, value) => {
//     setEditedValues((prev) => ({
//       ...prev,
//       [id]: { ...prev[id], [field]: value },
//     }));
//   };

//   const handleClear = () => {
//     setSelectedReceipts([]);
//     setEditedValues({});
//   };

//   const handleNext = () => {
//     if (selectedReceipts.length === 0) {
//       toast.error("Please select at least one receipt");
//       return;
//     }

//     // Validate selected rows
//     for (const id of selectedReceipts) {
//       const edited = editedValues[id] || {};
//       const original = receiptsData.find((r) => r.id === id);

//       if (edited.amountReceived === undefined || edited.amountReceived === null || edited.amountReceived === "") {
//         toast.error(`Amount Received is required for PA No: ${original.paNo}`);
//         return;
//       }

//       if (!edited.paymentDate) {
//         toast.error(`Payment Date is required for PA No: ${original.paNo}`);
//         return;
//       }

//       if (!edited.paymentMode) {
//         toast.error(`Payment Mode is required for PA No: ${original.paNo}`);
//         return;
//       }
//     }

//     // Prepare selected data
//     const selectedData = selectedReceipts.map((id) => {
//       const original = receiptsData.find((r) => r.id === id);
//       const edited = editedValues[id] || {};

//       return {
//         invoiceId: original.id,
//         paNo: original.paNo,
//         customerName: original.customerName,
//         amountPayable: original.amountPayable,
//         amountReceived: edited.amountReceived,
//         difference: original.amountPayable - edited.amountReceived,
//         differenceReason: edited.differencereson || "",
//         paymentMode: edited.paymentMode,
//         paymentRef: edited.paymentRef || "",
//         paymentDate: edited.paymentDate,
//       };
//     });

//     const encodedData = encodeURIComponent(JSON.stringify(selectedData));
//     router.push(`/ddo/receipt-preview?data=${encodedData}`);
//   };

//   const filteredReceipts = receiptsData.filter((r) => {
//     const matchesCustomer = selectedCustomer ? r.customerName === selectedCustomer.customerName : true;
//     const paymentDate = new Date(r.paymentDate);
//     const matchesFrom = fromDate ? paymentDate >= new Date(fromDate) : true;
//     const matchesTo = toDate ? paymentDate <= new Date(toDate) : true;
//     return matchesCustomer && matchesFrom && matchesTo;
//   });

//   const receiptColumns = [
//     {
//       key: "select",
//       label: "Select",
//       render: (v, row) => (
//         <input
//           type="checkbox"
//           checked={selectedReceipts.includes(row.id)}
//           onChange={(e) => handleSelectReceipt(row.id, e.target.checked)}
//         />
//       ),
//     },
//     { key: "paNo", label: "Proforma Number" },
//     { key: "customerName", label: "Customer Name" },
//     { key: "amountPayable", label: "Amount Payable", render: (v) => formatCurrency(v) },
//     {
//       key: "amountReceived",
//       label: "Amount Received",
//       render: (v, row) => {
//         const isChecked = selectedReceipts.includes(row.id);
//         const edited = editedValues[row.id]?.amountReceived ?? v;
//         if (!isChecked) return <span>{formatCurrency(v)}</span>;

//         return (
//           <input
//             type="number"
//             min="0"
//             step="1"
//             className="border rounded px-2 py-1 w-28"
//             value={edited}
//             onChange={(e) => updateField(row.id, "amountReceived", parseFloat(e.target.value) || 0)}
//           />
//         );
//       },
//     },
//     {
//       key: "difference",
//       label: "Difference",
//       render: (v, row) => {
//         const received = editedValues[row.id]?.amountReceived ?? row.amountReceived;
//         const diff = row.amountPayable - received;
//         return (
//           <span className={diff === 0 ? "text-green-600" : "text-red-600"}>
//             {formatCurrency(diff)}
//           </span>
//         );
//       },
//     },
//     {
//       key: "paymentMode",
//       label: "Payment Mode",
//       render: (v, row) => {
//         const isChecked = selectedReceipts.includes(row.id);
//         const edited = editedValues[row.id]?.paymentMode ?? v;
//         if (!isChecked) return <span>{v}</span>;

//         return (
//           <select
//             className="border rounded px-2 py-1"
//             value={edited}
//             onChange={(e) => updateField(row.id, "paymentMode", e.target.value)}
//           >
//             <option>Bank/ DD/ Cheque</option>
//             <option>Other</option>
//           </select>
//         );
//       },
//     },
//     {
//       key: "paymentRef",
//       label: "Payment Ref No",
//       render: (v, row) => {
//         const isChecked = selectedReceipts.includes(row.id);
//         const edited = editedValues[row.id]?.paymentRef ?? v;
//         if (!isChecked) return <span>{v || "-"}</span>;

//         return (
//           <input
//             type="text"
//             className="border rounded px-2 py-1 w-32"
//             value={edited}
//             onChange={(e) => updateField(row.id, "paymentRef", e.target.value)}
//           />
//         );
//       },
//     },
//     {
//       key: "paymentDate",
//       label: "Payment Date",
//       render: (v, row) => {
//         const isChecked = selectedReceipts.includes(row.id);
//         const edited = editedValues[row.id]?.paymentDate ?? v;

//         const formatDate = (dateStr) => {
//           if (!dateStr) return "";
//           const [y, m, d] = dateStr.split("-");
//           return `${d}-${m}-${y}`;
//         };

//         if (!isChecked) {
//           return <span>{formatDate(v)}</span>;
//         }

//         return (
//           <input
//             type="date"
//             className="border rounded px-2 py-1"
//             value={edited}
//             onChange={(e) => updateField(row.id, "paymentDate", e.target.value)}
//           />
//         );
//       },
//     },
//   ];

//   return (
//     <Layout role="ddo">
//       <div className="space-y-6">
//         <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
//           <span className="gradient-text">Shortfall Payments</span>
//           <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
//             bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30
//             translate-y-1">
//             {countrecords ?? 0}
//           </span>
//         </h1>

//         {/* Filters */}
//         <div className="flex flex-wrap items-center justify-between gap-4">
//           <div className="flex flex-wrap gap-4 items-end">
//             <div className="flex flex-col">
//               <label>From Date</label>
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 className="border px-3 py-2 rounded"
//               />
//             </div>
//             <div className="flex flex-col">
//               <label>To Date</label>
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 className="border px-3 py-2 rounded"
//               />
//             </div>
//             <div className="flex flex-col">
//               <label>Select Customer</label>
//               <select
//                 value={selectedCustomer?.id || ""}
//                 onChange={(e) => {
//                   const customer = customers.find((c) => String(c.id) === e.target.value);
//                   setSelectedCustomer(customer || null);
//                 }}
//                 className="flex-1 px-3 py-2 border rounded-lg bg-white"
//               >
//                 <option value="">All Customers</option>
//                 {customers.map((customer) => (
//                   <option key={customer.id} value={customer.id}>
//                     {customer.customerName}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="premium-card overflow-x-auto w-full">
//           {loading ? (
//             <div className="p-16">
//               <LoadingProgressBar message="Loading shortfall payments..." />
//             </div>
//           ) : (
//             <div className="min-w-max">
//               <Table columns={receiptColumns} data={filteredReceipts} itemsPerPage={10} />
//             </div>
//           )}

//           {!loading && (
//             <div className="flex justify-end gap-4 mt-4">
//               <button
//                 className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//                 onClick={handleNext}
//               >
//                 Next
//               </button>
//               <button
//                 className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
//                 onClick={handleClear}
//               >
//                 Clear
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </Layout>
//   );
// }


"use client";
import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import { formatCurrency } from '@/lib/gstUtils';
import ApiService from "@/components/api/api_service";
import { toast } from 'sonner';
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
    fetchCustomers();
    fetchShortfallInvoices();
  }, []);

  // Fetch active customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.handleGetRequest(
        `/tds/customers/active` // replace with actual customer API
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

  // Fetch shortfall invoices
  const fetchShortfallInvoices = async () => {
    try {
      setLoading(true);
      const response = await ApiService.handleGetRequest(
        "https://api.gokpolicegst.com:8443/tds/invoices/invoiceListDetails?isShortfall=true&status=SAVED"
      );

      if (response && response.success === "success") {
        const invoices = (response.data || []).map((invoice) => ({
          id: invoice.invoiceId,
          paNo: invoice.invoiceNumber,
          customerName: invoice.customerResponse?.name || "-",
          amountPayable: invoice.grandTotal ?? 0,
          amountReceived: invoice.paidAmount ?? 0,
          paymentMode: invoice.paymentType || "Bank",
          paymentRef: invoice.paymentReferenceNumber || "",
          paymentDate: invoice.invoiceDate,
        }));

        setReceiptsData(invoices);
      }
    } catch (error) {
      console.error("Error fetching shortfall invoices:", error);
      toast.error("Failed to fetch shortfall payments");
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
          paymentDate: prev[id]?.paymentDate ?? receiptsData.find(r => r.id === id)?.paymentDate,
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

      if (edited.amountReceived === undefined || edited.amountReceived === null || edited.amountReceived === "") {
        toast.error(`Amount Received is required for PA No: ${original.paNo}`);
        return;
      }

      if (!edited.paymentDate) {
        toast.error(`Payment Date is required for PA No: ${original.paNo}`);
        return;
      }

      if (!edited.paymentMode) {
        toast.error(`Payment Mode is required for PA No: ${original.paNo}`);
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
      };
    });

    const encodedData = encodeURIComponent(JSON.stringify(selectedData));
    router.push(`/ddo/receipt-preview?data=${encodedData}`);
  };

  const filteredReceipts = receiptsData.filter((r) => {
    const matchesCustomer = selectedCustomer ? r.customerName === selectedCustomer.customerName : true;
    const paymentDate = new Date(r.paymentDate);
    const matchesFrom = fromDate ? paymentDate >= new Date(fromDate) : true;
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
          onChange={(e) => handleSelectReceipt(row.id, e.target.checked)}
        />
      ),
    },
    { key: "paNo", label: "Proforma Number" },
    { key: "customerName", label: "Customer Name" },
    { key: "amountPayable", label: "Amount Payable", render: (v) => formatCurrency(v) },
    {
      key: "amountReceived",
      label: "Amount Received",
      render: (v, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.amountReceived ?? v;
        if (!isChecked) return <span>{formatCurrency(v)}</span>;

        return (
          <input
            type="number"
            min="0"
            step="1"
            className="border rounded px-2 py-1 w-28"
            value={edited}
            onChange={(e) => updateField(row.id, "amountReceived", parseFloat(e.target.value) || 0)}
          />
        );
      },
    },
    {
      key: "difference",
      label: "Difference",
      render: (v, row) => {
        const received = editedValues[row.id]?.amountReceived ?? row.amountReceived;
        const diff = row.amountPayable - received;
        return (
          <span className={diff === 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(diff)}
          </span>
        );
      },
    },
    {
      key: "paymentMode",
      label: "Payment Mode",
      render: (v, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.paymentMode ?? v;
        if (!isChecked) return <span>{v}</span>;

        return (
          <select
            className="border rounded px-2 py-1"
            value={edited}
            onChange={(e) => updateField(row.id, "paymentMode", e.target.value)}
          >
            <option>Bank/ DD/ Cheque</option>
            <option>Other</option>
          </select>
        );
      },
    },
    {
      key: "paymentRef",
      label: "Payment Ref No",
      render: (v, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.paymentRef ?? v;
        if (!isChecked) return <span>{v || "-"}</span>;

        return (
          <input
            type="text"
            className="border rounded px-2 py-1 w-32"
            value={edited}
            onChange={(e) => updateField(row.id, "paymentRef", e.target.value)}
          />
        );
      },
    },
    {
      key: "paymentDate",
      label: "Payment Date",
      render: (v, row) => {
        const isChecked = selectedReceipts.includes(row.id);
        const edited = editedValues[row.id]?.paymentDate ?? v;

        const formatDate = (dateStr) => {
          if (!dateStr) return "";
          const [y, m, d] = dateStr.split("-");
          return `${d}-${m}-${y}`;
        };

        if (!isChecked) return <span>{formatDate(v)}</span>;

        return (
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={edited}
            onChange={(e) => updateField(row.id, "paymentDate", e.target.value)}
          />
        );
      },
    },
  ];

  return (
    <Layout role="ddo">
      <div className="space-y-6">

        {/* Title + Filters on the same row */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold flex items-center gap-3 whitespace-nowrap">
            <span className="gradient-text">Shortfall Payments</span>
            <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
              bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30
              translate-y-1">
              {countrecords ?? 0}
            </span>
          </h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border px-3 py-2 rounded"
              />
            </div>
            <div className="flex flex-col">
              <label>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border px-3 py-2 rounded"
              />
            </div>
            <div className="flex flex-col">
              <label>Select Customer</label>
              <select
                value={selectedCustomer?.id || ""}
                onChange={(e) => {
                  const customer = customers.find((c) => String(c.id) === e.target.value);
                  setSelectedCustomer(customer || null);
                }}
                className="flex-1 px-3 py-2 border rounded-lg bg-white"
              >
                <option value="">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="premium-card overflow-x-auto w-full">
          {loading ? (
            <div className="p-16">
              <LoadingProgressBar message="Loading shortfall payments..." />
            </div>
          ) : (
            <div className="min-w-max">
              <Table columns={receiptColumns} data={filteredReceipts} itemsPerPage={10} />
            </div>
          )}

          {!loading && (
            <div className="flex justify-end gap-4 mt-4">
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
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
