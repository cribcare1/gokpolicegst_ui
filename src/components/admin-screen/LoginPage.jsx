"use client";
import { useEffect } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from "@/components/api/api_const";
import {LOGIN_CONSTANT} from "@/components/utils/constant";
import ApiService from "@/components/api/api_service";
import { useNetworkStatus } from '@/components/utils/network';
import { FOOTER_TEXT } from "@/components/utils/constant";
import { toast, Toaster } from 'sonner';
import { validateEmail, validatePassword } from '@/lib/gstUtils';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [rememberMe, setRememberMe] = useState(false);
  const [userData, setUserData] = useState(null);

  // Demo credentials for testing
  const DEMO_CREDENTIALS = {
    admin: {
      username: 'admin',
      password: 'admin123',
      fullName: 'Demo Admin'
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    // Validate email/username
    if (!email || email.trim() === '') {
      setError('Username is required');
      setIsLoading(false);
      return;
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      setIsLoading(false);
      return;
    }
    
    localStorage.removeItem("userToken");
  
    const requestBody = {
      userName: email,
      password: password,
      role: "admin",
    };
  
    // Check for demo credentials first (development mode)
    if (email === DEMO_CREDENTIALS.admin.username && password === DEMO_CREDENTIALS.admin.password) {
      // Demo login - bypass API
      const mockResponse = {
        userId: 'demo-admin-001',
        token: 'demo-token-' + Date.now(),
        fullName: DEMO_CREDENTIALS.admin.fullName,
        ddoCount: 0,
        form16Count: 0,
        form16ACount: 0
      };
      
      localStorage.setItem(LOGIN_CONSTANT.USER_TOKEN, mockResponse.token);
      localStorage.setItem(LOGIN_CONSTANT.USER_ID, mockResponse.userId);
      localStorage.setItem(LOGIN_CONSTANT.DDO_COUNT, mockResponse.ddoCount);
      localStorage.setItem(LOGIN_CONSTANT.FORM_16_COUNT, mockResponse.form16Count);
      localStorage.setItem(LOGIN_CONSTANT.FORM_16A_COUNT, mockResponse.form16ACount);
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
      }
      
      toast.success(`🎉 Demo Login successful! Welcome, ${mockResponse.fullName}.`);
      router.push("/admin_dashboard");
      setIsLoading(false);
      return;
    }
  
    try {
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.LOGIN, requestBody);
  
      if (response.status === "success") {
        setUserData(response.login_response);
        localStorage.setItem(LOGIN_CONSTANT.USER_TOKEN, response.login_response.token);
        localStorage.setItem(LOGIN_CONSTANT.USER_ID, response.login_response.userId);
        localStorage.setItem(LOGIN_CONSTANT.FULL_NAME, response.login_response.fullName);
        localStorage.setItem(LOGIN_CONSTANT.MOBILE_NUMBER, response.login_response.mobileNumber);
        localStorage.setItem(LOGIN_CONSTANT.EMAIL, response.login_response.email);
        localStorage.setItem(LOGIN_CONSTANT.ADDRESS, response.login_response.address);
        localStorage.setItem(LOGIN_CONSTANT.CITY, response.login_response.city);
        localStorage.setItem(LOGIN_CONSTANT.PINCODE, response.login_response.pinCode);

        localStorage.setItem(LOGIN_CONSTANT.USER_PROFILE_DATA, JSON.stringify(response.login_response));
  
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedPassword', password);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
        }
  
        toast.success(`🎉 Login successful! Welcome back, ${response.login_response.fullName || "User"}.`);
        router.push("/admin_dashboard");
      } else {
        toast.error(`❌ Error: ${response.message}`);
      }
    } catch (err) {
      setError(err.message);
      toast.error(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if(!isOnline){
    return (<div><p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p></div>);
  }

  const sendOTP = async () => {
    if (!resetEmail.trim()) {
      toast.error("Please enter your email before requesting an OTP.");
      return;
    }
  
    setIsLoading(true);
    setError(null);
    console.log("username : " + resetEmail);
  
    try {
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.SENDT_OTP_TO_EMAIL + resetEmail);
      console.log("API Response:", response);
  
      if (response.status === "success") {
        toast.success(`🎉 ${response.message}.`);
        localStorage.setItem(LOGIN_CONSTANT.EMAIL, response.email);
        router.push("/adminresetpassword");
      } else {
        toast.error(`❌ Error: ${response.message}`);
      }
    } catch (err) {
      setError(err.message);
      toast.error(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    handleLogin();
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate email
    if (!resetEmail || resetEmail.trim() === '') {
      setError('Username is required');
      setIsLoading(false);
      return;
    }
    
    try {
      // Simulate API call to send OTP (you would replace this with your actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Password reset requested for:", resetEmail);
      
      // Store the email in localStorage so the reset page can access it
      localStorage.setItem("resetEmail", resetEmail);
      
      // Navigate to the reset password page
      // router.push("\adminresetpassword");
      
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToHome = () => {
    router.push("/"); // Navigates to home page
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);
  
  // Home button component that appears in the same position on both screens
  const HomeButton = () => (
    <button 
      onClick={navigateToHome}
      className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-white backdrop-blur-md border border-teal-400/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-lg"
      aria-label="Go to home page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </button>
  );
  
  // Render forgot password view
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Home Button */}
        <HomeButton />
        
        {/* Add Toaster at the top level of component */}
        <Toaster position="top-right" richColors />
        
        <div className="w-full max-w-md backdrop-blur-lg bg-white/95 p-4 sm:p-6 md:p-8 my-4 sm:my-8 rounded-2xl shadow-2xl border border-white/20 relative z-10 mx-2 sm:mx-0">
          {/* Logo and Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg mb-4 sm:mb-6 ring-4 ring-teal-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Reset Password</h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-slate-600 px-2">Enter your User Name to reset your password</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/20 border border-red-500/30 text-red-800 rounded-lg text-xs sm:text-sm flex items-start sm:items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Success message */}
          {resetSuccess && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 text-green-800 rounded-lg text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Password reset link has been sent to your email.
            </div>
          )}
          
          {/* Reset Password Form */}
          <form className="space-y-4 sm:space-y-6" onSubmit={handleResetRequest}>
            <div>
              <label htmlFor="resetEmail" className="block text-xs sm:text-sm font-medium text-indigo-800 mb-1">
                User Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
               <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-6 2-6 4v1h12v-1c0-2-2-4-6-4z" />
               </svg>
                </div>
                <input
                  id="resetEmail"
                  name="resetEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 bg-gray-50 text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white rounded-lg shadow-sm transition-colors"
                  placeholder="Enter your User Name"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !resetEmail.trim()}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-lg shadow-lg text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                onClick={sendOTP}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>
          </form>

          {/* Back to login link */}
          <div className="mt-4 sm:mt-6 text-center">
            <button 
              onClick={() => setShowForgotPassword(false)} 
                className="inline-flex items-center text-sm sm:text-base text-teal-600 hover:text-teal-700 transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to login
            </button>
            {/* Footer */}
            <p className="mt-4 sm:mt-8 text-center text-xs sm:text-sm text-slate-500 px-2">
              {FOOTER_TEXT}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render login view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Home Button */}
      <HomeButton />
      
      {/* Add Toaster at the top level of component */}
      <Toaster position="top-right" richColors />
      
      {/* Glass morphism card container with light sky blue background and added padding */}
      <div className="w-full max-w-md backdrop-blur-xl bg-white/98 p-4 sm:p-6 md:p-8 lg:p-10 my-4 sm:my-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 relative z-10 mx-2 sm:mx-0">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 rounded-t-3xl"></div>
        
        {/* Logo and Header */}
        <div className="text-center mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-xl ring-4 ring-teal-50 transform hover:scale-105 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight px-2">Admin Login</h2>
            <div className="w-16 sm:w-20 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent mx-auto"></div>
            <p className="mt-2 sm:mt-4 text-xs sm:text-sm md:text-base text-slate-600 font-medium px-2">Login to access your dashboard</p>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Demo Credentials (for testing):</p>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p><strong>Username:</strong> admin</p>
            <p><strong>Password:</strong> admin123</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_CREDENTIALS.admin.username);
              setPassword(DEMO_CREDENTIALS.admin.password);
            }}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Click to fill demo credentials
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/20 border border-red-500/30 text-red-800 rounded-lg text-xs sm:text-sm flex items-start sm:items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="break-words">{error}</span>
          </div>
        )}
        
        {/* Login Form */}
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-slate-700 tracking-wide mb-1">
              Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-6 2-6 4v1h12v-1c0-2-2-4-6-4z" />
               </svg>
              </div>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 focus:bg-white rounded-xl shadow-sm transition-all duration-200 group-hover:border-teal-300"
                placeholder="UserName"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-slate-700 tracking-wide mb-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-9 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 focus:bg-white rounded-xl shadow-sm transition-all duration-200 group-hover:border-teal-300"
                placeholder="Password"
              />
              <div 
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" 
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3 w-3 text-teal-600 focus:ring-teal-500 border-gray-300 rounded cursor-pointer"
                style={{ minWidth: '12px', minHeight: '12px', width: '12px', height: '12px' }}
              />
                <label htmlFor="rememberMe" className="ml-2 block text-xs sm:text-sm text-slate-700 cursor-pointer">
                  Remember me
                </label>
            </div>
            
            <div className="text-xs sm:text-sm">
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <div className="pt-2 sm:pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 sm:py-4 px-4 sm:px-6 border border-transparent rounded-xl shadow-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:via-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}