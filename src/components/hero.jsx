'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const HeroCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const images = [
    {
      src: '/4 GST Tax Slabs and GST Filing – GST Guide….jpg',
      alt: 'GST Tax Slabs and Filing Guide',
      title: 'GST Tax Slabs & Filing',
      description: 'Comprehensive guide to GST tax slabs (28%, 18%, 12%, 5%) and filing procedures',
      badge: 'Tax Rates'
    },
    {
      src: '/GST Act_ Sections, Rules, and Evolution….jpg',
      alt: 'Comprehensive Guide to GST Act',
      title: 'GST Act: Complete Guide',
      description: 'Sections, Rules, and Evolution of GST Act - Your comprehensive reference',
      badge: 'Legal Guide'
    },
    {
      src: '/Business environment, registering for GST (Goods….jpg',
      alt: 'GST Registration Process',
      title: 'GST Registration',
      description: 'Complete step-by-step guide to GST registration process and documentation',
      badge: 'Registration'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative overflow-hidden w-full h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70 z-[1]"></div>
      
      {/* Main hero container */}
      <div className="absolute inset-0 flex transition-transform duration-1000 ease-in-out"
           style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {images.map((image, index) => (
          <div key={index} className="min-w-full h-full flex-shrink-0 relative">
            <div className="relative w-full h-full">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-1000 hover:scale-105"
                priority={index === 0}
                quality={75}
                sizes="100vw"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
              {/* Enhanced content overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-[2] px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-5 sm:space-y-7 max-w-5xl">
                  {/* Badge */}
                  <div className="inline-block">
                    <span className="bg-gradient-to-r from-teal-500/90 to-emerald-500/90 backdrop-blur-md text-white text-xs sm:text-sm font-bold py-2 px-4 sm:px-6 rounded-full border border-white/20 shadow-xl">
                      {image.badge}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white drop-shadow-2xl leading-tight">
                    <span className="bg-gradient-to-r from-white via-teal-100 to-emerald-100 bg-clip-text text-transparent">
                      {image.title}
                    </span>
                  </h1>
                  
                  {/* Description */}
                  <p className="text-lg sm:text-xl md:text-2xl text-teal-50/90 font-semibold drop-shadow-xl max-w-3xl mx-auto leading-relaxed">
                    {image.description}
                  </p>
                  
                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-5 pt-6 sm:pt-8">
                    <button 
                      onClick={() => {
                        const contactSection = document.getElementById('contactus');
                        if (contactSection) {
                          contactSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="group relative bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-4 sm:py-5 px-8 sm:px-12 rounded-xl shadow-2xl hover:shadow-teal-500/50 transform hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/30 backdrop-blur-sm overflow-hidden"
                    >
                      {/* Shine effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                      <span className="relative flex items-center gap-2 text-base sm:text-lg">
                        Learn More
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </button>
                    <button 
                      onClick={() => {
                        const contactSection = document.getElementById('contactus');
                        if (contactSection) {
                          contactSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="group relative bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white font-bold py-4 sm:py-5 px-8 sm:px-12 rounded-xl border-2 border-white/50 hover:border-white/70 shadow-2xl hover:shadow-white/30 transform hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden"
                    >
                      {/* Shine effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                      <span className="relative flex items-center gap-2 text-base sm:text-lg">
                        Get Started
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Enhanced Navigation dots */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-[3]">
        {images.map((_, index) => (
          <button
            key={index}
            className={`rounded-full transition-all duration-500 ${
              index === activeIndex 
                ? 'bg-white h-3 w-10 shadow-xl shadow-teal-500/50 ring-2 ring-teal-400' 
                : 'bg-white/40 hover:bg-white/60 h-3 w-3'
            }`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
      
      {/* Enhanced Arrow navigation */}
      <button 
        className="absolute left-4 sm:left-6 md:left-8 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-teal-500/80 to-emerald-500/80 backdrop-blur-md p-4 sm:p-5 rounded-full hover:from-teal-600 hover:to-emerald-600 border-2 border-white/30 transition-all duration-300 z-[3] hover:scale-125 shadow-2xl group"
        onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button 
        className="absolute right-4 sm:right-6 md:right-8 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-teal-500/80 to-emerald-500/80 backdrop-blur-md p-4 sm:p-5 rounded-full hover:from-teal-600 hover:to-emerald-600 border-2 border-white/30 transition-all duration-300 z-[3] hover:scale-125 shadow-2xl group"
        onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default HeroCarousel;