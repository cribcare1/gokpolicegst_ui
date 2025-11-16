"use client";
import dynamic from 'next/dynamic';

// Lazy load login page for better initial load
const AdminLogin = dynamic(() => import("@/components/admin-screen/LoginPage"), {
  loading: () => <div className="min-h-screen flex items-center justify-center bg-gray-50 animate-pulse"><div className="w-full max-w-md h-96 bg-gray-200 rounded-lg"></div></div>,
  ssr: false
});

export default function page() {
  return (
    <div>
   <AdminLogin/>
    </div>
  )
};