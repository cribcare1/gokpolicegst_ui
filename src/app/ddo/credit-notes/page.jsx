// "use client";
// import { useState, useEffect } from "react";
// import Layout from "@/components/shared/Layout";
// import Table from "@/components/shared/Table";
// import { formatCurrency } from '@/lib/gstUtils';
// import { API_ENDPOINTS } from "@/components/api/api_const";
// import { LOGIN_CONSTANT } from "@/components/utils/constant";
// import ApiService from "@/components/api/api_service";
// import { LoadingProgressBar } from "@/components/shared/ProgressBar";

// export default function ReceiptListPage() {
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [customers, setCustomers] = useState([]);
//   const [receiptsData, setReceiptsData] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const recordCount = receiptsData.length;
//   useEffect(() => {
//     fetchCustomers();
//     fetchReceipts();
//   }, []);

//   const fetchCustomers = async () => {
//     try {
//       setLoading(true);
//       const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
//       if (!ddoId) return;

//       const response = await ApiService.handleGetRequest(
//         `${API_ENDPOINTS.CUSTOMER_ACTIVE_LIST}${ddoId}`
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

//   const fetchReceipts = async () => {
//     try {
//       setLoading(true);

//       const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);

//       const response = await ApiService.handleGetRequest(
//         `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
//       );


//       console.log(response, "::: response in invoce");


//       if (response && response.success === "success") {
//         const list = (response.data || []).map((invoice) => ({
//           id: invoice.invoiceId,
//           receiptNo: invoice.receiptInvoiceNumber,
//           receiptDate: invoice.receiptInvoiceDate,
//           paNumber: invoice.invoiceNumber,
//           customerName: invoice.customerResponse?.name || "",
//           amountPayable: invoice.grandTotal,
//           amountReceived: invoice.paidAmount,
//           balance: invoice.balanceAmount,
//           paymentMode: invoice.paymentType,
//           paymentRef: invoice.paymentReferenceNumber || "-",
//           status: invoice.status
//         }));

//         setReceiptsData(list);
//       }
//     } catch (error) {
//       console.error("Error fetching receipts:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredReceipts = receiptsData.filter((r) => {
//     const matchesCustomer = selectedCustomer
//       ? r.customerName === selectedCustomer.customerName
//       : true;

//     const receiptDate = new Date(r.receiptDate);
//     const matchesFrom = fromDate ? receiptDate >= new Date(fromDate) : true;
//     const matchesTo = toDate ? receiptDate <= new Date(toDate) : true;

//     return matchesCustomer && matchesFrom && matchesTo;
//   });


//   const receiptColumns = [
//     { key: "receiptNo", label: "Invoice Number" },
//     {
//       key: "receiptDate",
//       label: "Invoice Date",
//       render: (v) => {
//         if (!v) return "-";
//         const date = new Date(v);
//         const day = String(date.getDate()).padStart(2, "0");
//         const month = String(date.getMonth() + 1).padStart(2, "0");
//         const year = date.getFullYear();
//         return `${day}/${month}/${year}`;
//       },
//     },
//     // { key: "paNumber", label: "Proforma Advice No" },
//     { key: "customerName", label: "Customer Name" },
//     { key: "amountReceived", label: "Amount Payable", render: (v) => formatCurrency(v, true) },
//     { key: "amountReceived", label: "Amount Received", render: (v) => formatCurrency(v, true) },
//     // { key: "balance", label: "Balance", render: (v) => formatCurrency(v) },
//     { key: "paymentMode", label: "Payment Mode" },
//     { key: "paymentRef", label: "Reference No" },
//     {
//       key: "status",
//       label: "Status",
//       render: (status) => {
//         const statusMap = {
//           generated: {
//             label: "Generated" || "generated",
//             className:
//               "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
//           },
//           pending: {
//             label: "Pending" || "pending",
//             className:
//               "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
//           },
//           failed: {
//             label: "Failed",
//             className:
//               "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
//           },
//         };

