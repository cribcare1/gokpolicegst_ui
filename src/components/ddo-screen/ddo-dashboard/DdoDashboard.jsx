"use client";
import React, { useEffect, useState } from 'react';
import { PieChart, FileText } from 'lucide-react';
import {LOGIN_CONSTANT} from "@/components/utils/constant";
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { useNetworkStatus } from '@/components/utils/network';

export default function Dashboard() {
  const [form16Count, setForm16Count] = useState(0);
  const [form16ACount, setForm16ACount] = useState(0); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isOnline = useNetworkStatus();
  
  const parseStoredNumber = (key) => {
    const value = localStorage.getItem(key);
    if (value === null) return 0;
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const form16 = parseStoredNumber(LOGIN_CONSTANT.FORM_16_COUNT);
      const form16A = parseStoredNumber(LOGIN_CONSTANT.FORM_16A_COUNT);
      setForm16Count(form16);
      setForm16ACount(form16A);
      console.log("Loaded counts:", form16, form16A);
    }
  }, []);
  
  // Card data
  const cards = [
    { title: 'No of Form16', value: form16Count, icon: FileText, color: 'blue' },
    { title: 'No of Form16A', value: form16ACount, icon: FileText, color: 'emerald' }
  ];

  const total = form16Count + form16ACount;
  
  const refreshForm16Count = async () => {
    try {
      setIsLoading(true);
      const tanNumber = localStorage.getItem(LOGIN_CONSTANT.DDO_TAN_NUMBER);
      if (!tanNumber) {
        setError("User not logged in");
        return;
      }

      const response = await ApiService.handleGetRequest(API_ENDPOINTS.DDO_REFRESH_COUNT + tanNumber);
      
      // Ensure we have numeric values
      const newForm16Count = Number(response.form16Count) || 0;
      const newForm16ACount = Number(response.form16ACount) || 0;
      
      // Update localStorage
      localStorage.setItem(LOGIN_CONSTANT.FORM_16_COUNT, newForm16Count); 
      localStorage.setItem(LOGIN_CONSTANT.FORM_16A_COUNT, newForm16ACount);
      
      // Update state
      setForm16Count(newForm16Count);
      setForm16ACount(newForm16ACount);
      console.log("Updated counts:", newForm16Count, newForm16ACount);

    } catch (err) {
      setError("Failed to fetch DDO data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart dimensions
  const radius = 80;
  const center = radius + 20;
  const chartSize = center * 2;
  
  // Function to render single segment arc
  const renderArc = (startAngle, endAngle, color) => {
    // Convert angles from degrees to radians
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    // Determine if the arc should be drawn the long way around
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };
  
  // Render full circle if only one type has value
  const renderFullCircle = (color) => {
    return (
      <circle 
        cx={center} 
        cy={center} 
        r={radius} 
        fill={color} 
      />
    );
  };

  if(!isOnline){
    return (<div><p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p></div>);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Forms 16 Statistics</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Last updated: Today</span>
              <button 
                type="button"
                onClick={refreshForm16Count}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {cards.map((card, index) => {
            const colorClasses = {
              blue: 'border-blue-500 bg-blue-50 text-blue-600',
              emerald: 'border-emerald-500 bg-emerald-50 text-emerald-600'
            };
            
            return (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 hover:shadow-lg transition-shadow"
                style={{ borderLeftColor: card.color === 'blue' ? '#3b82f6' : '#10b981' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 font-medium">{card.title}</p>
                    <p className="text-xl md:text-2xl font-bold mt-1" style={{ color: card.color === 'blue' ? '#2563eb' : '#059669' }}>{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${colorClasses[card.color]}`}>
                    <card.icon size={20} style={{ color: card.color === 'blue' ? '#3b82f6' : '#10b981' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie Chart Section */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-700">Form Distribution</h2>
            <PieChart className="text-blue-500" size={20} />
          </div>
          
          {total > 0 ? (
            <div className="flex flex-col md:flex-row items-center">
              {/* Pie Chart */}
              <div className="w-full md:w-1/2 flex justify-center mb-6 md:mb-0">
                <div className="relative">
                  <svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`} className="max-w-xs">
                    {/* Render chart based on data */}
                    {form16Count > 0 && form16ACount === 0 ? (
                      // Only Form16 has data
                      renderFullCircle('#3b82f6')
                    ) : form16Count === 0 && form16ACount > 0 ? (
                      // Only Form16A has data
                      renderFullCircle('#10b981')
                    ) : (
                      // Both have data
                      <>
                        <path d={renderArc(0, (form16Count / total) * 360, '#3b82f6')} fill="#3b82f6" />
                        <path d={renderArc((form16Count / total) * 360, 360, '#10b981')} fill="#10b981" />
                      </>
                    )}
                    
                    {/* Create donut effect with inner white circle */}
                    <circle cx={center} cy={center} r={radius * 0.6} fill="white" />
                    
                    {/* Center text */}
                    <text 
                      x={center} 
                      y={center - 10} 
                      textAnchor="middle" 
                      fontSize="16" 
                      fontWeight="bold" 
                      fill="#374151"
                    >
                      {total}
                    </text>
                    <text 
                      x={center} 
                      y={center + 15} 
                      textAnchor="middle" 
                      fontSize="12" 
                      fill="#6B7280"
                    >
                      Total Forms
                    </text>
                  </svg>
                </div>
              </div>
              
              {/* Enhanced Legend */}
              <div className="w-full md:w-1/2 space-y-6 px-4">
                {/* Form16 Legend */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#3b82f6' }}></div>
                      <span className="font-medium text-gray-700">Form16</span>
                    </div>
                    <div className="text-gray-900 font-bold">
                      {form16Count} ({total > 0 ? Math.round((form16Count / total) * 100) : 0}%)
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full" 
                      style={{ 
                        width: total > 0 ? `${(form16Count / total) * 100}%` : '0%', 
                        backgroundColor: '#3b82f6' 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Form16A Legend */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#10b981' }}></div>
                      <span className="font-medium text-gray-700">Form16A</span>
                    </div>
                    <div className="text-gray-900 font-bold">
                      {form16ACount} ({total > 0 ? Math.round((form16ACount / total) * 100) : 0}%)
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full" 
                      style={{ 
                        width: total > 0 ? `${(form16ACount / total) * 100}%` : '0%', 
                        backgroundColor: '#10b981' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <p className="text-gray-500 mb-2">No form data available</p>
                <button 
                  onClick={refreshForm16Count}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}