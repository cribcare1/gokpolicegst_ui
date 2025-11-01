'use client';
import React, { useState } from 'react';
import { Briefcase, FileUp, LogOut, LayoutDashboard, FileText, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Sidebar = ({
  activeSection,
  setActiveSection,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/adminlogin');
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} className="mr-3" /> },
    { id: 'ddo', name: 'Add DDO', icon: <Briefcase size={20} className="mr-3" /> },
    { id: 'form16', name: 'Upload Form 16', icon: <FileUp size={20} className="mr-3" /> },
    { id: 'form16a', name: 'Upload Form 16A', icon: <FileText size={20} className="mr-3" /> },
    { id: 'reports', name: 'Reports', icon: <BarChart3 size={20} className="mr-3" /> }
  ];

  return (
    <>
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block md:w-72 bg-gradient-to-b from-blue-700 to-indigo-800 text-white p-6 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'h-screen fixed top-16 left-0 right-0 z-50 overflow-y-auto' : ''}`}>
        <div className="hidden md:flex items-center mb-8">
          <h1 className="text-2xl font-bold bg-white/10 px-4 py-2 rounded-lg shadow-lg text-white border-l-4 border-amber-400">e-Wings</h1>
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`flex items-center w-full p-3 rounded-lg transition-all ${
                activeSection === item.id
                  ? 'bg-indigo-600 font-medium translate-x-2 shadow-md border-l-2 border-amber-400'
                  : 'hover:bg-indigo-600/40'
              }`}
              onClick={() => {
                setActiveSection(item.id);
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}

          <div className="pt-4 mt-6 border-t border-white/20">
            <button
              className="flex items-center w-full p-3 rounded-lg hover:bg-red-500/40 text-white transition-colors"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut size={20} className="mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="mb-6 text-gray-600">Are you sure you want to logout?</p>
            <div className="flex justify-center space-x-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
