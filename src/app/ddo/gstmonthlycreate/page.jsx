"use client";
import { API_ENDPOINTS } from "@/components/api/api_const";
import Button from "@/components/shared/Button";
import Layout from "@/components/shared/Layout";
import { t } from "@/lib/localization";
import { Building2, Hash, IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";
import { LOGIN_CONSTANT } from '@/components/utils/constant';
import ApiService from '@/components/api/api_service';
export default function GSTTDSMonthlyCreate() {
  const [toasts, setToasts] = useState([]);
  const [ddoInfo, setDdoInfo] = useState({ ddoCode: "", gstId: "", officeName: "" });
  const [formData, setFormData] = useState({
    financialYear: "",
    month: "",
    arnNumber: "",
    arnDate: "",
    amountDeclared: "",
    amountPaid: "",
    penaltyAmount: "",
    ackFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [fyList, setFyList] = useState([]);
  const [monthList, setMonthList] = useState([]);



  // Load DDO info from localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem(LOGIN_CONSTANT.USER_PROFILE_DATA);
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setDdoInfo({
        ddoCode: profile.ddoCode || "",
        gstId: profile.gstNumber || profile.gstId || "",
        officeName: profile.address || "",
      });
    }
  }, []);



  // Load financial years
  useEffect(() => {
    setFyList(getFinancialYears());
  }, []);
  const update = (e) => {
    const { name, value } = e.target;
    if ([LOGIN_CONSTANT.amountDeclared, LOGIN_CONSTANT.amountPaid, LOGIN_CONSTANT.penaltyAmount].includes(name) && value !== "") {
      const n = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: n });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return toast.show(LOGIN_CONSTANT.NO_FIE_SELECTED, LOGIN_CONSTANT.error);
    if (file.type !== "application/pdf") return toast.show(LOGIN_CONSTANT.ONLY_PDF_ALLOWED, "error");
    setFormData({ ...formData, ackFile: file });
  };

  const handleFYChange = (e) => {
    const fy = e.target.value;
    setFormData({ ...formData, financialYear: fy, month: "" });
    setMonthList(getMonthsForFY(fy));
  };

  const getFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const fyArr = [];
    for (let i = 5; i >= -5; i--) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      fyArr.push(`${startYear}-${String(endYear).slice(2)}`);
    }
    return fyArr;
  };

  const getMonthsForFY = (fy) => {
    if (!fy) return [];
    const [start, end] = fy.split("-").map((y) => parseInt(y.length === 2 ? "20" + y : y));
    const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const yearSuffix = [start, start, start, start, start, start, start, start, start, end, end, end];
    return monthNames.map((m, i) => `${m}/${String(yearSuffix[i]).slice(2)}`);
  };

  // Toast helper
  const toast = {
    show: (message, type = LOGIN_CONSTANT.success) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    },
  };


  const handleSubmit = async () => {
    try {
      if (!formData.financialYear) return toast.show(LOGIN_CONSTANT.SELECT_FINANCIAL, LOGIN_CONSTANT.error);
      if (!formData.month) return toast.show(LOGIN_CONSTANT.SELECT_MONTH, LOGIN_CONSTANT.error);
      if (!formData.arnNumber) return toast.show(LOGIN_CONSTANT.SELECT_ARN_NUMBER, LOGIN_CONSTANT.error);
      if (!formData.arnDate) return toast.show(LOGIN_CONSTANT.SELECT_ARN_DATE, LOGIN_CONSTANT.error);
      if (!formData.amountDeclared) return toast.show(LOGIN_CONSTANT.ENTER_AMOUNT_DECLARED, LOGIN_CONSTANT.error);
      if (!formData.amountPaid) return toast.show(LOGIN_CONSTANT.ENTER_AMOUNT_PAID, LOGIN_CONSTANT.error);
      if (!formData.ackFile) return toast.show(LOGIN_CONSTANT.UPLOAD_ACK_PDF, LOGIN_CONSTANT.error);

      setLoading(true);

      const requestPayload = {
        ddoId: Number(localStorage.getItem(LOGIN_CONSTANT.USER_ID)),
        filingMonth: `${formData.month}`,
        arnNo: formData.arnNumber,
        arnDate: formData.arnDate,
        declaredAmount: Number(formData.amountDeclared),
        paidAmount: Number(formData.amountPaid),
        penaltyAmount: Number(formData.penaltyAmount || 0),
        remark: formData.remark ?? "",
      };
          console.log("Sending File:", formData.ackFile);
      const data = await ApiService.handlePostMultiPartFileRequest(
        API_ENDPOINTS.TDS_MONTHLY_SAVE,
        requestPayload,
        formData.ackFile
      );

      if (!data || data.status !== LOGIN_CONSTANT.success) {
        throw new Error(data?.message || "Failed to submit report");
      }
      toast.show(data?.message, LOGIN_CONSTANT.success);
      setFormData({
        financialYear: "",
        month: "",
        arnNumber: "",
        arnDate: "",
        amountDeclared: "",
        amountPaid: "",
        penaltyAmount: "",
        ackFile: null,
      });

      setMonthList([]);

    } catch (err) {
      console.error("Submit Error:", err);
      toast.show(err.message || LOGIN_CONSTANT.SOMETHING_WENT_WRONG, LOGIN_CONSTANT.error);
    } finally {
      setLoading(false);
    }
  };


  const infoItems = [
    { label: LOGIN_CONSTANT.DDO_CODE, value: ddoInfo.ddoCode || "—", icon: <Hash className="text-blue-500" size={20} /> },
    { label: LOGIN_CONSTANT.OFFICE_ADDRESS, value: ddoInfo.officeName || "—", icon: <Building2 className="text-green-500" size={20} /> },
    { label: LOGIN_CONSTANT.GST_CODE, value: ddoInfo.gstId || "—", icon: <IndianRupee className="text-purple-500" size={20} /> },
  ];

  return (
    <Layout role="ddo">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999]">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>

      <div className="space-y-8">
        {/* Header + DDO Info Card */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 items-start w-full">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">{t("nav.gstmonthlyreports")}</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              Submit monthly GST-TDS details
            </p>
          </div>

          {/* DDO Info Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-shrink-0 w-full lg:w-auto">
            {infoItems.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
              >
                <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-xs text-gray-600 break-words">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Section */}
        <div className="premium-card p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Year */}
            <div>
              <label className="block text-sm font-semibold mb-2">Financial Year</label>
              <select
                name="financialYear"
                value={formData.financialYear}
                onChange={handleFYChange}
                className="premium-input w-full px-4 py-3"
              >
                <option value="">Select Year</option>
                {fyList.map((fy) => <option key={fy} value={fy}>{fy}</option>)}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-semibold mb-2">Month of Filing</label>
              <select
                name="month"
                value={formData.month}
                onChange={update}
                className="premium-input w-full px-4 py-3"
              >
                <option value="">Select Month</option>
                {monthList.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* ARN Number */}
            <div>
              <label className="block text-sm font-semibold mb-2">ARN Number</label>
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
              <label className="block text-sm font-semibold mb-2">ARN Date</label>
              <input
                type="date"
                name="arnDate"
                value={formData.arnDate}
                onChange={update}
                className="premium-input w-full px-4 py-3"
              />
            </div>

            {/* Amount Declared */}
            <div>
              <label className="block text-sm font-semibold mb-2">GST-TDS Amount Declared (Monthly Return)</label>
              <input
                type="text"
                name="amountDeclared"
                value={formData.amountDeclared}
                onChange={update}
                className="premium-input w-full px-4 py-3"
                placeholder="0"
              />
            </div>

            {/* Amount Paid */}
            <div>
              <label className="block text-sm font-semibold mb-2">GST-TDS Amount Paid for the Month</label>
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
              <label className="block text-sm font-semibold mb-2">Penalty & Interest (If any)</label>
              <input
                type="text"
                name="penaltyAmount"
                value={formData.penaltyAmount}
                onChange={update}
                className="premium-input w-full px-4 py-3"
                placeholder="0"
              />
            </div>

            {/* File */}
            <div>
              <label className="block text-sm font-semibold mb-2">Upload Acknowledgement (PDF Only)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFile}
                className="premium-input w-full px-4 py-3"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="primary" disabled={loading} onClick={handleSubmit}>
              {loading ? "Submitting..." : "Submit Report"}
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

  const bg =
    type === "success"
      ? "bg-green-50 border-green-500 text-green-700"
      : "bg-red-50 border-red-500 text-red-700";

  const iconColor = type === "success" ? "text-green-500" : "text-red-500";

  const SuccessIcon = (
    <svg
      className={`h-5 w-5 ${iconColor}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );

  const ErrorIcon = (
    <svg
      className={`h-5 w-5 ${iconColor}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.293-9.293a1 1 0 011.414 0L10 9.586l1.293-1.293a1 1 0 111.414 1.414L11.414 11l1.293 1.293a1 1 0 01-1.414 1.414L10 12.414l-1.293 1.293a1 1 0 01-1.414-1.414L8.586 11 7.293 9.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );

  const icon = type === "success" ? SuccessIcon : ErrorIcon;

  return (
    <div
      className={`border-l-4 px-4 py-3 rounded-md shadow-lg flex items-center gap-3 mb-3 ${bg}`}
    >
      {icon}
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
};


