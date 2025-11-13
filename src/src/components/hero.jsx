'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getMode } from '@/lib/theme';

const HeroCarousel = () => {
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check initial mode
    const mode = getMode();
    setDarkMode(mode === 'dark');
    
    // Listen for theme changes by observing the HTML element's class list
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      const currentMode = getMode();
      setDarkMode(currentMode === 'dark');
    });
    
    // Observe changes to the class attribute
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Also listen to storage changes (for cross-tab synchronization)
    const handleStorageChange = (e) => {
      if (e.key === 'preferredMode') {
        const currentMode = getMode();
        setDarkMode(currentMode === 'dark');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const image = {
    src: '/GST Act_ Sections, Rules, and Evolution….jpg',
    alt: 'GST Act Guide'
  };

  return (
    <div className={`relative overflow-hidden w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300`}>
      {/* Image container */}
      <div className="relative w-full h-full">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover"
          priority
          quality={75}
          sizes="100vw"
        />
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/40 to-black/50 z-[1]"></div>
        
        {/* Text overlay in the middle of image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[2] px-4">
          <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white drop-shadow-2xl">
              Bandobast GST Management System
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-2xl">
              Karnatak Police
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;