//         const config = statusMap[status] || {
//           label: status || "Unknown",
//           className:
//             "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
//         };

//         return (
//           <span
//             className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}
//           >
//             {config.label}
//           </span>
//         );
//       },


//     },
//   ];

//   return (
//     <Layout role="ddo">
//       <div className="space-y-6">

//         {/* Filters */}
//         <div className="flex flex-wrap items-center justify-between gap-4">
//           {/* <h1 className="text-2xl font-bold">
//             Invoice List</h1> */}
//           {/* <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
//               <span className="gradient-text"> Invoice List</span>
//             </h1> */}
//           <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 flex items-center gap-3 whitespace-nowrap">
//             <span className="gradient-text">Invoice List</span>
//             <span className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
//                      bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30
//                      translate-y-1">
//               {recordCount ?? 0}
//             </span>
//           </h1>
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
//                 className="px-3 py-2 border rounded bg-white"
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

//         {/* List Table */}
//         <div className="premium-card overflow-x-auto w-full">
//           {loading ? (
//             <div className="p-16">
//               <LoadingProgressBar message="Loading receipts..." />
//             </div>
//           ) : (
//             <div className="min-w-max">
//               <Table columns={receiptColumns} data={filteredReceipts} itemsPerPage={10} />
//             </div>
//           )}
//         </div>

//       </div>



//     </Layout>
//   );
// }


// "use client";
// import { useEffect, useRef, useState } from "react";
// import Layout from "@/components/shared/Layout";
// import Table from "@/components/shared/Table";
// import Modal from "@/components/shared/Modal";
// import Image from "next/image";
// import html2pdf from "html2pdf.js";
// import { formatCurrency } from "@/lib/gstUtils";
// import ApiService from "@/components/api/api_service";
// import { API_ENDPOINTS } from "@/components/api/api_const";
// import { LOGIN_CONSTANT } from "@/components/utils/constant";
// import { LoadingProgressBar } from "@/components/shared/ProgressBar";
// import { Printer, Download, X } from "lucide-react";

// const LIST_COLUMNS = [
//   { key: "receiptInvoiceNumber", label: "Invoice No" },
//   {
//     key: "receiptInvoiceDate",
//     label: "Invoice Date",
//     render: (v) => {
//       if (!v) return "-";
//       const d = new Date(v);
//       return `${d.getDate().toString().padStart(2, "0")}/${(
//         d.getMonth() + 1
//       )
//         .toString()
//         .padStart(2, "0")}/${d.getFullYear()}`;
//     },
//   },
//   { key: "customerName", label: "Customer Name" },
//   {
//     key: "grandTotal",
//     label: "Amount Payable",
//     render: (v) => formatCurrency(v, true),
//   },
//   {
//     key: "paidAmount",
//     label: "Amount Received",
//     render: (v) => formatCurrency(v, true),
//   },
//   {
//     key: "balanceAmount",
//     label: "Balance Amount",
//     render: (v) => formatCurrency(v, true),
//   },
//   { key: "paymentType", label: "Payment Mode" },
// ];

// export default function ReceiptListPage() {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [previewOpen, setPreviewOpen] = useState(false);
//   const [previewData, setPreviewData] = useState(null);

//   const printRef = useRef(null);

//   useEffect(() => {
//     fetchReceipts();
//   }, []);

//   const fetchReceipts = async () => {
//     try {
//       setLoading(true);
//       const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
//       const res = await ApiService.handleGetRequest(
//         `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
//       );

//       if (res?.success === "success") {
//         const normalized = (res.data || []).map((inv) => ({
//           receiptInvoiceNumber: inv.receiptInvoiceNumber,
//           receiptInvoiceDate: inv.receiptInvoiceDate,
//           customerName: inv.customerResponse?.name || "-",
//           grandTotal: inv.grandTotal,
//           paidAmount: inv.paidAmount,
//           balanceAmount: inv.balanceAmount,
//           paymentType: inv.paymentType,
//         }));
//         setData(normalized);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const downloadPDF = () => {
//     if (!printRef.current) return;

