"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { useRouter } from 'next/navigation'; 
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { useNetworkStatus } from '@/components/utils/network';
import { FOOTER_TEXT } from "@/components/utils/constant";

// Toast component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700';
  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
  const icon = type === 'success' ? (
    <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className={`fixed top-4 right-4 ${bgColor} p-4 rounded-md shadow-md border-l-4 z-50 transform transition-all duration-300 max-w-sm`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${iconColor} hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50`}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();
  const isOnline = useNetworkStatus();

  // Animation effect when component mounts
  useEffect(() => {
    setIsVisible(true);
    
    // Check for saved credentials
    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    
    if (isRemembered && savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
  
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
  
    setIsLoading(true); // start loading
    await fetchLoginData(); // perform login
    setIsLoading(false); // stop loading
  };
  
  // Demo credentials for testing
  const DEMO_CREDENTIALS = {
    ddo: {
      username: 'ddo',
      password: 'ddo123',
      fullName: 'Demo DDO User',
      userName: 'DEMO_DDO_001'
    }
  };

  const fetchLoginData = async () => {
    setLoading(true);
    setError(null);
    console.log("username : "+username);
    console.log("password : "+password);
    localStorage.removeItem("userToken");
    
    // Check for demo credentials first (development mode)
    if (username === DEMO_CREDENTIALS.ddo.username && password === DEMO_CREDENTIALS.ddo.password) {
      // Demo login - bypass API
      const mockResponse = {
        userId: 'demo-ddo-001',
        token: 'demo-token-' + Date.now(),
        fullName: DEMO_CREDENTIALS.ddo.fullName,
        userName: DEMO_CREDENTIALS.ddo.userName,
        ddoCount: 0,
        form16Count: 0,
        form16ACount: 0
      };
      
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
        localStorage.setItem('rememberedPassword', password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('rememberMe');
      }
      
      localStorage.setItem(LOGIN_CONSTANT.USER_TOKEN, mockResponse.token);
      localStorage.setItem(LOGIN_CONSTANT.USER_ID, mockResponse.userId);
      localStorage.setItem(LOGIN_CONSTANT.DDO_COUNT, mockResponse.ddoCount);
      localStorage.setItem(LOGIN_CONSTANT.FORM_16_COUNT, mockResponse.form16Count);
      localStorage.setItem(LOGIN_CONSTANT.FORM_16A_COUNT, mockResponse.form16ACount);
      localStorage.setItem(LOGIN_CONSTANT.DDO_USER_NAME, mockResponse.fullName);
      localStorage.setItem(LOGIN_CONSTANT.DDO_TAN_NUMBER, mockResponse.userName);
      localStorage.setItem('ddoCode', 'DEMO001');
      
      showToast("🎉 Demo Login successful! Welcome back.", "success");
      router.push("/ddo_dashboard");
      setLoading(false);
      setIsLoading(false);
      return;
    }
    
    const requestBody = {
      userName: username, password: password, role: "ddo"
    };
    console.log("request body "+JSON.stringify(requestBody));
    try {
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.LOGIN, requestBody);
  
      console.log("API Response:", response);

      if (response.status === "success") {
        // Store credentials if "Remember me" is checked
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
          localStorage.setItem('rememberedPassword', password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          // Clear remembered credentials if "Remember me" is unchecked
          localStorage.removeItem('rememberedUsername');
          localStorage.removeItem('rememberedPassword');
          localStorage.removeItem('rememberMe');
        }
        
        setUserData(response.login_response); // Store user data in state
        localStorage.setItem(LOGIN_CONSTANT.USER_TOKEN, response.login_response.token);
        localStorage.setItem(LOGIN_CONSTANT.USER_ID, response.login_response.userId); 
        localStorage.setItem(LOGIN_CONSTANT.DDO_COUNT, response.login_response.ddoCount); 
        localStorage.setItem(LOGIN_CONSTANT.FORM_16_COUNT, response.login_response.form16Count); 
        localStorage.setItem(LOGIN_CONSTANT.FORM_16A_COUNT, response.login_response.form16ACount);
        localStorage.setItem(LOGIN_CONSTANT.DDO_USER_NAME, response.login_response.fullName);
        localStorage.setItem(LOGIN_CONSTANT.DDO_TAN_NUMBER, response.login_response.userName); 
        
        showToast("🎉 Login successful! Welcome back.", "success");
        router.push("/ddo_dashboard");
      } else {
        showToast(`❌ Error: ${response.message}`, "error");
      }
    } catch (err) {
      setError(err.message);
      showToast(`❌ Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (password !== confirmPassword) {
      showToast("❌ Passwords do not match", "error");
      return;
    }
    
    setLoading(true);
    setError(null);
    console.log("username : "+username);
    console.log("password : "+password);
    localStorage.removeItem("userToken");
    const requestBody = {
      userName: username, password: password,
    };
    console.log("request body "+JSON.stringify(requestBody));
    try {
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.RESET_DDO_PASSWORD, requestBody);
  
      console.log("API Response:", response);
      console.log("API Response status :", response.status);

      if (response.status === "success") {
        console.log("Message:", response.message);
        showToast(`🎉 ${response.message}.`, "success");
        
        // Use setTimeout to ensure the toast is seen before switching to login
        setTimeout(() => {
          setIsLogin(true);
        }, 1500);
      } else {
        showToast(`❌ Error: ${response.message}`, "error");
      }
    } catch (err) {
      setError(err.message);
      showToast(`❌ Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if(!isOnline){
    return (<div><p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p></div>);
   }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const navigateToHome = () => {
    router.push("/"); // Navigates to home page
  };

  
  return (
    
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Home button positioned in top-left corner */}
      <button 
    onClick={navigateToHome}
    className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-white backdrop-blur-md border border-teal-400/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-lg"
    aria-label="Go to home page"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  </button>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      
      <div className={`max-w-md w-full space-y-6 sm:space-y-8 bg-white/98 backdrop-blur-xl p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 transform transition-all duration-700 relative z-10 mx-2 sm:mx-0 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 rounded-t-3xl"></div>
        
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-xl ring-4 ring-teal-50 transform hover:scale-105 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight px-2">
              {isLogin ? 'DDO Login' : 'Reset Password'}
            </h2>
            <div className="w-16 sm:w-20 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent mx-auto"></div>
            <p className="mt-2 sm:mt-4 text-center text-xs sm:text-sm md:text-base text-slate-600 font-medium px-2">
              {isLogin ? 'Login to access your account' : 'Enter your information to reset your password'}
            </p>
          </div>
        </div>

        {/* Demo Credentials Info */}
        {isLogin && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Demo Credentials (for testing):</p>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Username:</strong> ddo</p>
              <p><strong>Password:</strong> ddo123</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setUsername(DEMO_CREDENTIALS.ddo.username);
                setPassword(DEMO_CREDENTIALS.ddo.password);
              }}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Click to fill demo credentials
            </button>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 rounded-md shadow-sm" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm break-words">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-sm" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {isLogin ? (
          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-xs sm:text-sm font-semibold text-slate-700 tracking-wide">User Id</label>
                <div className="mt-1 relative rounded-xl shadow-sm group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 block w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 text-slate-800 focus:outline-none bg-gradient-to-br from-gray-50 to-white focus:bg-white transition-all duration-200 group-hover:border-teal-300"
                    placeholder="Enter the TAN"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-slate-700 tracking-wide">Password</label>
                <div className="mt-1 relative rounded-xl shadow-sm group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 block w-full pl-9 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 text-slate-800 focus:outline-none bg-gradient-to-br from-gray-50 to-white focus:bg-white transition-all duration-200 group-hover:border-teal-300"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-2">
              <div className="flex items-center group cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded cursor-pointer transition-all"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 sm:ml-3 block text-xs sm:text-sm font-medium text-slate-700 cursor-pointer group-hover:text-teal-600 transition-colors">
                  Remember me
                </label>
              </div>
              
              <div className="text-xs sm:text-sm">
                <button
                  type="button"
                  className="font-semibold text-teal-600 hover:text-teal-700 transition-all hover:underline underline-offset-2"
                  onClick={() => setIsLogin(false)}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <div className="pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center gap-2 py-3 sm:py-4 px-4 sm:px-6 border border-transparent rounded-xl shadow-xl text-xs sm:text-sm font-bold text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl ${
                  isLoading ? 'bg-teal-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:via-emerald-700 hover:to-teal-700'
                } focus:outline-none focus:ring-4 focus:ring-teal-500/50`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>

            <div className="pt-2 sm:pt-4 text-center text-xs text-gray-500 border-t border-gray-200 mt-4 sm:mt-6">
              {FOOTER_TEXT}
            </div>
          </form>
        ) : (
          <form className="mt-4 sm:mt-6 space-y-4 sm:space-y-6" onSubmit={(e) => { e.preventDefault(); resetPassword(); }}>
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-700">User Id</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-4.472 10.191A7.977 7.977 0 002 18a1 1 0 001 1h14a1 1 0 001-1 7.977 7.977 0 00-3.528-5.809A6 6 0 0010 2z" />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                    className="focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 block w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 text-slate-800 focus:outline-none bg-gradient-to-br from-gray-50 to-white focus:bg-white transition-all duration-200 group-hover:border-teal-300"
                    placeholder="Enter the TAN"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
        
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 8a5 5 0 0110 0v2h1a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1h1V8zm2 0v2h6V8a3 3 0 00-6 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                    className="focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 block w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 text-slate-800 focus:outline-none bg-gradient-to-br from-gray-50 to-white focus:bg-white transition-all duration-200 group-hover:border-teal-300"
                    placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
        
            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3 9H7a1 1 0 010-2h6a1 1 0 010 2z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                    className="focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 block w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 text-slate-800 focus:outline-none bg-gradient-to-br from-gray-50 to-white focus:bg-white transition-all duration-200 group-hover:border-teal-300"
                    placeholder="Enter Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
        
            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-xs sm:text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              > 
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-teal-300 group-hover:text-teal-200" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
        
            {/* Back to Login Button */}
            <div className="mt-3 sm:mt-4 text-center">
              <button
                type="button"
                className="font-medium text-xs sm:text-sm text-teal-600 hover:text-teal-700 transition-colors inline-flex items-center"
                onClick={() => setIsLogin(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to login
              </button>
            </div>
            <div className="pt-2 sm:pt-4 text-center text-xs text-gray-500 border-t border-gray-200 mt-4 sm:mt-6">
              {FOOTER_TEXT}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}