

// "use client";

// import Layout from "@/components/shared/Layout";
// import ApiService from "@/components/api/api_service";
// import { API_ENDPOINTS } from "@/components/api/api_const";
// import { LOGIN_CONSTANT } from "@/components/utils/constant";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Button from "@/components/shared/Button";
// import { formatCurrency } from "@/lib/gstUtils";

// export default function CreditNoteCreate() {
//   const router = useRouter();
//   const today = new Date().toISOString().split("T")[0];

//   const [invoiceList, setInvoiceList] = useState([]);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const [taxBreakup, setTaxBreakup] = useState({
//     cgst: 0,
//     sgst: 0,
//     igst: 0,
//   });

//   const [formData, setFormData] = useState({
//     receiptInvoiceNo: "",
//     customerName: "",
//     creditNoteDate: today,
//     creditNoteValue: "",
//     baseAmount: 0,
//     taxAmount: 0,
//     totalAmount: 0,
//     payableAmount: 0,
//     remark: "",
//     isExempted: false,
//   });

//   /* ================= FETCH INVOICES ================= */
//   useEffect(() => {
//     fetchInvoices();
//   }, []);

//   const fetchInvoices = async () => {
//     try {
//       const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
//       if (!ddoId) return;

//       const res = await ApiService.handleGetRequest(
//         `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
//       );

//       if (res?.success === "success") {
//         setInvoiceList(res.data || []);
//       }
//     } catch {
//       alert("Failed to fetch invoices");
//     }
//   };

//   /* ================= INPUT HANDLER ================= */
//   const update = (e) => {
//     const { name, value } = e.target;

//     /* ---- Invoice Selection ---- */
//     if (name === "receiptInvoiceNo") {
//       const invoice = invoiceList.find(
//         (i) => i.receiptInvoiceNumber === value
//       );
//       if (!invoice) return;

//       setSelectedInvoice(invoice);
//       setTaxBreakup({ cgst: 0, sgst: 0, igst: 0 });

//       setFormData({
//         receiptInvoiceNo: value,
//         customerName: invoice.customerResponse?.name || "",
//         creditNoteDate: today,
//         creditNoteValue: "",
//         baseAmount: 0,
//         taxAmount: 0,
//         totalAmount: 0,
//         payableAmount: invoice.grandTotal,
//         remark: "",
//         isExempted: false,
//       });
//       return;
//     }

//     /* ---- Credit Note Value (STRICT RESTRICTION) ---- */
//     if (name === "creditNoteValue") {
//       if (!selectedInvoice) return;

//       const creditValue = Number(value.replace(/[^0-9.]/g, ""));
//       const invoiceTotal = Number(selectedInvoice.grandTotal || 0);

//       // ⛔ HARD RESTRICTION — NO AUTO ROUNDING
//       if (creditValue > invoiceTotal) {
//         return;
//       }

//       const invoiceCgst = Number(selectedInvoice.totalCgst || 0);
//       const invoiceSgst = Number(selectedInvoice.totalSgst || 0);
//       const invoiceIgst = Number(selectedInvoice.totalIgst || 0);

//       const invoiceTaxTotal = invoiceCgst + invoiceSgst + invoiceIgst;
//       const invoiceBase = invoiceTotal - invoiceTaxTotal;

//       let baseAmount = 0,
//         cgst = 0,
//         sgst = 0,
//         igst = 0;

//       if (creditValue > 0 && invoiceTotal > 0) {
//         baseAmount = (creditValue / invoiceTotal) * invoiceBase;
//         cgst = invoiceBase ? (invoiceCgst / invoiceBase) * baseAmount : 0;
//         sgst = invoiceBase ? (invoiceSgst / invoiceBase) * baseAmount : 0;
//         igst = invoiceBase ? (invoiceIgst / invoiceBase) * baseAmount : 0;
//       }

//       const totalTax = cgst + sgst + igst;

//       setTaxBreakup({
//         cgst: Number(cgst.toFixed(2)),
//         sgst: Number(sgst.toFixed(2)),
//         igst: Number(igst.toFixed(2)),
//       });

//       setFormData((prev) => ({
//         ...prev,
//         creditNoteValue: creditValue,
//         baseAmount: Number(baseAmount.toFixed(2)),
//         taxAmount: Number(totalTax.toFixed(2)),
//         totalAmount: Number(creditValue.toFixed(2)),
//         isExempted: totalTax === 0 && creditValue > 0,
//       }));
//       return;
//     }

//     setFormData({ ...formData, [name]: value });
//   };

