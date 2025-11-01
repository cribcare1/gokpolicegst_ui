"use client";
import { useNetworkStatus } from '@/components/utils/network';
import React, { useState, useEffect, useRef } from "react";
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { LOGIN_CONSTANT } from "@/components/utils/constant";

export default function ChangePasswordForm() {
  const [ddoData, setDdos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordStrength, setPasswordStrength] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isOnline = useNetworkStatus();
  const [getDDOId, setDDOId] = useState('');
  const [selectedTAN, setSelectedTAN] = useState('Select TAN');
  const [ddoName, setDdoName] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    ddoTan: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("User ID not found in localStorage");
        return;
      }

      try {
        setIsLoading(true);
        const result = await ApiService.handleGetRequest(API_ENDPOINTS.GET_ALL_DDO);
        setDdos(result.ddoList || []);
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const resetPassword = async () => {
    setMessage({ type: '', text: '' });
    setLoading(true);
    setError(null);
    
    const requestBody = {
      userName: selectedTAN, 
      password: formData.newPassword,
    };
    
    try {
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.RESET_DDO_PASSWORD, requestBody);
      
      if (response.status === "success") {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        
        // Reset form
        setFormData({
          ddoTan: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordStrength('');
        setSelectedTAN('Select TAN');
        setDdoName('');
        setSearchTerm('');
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to change password' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Check password strength if the new password field is being updated
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    // Simple password strength checker
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    if (strength < 2) {
      setPasswordStrength('weak');
    } else if (strength < 4) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.newPassword || !formData.confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (passwordStrength === 'weak') {
      setMessage({ type: 'error', text: 'Please choose a stronger password' });
      return;
    }
    
    if (selectedTAN === 'Select TAN') {
      setMessage({ type: 'error', text: 'Please Select TAN to change the password' });
      return;
    }
  
    resetPassword();
  };

  const handleTANSelect = (tanData) => {
    setDDOId(tanData.id.toString());
    setSelectedTAN(tanData.tanNumber);
    setDdoName(tanData.fullName);
    setFormData({...formData, ddoTan: tanData.tanNumber});
    setShowDropdown(false);
    setSearchTerm(tanData.tanNumber);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    
    if (e.target.value === '') {
      setSelectedTAN('Select TAN');
      setDdoName('');
      setDDOId('');
    }
  };

  // Filter DDO data based on search term
  const filteredDDOs = ddoData?.filter(ddo => 
    ddo.tanNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ddo.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!isOnline) {
    return (
      <div>
        <p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {message.text && (
          <div className={`p-4 rounded-md ${
            message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="space-y-1 relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700">Search and Select TAN</label>
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-800 bg-white pr-10"
              placeholder="Search by TAN number or name..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
            />
            {searchTerm && (
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTAN('Select TAN');
                  setDdoName('');
                  setDDOId('');
                }}
              >
                ✕
              </button>
            )}
          </div>
          
          {showDropdown && filteredDDOs.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : (
                filteredDDOs.map(ddo => (
                  <div 
                    key={ddo.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                    onClick={() => handleTANSelect(ddo)}
                  >
                    <span className="font-medium">{ddo.tanNumber}</span>
                    <span className="text-sm text-gray-600">{ddo.fullName}</span>
                  </div>
                ))
              )}
            </div>
          )}
          
          {showDropdown && searchTerm && filteredDDOs.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <div className="p-4 text-center text-gray-500">No matching TAN found</div>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">DDO Name</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            value={ddoName}
            readOnly
          />
        </div>
        
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 pr-10"
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500"
            >
              {showNewPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {passwordStrength && (
            <div className="mt-1">
              <div className="flex items-center">
                <span className="text-xs mr-2">Password strength:</span>
                <div className="h-1.5 w-full bg-gray-200 rounded-full">
                  <div 
                    className={`h-1.5 rounded-full ${
                      passwordStrength === 'weak' ? 'w-1/4 bg-red-500' : 
                      passwordStrength === 'medium' ? 'w-2/4 bg-yellow-500' : 
                      'w-3/4 bg-green-500'
                    }`}
                  ></div>
                </div>
                <span className="ml-2 text-xs">
                  {passwordStrength === 'weak' ? 'Weak' : 
                   passwordStrength === 'medium' ? 'Medium' : 
                   'Strong'}
                </span>
              </div>
              {passwordStrength === 'weak' && (
                <p className="text-xs text-red-600 mt-1">
                  Use at least 8 characters with uppercase, lowercase, numbers, and symbols
                </p>
              )}
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 pr-10"
              placeholder="Confirm new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500"
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
          )}
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}