//     html2pdf()
//       .set({
//         margin: 6,
//         filename: `Receipt_${previewData?.receiptInvoiceNumber}.pdf`,
//         image: { type: "jpeg", quality: 0.98 },
//         html2canvas: {
//           scale: 1,
//           useCORS: true,
//           scrollX: 0,
//           scrollY: 0,
//         },
//         jsPDF: {
//           unit: "mm",
//           format: "a4",
//           orientation: "landscape",
//         },
//       })
//       .from(printRef.current)
//       .save();
//   };

//   return (
//     <Layout role="ddo">
//       {/* ================= LIST ================= */}
//       <div className="premium-card">
//         {loading ? (
//           <LoadingProgressBar />
//         ) : (
//           <Table
//             columns={[
//               ...LIST_COLUMNS,
//               {
//                 key: "preview",
//                 label: "Preview",
//                 render: (_, row) => (
//                   <button
//                     className="text-blue-600 underline"
//                     onClick={() => {
//                       setPreviewData(row);
//                       setPreviewOpen(true);
//                     }}
//                   >
//                     Preview
//                   </button>
//                 ),
//               },
//             ]}
//             data={data}
//             itemsPerPage={10}
//           />
//         )}
//       </div>

//       {/* ================= PREVIEW MODAL ================= */}
//       <Modal
//         isOpen={previewOpen}
//         onClose={() => setPreviewOpen(false)}
//         size="full"
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
//           <h2 className="text-lg font-bold">Receipt Preview</h2>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={downloadPDF}
//               className="p-2 hover:bg-gray-100 rounded"
//               title="Download PDF"
//             >
//               <Download size={18} />
//             </button>
//             <button
//               onClick={() => window.print()}
//               className="p-2 hover:bg-gray-100 rounded"
//               title="Print"
//             >
//               <Printer size={18} />
//             </button>
//             <button
//               onClick={() => setPreviewOpen(false)}
//               className="p-2 hover:bg-red-500 hover:text-white rounded"
//               title="Close"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         {previewData && (
//           <div
//             ref={printRef}
//             className="bg-white p-6 print-content"
//             style={{ width: "100%" }}
//           >
//             {/* HEADER */}
//             <div className="flex justify-between border-b pb-3 mb-4">
//               <div className="flex gap-3">
//                 <Image src="/1.png" width={50} height={50} alt="logo" />
//                 <div>
//                   <h1 className="font-bold text-sm">
//                     E WINGS SERVICE INDIA PRIVATE LTD
//                   </h1>
//                   <p className="text-xs">Electronic City, Bengaluru</p>
//                   <p className="text-xs">GSTIN: 01AMQPP1138R1Z2</p>
//                 </div>
//               </div>
//               <div className="text-right text-xs">
//                 <p className="font-bold text-green-700">Invoice</p>
//                 <p>Invoice No: {previewData.receiptInvoiceNumber}</p>
//                 <p>
//                   Date:{" "}
//                   {new Date(
//                     previewData.receiptInvoiceDate
//                   ).toLocaleDateString()}
//                 </p>
//               </div>
//             </div>

//             {/* TABLE */}
//             <table className="w-full border border-collapse">
//               <thead className="bg-green-800 text-white">
//                 <tr>
//                   {LIST_COLUMNS.map((col) => (
//                     <th
//                       key={col.key}
//                       className="border px-2 py-1 text-[9px]"
//                     >
//                       {col.label}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   {LIST_COLUMNS.map((col) => (
//                     <td
//                       key={col.key}
//                       className="border px-2 py-1 text-[9px]"
//                     >
//                       {col.render
//                         ? col.render(previewData[col.key])
//                         : previewData[col.key] ?? "-"}
//                     </td>
//                   ))}
//                 </tr>
//               </tbody>
//             </table>

