"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  const [activeTab, setActiveTab] = useState('aboutus');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      // Get section positions
      const aboutUsSection = document.getElementById('aboutus');
      const contactUsSection = document.getElementById('contactus');
      
      // Set buffer for better UX
      const buffer = 100;
      
      // Update active tab based on scroll position
      if (contactUsSection && scrollPosition >= contactUsSection.offsetTop - buffer) {
        setActiveTab('contactus');
      } else if (aboutUsSection && scrollPosition >= aboutUsSection.offsetTop - buffer) {
        setActiveTab('aboutus');
      } else {
        // If not scrolled to either section, could set to home or another default
        setActiveTab('home');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Initial check on mount
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    
    // Scroll to the appropriate section
    if (tab === 'aboutus' || tab === 'contactus') {
      const section = document.getElementById(tab);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="bg-gradient-to-r from-slate-800 via-teal-800 to-emerald-800 shadow-lg fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Company Logo and TDS Text */}
          <div className="flex-shrink-0 flex items-center pl-2">
            <Link href="/" className="flex items-center">
              <div className="relative w-10 h-12">
                <Image 
                  src="/company logo.jpeg" 
                  alt="Company Logo"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
              <span className="text-white text-2xl font-bold ml-4">e-Wings</span>
            </Link>
          </div>
          
          {/* Desktop Navigation Tabs */}
          <div className="hidden sm:flex items-center space-x-4 pr-4">
            <Link 
              href="/#aboutus"
              className={`px-4 py-2 rounded-md transition-colors duration-300 font-bold ${
                activeTab === 'aboutus' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'text-white hover:bg-teal-700/50'
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick('aboutus');
              }}
            >
              ABOUT US
            </Link>
            <Link 
              href="/adminlogin" 
              className={`px-4 py-2 rounded-md transition-colors duration-300 font-bold ${
                activeTab === 'admin' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'text-white hover:bg-teal-700/50'
              }`}
              onClick={() => handleTabClick('admin')}
            >
              ADMIN
            </Link>
            <Link 
              href="/ddologin" 
              className={`px-4 py-2 rounded-md transition-colors duration-300 font-bold ${
                activeTab === 'ddo' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'text-white hover:bg-teal-700/50'
              }`}
              onClick={() => handleTabClick('ddo')}
            >
              DDO
            </Link>
            <Link 
              href="/#contactus"
              className={`px-4 py-2 rounded-md transition-colors duration-300 font-bold ${
                activeTab === 'contactus' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'text-white hover:bg-teal-700/50'
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick('contactus');
              }}
            >
              CONTACT US
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-teal-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-900 rounded-b-lg shadow-inner">
            <Link
              href="/#aboutus"
              className={`block px-3 py-3 rounded-md text-base font-bold ${
                activeTab === 'aboutus'
                  ? 'bg-white text-teal-700'
                  : 'text-white hover:bg-teal-700/50'
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick('aboutus');
              }}
            >
              About Us
            </Link>
            <Link
              href="/adminlogin"
              className={`block px-3 py-3 rounded-md text-base font-bold ${
                activeTab === 'admin'
                  ? 'bg-white text-teal-700'
                  : 'text-white hover:bg-teal-700/50'
              }`}
              onClick={() => handleTabClick('admin')}
            >
              Admin
            </Link>
            <Link
              href="/ddologin"
              className={`block px-3 py-3 rounded-md text-base font-bold ${
                activeTab === 'ddo'
                  ? 'bg-white text-teal-700'
                  : 'text-white hover:bg-teal-700/50'
              }`}
              onClick={() => handleTabClick('ddo')}
            >
              DDO
            </Link>
            <Link
              href="/#contactus"
              className={`block px-3 py-3 rounded-md text-base font-bold ${
                activeTab === 'contactus'
                  ? 'bg-white text-teal-700'
                  : 'text-white hover:bg-teal-700/50'
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick('contactus');
              }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;