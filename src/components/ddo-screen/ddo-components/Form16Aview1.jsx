"use client";
import { useEffect, useState } from "react";
import {Search, Download, FileText, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, RefreshCw, AlertCircle} from "lucide-react";
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { ArrowLeft } from "lucide-react";
import { LOGIN_CONSTANT } from "@/components/utils/constant";
import { useNetworkStatus } from '@/components/utils/network';

export default function Form16AStatement({ fiscalYear, onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState("");
  const [form16Data, setformEntries] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const userName = localStorage.getItem(LOGIN_CONSTANT.DDO_USER_NAME);
  const tanNumber = localStorage.getItem(LOGIN_CONSTANT.DDO_TAN_NUMBER);
  const isOnline = useNetworkStatus();

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const requestBody = {
        financialYear: fiscalYear,
        tanNumber: tanNumber,
        formType: "form16a",
      };
  
      try {
        const response = await ApiService.handlePostRequest(API_ENDPOINTS.REPORT_DETAILS, requestBody);
  
        if (response.status === "success") {
          const reportList = response.files || [];
          setformEntries(reportList);
          setFilteredData(reportList);
        } else {
          setError(`❌ Error: ${response.message}`);
        }
      } catch (err) {
        setError(err.message || "An error occurred while uploading");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const downloadForm16 = async (isDownloadAll = false) => {
    setIsLoading(true);
    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);
    setSuccess(null);
    
    let keysArray;
    if (isDownloadAll) {
      // For download all, use all files in filteredData
      keysArray = [...filteredData];
    } else {
      // For selected download, use only selected files
      keysArray = Object.keys(selectedFiles).filter(key => selectedFiles[key]);
    }
    
    // Always use zip format when downloading multiple files
    const fileType = keysArray.length > 1 ? "zip" : keysArray[0];

    const requestBody = {
      financialYear: fiscalYear,
      tanNumber: tanNumber,
      formType: "form16a",
      fileNames: keysArray,
    };

    try {
      // Simulate download progress (in a real app, you'd get this from the API)
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          const newProgress = prev + (100 - prev) * 0.1;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 300);
      
      const response = await ApiService.handlePostDownloadZipRequest(API_ENDPOINTS.FORM16_DOWNLOAD, requestBody, fileType);
      
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      if (response.status === 200) {
        setSuccess('Form 16A downloaded successfully');
        // Reset all checkboxes after successful download
        setSelectedFiles({});
        setSelectAll(false);
        
        // Reset progress after a short delay to show 100%
        setTimeout(() => {
          setDownloadProgress(0);
          setIsDownloading(false);
        }, 1500);
      } else {
        setError(`❌ Error: ${response.message}`);
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    } catch (err) {
      setError(err.message || "An error occurred while downloading");
      setIsDownloading(false);
      setDownloadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filtered = form16Data.filter(ddo =>
      ddo?.toLowerCase().includes(searchQuery.toLowerCase()) 
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchQuery, form16Data]);

  const toggleFormSelection = (id) => {
    setSelectedFiles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedFiles({});
    } else {
      const allFiles = {};
      filteredData.forEach(item => {
        allFiles[item] = true;
      });
      setSelectedFiles(allFiles);
    }
    setSelectAll(!selectAll);
  };

  const handleDownload = () => {
    const selectedCount = Object.keys(selectedFiles).filter(id => selectedFiles[id]).length;
    
    if (selectedCount === 0) {
      setError("Please select at least one file to download");
      return;
    }
    downloadForm16(false);
  };

  const handleDownloadAll = () => {
    if (filteredData.length === 0) {
      setError("No files available to download");
      return;
    }
    
    // Call downloadForm16 with isDownloadAll=true to download all files
    downloadForm16(true);
  };

  // Check if any files are available for download
  const hasFiles = filteredData.length > 0;
  // Check if any files are selected
  const hasSelectedFiles = Object.keys(selectedFiles).filter(id => selectedFiles[id]).length > 0;

  if(!isOnline){
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <p className="text-red-600 text-center">
          Oops! It looks like you're offline. We'll reconnect once you're back online.❌
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-2 sm:p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 sm:p-8">
          <div className="flex items-center mb-2">
            <button 
              onClick={onBack}
              className="p-2 rounded-full hover:bg-indigo-500 transition-colors mr-3"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl sm:text-3xl font-bold">Form 16A Statement</h2>
          </div>
          <p className="text-indigo-100 text-sm sm:text-base">Tax Credit Details for FY {fiscalYear}</p>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-8">
          {/* Info Bar */}
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-3 sm:p-5 mb-6 sm:mb-8 rounded-xl border border-indigo-100 flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center shadow-sm">
            <div className="flex items-center px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base w-full sm:w-auto">
              <span className="font-semibold text-indigo-800 mr-2">FY:</span>
              <span className="text-indigo-700">{fiscalYear}</span>
            </div>
            <div className="flex items-center px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base w-full sm:w-auto">
              <span className="font-semibold text-indigo-800 mr-2">TAN:</span>
              <span className="text-indigo-700">{tanNumber}</span>
            </div>
            <div className="flex items-center px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base w-full sm:w-auto">
              <span className="font-semibold text-indigo-800 mr-2">Deductor:</span>
              <span className="text-indigo-700 break-all">{userName}</span>
            </div>
          </div>
          
          {/* Loading indicator - No top progress bar, just a loading spinner when loading data */}
          {isLoading && !isDownloading && (
            <div className="flex justify-center mb-6">
              <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
            </div>
          )}
          
          {/* Search Field */}
          <div className="mb-6 sm:mb-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search by PAN..." 
              className="w-full pl-10 sm:pl-12 p-3 sm:p-4 bg-indigo-50 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800 text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded text-sm sm:text-base">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 rounded text-sm sm:text-base">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>{success}</p>
              </div>
            </div>
          )}
          
          {/* Table - Responsive Table Container */}
          <div className="overflow-x-auto mb-6 sm:mb-8 rounded-xl border-2 border-indigo-100 shadow-sm">
            <table className="w-full border-collapse bg-white text-sm sm:text-base">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-800">
                  <th className="border-b p-2 sm:p-4 text-left font-semibold">SI No</th>
                  <th className="border-b p-2 sm:p-4 text-left font-semibold">Form16</th>
                  <th className="border-b p-2 sm:p-4 text-left font-semibold w-20">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 mr-1 sm:mr-2 cursor-pointer"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        disabled={!hasFiles}
                        aria-label="Select all"
                      />
                      <span className="hidden sm:inline">Select</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.slice(startIndex, startIndex + itemsPerPage).map((item, index) => (
                    <tr key={index} className="hover:bg-indigo-50 transition-colors">
                      <td className="border-b p-2 sm:p-4">
                        <span className="font-medium">{startIndex + index + 1}</span>
                      </td>
                      <td className="border-b p-2 sm:p-4 font-medium text-gray-800 break-all">
                        {item}
                      </td>
                      <td className="border-b p-2 sm:p-4 text-left">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            checked={!!selectedFiles[item]}
                            onChange={() => toggleFormSelection(item)}
                            aria-label={`Select ${item}`}
                          />
                        </label>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="border-b p-4 sm:p-5 text-center text-gray-500">
                      No records found matching your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-2">
            <div className="text-indigo-800 font-medium text-sm sm:text-base">
              Total Records: {filteredData.length}
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="p-1 sm:p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1 || !hasFiles}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 sm:px-4 py-1 sm:py-2 bg-indigo-200 text-indigo-800 rounded-lg font-medium text-sm sm:text-base">
                {currentPage}
              </span>
              <button 
                className="p-1 sm:p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage * itemsPerPage >= filteredData.length || !hasFiles}
                onClick={() => setCurrentPage(prev => prev + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          {/* Download Progress Bar - This is the only progress bar we'll keep */}
          {isDownloading && (
            <div className="mb-6 sm:mb-8">
              <div className="w-full h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-in-out"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-indigo-600 mt-2 text-center font-medium">
                {downloadProgress < 100 
                  ? `Downloading... ${Math.round(downloadProgress)}%` 
                  : 'Download Complete!'}
              </p>
            </div>
          )}
          
          {/* Action Buttons - Stack on Mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button 
              className={`bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium shadow-md transition-colors flex items-center justify-center text-sm sm:text-base ${
                hasSelectedFiles && !isDownloading 
                  ? 'hover:from-indigo-700 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={handleDownload}
              disabled={!hasSelectedFiles || isDownloading}
            >
              <Download size={18} className="mr-2 sm:mr-3" />
              Download Selected
            </button>
            <button 
              className={`bg-gradient-to-r from-violet-600 to-violet-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium shadow-md transition-colors flex items-center justify-center text-sm sm:text-base ${
                hasFiles && !isDownloading 
                  ? 'hover:from-violet-700 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={handleDownloadAll}
              disabled={!hasFiles || isDownloading}
            >
              <Download size={18} className="mr-2 sm:mr-3" />
              Download All
            </button>
            <button 
              className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium shadow-md hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors flex items-center justify-center text-sm sm:text-base"
              onClick={onBack}
              disabled={isDownloading}
            >
              <ArrowLeft size={18} className="mr-2 sm:mr-3" />
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}