//             {/* SUMMARY */}
//             <div className="flex justify-end mt-4">
//               <div className="border p-2 w-1/3 text-[9px]">
//                 <div className="flex justify-between">
//                   <span>Total</span>
//                   <span>{formatCurrency(previewData.grandTotal, true)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Received</span>
//                   <span>{formatCurrency(previewData.paidAmount, true)}</span>
//                 </div>
//                 <div className="flex justify-between font-bold border-t mt-1 pt-1">
//                   <span>Balance</span>
//                   <span>
//                     {formatCurrency(previewData.balanceAmount, true)}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <p className="text-center text-[9px] text-gray-500 mt-2">
//               * This is a system generated receipt
//             </p>
//           </div>
//         )}
//       </Modal>

//       {/* ================= PRINT STYLES ================= */}
//       <style jsx global>{`
//         @media print {
//           @page {
//             size: A4 landscape;
//             margin: 6mm;
//           }

//           html,
//           body {
//             margin: 0;
//             padding: 0;
//           }

//           body * {
//             visibility: hidden;
//           }

//           .print-content,
//           .print-content * {
//             visibility: visible;
//           }

//           .print-content {
//             position: static;
//             width: 100%;
//             margin: 0;
//             padding: 0;
//             background: white;
//             overflow: visible;
//             page-break-inside: avoid;
//           }

//           table,
//           tr {
//             page-break-inside: avoid;
//           }

//           th,
//           td {
//             font-size: 9px;
//             word-break: break-word;
//           }

//           button,
//           svg {
//             display: none !important;
//           }
//         }
//       `}</style>
//     </Layout>
//   );
// }





// "use client";
// import { useEffect, useRef, useState } from "react";
// import Layout from "@/components/shared/Layout";
// import Table from "@/components/shared/Table";
// import Modal from "@/components/shared/Modal";
// import Image from "next/image";
// import html2pdf from "html2pdf.js";
// import { formatCurrency } from "@/lib/gstUtils";
// import ApiService from "@/components/api/api_service";
// import { API_ENDPOINTS } from "@/components/api/api_const";
// import { LOGIN_CONSTANT } from "@/components/utils/constant";
// import { LoadingProgressBar } from "@/components/shared/ProgressBar";
// // import { Printer, Download, X } from "lucide-react";
// import { Plus, Search, Eye, Printer, FileText, Edit, Download, X, Trash2 } from 'lucide-react';
// const LIST_COLUMNS = [
//   { key: "receiptInvoiceNumber", label: "Invoice No" },
//   {
//     key: "receiptInvoiceDate",
//     label: "Invoice Date",
//     render: (v) => {
//       if (!v) return "-";
//       const d = new Date(v);
//       return `${d.getDate().toString().padStart(2, "0")}/${(
//         d.getMonth() + 1
//       )
//         .toString()
//         .padStart(2, "0")}/${d.getFullYear()}`;
//     },
//   },
//   { key: "customerName", label: "Customer Name" },
//   {
//     key: "grandTotal",
//     label: "Amount Payable",
//     render: (v) => formatCurrency(v, true),
//   },
//   {
//     key: "paidAmount",
//     label: "Amount Received",
//     render: (v) => formatCurrency(v, true),
//   },
//   {
//     key: "balanceAmount",
//     label: "Balance Amount",
//     render: (v) => formatCurrency(v, true),
//   },
//   { key: "paymentType", label: "Payment Mode" },
// ];

// export default function ReceiptListPage() {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [previewOpen, setPreviewOpen] = useState(false);
//   const [previewData, setPreviewData] = useState(null);

//   const [ddoInfo, setDdoInfo] = useState({
//     ddoCode: "",
//     gstId: "",
//     officeName: "",
//     name :""
//   });
//   const printRef = useRef();

