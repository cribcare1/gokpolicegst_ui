"use client";
import { useEffect, useState } from "react";
import {Search, Download, FileText, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, RefreshCw, AlertCircle} from "lucide-react";
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { ArrowLeft } from "lucide-react";
import {LOGIN_CONSTANT} from "@/components/utils/constant";
import { useNetworkStatus } from '@/components/utils/network';


export default function Form16Statement({ fiscalYear, onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState({});
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
        formType: "form16",
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
        setError(err.message || "An error occurred while fetching data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const simulateDownloadProgress = () => {
    setDownloadProgress(0);
    setIsDownloading(true);
    
    // Create a progress simulator that doesn't reach 100% until download completes
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 5) + 1;
      if (progress > 95) progress = 95; // Cap at 95% until complete
      setDownloadProgress(progress);
    }, 300);
    
    return interval;
  };

  const downloadForm16 = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    // Get array of selected file names
    const selectedFileNames = Object.keys(selectedFiles).filter(key => selectedFiles[key]);
    
    if (selectedFileNames.length === 0) {
      setError("No files selected for download");
      setIsLoading(false);
      return;
    }
    
    const fileType = selectedFileNames.length === 1 ? selectedFileNames[0] : "zip";
    
    const requestBody = {
      financialYear: fiscalYear,
      tanNumber: tanNumber,
      formType: "form16",
      fileNames: selectedFileNames,
    };

    try {
      // Start progress simulation - store interval ID 
      const progressInterval = simulateDownloadProgress();
      
      const response = await ApiService.handlePostDownloadZipRequest(API_ENDPOINTS.FORM16_DOWNLOAD, requestBody, fileType);
      
      // Clear interval and set to 100% only after download completes
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      if (response.status === 200) {
        setSuccess('Form 16 downloaded successfully');
        // Reset all checkboxes after successful download
        setSelectedFiles({});
        setSelectAll(false);
      } else {
        setError(`❌ Error: ${response.message}`);
      }
    } catch (err) {
      setError(err.message || "An error occurred while downloading");
    } finally {
      // Keep the progress bar at 100% for a moment before hiding
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
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

  // Handle select all toggle
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

  // Handle download action
  const handleDownload = () => {
    const selectedCount = Object.keys(selectedFiles).filter(id => selectedFiles[id]).length;
    
    if (selectedCount === 0) {
      alert("Please select at least one file to download");
      return;
    }
    downloadForm16();
  };

  // Handle download all action
  const handleDownloadAll = () => {
    if (filteredData.length === 0) {
      alert("No files available to download");
      return;
    }
    
    // Instead of updating state, directly pass the file names to download
    const requestBody = {
      financialYear: fiscalYear,
      tanNumber: tanNumber,
      formType: "form16",
      fileNames: filteredData, // Use all filtered data directly
    };
    
    // Call download function directly with all files
    downloadAllFiles(requestBody);
  };
  
  // Separate function for downloading all files
  const downloadAllFiles = async (requestBody) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    if (!requestBody.fileNames || requestBody.fileNames.length === 0) {
      setError("No files available to download");
      setIsLoading(false);
      return;
    }
    
    const fileType = "zip"; // Always use zip for all files
    
    try {
      // Start progress simulation
      setDownloadProgress(0);
      setIsDownloading(true);
      
      // Create a progress simulator that doesn't reach 100% until download completes
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 5) + 1;
        if (progress > 95) progress = 95; // Cap at 95% until complete
        setDownloadProgress(progress);
      }, 300);
      
      const response = await ApiService.handlePostDownloadZipRequest(API_ENDPOINTS.FORM16_DOWNLOAD, requestBody, fileType);
      
      // Clear interval and set to 100% only after download completes
      clearInterval(interval);
      setDownloadProgress(100);
      
      if (response.status === 200) {
        setSuccess('Form 16 downloaded successfully');
      } else {
        setError(`❌ Error: ${response.message}`);
      }
    } catch (err) {
      setError(err.message || "An error occurred while downloading");
    } finally {
      // Keep the progress bar at 100% for a moment before hiding
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
      setIsLoading(false);
    }
  };

  // Check if there are any records
  const hasRecords = filteredData.length > 0;
  
  // Check if any files are selected
  const hasSelectedFiles = Object.keys(selectedFiles).filter(id => selectedFiles[id]).length > 0;

  if(!isOnline){
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <p className="text-red-600 text-center font-medium">
          Oops! It looks like you're offline. We'll reconnect once you're back online.❌  
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-2 sm:p-6">
      <div className="w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 sm:p-8">
          <div className="flex items-center mb-2">
            <button 
              onClick={onBack}
              className="p-1 sm:p-2 rounded-full hover:bg-indigo-500 transition-colors mr-2 sm:mr-3"
              aria-label="Go back"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <h2 className="text-xl sm:text-3xl font-bold">Form 16 Statement</h2>
          </div>
          <p className="text-indigo-100 text-sm sm:text-base">Tax Credit Details for FY {fiscalYear}</p>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-8">
          {/* Info Bar */}
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-3 sm:p-5 mb-4 sm:mb-8 rounded-lg sm:rounded-xl border border-indigo-100 flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center shadow-sm gap-2">
            <div className="flex items-center px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base">
              <span className="font-semibold text-indigo-800 mr-2">FY:</span>
              <span className="text-indigo-700">{fiscalYear}</span>
            </div>
            <div className="flex items-center px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base">
              <span className="font-semibold text-indigo-800 mr-2">TAN:</span>
              <span className="text-indigo-700">{tanNumber}</span>
            </div>
            <div className="flex items-center px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base">
              <span className="font-semibold text-indigo-800 mr-2">Deductor:</span>
              <span className="text-indigo-700">{userName}</span>
            </div>
          </div>
          
          {/* Loading Bar (only for data loading, not for downloads) */}
          {isLoading && !isDownloading && (
            <div className="w-full h-1 overflow-hidden bg-gray-200 relative mb-4">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 animate-[progress_2s_linear_infinite]" />
              <style jsx>{`
                @keyframes progress {
                  0% {
                    left: -100%;
                  }
                  100% {
                    left: 100%;
                  }
                }
              `}</style>
            </div>
          )}
          
          {/* Search Field */}
          <div className="mb-4 sm:mb-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search by PAN..." 
              className="w-full pl-10 sm:pl-12 p-3 sm:p-4 bg-indigo-50 border-2 border-indigo-100 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800 text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Alert Messages */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded text-sm sm:text-base">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 rounded text-sm sm:text-base">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:mr-2 mr-1 sm:w-5 sm:h-5 w-4 h-4">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>{success}</p>
              </div>
            </div>
          )}
          
          {/* Table - Responsive approach */}
          <div className="overflow-x-auto mb-4 sm:mb-8 rounded-lg sm:rounded-xl border-2 border-indigo-100 shadow-sm">
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
                        aria-label="Select all"
                        disabled={!hasRecords}
                      />
                      <span className="hidden sm:inline">Select</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.slice(startIndex, startIndex + itemsPerPage).map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-indigo-50 transition-colors">
                      <td className="border-b p-2 sm:p-4">
                        <span className="font-medium">{startIndex + index + 1}</span>
                      </td>
                      <td className="border-b p-2 sm:p-4 font-medium text-gray-800 break-words">
                        <span className="block truncate max-w-[150px] sm:max-w-none">{item}</span>
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
                    <td colSpan="3" className="border-b p-3 sm:p-5 text-center text-gray-500">
                      No records found matching your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8 gap-2">
            <div className="text-indigo-800 font-medium text-sm sm:text-base order-2 sm:order-1">
              Total Records: {filteredData.length}
            </div>
            <div className="flex items-center space-x-2 order-1 sm:order-2">
              <button 
                className="p-1 sm:p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <span className="px-3 py-1 sm:px-4 sm:py-2 bg-indigo-200 text-indigo-800 rounded-lg font-medium text-sm sm:text-base">
                {currentPage}
              </span>
              <button 
                className="p-1 sm:p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage * itemsPerPage >= filteredData.length}
                onClick={() => setCurrentPage(prev => prev + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          
          {/* Download Progress - Moved above the buttons */}
          {isDownloading && (
            <div className="mb-4 sm:mb-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-indigo-700">Downloading files...</span>
                <span className="text-sm font-medium text-indigo-700">{downloadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-violet-500 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <button 
              className={`bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium shadow-md transition-colors flex items-center justify-center text-sm sm:text-base ${
                hasSelectedFiles && !isDownloading ? 
                "hover:from-indigo-700 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" : 
                "opacity-50 cursor-not-allowed"
              }`}
              onClick={handleDownload}
              disabled={!hasSelectedFiles || isDownloading}
            >
              <Download size={16} className="mr-2 sm:mr-3 sm:w-5 sm:h-5" />
              Download Selected
            </button>
            <button 
              className={`bg-gradient-to-r from-violet-600 to-violet-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium shadow-md transition-colors flex items-center justify-center text-sm sm:text-base ${
                hasRecords && !isDownloading ? 
                "hover:from-violet-700 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500" : 
                "opacity-50 cursor-not-allowed"
              }`}
              onClick={handleDownloadAll}
              disabled={!hasRecords || isDownloading}
            >
              <Download size={16} className="mr-2 sm:mr-3 sm:w-5 sm:h-5" />
              Download All
            </button>
            <button 
              className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium shadow-md hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors flex items-center justify-center text-sm sm:text-base"
              onClick={onBack}
            >
              <ArrowLeft size={16} className="mr-2 sm:mr-3 sm:w-5 sm:h-5" />
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}