//   /* ================= SUBMIT ================= */
//   const handleSubmit = async () => {
//     try {
//       if (!formData.receiptInvoiceNo) return alert("Select Invoice");
//       if (!formData.creditNoteValue) return alert("Enter Credit Note Value");
//       if (formData.creditNoteDate !== today)
//         return alert("Credit Note Date must be today's date");

//       setLoading(true);

//       const payload = {
//         invoiceId: selectedInvoice.invoiceId,
//         invoiceNo: formData.receiptInvoiceNo,
//         creditNoteDate: formData.creditNoteDate,
//         baseAmount: formData.baseAmount,
//         taxAmount: formData.taxAmount,
//         totalAmount: formData.totalAmount,
//         cgst: taxBreakup.cgst,
//         sgst: taxBreakup.sgst,
//         igst: taxBreakup.igst,
//         remark: formData.remark,
//         createdBy: Number(localStorage.getItem(LOGIN_CONSTANT.USER_ID)),
//       };

//       await ApiService.handlePostRequest(
//         API_ENDPOINTS.CREDIT_NOTE_SAVE,
//         payload
//       );

//       alert("Credit Note created successfully");
//       router.back();
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= UI ================= */
//   return (
//     <Layout role="ddo">
//       <div className="space-y-6">
//         <h1 className="text-3xl font-extrabold">Create Credit Note</h1>

//         <div className="premium-card p-6 space-y-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <Select
//               label="Receipt Invoice No"
//               name="receiptInvoiceNo"
//               value={formData.receiptInvoiceNo}
//               update={update}
//               options={invoiceList}
//             />

//             <Input label="Customer Name" value={formData.customerName} disabled />

//             <Input
//               label="Credit Note Date"
//               type="date"
//               name="creditNoteDate"
//               value={formData.creditNoteDate}
//               min={today}
//               max={today}
//               disabled
//             />

//             <Input
//               label="Invoice Total Amount"
//               value={formatCurrency(formData.payableAmount, true)}
//               disabled
//             />

//             <Input
//               label="Credit Note Value"
//               name="creditNoteValue"
//               value={formData.creditNoteValue}
//               update={update}
//               placeholder="Enter credit amount"
//             />

//             <Input label="Base Amount" value={formData.baseAmount} disabled />

//             {(formData.taxAmount > 0 || formData.isExempted) && (
//               <div>
//                 <label className="block text-sm font-semibold mb-2">
//                   Tax Amount
//                 </label>

//                 <input
//                   value={formData.taxAmount}
//                   disabled
//                   className="premium-input w-full px-4 py-3"
//                 />

//                 <div className="mt-1 text-sm text-gray-700 flex gap-4 flex-wrap">
//                   {formData.isExempted ? (
//                     <span>Tax: ₹0 (Exempted)</span>
//                   ) : (
//                     <>
//                       {taxBreakup.cgst > 0 && <span>CGST: ₹{taxBreakup.cgst}</span>}
//                       {taxBreakup.sgst > 0 && <span>SGST: ₹{taxBreakup.sgst}</span>}
//                       {taxBreakup.igst > 0 && <span>IGST: ₹{taxBreakup.igst}</span>}
//                     </>
//                   )}
//                 </div>
//               </div>
//             )}

//             <Input label="Total Amount" value={formData.totalAmount} disabled />
//           </div>

//           <textarea
//             name="remark"
//             value={formData.remark}
//             onChange={update}
//             className="premium-input w-full px-4 py-3"
//             placeholder="Optional remarks"
//           />

//           <div className="flex justify-end">
//             <Button onClick={handleSubmit} disabled={loading}>
//               {loading ? "Saving..." : "Save Credit Note"}
//             </Button>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// }

// /* ================= REUSABLE COMPONENTS ================= */
// const Input = ({
//   label,
//   name,
//   value,
//   update,
//   disabled,
//   placeholder,
//   type = "text",
//   min,
//   max,
// }) => (
//   <div>
//     <label className="block text-sm font-semibold mb-2">{label}</label>
//     <input
//       type={type}
//       name={name}
//       value={value}
//       min={min}
//       max={max}
//       disabled={disabled}
//       placeholder={placeholder}
//       onChange={update}
//       className="premium-input w-full px-4 py-3"
//     />
//   </div>
// );

// const Select = ({ label, name, value, update, options }) => (
//   <div>
//     <label className="block text-sm font-semibold mb-2">{label}</label>
//     <select
//       name={name}
//       value={value}
//       onChange={update}
//       className="premium-input w-full px-4 py-3"
//     >
//       <option value="">Select Invoice</option>
//       {options.map((o) => (
//         <option key={o.invoiceId} value={o.receiptInvoiceNumber}>
//           {o.receiptInvoiceNumber}
//         </option>
//       ))}
//     </select>
//   </div>
// );