//   useEffect(() => {
//     const storedProfile = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);
//     if (storedProfile) {
//       const profile = JSON.parse(storedProfile);
//       console.log("profile " , profile);
      
//       setDdoInfo({
//         ddoCode: profile.ddoCode || "",
//         gstId: profile.gstNumber || profile.gstId || "",
//         officeName: profile.address || "",
//         name:profile.fullName
//       });
//     }
//   }, []);

//   useEffect(() => {
//     fetchReceipts();
//   }, []);

//   const fetchReceipts = async () => {
//     try {
//       setLoading(true);
//       const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
//       const res = await ApiService.handleGetRequest(
//         `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
//       );
//       if (res?.success === "success") {
//         const normalized = (res.data || []).map((inv) => ({
//           receiptInvoiceNumber: inv.receiptInvoiceNumber,
//           receiptInvoiceDate: inv.receiptInvoiceDate,
//           customerName: inv.customerResponse?.name || "-",
//           grandTotal: inv.grandTotal,
//           paidAmount: inv.paidAmount,
//           balanceAmount: inv.balanceAmount,
//           paymentType: inv.paymentType,
//         }));
//         setData(normalized);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const downloadPDF = () => {
//     if (!printRef.current) return;

//     html2pdf()
//       .set({
//         margin: 6,
//         filename: `Receipt_${previewData?.receiptInvoiceNumber}.pdf`,
//         image: { type: "jpeg", quality: 0.98 },
//         html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
//         jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
//       })
//       .from(printRef.current)
//       .save();
//   };

//   return (
//     <Layout role="ddo">
//       {/* ================= LIST ================= */}
//       <div className="premium-card">
//         {loading ? (
//           <LoadingProgressBar />
//         ) : (
//           <Table
//             columns={[
//               ...LIST_COLUMNS,
//               {
//                 key: "preview",
//                 label: "Preview",
//                 render: (_, row) => (
//                   <button
//                     className="text-blue-600 underline"
//                     onClick={() => {
//                       setPreviewData(row);
//                       setPreviewOpen(true);
//                     }}
//                   >
//                        <Eye size={16} />
//                   </button>
//                 ),
//               },
//             ]}
//             data={data}
//             itemsPerPage={10}
//           />
//         )}
//       </div>

//       {/* ================= PREVIEW MODAL ================= */}
//       <Modal
//         isOpen={previewOpen}
//         onClose={() => setPreviewOpen(false)}
//         size="full"
//       >
//         {/* Sticky Header */}
//         <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
//           <h2 className="text-lg font-bold">Receipt Preview</h2>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={downloadPDF}
//               title="Download PDF"
//               className="p-2 hover:bg-gray-100 rounded"
//             >
//               <Download size={18} />
//             </button>
//             <button
//               onClick={() => window.print()}
//               title="Print"
//               className="p-2 hover:bg-gray-100 rounded"
//             >
//               <Printer size={18} />
//             </button>
//             <button
//               onClick={() => setPreviewOpen(false)}
//               title="Close"
//               className="p-2 hover:bg-red-500 hover:text-white rounded"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         {previewData && (
//           <div
//             ref={printRef}
//             className="flex-1 overflow-auto bg-white p-6 print-content"
//             style={{
//               maxWidth: "297mm",
//               minHeight: "210mm",
//               margin: "0 auto",
//               fontFamily: "Arial, sans-serif",
//             }}
//           >
//             {/* HEADER */}
//             <div className="flex justify-between border-b pb-3 mb-4">
//               <div className="flex gap-3 items-start">
//                 <Image src="/1.png" width={50} height={50} alt="logo" />
//                 <div>
//                   <h1 className="font-bold text-sm">
//                     E WINGS SERVICE INDIA PRIVATE LTD
//                   </h1>
//                   <p className="text-xs">DDO Name :{ddoInfo.name}</p>
//                   <p className="text-xs">{ddoInfo.officeName}</p>
//                   <p className="text-xs">GSTIN: {ddoInfo.gstId}</p>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <h2 className="font-bold text-green-700 text-sm">Invoice</h2>
//                 <p className="text-xs">
//                   Invoice No: {previewData.receiptInvoiceNumber}
//                 </p>
//                 <p className="text-xs">
//                   Date: {new Date(previewData.receiptInvoiceDate).toLocaleDateString()}
//                 </p>
//               </div>
//             </div>

