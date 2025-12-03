"use client";
import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Button from "@/components/shared/Button";
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { Building2, Hash, IndianRupee } from "lucide-react";
import { LOGIN_CONSTANT } from "@/components/utils/constant";

export default function TDSQuarterlyCreate() {
  const [toasts, setToasts] = useState([]);

  const toast = {
    show: (message, type = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
  };

  //  DDO Info from localStorage
  const [ddoInfo, setDdoInfo] = useState({
    ddoCode: "",
    officeName: "",
    gstin: "",
  });

  useEffect(() => {
    const storedProfile = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);

      setDdoInfo({
        ddoCode: profile.ddoCode || "",
        officeName: profile.address || "",
        gstin: profile.gstNumber || profile.gstId || "",
      });
    }
  }, []);

  const returnTypes = ["24Q", "26Q", "27EQ", "27Q"];
  const quarterList = ["Q1", "Q2", "Q3", "Q4"];

  const [formData, setFormData] = useState({
    fy: "",
    returnType: "",
    quarter: "",
    filingDate: "",
    receiptNo: "",
    deducteeCount: "",
    challanAmount: "",
    taxDeducted: "",
    revision: "",
    ackFile: null,
  });

  //  Update Handler
  const update = (e) => {
    const { name, value } = e.target;

    if (["deducteeCount", "challanAmount", "taxDeducted"].includes(name)) {
      return setFormData({ ...formData, [name]: value.replace(/[^0-9]/g, "") });
    }

    if (name === "receiptNo") {
      let cleaned = value.replace(/[^0-9]/g, "");
      if (cleaned.length > 15) cleaned = cleaned.slice(0, 15);
      return setFormData({ ...formData, receiptNo: cleaned });
    }

    setFormData({ ...formData, [name]: value });
  };

  //  File Upload Handler
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    if (f.type !== "application/pdf") {
      toast.show("Only PDF allowed", "error");
      return;
    }

    setFormData({ ...formData, ackFile: f });
  };

  //  Submit Handler
  const submitForm = async () => {
    const f = formData;

    if (!f.fy) return toast.show("Select Financial Year", "error");
    if (!f.returnType) return toast.show("Select Return Type", "error");
    if (!f.quarter) return toast.show("Select Quarter", "error");
    if (!f.filingDate) return toast.show("Select Filing Date", "error");
    if (!f.receiptNo || f.receiptNo.length !== 15)
      return toast.show("Enter 15-digit Provisional Receipt No.", "error");
    if (!f.deducteeCount) return toast.show("Enter Deductee Count", "error");
    if (!f.challanAmount) return toast.show("Enter Challan Amount", "error");
    if (!f.taxDeducted) return toast.show("Enter Tax Deducted", "error");
    if (!f.revision) return toast.show("Select Revision Filed", "error");
    if (!f.ackFile) return toast.show("Upload Ack PDF", "error");

    const fd = new FormData();
    Object.keys(f).forEach((k) => fd.append(k, f[k]));

    try {
      const res = await ApiService.handlePostRequest(
        API_ENDPOINTS.TDS_QUARTERLY_SAVE,
        fd,
        true
      );

      if (!res || res.status !== "success") throw new Error(res?.message);

      toast.show("Quarterly TDS Report Submitted", "success");

      setFormData({
        fy: "",
        returnType: "",
        quarter: "",
        filingDate: "",
        receiptNo: "",
        deducteeCount: "",
        challanAmount: "",
        taxDeducted: "",
        revision: "",
        ackFile: null,
      });
    } catch (err) {
      toast.show(err.message || "Error submitting data", "error");
    }
  };

  // FY list
  const fyList = (() => {
    const now = new Date().getFullYear();
    const arr = [];
    for (let i = 5; i >= -5; i--) {
      let s = now - i;
      arr.push(`${s}-${String(s + 1).slice(2)}`);
    }
    return arr;
  })();

  // Info Tile List
  const infoItems = [
    {
      label: "DDO Code",
      value: ddoInfo.ddoCode || "—",
      icon: <Hash className="text-blue-500" size={20} />,
    },
    {
      label: "Office Name",
      value: ddoInfo.officeName || "—",
      icon: <Building2 className="text-green-500" size={20} />,
    },
    {
      label: "TAN / GSTIN",
      value: ddoInfo.gstin || "—",
      icon: <IndianRupee className="text-purple-500" size={20} />,
    },
  ];

  return (
    <Layout role="ddo">

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[999999]">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>

      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 items-start">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">Quarterly TDS Filing</span>
            </h1>
            <p className="text-sm text-gray-500">
              Submit quarterly TDS return details
            </p>
          </div>

          {/* Info Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {infoItems.map((i, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="p-2 bg-gray-200 rounded-full">{i.icon}</div>
                <div>
                  <p className="text-xs font-semibold">{i.label}</p>
                  <p className="text-xs text-gray-600 truncate">{i.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FORM CARD */}
        <div className="premium-card p-6 sm:p-8 space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* FY */}
            <div>
              <label className="block text-sm font-semibold mb-2">Financial Year</label>
              <select name="fy" value={formData.fy} onChange={update}
                className="premium-input w-full px-4 py-3">
                <option value="">Select FY</option>
                {fyList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Return Type */}
            <div>
              <label className="block text-sm font-semibold mb-2">Return Type</label>
              <select name="returnType" value={formData.returnType} onChange={update}
                className="premium-input w-full px-4 py-3">
                <option value="">Select Return Type</option>
                {returnTypes.map((rt) => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>

            {/* Quarter */}
            <div>
              <label className="block text-sm font-semibold mb-2">Quarter</label>
              <select name="quarter" value={formData.quarter} onChange={update}
                className="premium-input w-full px-4 py-3">
                <option value="">Select Quarter</option>
                {quarterList.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            {/* Filing Date */}
            <div>
              <label className="block text-sm font-semibold mb-2">Date of Filing</label>
              <input type="date" name="filingDate" value={formData.filingDate}
                onChange={update} className="premium-input w-full px-4 py-3" />
            </div>

            {/* Receipt No */}
            <div>
              <label className="block text-sm font-semibold mb-2">Provisional Receipt No. (15 digits)</label>
              <input type="text" name="receiptNo" value={formData.receiptNo}
                onChange={update} maxLength={15}
                className="premium-input w-full px-4 py-3" placeholder="Enter 15-digit no." />
            </div>

            {/* Deductee Count */}
            <div>
              <label className="block text-sm font-semibold mb-2">No. of Deductee Records</label>
              <input type="text" name="deducteeCount" value={formData.deducteeCount}
                onChange={update} className="premium-input w-full px-4 py-3" placeholder="0" />
            </div>

            {/* Challan Amount */}
            <div>
              <label className="block text-sm font-semibold mb-2">Total Challan Amount</label>
              <input type="text" name="challanAmount" value={formData.challanAmount}
                onChange={update} className="premium-input w-full px-4 py-3" placeholder="0" />
            </div>

            {/* Tax Deducted */}
            <div>
              <label className="block text-sm font-semibold mb-2">Total Tax Deducted</label>
              <input type="text" name="taxDeducted" value={formData.taxDeducted}
                onChange={update} className="premium-input w-full px-4 py-3" placeholder="0" />
            </div>

            {/* Revision Filed */}
            <div>
              <label className="block text-sm font-semibold mb-2">Any Revision Filed?</label>
              <select name="revision" value={formData.revision}
                onChange={update} className="premium-input w-full px-4 py-3">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* PDF Upload */}
            <div>
              <label className="block text-sm font-semibold mb-2">Upload Ack (PDF Only)</label>
              <input type="file" accept="application/pdf"
                onChange={handleFile} className="premium-input w-full px-4 py-3" />
            </div>

          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="primary" onClick={submitForm}>
              Submit Quarterly Report
            </Button>
          </div>

        </div>

      </div>

    </Layout>
  );
}

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 5000);
    return () => clearTimeout(timer);
  }, []);

  const bg =
    type === "success"
      ? "bg-green-50 border-green-500 text-green-700"
      : "bg-red-50 border-red-500 text-red-700";

  return (
    <div
      className={`border-l-4 px-4 py-3 rounded-md shadow-lg flex items-center gap-3 mb-3 ${bg}`}
    >
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
};
