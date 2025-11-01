"use client";
import { useNetworkStatus } from '@/components/utils/network';
import React, { useState, useEffect } from "react";
import { Upload, X, Check, AlertTriangle, Loader } from 'lucide-react';
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { LOGIN_CONSTANT } from "@/components/utils/constant";

export default function UploadForm({ formType = "Form 16A" }) {
  const [ddoData, setDdos] = useState(null);
  const [fiscalYear, setFiscalYear] = useState('2024-25');
  const [selectedTAN, setSelectedTAN] = useState('Select TAN');
  const [getDDOId, setDDOId] = useState('');
  const [ddoName, setDdoName] = useState('');
  const [uploadStatus, setUploadStatus] = useState({ success: false, error: false });
  const [fileName, setFileName] = useState('');
  const [form16File, setForm16File] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isOnline = useNetworkStatus();

  const isValidTAN = () => {
    return selectedTAN && selectedTAN !== 'Select TAN';
  };

  const handleCancel = () => {
    setSelectedTAN('Select TAN');
    setDDOId('');
    setDdoName('');
    setFileName('');
    setForm16File('');
    setUploadStatus({ success: false, error: false });
    setError('');
  };
  
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

  const uploadForm16API = async () => {
    // Add validation check
    if (!isValidTAN()) {
      setError("Please select a valid TAN before uploading");
      setUploadStatus({ success: false, error: true });
      return;
    }
    
    if (!form16File) {
      setError("Please select a file to upload");
      setUploadStatus({ success: false, error: true });
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const requestBody = {
      financialYear: fiscalYear,
      tanNumber: selectedTAN,
      type: "form16a",
    };

    try {
      const response = await ApiService.handlePostMultiPartFileRequest(
        API_ENDPOINTS.FORM16_DOWNLOAD_PDF,
        requestBody,
        form16File
      );

      if (response.status === "success") {
        localStorage.setItem(LOGIN_CONSTANT.FORM_16A_COUNT, response.form16ACount);
        setUploadStatus({ success: true, error: false });
        setSuccess(response.message);
        handleCancel();
      } else {
        setUploadStatus({ success: false, error: true });
        setError(response.message || "An error occurred while uploading");
      }
    } catch (err) {
      setError(err.message || "An error occurred while uploading");
      setUploadStatus({ success: false, error: true });
    } finally {
      setIsLoading(false);
    }
  };
  
  if(!isOnline){
    return (<div><p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p></div>);
  }

  const handleUpload = (e) => {
    e.preventDefault();
    
    if (!isValidTAN()) {
      setError("Please select a valid TAN before uploading");
      setUploadStatus({ success: false, error: true });
      return;
    }
    
    if (!form16File) {
      setError("Please select a file to upload");
      setUploadStatus({ success: false, error: true });
      return;
    }
    
    uploadForm16API();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension !== 'zip' && fileExtension !== 'pdf') {
        setUploadStatus({ success: false, error: true });
        setError("Only ZIP and PDF files are allowed.");
        setFileName('');
        setForm16File('');
        alert("❌ Invalid file type. Please upload only .zip or .pdf files.");
        return;
      }
      setForm16File(file);
      setFileName(file.name);
      setUploadStatus({ success: false, error: false });
      setError('');
    }
  };
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension !== 'zip' && fileExtension !== 'pdf') {
        setUploadStatus({ success: false, error: true });
        setError("Only ZIP and PDF files are allowed.");
        setFileName('');
        setForm16File('');
        alert("❌ Invalid file type. Please upload only .zip or .pdf files.");
        return;
      }
      setForm16File(file);
      setFileName(file.name);
      setUploadStatus({ success: false, error: false });
      setError('');
    }
  };

  const handleChange = (e) => {
    const selectedId = e.target.value;
    setDDOId(selectedId);

    const selectedData = ddoData.find(item => item.id.toString() === selectedId);
    if (selectedData) {
      setSelectedTAN(selectedData.tanNumber);
      setDdoName(selectedData.fullName);
    }
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
          <div className="flex flex-col items-center">
            <Loader className="animate-spin text-indigo-600" size={40} />
            <p className="mt-2 text-sm text-gray-600">Please wait...</p>
          </div>
        </div>
      )}

      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 py-5 px-6">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
                <Upload className="mr-3 flex-shrink-0" size={24} />
                Upload {formType}
              </h2>
              <p className="text-indigo-100 text-sm mt-1">Complete the form below to upload your files</p>
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
            <form onSubmit={handleUpload} className="p-5 md:p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Select Fiscal Year</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-800 bg-white"
                      value={fiscalYear}
                      onChange={(e) => setFiscalYear(e.target.value)}
                    >
                      <option value="2024-25">2024-25</option>
                      <option value="2023-24">2023-24</option>
                      <option value="2022-23">2022-23</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Select TAN<span className="text-red-500">*</span></label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-800 bg-white"
                      value={getDDOId}
                      onChange={handleChange}
                    >
                      <option value="">{selectedTAN}</option>
                      {ddoData?.map(data => (
                        <option key={data.id} value={data.id}>{data.tanNumber}</option>
                      )) || <option value="example">Example DDO</option>}
                    </select>
                    {!isValidTAN() && uploadStatus.error && (
                      <p className="text-xs text-red-500 mt-1">Please select a valid TAN</p>
                    )}
                  </div>
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

                <div className="mt-8">
                  <div
                    className={`relative border-2 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300'} 
                    rounded-lg p-8 text-center hover:border-indigo-400 transition-all 
                    ${fileName ? 'border-indigo-300 bg-indigo-50/30' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                    <div className="flex flex-col items-center justify-center">
                      <div className={`p-3 rounded-full ${fileName ? 'bg-indigo-100' : 'bg-indigo-50'} mb-3`}>
                        <Upload className={`${fileName ? 'text-indigo-600' : 'text-indigo-400'}`} size={28} />
                      </div>
                      {fileName ? (
                        <div>
                          <p className="font-semibold text-indigo-600">{fileName}</p>
                          <p className="text-xs text-gray-500 mt-1">File selected for upload</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600 font-medium">Drag and drop your files here</p>
                          <p className="text-sm text-gray-500 mt-1">or <span className="text-indigo-600 font-medium">browse files</span></p>
                          <p className="text-xs text-gray-400 mt-2">Supported formats: ZIP, PDF</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {uploadStatus.success && (
                  <div className="mt-2 flex items-center p-2 rounded-lg bg-green-50 text-green-700 font-medium">
                    <Check className="mr-2 flex-shrink-0" size={18} />
                    <span>Files uploaded successfully!</span>
                  </div>
                )}

                {uploadStatus.error && (
                  <div className="mt-2 flex items-center p-2 rounded-lg bg-red-50 text-red-600 font-medium">
                    <AlertTriangle className="mr-2 flex-shrink-0" size={18} />
                    <span>{error || "Please complete all required fields"}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center justify-center"
                  >
                    <X className="mr-2" size={18} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={`px-5 py-2.5 ${isValidTAN() && form16File ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'} text-white rounded-lg font-medium transition-colors flex items-center justify-center shadow-sm hover:shadow`}
                    onClick={uploadForm16API}
                    disabled={!isValidTAN() || !form16File}
                  >
                    <Upload className="mr-2" size={18} />
                    Upload Files
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}