//             {/* TABLE */}
//             <div className="overflow-auto">
//               <table className="w-full border border-collapse">
//                 <thead className="bg-green-800 text-white">
//                   <tr>
//                     {LIST_COLUMNS.map((col) => (
//                       <th key={col.key} className="border px-2 py-1 text-[9px]">
//                         {col.label}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     {LIST_COLUMNS.map((col) => (
//                       <td key={col.key} className="border px-2 py-1 text-[9px]">
//                         {col.render
//                           ? col.render(previewData[col.key])
//                           : previewData[col.key] ?? "-"}
//                       </td>
//                     ))}
//                   </tr>
//                 </tbody>
//               </table>
//             </div>

//             {/* SUMMARY */}
//             <div className="flex justify-end mt-4">
//               <div className="border p-2 w-1/3 text-[9px]">
//                 <div className="flex justify-between">
//                   <span>Total</span>
//                   <span>{formatCurrency(previewData.grandTotal, true)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Received</span>
//                   <span>{formatCurrency(previewData.paidAmount, true)}</span>
//                 </div>
//                 <div className="flex justify-between font-bold border-t mt-1 pt-1">
//                   <span>Balance</span>
//                   <span>{formatCurrency(previewData.balanceAmount, true)}</span>
//                 </div>
//               </div>
//             </div>

//             <p className="text-center text-[9px] text-gray-500 mt-2">
//               * This is a system generated receipt
//             </p>
//           </div>
//         )}
//       </Modal>

//       {/* PRINT STYLES */}
//       <style jsx global>{`
//         @media print {
//           @page {
//             size: A4 landscape;
//             margin: 6mm;
//           }

//           body * {
//             visibility: hidden;
//           }

//           .print-content,
//           .print-content * {
//             visibility: visible;
//           }

//           .print-content {
//             position: absolute;
//             left: 0;
//             top: 0;
//             width: 100%;
//             max-width: 297mm;
//             transform: scale(0.9);
//             transform-origin: top left;
//             background: white;
//           }

//           table {
//             table-layout: fixed;
//             width: 100%;
//           }

//           th,
//           td {
//             word-break: break-word;
//             font-size: 9px;
//           }

//           button,
//           svg {
//             display: none !important;
//           }
//         }
//       `}</style>
//     </Layout>
//   );
// } 


// "use client";
// import { useEffect, useRef, useState } from "react";
// import Layout from "@/components/shared/Layout";
// import Table from "@/components/shared/Table";
// import Modal from "@/components/shared/Modal";
// import Image from "next/image";
// import html2pdf from "html2pdf.js";
// import { formatCurrency } from "@/lib/gstUtils";
// import ApiService from "@/components/api/api_service";
// import { API_ENDPOINTS } from "@/components/api/api_const";
// import { LOGIN_CONSTANT } from "@/components/utils/constant";
// import { LoadingProgressBar } from "@/components/shared/ProgressBar";
// import { Eye, Printer, Download, X } from "lucide-react";

