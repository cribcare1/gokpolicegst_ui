"use client";
import React, { useState } from 'react';
import { useNetworkStatus } from '@/components/utils/network';
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { 
  Briefcase, 
  Phone, 
  User,
  AlertCircle,
  Building,
  Code,
  FileText,
  UserCheck
} from 'lucide-react';

const DdoForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isOnline = useNetworkStatus();

  const [errors, setErrors] = useState({
    tanOfDDO: '',
    nameOfDDO: '',
    ddoCode: '',
    contactPerson: '',
    contactNumber: '',
    responsiblePerson: '',
    designation: ''
  });

  const [ddoForm, setDdoForm] = useState({
    tanOfDDO: '',
    nameOfDDO: '',
    ddoCode: '',
    contactPerson: '',
    contactNumber: '',
    responsiblePerson: '',
    designation: ''
  });
  
  const validateField = (name, value) => {
    switch (name) {
      case 'contactNumber':
        return /^\d{10}$/.test(value) ? '' : 'Contact number must be exactly 10 digits';
      case 'tanOfDDO':
        return /^[A-Z]{4}\d{5}[A-Z]{1}$/.test(value) ? '' : 'Please enter a valid TAN (e.g., ABCD12345Z)';
      case 'ddoCode':
        return /^[a-zA-Z0-9]{1,11}$/.test(value) ? '' : 'DDO Code must follow the format 02000OP001';
      default:
        return value.trim() ? '' : `${name.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + name.replace(/([A-Z])/g, ' $1').slice(1)} is required`;
    }
  };

  const handleDdoFormChange = (e) => {
    const { name, value } = e.target;
    
    // Handle contact number input
    if (name === 'contactNumber') {
      const numbersOnly = value.replace(/\D/g, '');
      if (numbersOnly.length <= 10) {
        setDdoForm(prev => ({ ...prev, [name]: numbersOnly }));
        const error = validateField(name, numbersOnly);
        setErrors(prev => ({ ...prev, [name]: error }));
      }
      return;
    }

    // Handle TAN input - convert to uppercase
    if (name === 'tanOfDDO') {
      const uppercaseValue = value.toUpperCase();
      setDdoForm(prev => ({ ...prev, [name]: uppercaseValue }));
      const error = validateField(name, uppercaseValue);
      setErrors(prev => ({ ...prev, [name]: error }));
      return;
    }

    if (name === 'ddoCode') {
      const uppercaseValue = value.toUpperCase().slice(0, 11); // Ensure max 11 and uppercase
      setDdoForm(prev => ({ ...prev, [name]: uppercaseValue }));
      const error = validateField(name, uppercaseValue);
      setErrors(prev => ({ ...prev, [name]: error }));
      return;
    }

    // Default case for other fields
    setDdoForm(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
  const isFormValid = () => {
    const fields = Object.keys(ddoForm);
    const newErrors = {};
    
    fields.forEach(field => {
      newErrors[field] = validateField(field, ddoForm[field]);
    });
    
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleDdoSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User ID not found in localStorage");
      setLoading(false);
      return;
    }

    const requestBody = {
      "user": {
        "ddoTan": ddoForm.tanOfDDO,
        "fullName": ddoForm.nameOfDDO,
        "ddoCode": ddoForm.ddoCode,
        "contactPerson": ddoForm.contactPerson,
        "mobileNumber": ddoForm.contactNumber,
        "responsiblePerson": ddoForm.responsiblePerson,
        "designation": ddoForm.designation,
        "password": ddoForm.tanOfDDO+"@1",
      },
      "adminId": userId
    };

    try {
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.ADD_DDO_BYADMIN, requestBody);

      if (response.status === "success") {
        localStorage.setItem(LOGIN_CONSTANT.DDO_COUNT, response.ddoCount);
        setSuccess(`DDO added successfully! Now you can upload Form 16 for ${ddoForm.nameOfDDO}.`);
        setDdoForm({
          tanOfDDO: '',
          nameOfDDO: '',
          ddoCode: '',
          contactPerson: '',
          contactNumber: '',
          responsiblePerson: '',
          designation: ''
        });
      } else {
        setError(`Failed to add DDO: ${response.message}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if(!isOnline){
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <p className="text-red-600 text-center text-lg font-medium">
          Oops! It looks like you're offline. We'll reconnect once you're back online.❌
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-3 sm:p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
    <div className="max-w-8xl h-full mx-auto bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl transition-all duration-300 hover:shadow-2xl p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center mb-6 sm:mb-8 space-y-3 sm:space-y-0">
          <div className="bg-indigo-100 dark:bg-indigo-900 p-3 sm:p-4 rounded-xl mr-0 sm:mr-5 w-14 h-14 flex items-center justify-center">
            <Briefcase size={24} className="text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Add DDO</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Add Drawing and Disbursing Officer details for Form-16 uploads</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded text-sm sm:text-base">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 rounded text-sm sm:text-base">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0 sm:w-5 sm:h-5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <p>{success}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleDdoSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5 text-sm font-medium">TAN of DDO</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Code size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="tanOfDDO"
                  value={ddoForm.tanOfDDO}
                  onChange={handleDdoFormChange}
                  className={`w-full h-10 sm:h-12 pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border ${errors.tanOfDDO ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all`} 
                  required
                  placeholder="Enter TAN (e.g., ABCD12345Z)"
                  maxLength={10}
                />
              </div>
              {errors.tanOfDDO && <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-red-500">{errors.tanOfDDO}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5 text-sm font-medium">Name of The DDO</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="nameOfDDO"
                  value={ddoForm.nameOfDDO}
                  onChange={handleDdoFormChange}
                  className={`w-full h-10 sm:h-12 pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border ${errors.nameOfDDO ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all`} 
                  required
                  placeholder="Enter DDO name"
                />
              </div>
              {errors.nameOfDDO && <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-red-500">{errors.nameOfDDO}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5 text-sm font-medium">DDO Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FileText size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="ddoCode"
                  value={ddoForm.ddoCode}
                  onChange={handleDdoFormChange}
                  className={`w-full h-10 sm:h-12 pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border ${errors.ddoCode ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all`} 
                  required
                  placeholder="Enter DDO code"
                />
              </div>
              {errors.ddoCode && <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-red-500">{errors.ddoCode}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5 text-sm font-medium">Contact Person</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="contactPerson"
                  value={ddoForm.contactPerson}
                  onChange={handleDdoFormChange}
                  className={`w-full h-10 sm:h-12 pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border ${errors.contactPerson ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all`} 
                  required
                  placeholder="Enter contact person name"
                />
              </div>
              {errors.contactPerson && <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-red-500">{errors.contactPerson}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5 text-sm font-medium">Contact Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Phone size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
                <input 
                  type="tel" 
                  name="contactNumber"
                  value={ddoForm.contactNumber}
                  onChange={handleDdoFormChange}
                  maxLength={10}
                  className={`w-full h-10 sm:h-12 pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border ${errors.contactNumber ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all`}
                  required
                  placeholder="Enter 10-digit contact number"
                />
              </div>
              {errors.contactNumber && <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-red-500">{errors.contactNumber}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5 text-sm font-medium">Responsible Person</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserCheck size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="responsiblePerson"
                  value={ddoForm.responsiblePerson}
                  onChange={handleDdoFormChange}
                  className={`w-full h-10 sm:h-12 pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border ${errors.responsiblePerson ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all`} 
                  required
                  placeholder="Enter responsible person name"
                />
              </div>
              {errors.responsiblePerson && <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-red-500">{errors.responsiblePerson}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5 text-sm font-medium">Designation</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Building size={16} className="text-gray-500 dark:text-gray-400" />
              </div>
              <input 
                type="text" 
                name="designation"
                value={ddoForm.designation}
                onChange={handleDdoFormChange}
                className={`w-full h-10 sm:h-12 pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border ${errors.designation ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all`}
                required
                placeholder="Enter designation"
              />
            </div>
            {errors.designation && <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-red-500">{errors.designation}</p>}
          </div>
          
          <div className="pt-2 sm:pt-4">
            <button 
              type="submit"
              disabled={loading || Object.values(errors).some(error => error !== '')}
              className={`w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm sm:text-base font-medium rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center ${(loading || Object.values(errors).some(error => error !== '')) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Submit DDO Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DdoForm;