// "use client";

// import Layout from "@/components/shared/Layout";
// import ApiService from "@/components/api/api_service";
// import { API_ENDPOINTS } from "@/components/api/api_const";
// import { LOGIN_CONSTANT } from "@/components/utils/constant";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Button from "@/components/shared/Button";
// import { formatCurrency } from "@/lib/gstUtils";

// export default function CreditNoteCreate() {
//   const router = useRouter();
//   const today = new Date().toISOString().split("T")[0];

//   const [invoiceList, setInvoiceList] = useState([]);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const [taxBreakup, setTaxBreakup] = useState({
//     cgst: 0,
//     sgst: 0,
//     igst: 0,
//   });

//   const [formData, setFormData] = useState({
//     receiptInvoiceNo: "",
//     customerName: "",
//     customerGstin: "",
//     serviceType: "",
//     creditNoteDate: today,
//     creditNoteValue: "",
//     baseAmount: 0,
//     taxAmount: 0,
//     totalAmount: 0,
//     payableAmount: 0,
//     remark: "",
//     isExempted: false,
//   });

//   /* ================= FETCH INVOICES ================= */
//   useEffect(() => {
//     fetchInvoices();
//   }, []);

//   const fetchInvoices = async () => {
//     try {
//       const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
//       if (!ddoId) return;

//       const res = await ApiService.handleGetRequest(
//         `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
//       );

//       if (res?.success === "success") {
//         setInvoiceList(res.data || []);
//       }
//     } catch {
//       alert("Failed to fetch invoices");
//     }
//   };

//   /* ================= INPUT HANDLER ================= */
//   const update = (e) => {
//     const { name, value } = e.target;

//     /* ---- Invoice Selection ---- */
//     if (name === "receiptInvoiceNo") {
//       const invoice = invoiceList.find(
//         (i) => i.receiptInvoiceNumber === value
//       );
//       if (!invoice) return;

//       setSelectedInvoice(invoice);
//       setTaxBreakup({ cgst: 0, sgst: 0, igst: 0 });

//       setFormData({
//         receiptInvoiceNo: value,
//         customerName: invoice.customerResponse?.name || "",
//         customerGstin: invoice.customerResponse?.gstin || "NA",
//         serviceType: invoice.serviceType || "FCM",
//         creditNoteDate: today,
//         creditNoteValue: "",
//         baseAmount: 0,
//         taxAmount: 0,
//         totalAmount: 0,
//         payableAmount: invoice.grandTotal,
//         remark: "",
//         isExempted: false,
//       });
//       return;
//     }

//     /* ---- Credit Note Value ---- */
//     if (name === "creditNoteValue") {
//       if (!selectedInvoice) return;

//       const creditValue = Number(value.replace(/[^0-9.]/g, ""));
//       const invoiceTotal = Number(selectedInvoice.grandTotal || 0);

//       if (creditValue > invoiceTotal) return;

//       const invoiceCgst = Number(selectedInvoice.totalCgst || 0);
//       const invoiceSgst = Number(selectedInvoice.totalSgst || 0);
//       const invoiceIgst = Number(selectedInvoice.totalIgst || 0);

//       const invoiceTaxTotal = invoiceCgst + invoiceSgst + invoiceIgst;
//       const invoiceBase = invoiceTotal - invoiceTaxTotal;

//       let baseAmount = 0,
//         cgst = 0,
//         sgst = 0,
//         igst = 0;

//       if (creditValue > 0 && invoiceTotal > 0) {
//         baseAmount = (creditValue / invoiceTotal) * invoiceBase;
//         cgst = invoiceBase ? (invoiceCgst / invoiceBase) * baseAmount : 0;
//         sgst = invoiceBase ? (invoiceSgst / invoiceBase) * baseAmount : 0;
//         igst = invoiceBase ? (invoiceIgst / invoiceBase) * baseAmount : 0;
//       }

//       /* ===== ROUND OFF ===== */
//       const roundedBase = Math.round(baseAmount);
//       const roundedCgst = Math.round(cgst);
//       const roundedSgst = Math.round(sgst);
//       const roundedIgst = Math.round(igst);
//       const roundedTax = roundedCgst + roundedSgst + roundedIgst;

//       setTaxBreakup({
//         cgst: roundedCgst,
//         sgst: roundedSgst,
//         igst: roundedIgst,
//       });

//       setFormData((prev) => ({
//         ...prev,
//         creditNoteValue: creditValue,
//         baseAmount: roundedBase,
//         taxAmount: roundedTax,
//         totalAmount: creditValue,
//         isExempted: roundedTax === 0 && creditValue > 0,
//       }));
//       return;
//     }

