"use client";
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar Component';
import Form16Upload from '../admin-components/UploadForm16Screen'
import StatisticsDisplay from '../admin-components/Dashboardnew';
import UploadForm from '../admin-components/UploadForm16AScreen';
import Reports from '../admin-components/ReportScreen';
import DDOButtons from '../admin-components/AddDdoScreen';
import { FOOTER_TEXT } from "@/components/utils/constant";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  
  // For DDO list
  const [ddos, setDdos] = useState([
    { id: 1, name: "DDO Office 1" },
    { id: 2, name: "DDO Office 2" },
    { id: 3, name: "DDO Office 3" }
  ]);
  
  // Handle dark mode toggle and initialization
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) document.documentElement.classList.add('dark');
  }, []);

  // Handle back button event
  useEffect(() => {
    const handlePopState = () => {
      if (!showExitConfirmation) {
        setShowExitConfirmation(true);
        // Push a new history state to prevent immediate navigation
        window.history.pushState(null, null, window.location.pathname);
      }
    };

    // Add event listeners
    window.addEventListener('popstate', handlePopState);

    // Add history state on component mount
    window.history.pushState(null, null, window.location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showExitConfirmation]);

  const handleExit = () => {
    setShowExitConfirmation(false);
    // Use window.location to navigate away from the application
    window.location.href = "/"; // Navigate to home page or login page
    // Alternative: window.close(); // This may not work in all browsers due to security restrictions
  };

  const handleCancel = () => {
    setShowExitConfirmation(false);
  };
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <div className={`flex flex-col md:flex-row min-h-screen w-full ${isDarkMode ? 'dark' : ''}`}>
      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">e-Wings</h1>
        <button onClick={toggleMobileMenu} className="p-2 focus:outline-none">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Sidebar Component */}
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
      
      {/* Main Content */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen overflow-auto flex flex-col">
        <div className="flex-1">
          {activeSection === 'ddo' && <DDOButtons />}
          {activeSection === 'form16' && <Form16Upload ddos={ddos} />}
          {!activeSection && <StatisticsDisplay setActiveSection={setActiveSection} />}
          {activeSection === 'dashboard' && <StatisticsDisplay />}
          {activeSection === 'form16a' && <UploadForm />}
          {activeSection === 'reports' && <Reports/>}
        </div>
        
        {/* Footer */}
        <footer className="bg-gray-200 dark:bg-gray-800 text-center text-gray-600 dark:text-gray-400 py-4">
          {FOOTER_TEXT}
        </footer>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
  <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
        Do you want to exit?
      </h3>
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleCancel}
          className="px-5 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleExit}
          className="px-5 py-2 text-base font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
        >
          Exit
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Dashboard;