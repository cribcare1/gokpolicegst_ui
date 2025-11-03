'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy components for better initial load performance
const HeroCarousel = dynamic(() => import("@/components/hero"), {
  loading: () => <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 animate-pulse" />,
  ssr: false
});

const ContactUs = dynamic(() => import("@/components/Contactus"), {
  loading: () => <div className="min-h-screen bg-gray-50 animate-pulse" />,
  ssr: false
});

const ScrollToTop = dynamic(() => import("@/components/ScrollToTop"), {
  ssr: false
});

export default function layout({children}) {
  return (
    <div>
        {children}
        <Suspense fallback={<div className="w-full h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 animate-pulse" />}>
          <HeroCarousel/>
        </Suspense>
        <Suspense fallback={<div className="min-h-screen bg-gray-50 animate-pulse" />}>
          <ContactUs/>
        </Suspense>
        <ScrollToTop/>
    </div>
  )
};