//     setFormData({ ...formData, [name]: value });
//   };

//   /* ================= SUBMIT ================= */
//   const handleSubmit = async () => {
//     try {
//       if (!formData.receiptInvoiceNo) return alert("Select Invoice");
//       if (!formData.creditNoteValue) return alert("Enter Credit Note Value");
//       if (formData.creditNoteDate !== today)
//         return alert("Credit Note Date must be today's date");

//       setLoading(true);

//       const payload = {
//         invoiceId: selectedInvoice.invoiceId,
//         invoiceNo: formData.receiptInvoiceNo,
//         creditNoteDate: formData.creditNoteDate,
//         baseAmount: formData.baseAmount,
//         taxAmount: formData.taxAmount,
//         totalAmount: formData.totalAmount,
//         cgst: taxBreakup.cgst,
//         sgst: taxBreakup.sgst,
//         igst: taxBreakup.igst,
//         remark: formData.remark,
//         createdBy: Number(localStorage.getItem(LOGIN_CONSTANT.USER_ID)),
//       };

//       await ApiService.handlePostRequest(
//         API_ENDPOINTS.CREDIT_NOTE_SAVE,
//         payload
//       );

//       alert("Credit Note created successfully");
//       router.back();
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= UI ================= */
//   return (
//     <Layout role="ddo">
//       <div className="space-y-6">

//         {/* HEADER WITH DATE */}
//         <div className="flex justify-between items-center">
//           <h1 className="text-3xl font-extrabold">Create Credit Note</h1>
//           <span className="text-sm font-semibold text-gray-600">
//             Date: {today}
//           </span>
//         </div>

//         <div className="premium-card p-6 space-y-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <Select
//               label="Receipt Invoice No"
//               name="receiptInvoiceNo"
//               value={formData.receiptInvoiceNo}
//               update={update}
//               options={invoiceList}
//             />

//             <Input label="Customer Name" value={formData.customerName} disabled />

//             <Input label="Customer GSTIN" value={formData.customerGstin} disabled />

//             <Input label="Service Type" value={formData.serviceType} disabled />

//             <Input
//               label="Credit Note Date"
//               type="date"
//               value={formData.creditNoteDate}
//               disabled
//             />

//             <Input
//               label="Invoice Total Amount"
//               value={formatCurrency(formData.payableAmount, true)}
//               disabled
//             />

//             <Input
//               label="Credit Note Value"
//               name="creditNoteValue"
//               value={formData.creditNoteValue}
//               update={update}
//               placeholder="Enter credit amount"
//             />

//             <Input label="Base Amount" value={formData.baseAmount} disabled />

//             {(formData.taxAmount > 0 || formData.isExempted) && (
//               <div>
//                 <label className="block text-sm font-semibold mb-2">
//                   Tax Amount
//                 </label>

//                 <input
//                   value={formData.taxAmount}
//                   disabled
//                   className="premium-input w-full px-4 py-3"
//                 />

//                 <div className="mt-1 text-sm text-gray-700 flex gap-4 flex-wrap">
//                   {formData.isExempted ? (
//                     <span>Tax: ₹0 (Exempted)</span>
//                   ) : (
//                     <>
//                       {taxBreakup.cgst > 0 && <span>CGST: ₹{taxBreakup.cgst}</span>}
//                       {taxBreakup.sgst > 0 && <span>SGST: ₹{taxBreakup.sgst}</span>}
//                       {taxBreakup.igst > 0 && <span>IGST: ₹{taxBreakup.igst}</span>}
//                     </>
//                   )}
//                 </div>
//               </div>
//             )}

//             <Input label="Total Amount" value={formData.totalAmount} disabled />
//           </div>

//           <textarea
//             name="remark"
//             value={formData.remark}
//             onChange={update}
//             className="premium-input w-full px-4 py-3"
//             placeholder="Optional remarks"
//           />

//           <div className="flex justify-end">
//             <Button onClick={handleSubmit} disabled={loading}>
//               {loading ? "Saving..." : "Save Credit Note"}
//             </Button>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// }

// /* ================= REUSABLE COMPONENTS ================= */
// const Input = ({
//   label,
//   name,
//   value,
//   update,
//   disabled,
//   placeholder,
//   type = "text",
// }) => (
//   <div>
//     <label className="block text-sm font-semibold mb-2">{label}</label>
//     <input
//       type={type}
//       name={name}
//       value={value}
//       disabled={disabled}
//       placeholder={placeholder}
//       onChange={update}
//       className="premium-input w-full px-4 py-3"
//     />
//   </div>
// );

