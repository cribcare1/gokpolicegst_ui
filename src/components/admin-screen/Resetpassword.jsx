"use client";
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, User, Key, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { useNetworkStatus } from '@/components/utils/network';
import { FOOTER_TEXT } from "@/components/utils/constant";
import { toast, Toaster } from 'sonner';
import {LOGIN_CONSTANT} from "@/components/utils/constant";


export default function ResetPasswordForm() {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isOnline = useNetworkStatus();
  

  const resetForgotPassword = async () => {
    setIsLoading(true);
    setErrors({});
    console.log("username : "+userEmail);
    console.log("password : "+newPassword);
    localStorage.removeItem("userToken");
    const requestBody = {
      email: userEmail, 
      password: newPassword,
      otp: otp,
    };
    console.log("request body "+JSON.stringify(requestBody));
    
    try {
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.RESET_ADMIN_PASSWORD, requestBody);
  
      console.log("API Response:", response);

      if (response.status === "success") {
        toast.success(`🎉 ${response.message}.`);
        router.push("/adminlogin");
      } else {
        toast.error(`❌ Error: ${response.message}`);
      }
    } catch (err) {
      setErrors(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  if(!isOnline){
    return (<div><p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p></div>);
   }

  // Get email from localStorage when the component mounts
  useEffect(() => {
    setUserEmail(localStorage.getItem(LOGIN_CONSTANT.EMAIL));
    // If there's no resetEmail in localStorage, user might have navigated directly to this page
    const resetEmail = localStorage.getItem("resetEmail");
    if (resetEmail) {
      setUserEmail(resetEmail);
      // You could also auto-populate the userId if it's derived from email
      // For example: setUserId(resetEmail.split("@")[0]);
    } else {
      // Optionally redirect back to login if no email is found
      // router.push("/admin_login");
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!userId.trim()) {
      newErrors.userId = 'User ID is required';
    }
    
    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      resetForgotPassword();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-2 sm:p-4 relative overflow-hidden">
      <Toaster position="top-right" richColors />
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

    <div className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 relative overflow-hidden z-10 border border-white/20 mx-2 sm:mx-0"> 
        <div className="text-center relative z-10">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg mb-3 sm:mb-4 ring-4 ring-teal-100">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent px-2">Reset Password</h2>
          <div className="mt-2 sm:mt-3 flex items-center justify-center">
            <span className="bg-teal-100 text-teal-800 font-semibold text-xs px-3 sm:px-4 py-1 sm:py-1.5 rounded-full flex items-center">
              <Shield size={12} className="mr-1 sm:mr-1.5" />
              ADMIN
            </span>
          </div>
        </div>
        
        {userEmail && (
          <div className="text-center text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 break-words">
            OTP has been sent to <span className="font-semibold break-all">{userEmail}</span>
          </div>
        )}
        
        {/* General form error */}
        {errors.form && (
          <div className="p-2 sm:p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm break-words">
            {errors.form}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 relative z-10">
          {/* User ID Field */}
          <div className="group">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5" htmlFor="userId">
              User ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="sm:w-[18px] sm:h-[18px] text-teal-400 group-focus-within:text-teal-600" />
              </div>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={`w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border-2 ${errors.userId ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 ease-in-out bg-gray-50 focus:bg-white`}
                placeholder="Enter your user ID"
              />
            </div>
            {errors.userId && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.userId}</p>}
          </div>
          
          {/* New Password Field */}
          <div className="group">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5" htmlFor="newPassword">
              <span className="font-bold">Password</span>
              <br />
              <span className="text-xs font-normal text-gray-500">Enter New Password</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key size={16} className="sm:w-[18px] sm:h-[18px] text-teal-400 group-focus-within:text-teal-600" />
              </div>
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base border-2 ${errors.newPassword ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 ease-in-out bg-gray-50 focus:bg-white`}
                placeholder="XXXXXXX"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-teal-500 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 
                  <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : 
                  <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                }
              </button>
            </div>
            {errors.newPassword && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.newPassword}</p>}
          </div>
          
          {/* Confirm Password Field */}
          <div className="group">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key size={16} className="sm:w-[18px] sm:h-[18px] text-teal-400 group-focus-within:text-teal-600" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base border-2 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 ease-in-out bg-gray-50 focus:bg-white`}
                placeholder="XXXXXXX"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-teal-500 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? 
                  <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : 
                  <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                }
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>
          
          {/* OTP Field */}
          <div className="group">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5" htmlFor="otp">
              <span className="block sm:inline">Enter OTP Sent to email ID : </span>
              <span className="break-all font-semibold">{userEmail}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="sm:w-[18px] sm:h-[18px] text-teal-400 group-focus-within:text-teal-600" />
              </div>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className={`w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border-2 ${errors.otp ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 ease-in-out bg-gray-50 focus:bg-white`}
                placeholder="6-digit OTP"
              />
            </div>
            {errors.otp && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.otp}</p>}
            
            {/* Resend OTP option */}
            {/* <div className="flex justify-end mt-1">
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                onClick={() => {
                  alert("OTP resent to your email!");
                }}
              >
                Resend OTP
              </button>
            </div> */}
          </div>
          
          {/* Reset Button */}
          <div className="pt-2 sm:pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-[1.02] flex items-center justify-center text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isSubmitting ? 'Processing...' : 'Reset Password'}
            </button>
          </div>
          
          {/* Back to login link */}
          <div className="text-center mt-3 sm:mt-4">
            <button
              type="button"
              onClick={() => router.push("/adminlogin")}
              className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to login
            </button>
              {/* Footer */}
          </div>
          <p className="mt-4 sm:mt-8 text-center text-xs sm:text-sm text-slate-500 px-2">
        {FOOTER_TEXT}
      </p>
        </form>
      </div>
    </div>
  );
}