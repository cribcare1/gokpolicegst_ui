"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Languages } from 'lucide-react';
import { t, getLanguage, setLanguage as setLang } from '@/lib/localization';
import { getTheme, getMode, setTheme, applyTheme } from '@/lib/theme';

const Navbar = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('aboutus');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const lang = getLanguage();
    setCurrentLanguage(lang);
    const mode = getMode();
    setDarkMode(mode === 'dark');
    applyTheme();
  }, []);

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

  const handleTabClick = (tab, e) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    
    // Scroll to the appropriate section only for anchor links
    if (tab === 'aboutus' || tab === 'contactus') {
      if (e) {
        e.preventDefault();
      }
      const section = document.getElementById(tab);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // For admin and ddo links, let Next.js Link handle navigation naturally
  };

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'en' ? 'kn' : 'en';
    setCurrentLanguage(newLang);
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', newLang);
      window.location.reload(); // Reload to apply language changes
    }
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    const theme = getTheme();
    
    // Update state immediately for UI responsiveness
    setDarkMode(newMode);
    
    // Apply theme (setTheme updates localStorage and calls applyTheme internally)
    setTheme(theme, newMode ? 'dark' : 'light');
  };

  // Sync with theme changes from other sources
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      // Check initial state
      const mode = getMode();
      const isDark = mode === 'dark';
      if (isDark !== darkMode) {
        setDarkMode(isDark);
        applyTheme();
      }
    }
  }, [mounted]);

  return (
    <nav className={`${darkMode 
      ? 'bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-900' 
      : 'bg-gradient-to-r from-slate-800 via-teal-800 to-emerald-800'
    } shadow-lg fixed top-0 w-full z-50 transition-colors duration-300`}>
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
          <div className="hidden sm:flex items-center space-x-2 pr-4">
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
              {mounted ? t('nav.aboutUs') : 'ABOUT US'}
            </Link>
            <button
              onClick={() => router.push('/adminlogin')}
              className={`px-4 py-2 rounded-md transition-colors duration-300 font-bold ${
                activeTab === 'admin' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'text-white hover:bg-teal-700/50'
              }`}
            >
              {mounted ? t('nav.admin') : 'ADMIN'}
            </button>
            <button
              onClick={() => router.push('/ddologin')}
              className={`px-4 py-2 rounded-md transition-colors duration-300 font-bold ${
                activeTab === 'ddo' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'text-white hover:bg-teal-700/50'
              }`}
            >
              {mounted ? t('nav.ddoButton') : 'DDO'}
            </button>
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
              {mounted ? t('nav.contactUs') : 'CONTACT US'}
            </Link>
            
            {/* Language Toggle */}
            <div className="flex items-center border-l border-teal-600/50 pl-3 ml-2">
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-md text-white hover:bg-teal-700/50 transition-colors duration-300"
                title={currentLanguage === 'en' ? 'Switch to Kannada' : 'Switch to English'}
              >
                <Languages size={20} />
              </button>
              <span className="ml-2 text-white text-sm font-semibold">
                {currentLanguage === 'en' ? 'EN' : 'KN'}
              </span>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-white hover:bg-teal-700/50 transition-colors duration-300"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          {/* Mobile menu button and controls */}
          <div className="flex items-center space-x-2 sm:hidden">
            {/* Language Toggle - Mobile */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-md text-white hover:bg-teal-700/50 transition-colors duration-300"
              title={currentLanguage === 'en' ? 'Switch to Kannada' : 'Switch to English'}
            >
              <Languages size={18} />
            </button>
            <span className="text-white text-xs font-semibold">
              {currentLanguage === 'en' ? 'EN' : 'KN'}
            </span>
            
            {/* Theme Toggle - Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-white hover:bg-teal-700/50 transition-colors duration-300"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
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
              {mounted ? t('nav.aboutUs') : 'About Us'}
            </Link>
            <button
              onClick={() => {
                router.push('/adminlogin');
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-3 rounded-md text-base font-bold ${
                activeTab === 'admin'
                  ? 'bg-white text-teal-700'
                  : 'text-white hover:bg-teal-700/50'
              }`}
            >
              {mounted ? t('nav.admin') : 'Admin'}
            </button>
            <button
              onClick={() => {
                router.push('/ddologin');
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-3 rounded-md text-base font-bold ${
                activeTab === 'ddo'
                  ? 'bg-white text-teal-700'
                  : 'text-white hover:bg-teal-700/50'
              }`}
            >
              {mounted ? t('nav.ddoButton') : 'DDO'}
            </button>
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
              {mounted ? t('nav.contactUs') : 'Contact Us'}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;