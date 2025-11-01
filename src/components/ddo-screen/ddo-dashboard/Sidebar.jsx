"use client";
import React, { useState } from 'react';
import { Home, UserCircle, FileText, FilePlus, LogOut, X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'ddoProfile', label: 'DDO Profile', icon: <UserCircle size={20} /> },
    { id: 'viewForm16', label: 'View Form16', icon: <FileText size={20} /> },
    { id: 'viewForm16A', label: 'View Form16A', icon: <FilePlus size={20} /> },
  ];

  const confirmLogout = () => {
    localStorage.clear();
    router.push("/ddologin");
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to log out of your DDO account?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative top-0 left-0 h-screen md:h-auto w-72 z-40 transform transition-all duration-300 ease-in-out 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 bg-gradient-to-br from-indigo-800 to-indigo-950 shadow-xl`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-indigo-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <span className="text-indigo-800 font-bold text-lg">DS</span>
            </div>
            <h1 className="text-xl font-bold text-white">DDO Section</h1>
          </div>
          <button 
            className="md:hidden text-indigo-200 hover:text-white transition-colors" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={22} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200
                ${activeTab === item.id 
                  ? 'bg-indigo-700/50 text-white font-medium shadow-sm' 
                  : 'text-indigo-200 hover:bg-indigo-700/30 hover:text-white'}`}
            >
              <span className={`${activeTab === item.id ? 'text-white' : 'text-indigo-300'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {activeTab === item.id && (
                <ChevronRight size={16} className="ml-auto text-indigo-300" />
              )}
            </button>
          ))}
          
          <div className="border-t border-indigo-700/30 my-3" />
          
          <button 
            onClick={() => setShowLogoutConfirm(true)} 
            className="w-full flex items-center gap-3 p-3 text-indigo-200 hover:bg-indigo-700/30 hover:text-white rounded-lg transition-all duration-200"
          >
            <span className="text-indigo-300">
              <LogOut size={20} />
            </span>
            <span>Logout</span>
          </button>
        </nav>
        
        {/* User info at bottom (optional) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-indigo-700/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <UserCircle size={20} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-white font-medium text-sm truncate">DDO Admin</p>
              <p className="text-indigo-300 text-xs truncate">admin@department.gov</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}