"use client";
import React, { useState, useEffect } from "react";
import { FileText } from 'lucide-react';
import Form16View from './ReportDetailsScreen';
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { useNetworkStatus } from '@/components/utils/network';

export default function TaxReports() {
  const [viewMode, setViewMode] = useState('reports');
  const [fiscalYear, setFiscalYear] = useState('2024-25');
  const [selectedForm, setSelectedForm] = useState('Form16');
  const [selectedTAN, setSelectedTAN] = useState('Select TAN');
  const [ddoName, setDdoName] = useState('');
  const [error, setError] = useState('');
  const [tanError, setTanError] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const [ddoData, setDdos] = useState([]);
  const [getDDOId, setDDOId] = useState('');
  const isOnline = useNetworkStatus();

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

  if(!isOnline){
    return (<div><p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p></div>);
  }

  const handleTANChange = (e) => {
    const tan = e.target.value;
    setSelectedTAN(tan);
    setTanError('');

    const ddoMap = {
      'BLRL01542N': 'DCP CAR',
      'BLRL01543X': 'DCP FINANCE',
      'BLRL01544Y': 'DCP ADMIN'
    };
    setDdoName(ddoMap[tan] || 'Unknown');
  };
  
  const handleChange = (e) => {
    const selectedId = e.target.value;
    setDDOId(selectedId);
    setTanError('');

    const selectedData = ddoData.find(item => item.id.toString() === selectedId);
    if (selectedData) {
      setSelectedTAN(selectedData.tanNumber);
      setDdoName(selectedData.fullName);
    }
  };

  const handleViewReports = () => {
    // Validate TAN selection
    if (selectedTAN === 'Select TAN' || !selectedTAN) {
      setTanError('Please select a TAN to continue');
      return;
    }
    
    // If validation passes, proceed to view reports
    setViewMode('form16View');
  };

  if (viewMode === 'form16View') {
    return (
      <Form16View 
        fiscalYear={fiscalYear}
        selectedTAN={selectedTAN}
        ddoName={ddoName}
        formType={selectedForm}
        setViewMode={setViewMode}
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full min-h-[500px] flex flex-col bg-gray-50 p-4 relative">
      {/* Top animated loading bar */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
          <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        </div>
      )}

      <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden">     
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
          <h2 className="text-xl font-bold">Tax Reports</h2>
          <p className="text-blue-100 text-sm mt-1">Select options to view reports</p>
        </div>

        <div className={`p-4 flex-1 flex flex-col transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Financial Year</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
              >
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Form Type</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
              >
                <option value="Form16">Form16</option>
                <option value="Form16A">Form16A</option>
              </select>
            </div>

           <div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">TAN</label>
  <select
    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white ${tanError ? 'border-red-500' : 'border-gray-300'}`}
    value={getDDOId}
    onChange={handleChange}
  >
    <option value="">Select TAN</option>
    {ddoData?.map(data => (
      <option key={data.id} value={data.id}>{data.tanNumber}</option>
    ))}
  </select>
  {tanError && <p className="text-red-500 text-xs mt-1">{tanError}</p>}
</div>

            

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">DDO Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                value={ddoName}
                readOnly
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleViewReports}
              className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-md py-2 px-4 hover:from-blue-700 hover:to-indigo-800 transition-colors shadow-sm text-sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}