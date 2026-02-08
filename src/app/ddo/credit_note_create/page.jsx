
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
  const [creditError, setCreditError] = useState("");

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
    fromDate: "",
    toDate: "",
  });

  /* ================= FETCH INVOICES ================= */
  useEffect(() => {
    fetchInvoices();
  }, [formData.fromDate, formData.toDate]);

  const fetchInvoices = async () => {
    try {
      const ddoId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
      if (!ddoId) return;

      const res = await ApiService.handleGetRequest(
        `${API_ENDPOINTS.INVOICE_LIST}${ddoId}&status=SUBMITTED`
      );

      if (res?.success === "success") {
        const usedInvoices = JSON.parse(
          localStorage.getItem("USED_CREDIT_NOTE_INVOICES") || "[]"
        );

        let filteredInvoices = (res.data || []).filter(
          (inv) => !usedInvoices.includes(inv.receiptInvoiceNumber)
        );

        const { fromDate, toDate } = formData;

        if (fromDate) {
          filteredInvoices = filteredInvoices.filter(
            (inv) => inv.invoiceDate >= fromDate
          );
        }

        if (toDate) {
          filteredInvoices = filteredInvoices.filter(
            (inv) => inv.invoiceDate <= toDate
          );
        }

        setInvoiceList(filteredInvoices);
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

      const serviceType = invoice.customerResponse?.type || "";
      const isExemptedService = serviceType === "Exempted";

      setSelectedInvoice(invoice);
      setTaxBreakup({ cgst: 0, sgst: 0, igst: 0 });
      setCreditError("");

      setFormData({
        ...formData,
        receiptInvoiceNo: value,
        customerName: invoice.customerResponse?.name || "",
        customerGstin: invoice.customerResponse?.gstNumber || "",
        serviceType: serviceType,
        creditNoteDate: today,
        creditNoteValue: "",
        baseAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        payableAmount: invoice.grandTotal,
        remark: "",
        isExempted: isExemptedService,
      });
      return;
    }

    /* ---- Credit Note Value ---- */
    if (name === "creditNoteValue") {
      if (!selectedInvoice) return;

      if (value === "") {
        setFormData((prev) => ({
          ...prev,
          creditNoteValue: "",
          baseAmount: 0,
          taxAmount: 0,
          totalAmount: 0,
        }));
        setTaxBreakup({ cgst: 0, sgst: 0, igst: 0 });
        setCreditError("");
        return;
      }

      if (!/^\d*\.?\d*$/.test(value)) return;

      const creditValue = Number(value);
      const invoiceTotal = Number(selectedInvoice.grandTotal || 0);

      if (creditValue > invoiceTotal) {
        setCreditError(
          `Credit Note value cannot exceed Invoice Total (₹${invoiceTotal})`
        );
        return;
      }

      setCreditError("");

      const serviceType = selectedInvoice.customerResponse?.type || "";
      let baseAmount = 0;
      let taxAmount = 0;
      let cgst = 0,
        sgst = 0,
        igst = 0;

      // ===== Only FCM has tax =====
      if (serviceType === "FCM") {
        const GST_RATE = 18;
        const invoiceIgst = Number(selectedInvoice.totalIgst || 0);

        baseAmount = Math.round(creditValue / (1 + GST_RATE / 100));
        taxAmount = Math.round(creditValue - baseAmount);

        if (invoiceIgst > 0) {
          igst = taxAmount;
        } else {
          cgst = Number((taxAmount / 2).toFixed(2));
          sgst = Number((taxAmount / 2).toFixed(2));
        }
      } else {
        // RCM or Exempted: credit amount = base amount, tax = 0
        baseAmount = Math.round(creditValue);
        taxAmount = 0;
      }

      setTaxBreakup({ cgst, sgst, igst });

      setFormData((prev) => ({
        ...prev,
        creditNoteValue: value,
        baseAmount,
        taxAmount,
        totalAmount: creditValue,
        isExempted: serviceType === "Exempted",
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
        creditNoteAmount: Number(formData.creditNoteValue),
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

  const getTaxPercent = (tax) => {
    if (!formData.baseAmount || tax === 0) return 0;
    return Math.round((tax / formData.baseAmount) * 100);
  };

  /* ================= UI ================= */
  return (
    <Layout role="ddo">
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="w-40">
          ← Back to List
        </Button>

        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-extrabold">Create Credit Note</h1>

          {/* ===== Date Filters ===== */}
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">From</label>
              <input
                type="date"
                value={formData.fromDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fromDate: e.target.value }))
                }
                className="premium-input px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">To</label>
              <input
                type="date"
                value={formData.toDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, toDate: e.target.value }))
                }
                className="premium-input px-2 py-1"
              />
            </div>
          </div>
        </div>

        <div className="premium-card p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Select
              label="Invoice No"
              name="receiptInvoiceNo"
              value={formData.receiptInvoiceNo}
              update={update}
              options={invoiceList}
            />

            <Input label="Customer Name" value={formData.customerName} disabled />
            <Input label="Customer GSTIN" value={formData.customerGstin} disabled />
            <Input label="Service Type" value={formData.serviceType} disabled />

            <Input
              label="Invoice Total Amount"
              value={formatCurrency(formData.payableAmount, true)}
              disabled
            />

            <div>
              <Input
                label="Credit Note Value"
                name="creditNoteValue"
                value={formData.creditNoteValue}
                update={update}
                placeholder="Enter credit amount"
              />
              {creditError && (
                <p className="mt-1 text-sm text-red-600 font-medium">{creditError}</p>
              )}
            </div>

            <Input label="Base Amount" value={formData.baseAmount} disabled />

            {/* ==== TAX AMOUNT SECTION ==== */}
            <div>
              <label className="block text-sm font-semibold mb-2">Tax Amount</label>
              <input
                value={formData.taxAmount}
                disabled
                className="premium-input w-full px-4 py-3"
              />
              <div className="mt-1 text-sm text-gray-700 flex gap-4 flex-wrap">
                {formData.isExempted ? (
                  <span>Tax: ₹0 (Exempted)</span>
                ) : selectedInvoice?.customerResponse?.type === "RCM" ? (
                  <span>Tax: ₹0 (RCM)</span>
                ) : (
                  <>
                    {taxBreakup.cgst > 0 && (
                      <span>
                        CGST: ₹{taxBreakup.cgst} ({getTaxPercent(taxBreakup.cgst)}%)
                      </span>
                    )}
                    {taxBreakup.sgst > 0 && (
                      <span>
                        SGST: ₹{taxBreakup.sgst} ({getTaxPercent(taxBreakup.sgst)}%)
                      </span>
                    )}
                    {taxBreakup.igst > 0 && (
                      <span>
                        IGST: ₹{taxBreakup.igst} ({getTaxPercent(taxBreakup.igst)}%)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

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
const Input = ({ label, name, value, update, disabled, placeholder, type = "text" }) => (
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
