"use client";
import { useState, useEffect } from "react";
import Layout from "@/components/shared/Layout";
import Button from "@/components/shared/Button";
import { Building2, Hash, IndianRupee } from "lucide-react";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import ApiService from "@/components/api/api_service";
import { API_ENDPOINTS } from "@/components/api/api_const";
import { t } from "@/lib/localization";
import { useRouter } from 'next/navigation';
export default function TDSQuarterlyCreate() {
    const router = useRouter();
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ddoInfo, setDdoInfo] = useState({ ddoCode: "", gstin: "", officeName: "" });
  const [fyList, setFyList] = useState([]);
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
    remarks: "",
  });

  const returnTypes = ["24Q", "26Q", "27EQ", "27Q"];
  const quarterList = ["Q1", "Q2", "Q3", "Q4"];

  // Load DDO info
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

  // Load FY list
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const arr = [];
    for (let i = 5; i >= -5; i--) {
      let s = currentYear - i;
      arr.push(`${s}-${String(s + 1).slice(2)}`);
    }
    setFyList(arr);
  }, []);

  const update = (e) => {
    const { name, value } = e.target;
    if (["deducteeCount", "challanAmount", "taxDeducted"].includes(name)) {
      setFormData({ ...formData, [name]: value.replace(/[^0-9]/g, "") });
      return;
    }
    if (name === "receiptNo") {
      let cleaned = value.replace(/[^0-9]/g, "");
      if (cleaned.length > 15) cleaned = cleaned.slice(0, 15);
      setFormData({ ...formData, receiptNo: cleaned });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return toast.show("No file selected", "error");
    if (file.type !== "application/pdf") return toast.show("Only PDF allowed", "error");
    setFormData({ ...formData, ackFile: file });
  };

  const toast = {
    show: (message, type = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    },
  };

 


  const handleSubmit = async () => {
  try {
    const f = formData;

    // Validation
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

    setLoading(true);

    // Prepare payload similar to GST monthly
    const requestPayload = {
      ddoId: Number(localStorage.getItem(LOGIN_CONSTANT.USER_ID)),
      fiscalYear: f.fy,
      returnType: f.returnType,
      quarter: f.quarter,
      dateOfFiling: f.filingDate,
      provisionalReceiptNo: f.receiptNo,
      deducteeCount: Number(f.deducteeCount),
      totalChallanAmount: Number(f.challanAmount),
      totalTaxDeducted: Number(f.taxDeducted),
      anyRevisionFiled: f.revision === "Yes",
      remarks: f.remarks ?? "",
    };

    console.log("Sending File:", f.ackFile);

    const data = await ApiService.handlePostMultiPartFileRequest(
      API_ENDPOINTS.TDS_QUARTERLY_SAVE,
      requestPayload,
      f.ackFile
    );

    if (!data || data.status !== LOGIN_CONSTANT.success) {
      throw new Error(data?.message || "Failed to submit report");
    }

    toast.show(data?.message || "Quarterly TDS Report Submitted", LOGIN_CONSTANT.success);

    // Reset form
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
      remarks: "",
    });
router.replace('/ddo/quarterly_tds_list'); 
  } catch (err) {
    console.error("Submit Error:", err);
    toast.show(err.message || LOGIN_CONSTANT.SOMETHING_WENT_WRONG, LOGIN_CONSTANT.error);
  } finally {
    setLoading(false);
  }
};


  const infoItems = [
    { label: "DDO Code", value: ddoInfo.ddoCode || "—", icon: <Hash className="text-blue-500" size={20} /> },
    { label: "Office Name", value: ddoInfo.officeName || "—", icon: <Building2 className="text-green-500" size={20} /> },
    { label: "TAN / GSTIN", value: ddoInfo.gstin || "—", icon: <IndianRupee className="text-purple-500" size={20} /> },
  ];

  return (
    <Layout role="ddo">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[9999]">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>

      <div className="space-y-8">
        {/* Header + DDO Info */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 items-start">
          <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">{t("nav.tdsquarterlyreports")}</span>
            </h1>
            <p className="text-sm text-gray-500">Submit quarterly TDS return details</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {infoItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <div className="p-2 bg-gray-200 rounded-full">{item.icon}</div>
                <div>
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-xs text-gray-600 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="premium-card p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Financial Year</label>
              <select name="fy" value={formData.fy} onChange={update} className="premium-input w-full px-4 py-3">
                <option value="">Select FY</option>
                {fyList.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Return Type</label>
              <select name="returnType" value={formData.returnType} onChange={update} className="premium-input w-full px-4 py-3">
                <option value="">Select Return Type</option>
                {returnTypes.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Quarter</label>
              <select name="quarter" value={formData.quarter} onChange={update} className="premium-input w-full px-4 py-3">
                <option value="">Select Quarter</option>
                {quarterList.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Date of Filing</label>
              <input type="date" name="filingDate" value={formData.filingDate} onChange={update} className="premium-input w-full px-4 py-3" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Provisional Receipt No. (15 digits)</label>
              <input type="text" name="receiptNo" value={formData.receiptNo} onChange={update} maxLength={15} className="premium-input w-full px-4 py-3" placeholder="Enter 15-digit no." />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">No. of Deductee Records</label>
              <input type="text" name="deducteeCount" value={formData.deducteeCount} onChange={update} className="premium-input w-full px-4 py-3" placeholder="0" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Total Challan Amount</label>
              <input type="text" name="challanAmount" value={formData.challanAmount} onChange={update} className="premium-input w-full px-4 py-3" placeholder="0" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Total Tax Deducted</label>
              <input type="text" name="taxDeducted" value={formData.taxDeducted} onChange={update} className="premium-input w-full px-4 py-3" placeholder="0" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Any Revision Filed?</label>
              <select name="revision" value={formData.revision} onChange={update} className="premium-input w-full px-4 py-3">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Upload Ack (PDF Only)</label>
              <input type="file" accept="application/pdf" onChange={handleFile} className="premium-input w-full px-4 py-3" />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold mb-2">Remarks</label>
              <textarea name="remarks" value={formData.remarks} onChange={update} className="premium-input w-full px-4 py-3" placeholder="Optional remarks"></textarea>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="primary" disabled={loading} onClick={handleSubmit}>
              {loading ? "Submitting..." : "Submit Quarterly Report"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const Toast = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === "success" ? "bg-green-50 border-green-500 text-green-700" : "bg-red-50 border-red-500 text-red-700";

  return (
    <div className={`border-l-4 px-4 py-3 rounded-md shadow-lg flex items-center gap-3 mb-3 ${bg}`}>
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
};
