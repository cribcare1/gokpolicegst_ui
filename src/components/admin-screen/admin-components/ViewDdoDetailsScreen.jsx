"use client";
import { useState, useEffect } from 'react';
import { ChevronLeft, XCircle, Save, Edit, X,AlertCircle } from 'lucide-react';
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";

export default function DDODetailsView({ ddo, onBack }) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ddoData, setDdos] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  
  function getChangedFieldsWithBlanks(original = {}, updated = {}) {
    const result = {};
  
    for (const key in updated) {
      if (JSON.stringify(updated[key]) !== JSON.stringify(original?.[key])) {
        result[key] = updated[key];
      } else {
        result[key] = "";
      }
    }
  
    return result;
  }
  
  

  const editDdoProfileApi = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    const requestBody = getChangedFieldsWithBlanks(ddoData, formData)
    console.log("changed array "+requestBody);
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User ID not found in localStorage");
      setIsLoading(false);
      return;
    }

  //   const requestBody = {
  //         "name": changedData.name,
  //         "contactNumber": changedData.contactNumber,
  //         "contactPerson": changedData.contactPerson,
  //         "ddocode": changedData.ddocode,
  //         "responsiblePerson": changedData.responsiblePerson,
  //         "tanNumber": changedData.tanNumber,
  //         "designation": changedData.designation,
  //  };

    try {
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.DDO_DETAILS_EDITBUTTON+userId, requestBody);

      if (response.status === "success") {
        setSuccess(`DDO added successfully! Now you can upload Form 16 for ${formData.name}.`);
        handleCancel();
      } else {
        setError(`Failed to add DDO: ${response.message}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    const fields = Object.keys(formData);
    const newErrors = {};
    
    fields.forEach(field => {
      newErrors[field] = validateField(field, formData[field]);
    });
    
    setError(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'contactNumber':
        return /^\d{10}$/.test(value) ? '' : 'Contact number must be exactly 10 digits';
      case 'tanOfDDO':
        return /^[A-Z]{4}\d{5}[A-Z]$/.test(value) ? '' : 'Please enter a valid TAN (e.g., ABCD12345Z)';
        case 'ddoCode':
          return /^[a-zA-Z0-9]{1,11}$/.test(value) ? ''  : 'DDO Code must follow the format 02000OP001';
        
      default:
        return value.trim() ? '' : `${name.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + name.replace(/([A-Z])/g, ' $1').slice(1)} is required`;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setError("User not logged in");
          return;
        }

        const result = await ApiService.handleGetRequest(API_ENDPOINTS.GET_DDO_DETAILS + ddo.id);
        const ddoDetails = result.ddo_data;
        setDdos(ddoDetails);
        setFormData(ddoDetails); // Initialize form data with current DDO data
      } catch (err) {
        setError("Failed to fetch DDO data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (ddo?.id) {
      fetchData();
    }
  }, [ddo]);

  if (!ddo) return null;

  if (isLoading) {
    return <div className="p-6 text-center text-blue-600 font-medium">Loading DDO details...</div>;
  }

  // if (error) {
  //   return <div className="p-6 text-center text-red-600 font-medium">{error}</div>;
  // }

  if (!ddoData) {
    return null; // Or a loading/fallback UI
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleCancel = () => {
    setFormData(ddoData); // Reset form data to original
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-8xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold text-white">DDO Details</h2>
          <div className="flex gap-2">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors"
              >
                <Edit size={18} className="mr-1" /> Edit
              </button>
            )}
            <button 
              onClick={onBack}
              className="flex items-center bg-white text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
            >
              <ChevronLeft size={18} className="mr-1" /> Back
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="p-6">
          {/* DDO Basic Info Card */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">DDO Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-600 font-medium">DDO Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-800">{ddoData?.name || "N/A"}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">TAN</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="tanNumber"
                    value={formData.tanNumber || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-800">{ddoData?.tanNumber || "N/A"}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">DDO Code</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="ddocode"
                    value={formData.ddocode || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-800">{ddoData?.ddocode || "N/A"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Contact Person</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="text-base font-semibold text-gray-800">{ddoData?.contactPerson || "N/A"}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Contact Number</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactNumber"
                      value={formData.contactNumber || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="text-base font-semibold text-gray-800">{ddoData?.contactNumber || "N/A"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Responsible Officer */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Responsible Officer</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Responsible Person</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="responsiblePerson"
                      value={formData.responsiblePerson || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="text-base font-semibold text-gray-800">{ddoData?.responsiblePerson || "N/A"}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Designation</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="text-base font-semibold text-gray-800">{ddoData?.designation || "N/A"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 rounded">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-end border-t gap-3">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors flex items-center"
                disabled={isSaving}
              >
                <X size={18} className="mr-2" /> Cancel
              </button>
              <button 
                onClick={editDdoProfileApi}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-md hover:from-green-600 hover:to-green-700 transition-colors flex items-center"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : (
                  <>
                    <Save size={18} className="mr-2" /> Save
                  </>
                )}
  
              </button>
            </>
          ) : (
            <button 
              onClick={onBack}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-md hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center"
            >
              Close <XCircle size={18} className="ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}