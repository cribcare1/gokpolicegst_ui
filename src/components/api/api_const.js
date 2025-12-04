const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.gokpolicegst.com:8443/tds"; //"http://13.126.232.163:8888/tds";

export const API_ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/upload`,
  LOGIN: `${API_BASE_URL}/auth/loginUsingUserNamePassword`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  GET_ALL_DDO: `${API_BASE_URL}/user/getAllDDOByAdminForDropDown`,
  GET_DDO_DETAILS: `${API_BASE_URL}/user/viewDDODetailsUsingId/`,
  UPLOAD_FORM16: `${API_BASE_URL}/form16/upload`,
  ADD_DDO_BYADMIN: `${API_BASE_URL}/user/addDDOByAdmin`,
  GET_ALL_FORM16: `${API_BASE_URL}/form16/getLastThreeYearsForm16/`,
  DOWNLOAD_FORM16: `${API_BASE_URL}/form16/generateDownloadLink/`,
  SENDT_OTP_TO_EMAIL: `${API_BASE_URL}/auth/send-otp?userNameOrEmail=`,
  RESET_DDO_PASSWORD: `${API_BASE_URL}/auth/resetPassword`,
  RESET_ADMIN_PASSWORD: `${API_BASE_URL}/auth/verify-otp`,
  REPORT_DETAILS: `${API_BASE_URL}/form16/getUploadedForms`,
  FORM16_DOWNLOAD:`${API_BASE_URL}/form16/download`,
  FORM16_DOWNLOAD_PDF:`${API_BASE_URL}/form16/uploadFormFilesWithZIPFolder`,
  DDO_REFRESH_COUNT: `${API_BASE_URL}/user/viewDashboardData?tanNumber=`,
  DDO_DETAILS_EDITBUTTON: `${API_BASE_URL}/user/editDdo/`,
  
  IMAGE_BASE_URL: `${API_BASE_URL}/auth/getImage/gst/`,

  // GST Master Data Endpoints
  GST_LIST: `${API_BASE_URL}/gst/activeGSTDetails`,
  GST_ADD: `${API_BASE_URL}/gst/saveOrUpdateGST`,
  GST_UPDATE: `${API_BASE_URL}/gst/saveOrUpdateGST`,
  GST_DELETE: `${API_BASE_URL}/gst/delete/`,
  GST_GET: `${API_BASE_URL}/gst/get/`,
  
  // PAN Master Data Endpoints
  PAN_LIST: `${API_BASE_URL}/pan/getAllActivePan`,
  PAN_ADD: `${API_BASE_URL}/pan/saveOrUpdate`,
  PAN_UPDATE: `${API_BASE_URL}/pan/saveOrUpdate`,
  PAN_DELETE: `${API_BASE_URL}/pan/delete/`,
  
  // DDO Master Data Endpoints (already exists but adding for consistency)
  DDO_LIST: `${API_BASE_URL}/gst/ddoList?gstId=`,
  DDO_LIST_PER_GST: `${API_BASE_URL}/gst/ddoList?gstId=`,
  DDO_ADD: `${API_BASE_URL}/user/addDDOByGSTIN`,
  DDO_UPDATE: `${API_BASE_URL}/user/addDDOByGSTIN`,
  DDO_DELETE: `${API_BASE_URL}/ddo/delete/`,
  DDO_MAPPING: `${API_BASE_URL}/user/addDDOByGSTIN`,
  GST_TDS_MONTHLY_REPORT : `${API_BASE_URL}/monthly-gst-filing/getMonthlyGstFilingByDdoId/`,
  TDS_QUARTERLY_LIST : `${API_BASE_URL}/quarterly-income-tax/ddo/`,
  TDS_MONTHLY_SAVE : `${API_BASE_URL}/monthly-gst-filing/saveOrUpdateNew`,
  TDS_QUARTERLY_SAVE : `${API_BASE_URL}/quarterly-income-tax/saveOrUpdate`,
  // HSN Master Data Endpoints
  HSN_LIST: `${API_BASE_URL}/hsn/getAllHSN`,
  HSN_ADD: `${API_BASE_URL}/hsn/saveOrUpdateHSN`,
  HSN_UPDATE: `${API_BASE_URL}/hsn/saveOrUpdateHSN`,
  HSN_DELETE: `${API_BASE_URL}/hsn/delete/`,
  HSN_HISTORY: `${API_BASE_URL}/hsn/getAllHSNHistory/`,
  
  // Bank Details Endpoints
  BANK_LIST: `${API_BASE_URL}/banks/activeBankDetails`,
  BANK_ADD: `${API_BASE_URL}/banks/saveOrUpdateBank`,
  BANK_UPDATE: `${API_BASE_URL}/banks/saveOrUpdateBank`,
  BANK_DELETE: `${API_BASE_URL}/banks/deleteBank/`,
  
  // Customer Endpoints
  CUSTOMER_LIST: `${API_BASE_URL}/customer/list`,
  CUSTOMER_ADD: `${API_BASE_URL}/customer/add`,
  CUSTOMER_UPDATE: `${API_BASE_URL}/customer/update`,
  CUSTOMER_DELETE: `${API_BASE_URL}/customer/delete/`,
  CUSTOMER_ACTIVE_LIST: `${API_BASE_URL}/customer/activeCustomers/`, // GET with ddoId
  CUSTOMER_ADD_OR_EDIT: `${API_BASE_URL}/customer/addOrEditCustomer`, // POST for add/edit
  CUSTOMER_DELETE_BY_ID: `${API_BASE_URL}/customer/deleteCustomer/`, // DELETE with customerId
  
  // Bill/Invoice Endpoints
  BILL_LIST: `${API_BASE_URL}/bill/list`,
  INVOICE_DDO_LIST: `${API_BASE_URL}/invoices/list?ddoId=`,
  PROFORMA_ADVICE_LIST: `${API_BASE_URL}/invoices/invoiceListDetails?ddoId=`,
  BILL_ADD: `${API_BASE_URL}/invoices/save`,
  BILL_UPDATE: `${API_BASE_URL}/bill/update`,
  BILL_GET: `${API_BASE_URL}/bill/get/`,
  BILL_DETAIL: `${API_BASE_URL}/bill/detail/`,
  BILL_SUBMIT: `${API_BASE_URL}/bill/submit`,
  BILL_APPROVE: `${API_BASE_URL}/bill/approve/`,
BILL_REJECT: `${API_BASE_URL}/bill/reject/`,
  BILL_DELETE: `${API_BASE_URL}/bill/delete/`,
  
  // Invoice Number Generation
  GENERATE_INVOICE_NUMBER: `${API_BASE_URL}/invoices/generate-number`,
  
  // Get Current GST Details of DDO
  GET_CURRENT_GST_OF_DDO: `${API_BASE_URL}/user/getCurrentGstOfDdo`,
  
  // Credit Note Endpoints
  CREDIT_NOTE_ADD: `${API_BASE_URL}/creditnote/add`,
  CREDIT_NOTE_LIST: `${API_BASE_URL}/creditnote/list`,
  
  // Dashboard Endpoints
  ADMIN_DASHBOARD: `${API_BASE_URL}/user/getDashboardStats`,
  DDO_DASHBOARD: `${API_BASE_URL}/dashboard/ddo`,
  GSTIN_DASHBOARD: `${API_BASE_URL}/dashboard/gstin`,
  
  // GSTIN Password Reset
  RESET_GSTIN_PASSWORD: `${API_BASE_URL}/auth/resetGstinPassword`,
  
  // Reports Endpoints
  REPORTS_MONTHLY: `${API_BASE_URL}/reports/monthly`,
  REPORTS_EXCEPTIONS: `${API_BASE_URL}/reports/exceptions`,
  
  // Profile Endpoints
  PROFILE_GET: `${API_BASE_URL}/profile/get`,
  PROFILE_UPDATE: `${API_BASE_URL}/profile/update`,
  ADMIN_PROFILE_UPDATE: `${API_BASE_URL}/user/editAdmin`,
  
  // DDO Mapping Endpoints
  DDO_MAPPING_UPDATE: `${API_BASE_URL}/gst/migrate-ddos`,
  
};

export const MESSAGES = {
    UPLOAD_SUCCESS: "✅ File uploaded successfully!",
    UPLOAD_ERROR: "❌ Upload failed. Please try again.",
    LOGIN_REQUIRED: "⚠️ Please log in to continue.",
  };
  