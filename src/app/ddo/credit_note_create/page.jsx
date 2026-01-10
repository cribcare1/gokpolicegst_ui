
"use client";

import Layout from "@/components/shared/Layout";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";

export default function CreditNoteCreate() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [invoiceList, setInvoiceList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // store selected invoice

  const [formData, setFormData] = useState({
    receiptInvoiceNo: "",  // show in dropdown
    invoiceTotal: 0,       // grand total from API
    creditNoteValue: "",
    baseAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    remark: "",
  });

  /* -----------------------------
     FETCH INVOICE LIST
  ----------------------------- */
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) return;

      const response = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
      );

      if (response?.success === "success") {
        setInvoiceList(response.data || []);
      }
    } catch (err) {
      console.error("Invoice fetch error", err);
      toast.show("Failed to fetch invoices", "error");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     UPDATE HANDLER
  ----------------------------- */
  const update = (e) => {
    const { name, value } = e.target;

    // Receipt selection
    if (name === "receiptInvoiceNo") {
      const invoice = invoiceList.find(
        (i) => i.receiptInvoiceNumber === value
      );
      if (!invoice) return;

      setSelectedInvoice(invoice);

      // reset CNV and calculated fields when selection changes
      setFormData({
        receiptInvoiceNo: value,
        invoiceTotal: invoice.grandTotal,
        creditNoteValue: "",
        baseAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        remark: "",
      });
      return;
    }

    // Credit Note Value input
    if (name === "creditNoteValue") {
      const creditValue = value.replace(/[^0-9.]/g, ""); // only numbers & dot
      if (!selectedInvoice) return;

      const totalPayable = Number(selectedInvoice.grandTotal || 0);
      let baseAmount = 0,
        taxAmount = 0,
        totalAmount = Number(creditValue || 0);

      if (creditValue && totalPayable) {
        // Assuming invoice tax rate = total - base (if available) or 18% as example
        const taxRate = selectedInvoice.taxRate || 0.18; // adjust according to your API
        baseAmount = Number(creditValue) / (1 + taxRate);
        taxAmount = Number(creditValue) - baseAmount;
        totalAmount = Number(creditValue);
      }

      setFormData((prev) => ({
        ...prev,
        creditNoteValue: creditValue,
        baseAmount: Number(baseAmount.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
      }));
      return;
    }

    // other inputs (like remarks)
    setFormData({ ...formData, [name]: value });
  };

  /* -----------------------------
     TOAST
  ----------------------------- */
  const toast = {
    show: (message, type = "success") => {
      const id = Date.now();
      setToasts((p) => [...p, { id, message, type }]);
      setTimeout(() => {
        setToasts((p) => p.filter((x) => x.id !== id));
      }, 5000);
    },
  };

  /* -----------------------------
     SUBMIT
  ----------------------------- */
  const handleSubmit = async () => {
    try {
      const f = formData;

      if (!f.receiptInvoiceNo) return toast.show("Select Receipt No", "error");
      if (!f.creditNoteValue) return toast.show("Enter Credit Note Value", "error");
      if (Number(f.creditNoteValue) > Number(f.invoiceTotal))
        return toast.show("Credit Note Value cannot exceed Total Payable Amount", "error");

      setLoading(true);

      const payload = {
         invoiceId: selectedInvoice.invoiceId,
        invoiceNo: f.receiptInvoiceNo,
        creditNoteDate: new Date().toISOString().split("T")[0],
        baseAmount: f.baseAmount,
        taxAmount: f.taxAmount,
        totalAmount: f.totalAmount,
        remark: f.remark ?? "",
        createdBy: Number(localStorage.getItem(LOGIN_CONSTANT.USER_ID)),
      };

      const data = await ApiService.handlePostRequest(API_ENDPOINTS.CREDIT_NOTE_SAVE, payload);

      if (!data || data.status !== LOGIN_CONSTANT.success) {
        throw new Error(data?.message || "Failed to save credit note");
      }

      toast.show(`Credit Note ${data.creditNoteNo ?? ""} created successfully`, "success");
      router.back();
    } catch (err) {
      toast.show(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="ddo">
      {/* TOAST */}
      <div className="fixed top-4 right-4 z-[9999]">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold gradient-text">Create Credit Note</h1>
          <Button variant="outline" onClick={() => router.back()}>
            ← Back to List
          </Button>
        </div>

        <div className="premium-card p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Select
              label="Receipt Invoice No"
              name="receiptInvoiceNo"
              value={formData.receiptInvoiceNo}
              update={update}
              options={invoiceList}
            />
            <Input
              label="Credit Note Value"
              name="creditNoteValue"
              value={formData.creditNoteValue}
              update={update}
              placeholder="0"
            />
            <Input label="Base Amount" value={formData.baseAmount} disabled />
            <Input label="Tax Amount" value={formData.taxAmount} disabled />
            <Input label="Total Amount" value={formData.totalAmount} disabled />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Remarks</label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={update}
              className="premium-input w-full px-4 py-3"
              placeholder="Optional remarks"
            />
          </div>

          <div className="flex justify-end">
            <Button variant="primary" disabled={loading} onClick={handleSubmit}>
              {loading ? "Saving..." : "Save Credit Note"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* -----------------------------
   TOAST
----------------------------- */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, []);

  const bg =
    type === "success"
      ? "bg-green-50 border-green-500 text-green-700"
      : "bg-red-50 border-red-500 text-red-700";

  return (
    <div className={`border-l-4 px-4 py-3 rounded-md shadow-lg mb-3 ${bg}`}>
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
};

/* -----------------------------
   INPUT
----------------------------- */
const Input = ({ label, name, value, update, disabled, placeholder }) => (
  <div>
    <label className="block text-sm font-semibold mb-2">{label}</label>
    <input
      name={name}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={update}
      className="premium-input w-full px-4 py-3"
    />
  </div>
);

/* -----------------------------
   SELECT
----------------------------- */
const Select = ({ label, name, value, update, options }) => (
  <div>
    <label className="block text-sm font-semibold mb-2">{label}</label>
    <select name={name} value={value} onChange={update} className="premium-input w-full px-4 py-3">
      <option value="">Select Receipt Invoice</option>
      {options.map((o) => (
        <option key={o.invoiceId} value={o.receiptInvoiceNumber}>
          {o.receiptInvoiceNumber}
        </option>
      ))}
    </select>
  </div>
);