// const LIST_COLUMNS = [
//   { key: "receiptInvoiceNumber", label: "Invoice No" },
//   {
//     key: "receiptInvoiceDate",
//     label: "Invoice Date",
//     render: (v) => {
//       if (!v) return "-";
//       const d = new Date(v);
//       return `${d.getDate().toString().padStart(2, "0")}/${(
//         d.getMonth() + 1
//       )
//         .toString()
//         .padStart(2, "0")}/${d.getFullYear()}`;
//     },
//   },
//   { key: "customerName", label: "Customer Name" },
//   {
//     key: "grandTotal",
//     label: "Amount Payable",
//     render: (v) => formatCurrency(v, true),
//   },
//   {
//     key: "paidAmount",
//     label: "Amount Received",
//     render: (v) => formatCurrency(v, true),
//   },
//   {
//     key: "balanceAmount",
//     label: "Balance Amount",
//     render: (v) => formatCurrency(v, true),
//   },
//   { key: "paymentType", label: "Payment Mode" },
// ];



"use client";
import { useEffect, useRef, useState } from "react";
import Layout from "@/components/shared/Layout";
import Table from "@/components/shared/Table";
import Modal from "@/components/shared/Modal";
import Image from "next/image";
import { formatCurrency } from "@/lib/gstUtils";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { LoadingProgressBar } from "@/components/shared/ProgressBar";
import { Eye, Printer, Download, X } from "lucide-react";

const LIST_COLUMNS = [
  { key: "receiptInvoiceNumber", label: "Invoice No" },
  {
    key: "receiptInvoiceDate",
    label: "Invoice Date",
    render: (v) => {
      if (!v) return "-";
      const d = new Date(v);
      return `${d.getDate().toString().padStart(2, "0")}/${(
        d.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`;
    },
  },
  { key: "customerName", label: "Customer Name" },
  {
    key: "grandTotal",
    label: "Amount Payable",
    render: (v) => formatCurrency(v, true),
  },
  {
    key: "paidAmount",
    label: "Amount Received",
    render: (v) => formatCurrency(v, true),
  },
  {
    key: "balanceAmount",
    label: "Balance Amount",
    render: (v) => formatCurrency(v, true),
  },
  { key: "paymentType", label: "Payment Mode" },
];

