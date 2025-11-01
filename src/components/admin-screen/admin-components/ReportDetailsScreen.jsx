"use client";

import { useEffect, useState } from "react";
import {Search,Download,FileText,ChevronFirst,ChevronLast,ChevronLeft,ChevronRight,RefreshCw, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { useNetworkStatus } from '@/components/utils/network';

export default function Form16View({ fiscalYear, selectedTAN, ddoName, formType, setViewMode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedForms, setSelectedForms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState('');
  const [formEntries, setformEntries] = useState([]);
  const [filteredEntries, setFilteredData] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const isOnline = useNetworkStatus();
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const requestBody = {
        financialYear: fiscalYear,
        tanNumber: selectedTAN,
        formType: formType,
      };

      try {
        const response = await ApiService.handlePostRequest(API_ENDPOINTS.REPORT_DETAILS, requestBody);

        if (response.status === "success") {
          const reportList = response.files || []; 
          setformEntries(reportList);
          setFilteredData(reportList);
          setSuccess(response.message);
        } else {
         setError(response.message)
        }
      } catch (err) {
        setError(err.message || "An error occurred while uploading");
       
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if(!isOnline){
    return (<div><p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p></div>);
   }

  const downloadForm16 = async (filesToDownload) => {
    setIsLoading(true);
    setError(null);
    const keysArray = filesToDownload;
    const fileType = filesToDownload.length === 1 ? keysArray[0] : "zip";
    const requestBody = {
      financialYear: fiscalYear,
      tanNumber: selectedTAN,
      formType: formType,
      fileNames: keysArray,
    };

    try {
      const response = await ApiService.handlePostDownloadZipRequest(API_ENDPOINTS.FORM16_DOWNLOAD, requestBody, fileType);
      console.log(response);
      if (response.status === 200) {
        setSuccess('Form 16 downloaded successfully');
        // Reset selections after successful download
        setSelectedForms([]);
        setSelectAll(false);
      } else {
        setError(`❌ Error: ${response.message}`);
      }
    } catch (err) {
      setError(err.message || "An error occurred while downloading");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    const filtered = formEntries.filter(ddo =>
      ddo?.toLowerCase().includes(searchTerm.toLowerCase()) 
    );
    setFilteredData(filtered);
    setCurrentPage(1);
    
    // Update selectAll state when filter changes
    setSelectAll(false);
  }, [searchTerm, formEntries]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

  const toggleFormSelection = (formName) => {
    setSelectedForms((prev) =>
      prev.includes(formName)
        ? prev.filter((name) => name !== formName)
        : [...prev, formName]
    );
  };
  
  // Handle select all for current page
  const handleSelectAllChange = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    if (newSelectAll) {
      // Add all current page items to selection if they're not already selected
      const updatedSelection = [...selectedForms];
      paginatedEntries.forEach(entry => {
        if (!updatedSelection.includes(entry)) {
          updatedSelection.push(entry);
        }
      });
      setSelectedForms(updatedSelection);
    } else {
      // Remove all current page items from selection
      setSelectedForms(selectedForms.filter(
        name => !paginatedEntries.includes(name)
      ));
    }
  };

  // Check if all items on the current page are selected
  useEffect(() => {
    const allCurrentPageSelected = paginatedEntries.length > 0 && 
      paginatedEntries.every(entry => selectedForms.includes(entry));
    setSelectAll(allCurrentPageSelected);
  }, [selectedForms, paginatedEntries]);

  const handleClear = () => {
    setSearchTerm("");
    setCurrentPage(1);
    setSelectedForms([]);
    setSelectAll(false);
  };

  const handleDownloadSelected = () => {
    if (selectedForms.length === 0) {
      setError("Please select at least one form to download");
      return;
    }
    
    // Use current selectedForms directly instead of depending on state update
    downloadForm16(selectedForms);
  };

  const handleDownloadAll = () => {
    if (filteredEntries.length === 0) {
      setError("No forms available to download");
      return;
    }
    
    // Pass the filteredEntries directly to the download function instead of setting state
    downloadForm16([...filteredEntries]);
  };

  // Select all forms (across all pages)
  const handleSelectAllForms = () => {
    if (selectedForms.length === filteredEntries.length) {
      // If all are selected, deselect all
      setSelectedForms([]);
      setSelectAll(false);
    } else {
      // Otherwise, select all
      setSelectedForms([...filteredEntries]);
      setSelectAll(true);
    }
  };

  // Check if data is available
  const hasData = filteredEntries.length > 0;

  // Loading bar component to reuse
  const LoadingBar = () => (
    <div className="w-full h-1 overflow-hidden bg-gray-200 relative">
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
  );

  return (
    <div className="max-w-4xl mx-auto w-full min-h-[500px] flex flex-col bg-gray-50 p-4">
      <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <h2 className="text-xl font-bold mb-2 sm:mb-0">{formType} View</h2>
            <button
              onClick={() => setViewMode("reports")}
              className="flex items-center text-white bg-white/20 hover:bg-white/30 px-3 py-1 text-sm rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Reports
            </button>
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

        {/* Info Section */}
        <div className="bg-blue-50 p-3 border-b border-blue-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-2 bg-white rounded-md shadow-sm">
              <span className="text-xs uppercase text-gray-500 mb-1">Fiscal Year</span>
              <span className="font-medium text-blue-700">{fiscalYear}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-white rounded-md shadow-sm">
              <span className="text-xs uppercase text-gray-500 mb-1">TAN</span>
              <span className="font-medium text-blue-700">{selectedTAN}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-white rounded-md shadow-sm">
              <span className="text-xs uppercase text-gray-500 mb-1">DDO Name</span>
              <span className="font-medium text-blue-700">{ddoName}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
              placeholder="Search by PAN number"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1 rounded-md border border-gray-200 mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xs">
                <tr>
                  <th className="px-3 py-2 text-left uppercase">SI No</th>
                  <th className="px-3 py-2 text-left uppercase">{formType}</th>
                  <th className="px-3 py-2 text-left uppercase w-24">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={selectAll}
                        onChange={handleSelectAllChange}
                        aria-label="Select all forms on this page"
                        disabled={!hasData}
                      />
                      <span className="ml-2 text-xs">Select All</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEntries.length > 0 ? (
                  paginatedEntries.map((entry, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                      <td className="px-3 py-2 text-sm text-gray-500">{startIndex + index + 1}</td>
                      <td className="px-3 py-2 text-sm font-medium text-blue-700">{entry}</td>
                      <td className="px-3 py-2 w-24">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={selectedForms.includes(entry)}
                            onChange={() => toggleFormSelection(entry)}
                            aria-label={`Select ${entry}`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
                      No forms found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Selection Count and Select All */}
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedForms.length > 0 && (
                <span>{selectedForms.length} form(s) selected</span>
              )}
            </div>
            <button
              onClick={handleSelectAllForms}
              className={`flex items-center text-sm text-blue-600 hover:text-blue-800 ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!hasData}
            >
              {selectedForms.length === filteredEntries.length && filteredEntries.length > 0 
                ? "Deselect All" 
                : "Select All Forms"}
            </button>
          </div>

          {/* Pagination */}
          <div className="mb-4 text-center">
            <p className="text-sm font-medium text-gray-600">
              {filteredEntries.length > 0
                ? `Showing ${startIndex + 1}-${Math.min(
                    startIndex + itemsPerPage,
                    filteredEntries.length
                  )} of ${filteredEntries.length} forms`
                : "No forms to display"}
            </p>
            <div className="flex justify-center mt-2 space-x-1">
              {[
                { icon: ChevronFirst, onClick: () => setCurrentPage(1), disabled: currentPage === 1 || !hasData },
                {
                  icon: ChevronLeft,
                  onClick: () => setCurrentPage((prev) => Math.max(prev - 1, 1)),
                  disabled: currentPage === 1 || !hasData,
                },
                {
                  icon: ChevronRight,
                  onClick: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)),
                  disabled: currentPage === totalPages || totalPages === 0 || !hasData,
                },
                {
                  icon: ChevronLast,
                  onClick: () => setCurrentPage(totalPages),
                  disabled: currentPage === totalPages || totalPages === 0 || !hasData,
                },
              ].map(({ icon: Icon, onClick, disabled }, idx) => (
                <button
                  key={idx}
                  className="p-1 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
                  onClick={onClick}
                  disabled={disabled}
                >
                  <Icon className="w-4 h-4 text-blue-600" />
                </button>
              ))}
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages || 1}
              </span>
            </div>
          </div>

          {/* Progress Bar positioned above the action buttons */}
          {isLoading && <div className="mb-4"><LoadingBar /></div>}

          {/* Action Buttons */}
          <div className="flex flex-row flex-wrap gap-2 justify-center mt-4">
            <button
              onClick={handleDownloadSelected}
              className={`flex items-center justify-center px-4 py-2 text-sm font-medium ${
                selectedForms.length > 0
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-400 cursor-not-allowed"
              } text-white rounded-md`}
              disabled={selectedForms.length === 0 || isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Selected
            </button>

            <button
              onClick={handleDownloadAll}
              className={`flex items-center justify-center px-4 py-2 text-sm font-medium ${
                hasData
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-green-400 cursor-not-allowed"
              } text-white rounded-md`}
              disabled={!hasData || isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Download All
            </button>

            <button
              onClick={handleClear}
              className="flex items-center justify-center px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md"
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