// const Select = ({ label, name, value, update, options }) => (
//   <div>
//     <label className="block text-sm font-semibold mb-2">{label}</label>
//     <select
//       name={name}
//       value={value}
//       onChange={update}
//       className="premium-input w-full px-4 py-3"
//     >
//       <option value="">Select Invoice</option>
//       {options.map((o) => (
//         <option key={o.invoiceId} value={o.receiptInvoiceNumber}>
//           {o.receiptInvoiceNumber}
//         </option>
//       ))}
//     </select>
//   </div>
// );


// "use client";

// import Layout from "@/components/shared/Layout";
// import ApiService from "@/components/api/api_service";
// import { API_ENDPOINTS } from "@/components/api/api_const";
// import { LOGIN_CONSTANT } from "@/components/utils/constant";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Button from "@/components/shared/Button";
// import { formatCurrency } from "@/lib/gstUtils";

// export default function CreditNoteCreate() {
//   const router = useRouter();
//   const today = new Date().toISOString().split("T")[0];

//   const [invoiceList, setInvoiceList] = useState([]);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const [taxBreakup, setTaxBreakup] = useState({
//     cgst: 0,
//     sgst: 0,
//     igst: 0,
//   });

//   const [formData, setFormData] = useState({
//     receiptInvoiceNo: "",
//     customerName: "",
//     customerGstin: "",
//     serviceType: "",
//     creditNoteDate: today,
//     creditNoteValue: "",
//     baseAmount: 0,
//     taxAmount: 0,
//     totalAmount: 0,
//     payableAmount: 0,
//     remark: "",
//     isExempted: false,
//   });

//   /* ================= FETCH INVOICES ================= */
//   useEffect(() => {
//     fetchInvoices();
//   }, []);

//   const fetchInvoices = async () => {
//     try {
//       const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
//       if (!ddoId) return;

//       const res = await ApiService.handleGetRequest(
//         `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
//       );

//       if (res?.success === "success") {
//         setInvoiceList(res.data || []);
//       }
//     } catch {
//       alert("Failed to fetch invoices");
//     }
//   };

//   /* ================= INPUT HANDLER ================= */
//   const update = (e) => {
//     const { name, value } = e.target;

//     /* ---- Invoice Selection ---- */
//     if (name === "receiptInvoiceNo") {
//       const invoice = invoiceList.find(
//         (i) => i.receiptInvoiceNumber === value
//       );
//       if (!invoice) return;

//       setSelectedInvoice(invoice);
//       setTaxBreakup({ cgst: 0, sgst: 0, igst: 0 });

//       setFormData({
//         receiptInvoiceNo: value,
//         customerName: invoice.customerResponse?.name || "",
//         customerGstin: invoice.customerResponse?.gstNumber || "NA",
//         serviceType:
//           invoice.customerResponse?.type === "Exempted" ? "RCM" : "FCM",
//         creditNoteDate: today,
//         creditNoteValue: "",
//         baseAmount: 0,
//         taxAmount: 0,
//         totalAmount: 0,
//         payableAmount: invoice.grandTotal,
//         remark: "",
//         isExempted: false,
//       });
//       return;
//     }

//     /* ---- Credit Note Value ---- */
//     if (name === "creditNoteValue") {
//       if (!selectedInvoice) return;

//       const creditValue = Number(value.replace(/[^0-9.]/g, ""));
//       const invoiceTotal = Number(selectedInvoice.grandTotal || 0);

//       if (creditValue > invoiceTotal) return;

//       const invoiceCgst = Number(selectedInvoice.totalCgst || 0);
//       const invoiceSgst = Number(selectedInvoice.totalSgst || 0);
//       const invoiceIgst = Number(selectedInvoice.totalIgst || 0);

//       const invoiceTaxTotal = invoiceCgst + invoiceSgst + invoiceIgst;
//       const invoiceBase = invoiceTotal - invoiceTaxTotal;

//       let baseAmount = 0,
//         cgst = 0,
//         sgst = 0,
//         igst = 0;

//       if (creditValue > 0 && invoiceTotal > 0) {
//         baseAmount = (creditValue / invoiceTotal) * invoiceBase;
//         cgst = invoiceBase ? (invoiceCgst / invoiceBase) * baseAmount : 0;
//         sgst = invoiceBase ? (invoiceSgst / invoiceBase) * baseAmount : 0;
//         igst = invoiceBase ? (invoiceIgst / invoiceBase) * baseAmount : 0;
//       }

