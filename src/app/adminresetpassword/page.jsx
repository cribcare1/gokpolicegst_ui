"use client";
import dynamic from 'next/dynamic';

// Lazy load reset password page for better initial load
const ResetPasswordForm = dynamic(() => import("@/components/admin-screen/Resetpassword"), {
  loading: () => <div className="min-h-screen flex items-center justify-center bg-gray-50 animate-pulse"><div className="w-full max-w-md h-96 bg-gray-200 rounded-lg"></div></div>,
  ssr: false
});

export default function page() {
  return (
    <div>
   <ResetPasswordForm/>
    </div>
  )
};