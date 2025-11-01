"use client";
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './DdoDashboard';
import DDOProfile from './DDOProfile';
import IntegratedForm16 from '../ddo-components/Form16View';
import IntegratedForm16A from '../ddo-components/Form16AView';
import { FOOTER_TEXT } from "@/components/utils/constant";
import { Menu } from 'lucide-react';

export default function EWingsDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [fiscalYear, setFiscalYear] = useState('2024-25');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (!showExitConfirmation) {
        setShowExitConfirmation(true);
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.pathname);

    return () => window.removeEventListener('popstate', handlePopState);
  }, [showExitConfirmation]);

  const handleExit = () => {
    setShowExitConfirmation(false);
    window.location.href = "/";
  };

  const handleCancel = () => setShowExitConfirmation(false);

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'ddoProfile': return <DDOProfile />;
      case 'viewForm16': return <IntegratedForm16 fiscalYear={fiscalYear} />;
      case 'viewForm16A': return <IntegratedForm16A fiscalYear={fiscalYear} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-gray-600 font-medium">Select an option from the sidebar</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">e-Wings</h1>
          </div>
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 rounded-md focus:outline-none"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-grow">
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
          }}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        <main className="flex-grow p-2 md:p-4 lg:p-6">
          <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="text-lg font-medium text-gray-800">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'ddoProfile' && 'DDO Profile'}
                {activeTab === 'viewForm16' && 'Form 16 View'}
                {activeTab === 'viewForm16A' && 'Form 16A View'}
              </h2>
            </div>
            <div className="p-4">{renderActiveContent()}</div>
            <p className="mt-8 text-center text-sm text-indigo-700/70">{FOOTER_TEXT}</p>
          </div>
        </main>
      </div>

      {showExitConfirmation && (
  <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 w-full max-w-lg mx-4 shadow-2xl">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Do you want to exit?</h3>
      <div className="flex justify-center space-x-6">
        <button 
          onClick={handleCancel} 
          className="px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Cancel
        </button>
        <button 
          onClick={handleExit} 
          className="px-6 py-3 text-base font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          Exit
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