//       /* ===== ROUND OFF ===== */
//       const roundedBase = Math.round(baseAmount);
//       const roundedCgst = Math.round(cgst);
//       const roundedSgst = Math.round(sgst);
//       const roundedIgst = Math.round(igst);
//       const roundedTax = roundedCgst + roundedSgst + roundedIgst;

//       setTaxBreakup({
//         cgst: roundedCgst,
//         sgst: roundedSgst,
//         igst: roundedIgst,
//       });

//       setFormData((prev) => ({
//         ...prev,
//         creditNoteValue: creditValue,
//         baseAmount: roundedBase,
//         taxAmount: roundedTax,
//         totalAmount: creditValue,
//         isExempted: roundedTax === 0 && creditValue > 0,
//       }));
//       return;
//     }

//     setFormData({ ...formData, [name]: value });
//   };

//   /* ================= SUBMIT ================= */
//   const handleSubmit = async () => {
//     try {
//       if (!formData.receiptInvoiceNo) return alert("Select Invoice");
//       if (!formData.creditNoteValue) return alert("Enter Credit Note Value");
//       if (formData.creditNoteDate !== today)
//         return alert("Credit Note Date must be today's date");

//       setLoading(true);

//       const payload = {
//         invoiceId: selectedInvoice.invoiceId,
//         invoiceNo: formData.receiptInvoiceNo,
//         creditNoteDate: formData.creditNoteDate,
//         baseAmount: formData.baseAmount,
//         taxAmount: formData.taxAmount,
//         totalAmount: formData.totalAmount,
//         cgst: taxBreakup.cgst,
//         sgst: taxBreakup.sgst,
//         igst: taxBreakup.igst,
//         remark: formData.remark,
//         createdBy: Number(localStorage.getItem(LOGIN_CONSTANT.USER_ID)),
//       };

//       await ApiService.handlePostRequest(
//         API_ENDPOINTS.CREDIT_NOTE_SAVE,
//         payload
//       );

//       alert("Credit Note created successfully");
//       router.back();
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= UI ================= */
//   return (
//     <Layout role="ddo">
//       <div className="space-y-6">

//         {/* HEADER WITH DATE */}
//         <div className="flex justify-between items-center">
//           <h1 className="text-3xl font-extrabold">Create Credit Note</h1>
//           <span className="text-sm font-semibold text-gray-600">
//             Date: {today}
//           </span>
//         </div>

//         <div className="premium-card p-6 space-y-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <Select
//               label="Receipt Invoice No"
//               name="receiptInvoiceNo"
//               value={formData.receiptInvoiceNo}
//               update={update}
//               options={invoiceList}
//             />

//             <Input label="Customer Name" value={formData.customerName} disabled />

//             <Input label="Customer GSTIN" value={formData.customerGstin} disabled />

//             <Input label="Service Type" value={formData.serviceType} disabled />

//             <Input
//               label="Credit Note Date"
//               type="date"
//               value={formData.creditNoteDate}
//               disabled
//             />

//             <Input
//               label="Invoice Total Amount"
//               value={formatCurrency(formData.payableAmount, true)}
//               disabled
//             />

//             <Input
//               label="Credit Note Value"
//               name="creditNoteValue"
//               value={formData.creditNoteValue}
//               update={update}
//               placeholder="Enter credit amount"
//             />

//             <Input label="Base Amount" value={formData.baseAmount} disabled />

//             {(formData.taxAmount > 0 || formData.isExempted) && (
//               <div>
//                 <label className="block text-sm font-semibold mb-2">
//                   Tax Amount
//                 </label>

//                 <input
//                   value={formData.taxAmount}
//                   disabled
//                   className="premium-input w-full px-4 py-3"
//                 />

//                 <div className="mt-1 text-sm text-gray-700 flex gap-4 flex-wrap">
//                   {formData.isExempted ? (
//                     <span>Tax: ₹0 (Exempted)</span>
//                   ) : (
//                     <>
//                       {taxBreakup.cgst > 0 && <span>CGST: ₹{taxBreakup.cgst}</span>}
//                       {taxBreakup.sgst > 0 && <span>SGST: ₹{taxBreakup.sgst}</span>}
//                       {taxBreakup.igst > 0 && <span>IGST: ₹{taxBreakup.igst}</span>}
//                     </>
//                   )}
//                 </div>
//               </div>
//             )}

//             <Input label="Total Amount" value={formData.totalAmount} disabled />
//           </div>

//           <textarea
//             name="remark"
//             value={formData.remark}
//             onChange={update}
//             className="premium-input w-full px-4 py-3"
//             placeholder="Optional remarks"
//           />

//           <div className="flex justify-end">
//             <Button onClick={handleSubmit} disabled={loading}>
//               {loading ? "Saving..." : "Save Credit Note"}
//             </Button>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// }

