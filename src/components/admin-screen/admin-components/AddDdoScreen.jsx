"use client";
import { useState } from 'react';
import DDOViewer from './ViewDdoListScreen';
import DdoForm from '../admin-dashboard/AddDDOScreen';
import { useNetworkStatus } from '@/components/utils/network';
import ChangePasswordForm from './DdoPasswordchangeform';

export default function DDOButtons() {
  const [activeComponent, setActiveComponent] = useState(null);
  const isOnline = useNetworkStatus();

  const handleButtonClick = (component) => {
    setActiveComponent(component);
  };

  const handleReturn = () => {
    setActiveComponent(null);
  };

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
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 md:p-10">
        <h1 className="text-2xl md:text-4xl font-bold text-center text-indigo-800 mb-6">
          DDO Management
        </h1>

        <div className="w-full border-b border-gray-200 mb-8"></div>

        {!activeComponent ? (
          <>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Welcome to the DDO Management Portal. Select an option below to create a new DDO, view existing ones, or change DDO passwords.
            </p>

            <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mb-8">
              {/* Create DDO Card */}
              <div
                className="w-full md:w-1/3 bg-white rounded-xl border-2 border-indigo-200 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-indigo-400 cursor-pointer group"
                onClick={() => handleButtonClick('create')}
              >
                <div className="h-2 bg-indigo-600 w-full"></div>
                <div className="p-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4 mx-auto text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">Create DDO</h3>
                  <p className="text-gray-600 text-center text-sm">Create and configure new Decentralized Data Objects</p>
                </div>
              </div>

              {/* View DDO Card */}
              <div
                className="w-full md:w-1/3 bg-white rounded-xl border-2 border-indigo-200 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-indigo-400 cursor-pointer group"
                onClick={() => handleButtonClick('view')}
              >
                <div className="h-2 bg-indigo-600 w-full"></div>
                <div className="p-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4 mx-auto text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">View DDO</h3>
                  <p className="text-gray-600 text-center text-sm">Browse and manage your existing Decentralized Data Objects</p>
                </div>
              </div>

              {/* Change DDO Password Card */}
              <div
                className="w-full md:w-1/3 bg-white rounded-xl border-2 border-indigo-200 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-indigo-400 cursor-pointer group"
                onClick={() => handleButtonClick('changePassword')}
              >
                <div className="h-2 bg-indigo-600 w-full"></div>
                <div className="p-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4 mx-auto text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">Change Password</h3>
                  <p className="text-gray-600 text-center text-sm">Update security credentials for your DDO accounts</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mb-6">
            <button
              onClick={handleReturn}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-300 mb-6"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to options
            </button>

            <h2 className="text-xl md:text-2xl font-semibold text-indigo-800 mb-6">
              {activeComponent === 'create' ? 'Create New DDO' :
               activeComponent === 'view' ? 'View DDOs' :
               'Change DDO Password'}
            </h2>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              {activeComponent === 'create' && <DdoForm />}
              {activeComponent === 'view' && <DDOViewer />}
              {activeComponent === 'changePassword' && <ChangePasswordForm />}
            </div>
          </div>
        )}

        <div className="w-full border-t border-gray-200 mt-8 pt-6"></div>
      </div>
    </div>
  );
}
