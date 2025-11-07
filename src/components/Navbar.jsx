"use client";
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Languages } from 'lucide-react';
import { t, getLanguage, setLanguage as setLang } from '@/lib/localization';
import { getTheme, getMode, setTheme, applyTheme } from '@/lib/theme';

const Navbar = memo(() => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
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
    let ticking = false;
    let rafId = null;
    
    const handleScroll = () => {
      if (!ticking) {
        rafId = window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          
          // Get section positions - cache for performance
          const contactUsSection = document.getElementById('contactus');
          
          // Set buffer for better UX
          const buffer = 100;
          
          // Update active tab based on scroll position
          if (contactUsSection && scrollPosition >= contactUsSection.offsetTop - buffer) {
            setActiveTab('contactus');
          } else {
            // If not scrolled to contact section, set to home
            setActiveTab('home');
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };
    
    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check on mount with small delay to ensure DOM is ready
    const timeoutId = setTimeout(handleScroll, 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleTabClick = useCallback((tab, e) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    
    // Scroll to the appropriate section only for anchor links
    if (tab === 'contactus') {
      if (e) {
        e.preventDefault();
      }
      // Use requestIdleCallback for non-critical scroll operation
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          const section = document.getElementById(tab);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        });
      } else {
        setTimeout(() => {
          const section = document.getElementById(tab);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }, 0);
      }
    }
    // For admin and ddo links, let Next.js Link handle navigation naturally
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = currentLanguage === 'en' ? 'kn' : 'en';
    setCurrentLanguage(newLang);
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', newLang);
      // Force re-render instead of full page reload
      router.refresh();
    }
  }, [currentLanguage, router]);

  const toggleTheme = useCallback(() => {
    const newMode = !darkMode;
    const theme = getTheme();
    
    // Update state immediately for UI responsiveness
    setDarkMode(newMode);
    
    // Apply theme (setTheme updates localStorage and calls applyTheme internally)
    setTheme(theme, newMode ? 'dark' : 'light');
  }, [darkMode]);

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
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Company Logo and TDS Text */}
          <div className="flex-shrink-0 flex items-center pl-1 sm:pl-2 min-w-0 flex-1">
            <Link href="/" className="flex items-center min-w-0">
              <div className="relative w-8 sm:w-10 h-8 sm:h-10 md:h-12 flex-shrink-0">
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 pr-2 lg:pr-4">
            <button
              onClick={() => router.push('/adminlogin')}
              onMouseEnter={() => router.prefetch('/adminlogin')}
              className={`px-2 lg:px-4 py-1.5 lg:py-2 rounded-md transition-colors duration-300 font-bold text-xs lg:text-sm touch-manipulation ${
                activeTab === 'admin' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'text-white hover:bg-teal-700/50'
              }`}
            >
              {mounted ? t('nav.admin') : 'Admin Login'}
            </button>
            <button
              onClick={() => router.push('/gstinlogin')}
              onMouseEnter={() => router.prefetch('/gstinlogin')}
              className={`px-2 lg:px-4 py-1.5 lg:py-2 rounded-md transition-colors duration-300 font-bold text-xs lg:text-sm touch-manipulation ${
                activeTab === 'gstin' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'text-white hover:bg-teal-700/50'
              }`}
            >
              {mounted ? t('nav.gstinLogin') : 'GSTIN Login'}
            </button>
            <button
              onClick={() => router.push('/ddologin')}
              onMouseEnter={() => router.prefetch('/ddologin')}
              className={`px-2 lg:px-4 py-1.5 lg:py-2 rounded-md transition-colors duration-300 font-bold text-xs lg:text-sm touch-manipulation ${
                activeTab === 'ddo' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'text-white hover:bg-teal-700/50'
              }`}
            >
              {mounted ? t('nav.ddoButton') : 'DDO Login'}
            </button>
            <Link 
              href="/#contactus"
              className={`px-2 lg:px-4 py-1.5 lg:py-2 rounded-md transition-colors duration-300 font-bold text-xs lg:text-sm touch-manipulation ${
                activeTab === 'contactus' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'text-white hover:bg-teal-700/50'
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick('contactus');
              }}
            >
              {mounted ? t('nav.contactUs') : 'Contact Us'}
            </Link>
            
            {/* Language Toggle */}
            <div className="flex items-center border-l border-teal-600/50 pl-2 lg:pl-3 ml-1 lg:ml-2">
              <button
                onClick={toggleLanguage}
                className="p-1.5 lg:p-2 rounded-md text-white hover:bg-teal-700/50 transition-colors duration-300 touch-manipulation"
                title={currentLanguage === 'en' ? 'Switch to Kannada' : 'Switch to English'}
              >
                <Languages size={18} className="lg:w-5 lg:h-5" />
              </button>
              <span className="ml-1 lg:ml-2 text-white text-xs lg:text-sm font-semibold">
                {currentLanguage === 'en' ? 'EN' : 'KN'}
              </span>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 lg:p-2 rounded-md text-white hover:bg-teal-700/50 transition-colors duration-300 touch-manipulation"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={18} className="lg:w-5 lg:h-5" /> : <Moon size={18} className="lg:w-5 lg:h-5" />}
            </button>
          </div>
          
          {/* Mobile menu button and controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:hidden">
            {/* Language Toggle - Mobile */}
            <button
              onClick={toggleLanguage}
              className="p-1.5 sm:p-2 rounded-md text-white hover:bg-teal-700/50 transition-colors duration-300 touch-manipulation"
              title={currentLanguage === 'en' ? 'Switch to Kannada' : 'Switch to English'}
              aria-label="Toggle language"
            >
              <Languages size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <span className="text-white text-[10px] sm:text-xs font-semibold hidden sm:inline">
              {currentLanguage === 'en' ? 'EN' : 'KN'}
            </span>
            
            {/* Theme Toggle - Mobile */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-md text-white hover:bg-teal-700/50 transition-colors duration-300 touch-manipulation"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Moon size={16} className="sm:w-[18px] sm:h-[18px]" />}
            </button>
            
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md text-white hover:bg-teal-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-300 touch-manipulation min-w-[44px] min-h-[44px]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg
                  className="block h-5 w-5 sm:h-6 sm:w-6"
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
                  className="block h-5 w-5 sm:h-6 sm:w-6"
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
          
          {/* Tablet menu button (between sm and md) */}
          <div className="hidden sm:flex md:hidden items-center space-x-1">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-md text-white hover:bg-teal-700/50 transition-colors duration-300 touch-manipulation"
              title={currentLanguage === 'en' ? 'Switch to Kannada' : 'Switch to English'}
            >
              <Languages size={18} />
            </button>
            <span className="text-white text-xs font-semibold">
              {currentLanguage === 'en' ? 'EN' : 'KN'}
            </span>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-white hover:bg-teal-700/50 transition-colors duration-300 touch-manipulation"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-teal-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-300 touch-manipulation"
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
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-900 rounded-b-lg shadow-inner">
            <button
              onClick={() => {
                router.push('/adminlogin');
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-3 rounded-md text-sm sm:text-base font-bold touch-manipulation min-h-[44px] flex items-center ${
                activeTab === 'admin'
                  ? 'bg-white text-teal-700'
                  : 'text-white hover:bg-teal-700/50 active:bg-teal-700/70'
              }`}
            >
              {mounted ? t('nav.admin') : 'Admin Login'}
            </button>
            <button
              onClick={() => {
                router.push('/gstinlogin');
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-3 rounded-md text-sm sm:text-base font-bold touch-manipulation min-h-[44px] flex items-center ${
                activeTab === 'gstin'
                  ? 'bg-white text-teal-700'
                  : 'text-white hover:bg-teal-700/50 active:bg-teal-700/70'
              }`}
            >
              {mounted ? t('nav.gstinLogin') : 'GSTIN Login'}
            </button>
            <button
              onClick={() => {
                router.push('/ddologin');
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-3 rounded-md text-sm sm:text-base font-bold touch-manipulation min-h-[44px] flex items-center ${
                activeTab === 'ddo'
                  ? 'bg-white text-teal-700'
                  : 'text-white hover:bg-teal-700/50 active:bg-teal-700/70'
              }`}
            >
              {mounted ? t('nav.ddoButton') : 'DDO Login'}
            </button>
            <Link
              href="/#contactus"
              className={`block px-3 py-3 rounded-md text-sm sm:text-base font-bold touch-manipulation min-h-[44px] flex items-center ${
                activeTab === 'contactus'
                  ? 'bg-white text-teal-700'
                  : 'text-white hover:bg-teal-700/50 active:bg-teal-700/70'
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
});

Navbar.displayName = 'Navbar';

export default Navbar;