// /* ================= REUSABLE COMPONENTS ================= */
// const Input = ({
//   label,
//   name,
//   value,
//   update,
//   disabled,
//   placeholder,
//   type = "text",
// }) => (
//   <div>
//     <label className="block text-sm font-semibold mb-2">{label}</label>
//     <input
//       type={type}
//       name={name}
//       value={value}
//       disabled={disabled}
//       placeholder={placeholder}
//       onChange={update}
//       className="premium-input w-full px-4 py-3"
//     />
//   </div>
// );

// const Select = ({ label, name, value, update, options }) => (
//   <div>
//     <label className="block text-sm font-semibold mb-2">{label}</label>
//     <select
//       name={name}
//       value={value}
//       onChange={update}
//       className="premium-input w-full px-4 py-3"
//     >
//       <option value="">Select Invoice</option>
//       {options.map((o) => (
//         <option key={o.invoiceId} value={o.receiptInvoiceNumber}>
//           {o.receiptInvoiceNumber}
//         </option>
//       ))}
//     </select>
//   </div>
// );


"use client";

import Layout from "@/components/shared/Layout";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { formatCurrency } from "@/lib/gstUtils";

export default function CreditNoteCreate() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [invoiceList, setInvoiceList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  const [taxBreakup, setTaxBreakup] = useState({
    cgst: 0,
    sgst: 0,
    igst: 0,
  });

  const [formData, setFormData] = useState({
    receiptInvoiceNo: "",
    customerName: "",
    customerGstin: "",
    serviceType: "",
    creditNoteDate: today,
    creditNoteValue: "",
    baseAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    payableAmount: 0,
    remark: "",
    isExempted: false,
  });

  /* ================= FETCH INVOICES ================= */
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) return;

      const res = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
      );

      if (res?.success === "success") {
        setInvoiceList(res.data || []);
      }
    } catch {
      alert("Failed to fetch invoices");
    }
  };

  /* ================= INPUT HANDLER ================= */
  const update = (e) => {
    const { name, value } = e.target;

    /* ---- Invoice Selection ---- */
    if (name === "receiptInvoiceNo") {
      const invoice = invoiceList.find(
        (i) => i.receiptInvoiceNumber === value
      );
      if (!invoice) return;

      setSelectedInvoice(invoice);
      setTaxBreakup({ cgst: 0, sgst: 0, igst: 0 });

      setFormData({
        receiptInvoiceNo: value,
        customerName: invoice.customerResponse?.name || "",
        customerGstin: invoice.customerResponse?.gstNumber || "NA",
        serviceType: invoice.customerResponse?.type || "FCM", // direct type
        creditNoteDate: today,
        creditNoteValue: "",
        baseAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        payableAmount: invoice.grandTotal,
        remark: "",
        isExempted: invoice.customerResponse?.type === "Exempted",
      });
      return;
    }

    /* ---- Credit Note Value ---- */
    if (name === "creditNoteValue") {
      if (!selectedInvoice) return;

      const creditValue = Number(value.replace(/[^0-9.]/g, ""));
      const invoiceTotal = Number(selectedInvoice.grandTotal || 0);

      if (creditValue > invoiceTotal) return;

      const invoiceCgst = Number(selectedInvoice.totalCgst || 0);
      const invoiceSgst = Number(selectedInvoice.totalSgst || 0);
      const invoiceIgst = Number(selectedInvoice.totalIgst || 0);

      const invoiceTaxTotal = invoiceCgst + invoiceSgst + invoiceIgst;
      const invoiceBase = invoiceTotal - invoiceTaxTotal;

      let baseAmount = 0,
        cgst = 0,
        sgst = 0,
        igst = 0;

      if (creditValue > 0 && invoiceTotal > 0) {
        baseAmount = (creditValue / invoiceTotal) * invoiceBase;
        cgst = invoiceBase ? (invoiceCgst / invoiceBase) * baseAmount : 0;
        sgst = invoiceBase ? (invoiceSgst / invoiceBase) * baseAmount : 0;
        igst = invoiceBase ? (invoiceIgst / invoiceBase) * baseAmount : 0;
      }

      /* ===== ROUND OFF ===== */
      const roundedBase = Math.round(baseAmount);
      const roundedCgst = Math.round(cgst);
      const roundedSgst = Math.round(sgst);
      const roundedIgst = Math.round(igst);
      const roundedTax = roundedCgst + roundedSgst + roundedIgst;

      setTaxBreakup({
        cgst: roundedCgst,
        sgst: roundedSgst,
        igst: roundedIgst,
      });

      setFormData((prev) => ({
        ...prev,
        creditNoteValue: creditValue,
        baseAmount: roundedBase,
        taxAmount: roundedTax,
        totalAmount: creditValue,
        isExempted: roundedTax === 0 && creditValue > 0,
      }));
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
      if (!formData.receiptInvoiceNo) return alert("Select Invoice");
      if (!formData.creditNoteValue) return alert("Enter Credit Note Value");

      setLoading(true);

      const payload = {
        invoiceId: selectedInvoice.invoiceId,
        invoiceNo: formData.receiptInvoiceNo,
        creditNoteDate: formData.creditNoteDate,
        baseAmount: formData.baseAmount,
        taxAmount: formData.taxAmount,
        totalAmount: formData.totalAmount,
        cgst: taxBreakup.cgst,
        sgst: taxBreakup.sgst,
        igst: taxBreakup.igst,
        remark: formData.remark,
        createdBy: Number(localStorage.getItem(LOGIN_CONSTANT.USER_ID)),
      };

      await ApiService.handlePostRequest(
        API_ENDPOINTS.CREDIT_NOTE_SAVE,
        payload
      );

      alert("Credit Note created successfully");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Layout role="ddo">
      <div className="space-y-6">

        {/* HEADER WITH DATE */}
        {/* <div className="flex justify-between items-center">
          
          <h1 className="text-3xl font-extrabold">Create Credit Note</h1>
          <span className="text-sm font-semibold text-gray-600">
            Date: {today}
          </span>
        </div> */}

        <div className="flex flex-col space-y-2">
          {/* Back Button */}
          <Button
  variant="outline"
  onClick={() => router.back()}
 className="w-40" 
>
  ← Back to List
</Button>

          {/* Header and Date */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold">Create Credit Note</h1>
            <span className="text-sm font-semibold text-gray-600">
              Date: {today}
            </span>
          </div>
        </div>


        <div className="premium-card p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Select
              label="Receipt Invoice No"
              name="receiptInvoiceNo"
              value={formData.receiptInvoiceNo}
              update={update}
              options={invoiceList}
            />

            <Input label="Customer Name" value={formData.customerName} disabled />

            <Input label="Customer GSTIN" value={formData.customerGstin} disabled />

            <Input label="Service Type" value={formData.serviceType} disabled />

            {/* Removed Credit Note Date input */}

            <Input
              label="Invoice Total Amount"
              value={formatCurrency(formData.payableAmount, true)}
              disabled
            />

            <Input
              label="Credit Note Value"
              name="creditNoteValue"
              value={formData.creditNoteValue}
              update={update}
              placeholder="Enter credit amount"
            />

            <Input label="Base Amount" value={formData.baseAmount} disabled />

            {(formData.taxAmount > 0 || formData.isExempted) && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Tax Amount
                </label>

                <input
                  value={formData.taxAmount}
                  disabled
                  className="premium-input w-full px-4 py-3"
                />

                <div className="mt-1 text-sm text-gray-700 flex gap-4 flex-wrap">
                  {formData.isExempted ? (
                    <span>Tax: ₹0 (Exempted)</span>
                  ) : (
                    <>
                      {taxBreakup.cgst > 0 && <span>CGST: ₹{taxBreakup.cgst}</span>}
                      {taxBreakup.sgst > 0 && <span>SGST: ₹{taxBreakup.sgst}</span>}
                      {taxBreakup.igst > 0 && <span>IGST: ₹{taxBreakup.igst}</span>}
                    </>
                  )}
                </div>
              </div>
            )}

            <Input label="Total Amount" value={formData.totalAmount} disabled />
          </div>

          <textarea
            name="remark"
            value={formData.remark}
            onChange={update}
            className="premium-input w-full px-4 py-3"
            placeholder="Optional remarks"
          />

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Credit Note"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ================= REUSABLE COMPONENTS ================= */
const Input = ({
  label,
  name,
  value,
  update,
  disabled,
  placeholder,
  type = "text",
}) => (
  <div>
    <label className="block text-sm font-semibold mb-2">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={update}
      className="premium-input w-full px-4 py-3"
    />
  </div>
);

const Select = ({ label, name, value, update, options }) => (
  <div>
    <label className="block text-sm font-semibold mb-2">{label}</label>
    <select
      name={name}
      value={value}
      onChange={update}
      className="premium-input w-full px-4 py-3"
    >
      <option value="">Select Invoice</option>
      {options.map((o) => (
        <option key={o.invoiceId} value={o.receiptInvoiceNumber}>
          {o.receiptInvoiceNumber}
        </option>
      ))}
    </select>
  </div>
);
