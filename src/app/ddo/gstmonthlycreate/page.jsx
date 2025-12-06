"use client";
import { API_ENDPOINTS } from "@/components/api/api_const";
import Button from "@/components/shared/Button";
import Layout from "@/components/shared/Layout";
import { Building2, Hash, IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import ApiService from "@/components/api/api_service";
import { t } from "@/lib/localization";
import { useRouter } from 'next/navigation';
export default function GSTTDSMonthlyCreate() {
  const router = useRouter();
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fyList, setFyList] = useState([]);
  const [monthList, setMonthList] = useState([]);

  const [ddoInfo, setDdoInfo] = useState({
    ddoCode: "",
    gstId: "",
    officeName: "",
  });

  const [formData, setFormData] = useState({
    financialYear: "",
    month: "",
    arnNumber: "",
    arnDate: "",
    amountDeclared: "",
    amountPaid: "",
    penaltyAmount: "",
    ackFile: null,
    remark: "",
  });

  // ------------------------------
  // Load DDO INFO
  // ------------------------------
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
      });
    }
  }, []);

  // ------------------------------
  // Load FY List
  // ------------------------------
  useEffect(() => {
    const current = new Date().getFullYear();
    const arr = [];
    for (let i = 5; i >= -5; i--) {
      const s = current - i;
      arr.push(`${s}-${String(s + 1).slice(2)}`);
    }
    setFyList(arr);
  }, []);

  // ------------------------------
  // Month Options for FY
  // ------------------------------
  const getMonthsForFY = (fy) => {
    if (!fy) return [];

    const [start, end] = fy
      .split("-")
      .map((y) => (y.length === 2 ? Number("20" + y) : Number(y)));

    const monthNames = [
      "Apr", "May", "Jun",
      "Jul", "Aug", "Sep",
      "Oct", "Nov", "Dec",
      "Jan", "Feb", "Mar",
    ];
    const yearSuffix = [
      start, start, start, start, start, start,
      start, start, start, end, end, end,
    ];

    return monthNames.map((m, i) => `${m}/${String(yearSuffix[i]).slice(2)}`);
  };

  const handleFYChange = (e) => {
    const fy = e.target.value;
    setFormData({ ...formData, financialYear: fy, month: "" });
    setMonthList(getMonthsForFY(fy));
  };

  // ------------------------------
  // FORM UPDATE HANDLER
  // ------------------------------
  const update = (e) => {
    const { name, value } = e.target;

    if (
      ["amountDeclared", "amountPaid", "penaltyAmount"].includes(name) &&
      value !== ""
    ) {
      return setFormData({
        ...formData,
        [name]: value.replace(/[^0-9]/g, ""),
      });
    }

    setFormData({ ...formData, [name]: value });
  };

  // ------------------------------
  // FILE UPLOAD
  // ------------------------------
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return toast.show("No file selected", "error");
    if (file.type !== "application/pdf")
      return toast.show("Only PDF files allowed!", "error");

    setFormData({ ...formData, ackFile: file });
  };

  // ------------------------------
  // TOAST HANDLER
  // ------------------------------
  const toast = {
    show: (message, type = "success") => {
      const id = Date.now();
      setToasts((p) => [...p, { id, message, type }]);
      setTimeout(() => {
        setToasts((p) => p.filter((x) => x.id !== id));
      }, 5000);
    },
  };

  // ------------------------------
  // SUBMIT
  // ------------------------------
  const handleSubmit = async () => {
    try {
      const f = formData;

      if (!f.financialYear)
        return toast.show("Select Financial Year", "error");
      if (!f.month) return toast.show("Select Filing Month", "error");
      if (!f.arnNumber) return toast.show("Enter ARN Number", "error");
      if (!f.arnDate) return toast.show("Select ARN Date", "error");
      if (!f.amountDeclared)
        return toast.show("Enter GST-TDS Declared Amount", "error");
      if (!f.amountPaid)
        return toast.show("Enter GST-TDS Paid Amount", "error");
      if (!f.ackFile)
        return toast.show("Upload Acknowledgement PDF", "error");

      setLoading(true);

      const requestPayload = {
        ddoId: Number(localStorage.getItem(LOGIN_CONSTANT.USER_ID)),
        filingMonth: f.month,
        arnNo: f.arnNumber,
        arnDate: f.arnDate,
        declaredAmount: Number(f.amountDeclared),
        paidAmount: Number(f.amountPaid),
        penaltyAmount: Number(f.penaltyAmount || 0),
        remark: f.remark ?? "",
      };

      const data = await ApiService.handlePostMultiPartFileRequest(
        API_ENDPOINTS.TDS_MONTHLY_SAVE,
        requestPayload,
        f.ackFile
      );

      if (!data || data.status !== LOGIN_CONSTANT.success)
        throw new Error(data?.message || "Failed to submit report");

      toast.show(data.message, "success");

      // RESET
      setFormData({
        financialYear: "",
        month: "",
        arnNumber: "",
        arnDate: "",
        amountDeclared: "",
        amountPaid: "",
        penaltyAmount: "",
        ackFile: null,
        remark: "",
      });

      setMonthList([]);
      router.replace('/ddo/ddo_gstmonthlyreport_list'); 
    } catch (err) {
      toast.show(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // INFO CARDS
  // ------------------------------
  const infoItems = [
    {
      label: "DDO Code",
      value: ddoInfo.ddoCode || "—",
      icon: <Hash className="text-blue-500" size={20} />,
    },
    {
      label: "Office Address",
      value: ddoInfo.officeName || "—",
      icon: <Building2 className="text-green-500" size={20} />,
    },
    {
      label: "GSTIN",
      value: ddoInfo.gstId || "—",
      icon: <IndianRupee className="text-purple-500" size={20} />,
    },
  ];

  return (
    <Layout role="ddo">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999]">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }
          />
        ))}
      </div>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 items-start">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold mb-2">
              {t("nav.gstmonthlyreports")}
            </h1>
            <p className="text-sm text-gray-500">
              Submit monthly GST-TDS return details
            </p>
          </div>

          {/* DDO INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {infoItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="p-2 bg-gray-200 rounded-full">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-xs text-gray-600 truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div className="premium-card p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FY */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Financial Year
              </label>
              <select
                name="financialYear"
                value={formData.financialYear}
                onChange={handleFYChange}
                className="premium-input w-full px-4 py-3"
              >
                <option value="">Select FY</option>
                {fyList.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Month
              </label>
              <select
                name="month"
                value={formData.month}
                onChange={update}
                className="premium-input w-full px-4 py-3"
              >
                <option value="">Select Month</option>
                {monthList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* ARN Number */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                ARN Number
              </label>
              <input
                type="text"
                name="arnNumber"
                value={formData.arnNumber}
                onChange={update}
                className="premium-input w-full px-4 py-3"
                placeholder="Enter ARN Number"
              />
            </div>

            {/* ARN Date */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                ARN Date
              </label>
              <input
                type="date"
                name="arnDate"
                value={formData.arnDate}
                onChange={update}
                className="premium-input w-full px-4 py-3"
              />
            </div>

            {/* Declared Amount */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                GST-TDS Amount Declared
              </label>
              <input
                type="text"
                name="amountDeclared"
                value={formData.amountDeclared}
                onChange={update}
                className="premium-input w-full px-4 py-3"
                placeholder="0"
              />
            </div>

            {/* Paid Amount */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                GST-TDS Amount Paid
              </label>
              <input
                type="text"
                name="amountPaid"
                value={formData.amountPaid}
                onChange={update}
                className="premium-input w-full px-4 py-3"
                placeholder="0"
              />
            </div>

            {/* Penalty */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Penalty / Interest (If any)
              </label>
              <input
                type="text"
                name="penaltyAmount"
                value={formData.penaltyAmount}
                onChange={update}
                className="premium-input w-full px-4 py-3"
                placeholder="0"
              />
            </div>

            {/* FILE */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Upload Acknowledgement (PDF Only)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFile}
                className="premium-input w-full px-4 py-3"
              />
            </div>

            {/* REMARKS */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Remarks
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={update}
                className="premium-input w-full px-4 py-3"
                placeholder="Optional remarks"
              ></textarea>
            </div>
          </div>

          {/* SUBMIT */}
          <div className="pt-4 flex justify-end">
            <Button
              variant="primary"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Submitting..." : "Submit Monthly Report"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ------------------------------
// TOAST COMPONENT
// ------------------------------
const Toast = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
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
