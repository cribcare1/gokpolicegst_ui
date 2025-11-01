const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.ewingstds.com:8443/tds"; //"http://13.126.232.163:8888/tds";

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
  
};

export const MESSAGES = {
    UPLOAD_SUCCESS: "✅ File uploaded successfully!",
    UPLOAD_ERROR: "❌ Upload failed. Please try again.",
    LOGIN_REQUIRED: "⚠️ Please log in to continue.",
  };
  