export default function ReceiptListPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const [ddoInfo, setDdoInfo] = useState({
    ddoCode: "",
    gstId: "",
    officeName: "",
    name: "",
  });

  const printRef = useRef();

  /* ================= USER INFO ================= */
  useEffect(() => {
    const storedProfile = localStorage.getItem(
      LOGIN_CONSTANT.USER_PROFILE_DATA
    );
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setDdoInfo({
        ddoCode: profile.ddoCode || "",
        gstId: profile.gstNumber || profile.gstId || "",
        officeName: profile.address || "",
        name: profile.fullName,
      });
    }
  }, []);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      const res = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
      );

      if (res?.success === "success") {
        const normalized = (res.data || []).map((inv) => ({
          receiptInvoiceNumber: inv.receiptInvoiceNumber,
          receiptInvoiceDate: inv.receiptInvoiceDate,
          customerId: inv.customerResponse?.id,
          customerName: inv.customerResponse?.name || "-",
          grandTotal: inv.grandTotal,
          paidAmount: inv.paidAmount,
          balanceAmount: inv.balanceAmount,
          paymentType: inv.paymentType,
        }));

        setData(normalized);

        const uniqueCustomers = Array.from(
          new Map(
            normalized
              .filter((i) => i.customerId)
              .map((i) => [
                i.customerId,
                { id: i.customerId, customerName: i.customerName },
              ])
          ).values()
        );

        setCustomers(uniqueCustomers);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER LOGIC ================= */
  const filteredData = data.filter((item) => {
    const invoiceDate = new Date(item.receiptInvoiceDate);

    if (fromDate && invoiceDate < new Date(fromDate)) return false;
    if (toDate && invoiceDate > new Date(toDate)) return false;

    if (selectedCustomer && item.customerId !== selectedCustomer.id) {
      return false;
    }
    return true;
  });

  const recordCount = filteredData.length;

  /* ================= PDF ================= */
  const downloadPDF = async () => {
    if (!printRef.current) return;

    // Dynamic import to prevent SSR errors
    const html2pdf = (await import("html2pdf.js")).default;

    html2pdf()
      .set({
        margin: 6,
        filename: `Receipt_${previewData?.receiptInvoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(printRef.current)
      .save();
  };

  return (
    <Layout role="ddo">
      {/* ================= HEADER + FILTERS ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold flex items-center gap-3 whitespace-nowrap">
          <span className="gradient-text">Receipt List</span>
          <span
            className="inline-flex items-center px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
            bg-[var(--color-primary)]/10 text-[var(--color-primary)]
            border border-[var(--color-primary)]/30 translate-y-1"
          >
            {recordCount}
          </span>
        </h1>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border px-3 py-2 rounded"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border px-3 py-2 rounded"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm">Select Customer</label>
            <select
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const customer = customers.find(
                  (c) => String(c.id) === e.target.value
                );
                setSelectedCustomer(customer || null);
              }}
              className="px-3 py-2 border rounded bg-white"
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

      {/* ================= TABLE ================= */}
      <div className="premium-card">
        {loading ? (
          <LoadingProgressBar />
        ) : (
          <Table
            columns={[
              ...LIST_COLUMNS,
              {
                key: "preview",
                label: "Preview",
                render: (_, row) => (
                  <button
                    className="text-blue-600 underline"
                    onClick={() => {
                      setPreviewData(row);
                      setPreviewOpen(true);
                    }}
                  >
                    <Eye size={16} />
                  </button>
                ),
              },
            ]}
            data={filteredData}
            itemsPerPage={10}
          />
        )}
      </div>

      {/* ================= PREVIEW MODAL ================= */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        size="full"
      >
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold">Receipt Preview</h2>
          <div className="flex items-center gap-2">
            <button onClick={downloadPDF} className="p-2 hover:bg-gray-100 rounded">
              <Download size={18} />
            </button>
            <button onClick={() => window.print()} className="p-2 hover:bg-gray-100 rounded">
              <Printer size={18} />
            </button>
            <button
              onClick={() => setPreviewOpen(false)}
              className="p-2 hover:bg-red-500 hover:text-white rounded"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {previewData && (
          <div
            ref={printRef}
            className="bg-white p-6 print-content"
            style={{ width: "100%" }}
          >
            {/* HEADER */}
            <div className="flex justify-between border-b pb-3 mb-4">
              <div className="flex gap-3">
                <Image src="/1.png" width={50} height={50} alt="logo" />
                <div>
                  <h1 className="font-bold text-sm">
                    E WINGS SERVICE INDIA PRIVATE LTD
                  </h1>
                  <p className="text-xs">Electronic City, Bengaluru</p>
                  <p className="text-xs">GSTIN: 01AMQPP1138R1Z2</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold text-green-700">Invoice</p>
                <p>Invoice No: {previewData.receiptInvoiceNumber}</p>
                <p>
                  Date:{" "}
                  {new Date(previewData.receiptInvoiceDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* TABLE */}
            <table className="w-full border border-collapse">
              <thead className="bg-green-800 text-white">
                <tr>
                  {LIST_COLUMNS.map((col) => (
                    <th key={col.key} className="border px-2 py-1 text-[9px]">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {LIST_COLUMNS.map((col) => (
                    <td key={col.key} className="border px-2 py-1 text-[9px]">
                      {col.render
                        ? col.render(previewData[col.key])
                        : previewData[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* SUMMARY */}
            <div className="flex justify-end mt-4">
              <div className="border p-2 w-1/3 text-[9px]">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span>{formatCurrency(previewData.grandTotal, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Received</span>
                  <span>{formatCurrency(previewData.paidAmount, true)}</span>
                </div>
                <div className="flex justify-between font-bold border-t mt-1 pt-1">
                  <span>Balance</span>
                  <span>{formatCurrency(previewData.balanceAmount, true)}</span>
                </div>
              </div>
            </div>

            <p className="text-center text-[9px] text-gray-500 mt-2">
              * This is a system generated receipt
            </p>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
