import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Form16AStatement from './Form16Aview1';
import { useNetworkStatus } from '@/components/utils/network';

export default function Form16AViewer() {
  const [selectedFY, setSelectedFY] = useState('2024-25');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showForm16View, setShowForm16View] = useState(false);
  const isOnline = useNetworkStatus();

  const availableFY = ['2024-25', '2023-24', '2022-23'];

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const selectFY = (fy) => {
    setSelectedFY(fy);
    setIsDropdownOpen(false);
  };

  const handleViewStatement = () => {
    setShowForm16View(true); // Immediately show the statement
  };

  if (showForm16View) {
    return <Form16AStatement fiscalYear={selectedFY} onBack={() => setShowForm16View(false)} />;
  }

  if (!isOnline) {
    return (
      <div>
        <p className="text-red-600">
          Oops! It looks like you're offline. We'll reconnect once you're back online.❌
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-8">
          <h2 className="text-3xl font-bold text-center">Form 16A Viewer</h2>
          <p className="text-center text-indigo-100 mt-2">Tax Credit Statement</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-8">
            <label className="block text-gray-800 font-semibold mb-3 text-lg">Select Financial Year</label>
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="w-full bg-white border-2 border-indigo-200 rounded-xl py-4 px-5 flex justify-between items-center text-gray-800 shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              >
                <span className="font-medium text-lg">{selectedFY}</span>
                <ChevronDown
                  size={22}
                  className={`text-indigo-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-indigo-200 rounded-xl shadow-xl overflow-hidden">
                  {availableFY.map((fy) => (
                    <div
                      key={fy}
                      onClick={() => selectFY(fy)}
                      className={`px-5 py-4 text-gray-700 hover:bg-indigo-50 cursor-pointer transition-colors ${
                        selectedFY === fy ? 'bg-indigo-100 text-indigo-700 font-medium' : ''
                      }`}
                    >
                      {fy}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Button */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <button
              className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 px-6 rounded-xl font-medium text-lg shadow-md hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              onClick={handleViewStatement}
            >
              View Statement
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-indigo-50 px-6 py-5 border-t border-indigo-100">
          <p className="text-sm text-indigo-700 text-center">
            Form 16A contains quarterly TDS/TCS details credited to your account
          </p>
        </div>
      </div>
    </div>
  );
}
