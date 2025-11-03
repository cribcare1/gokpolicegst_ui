"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/shared/Layout';
import { Building2, CreditCard, FileText, Users, MapPin, BarChart3 } from 'lucide-react';
import Link from 'next/link';

// Lazy load ProfileMaster to improve initial page load
const ProfileMaster = dynamic(() => import('@/components/master-data/ProfileMaster'), {
  loading: () => <div className="premium-card p-4 sm:p-6 animate-pulse"><div className="h-48 bg-gray-200 rounded"></div></div>,
  ssr: false
});

export default function MasterDataCompletePage() {
  const sections = [
    {
      id: 'profile',
      title: 'Profile',
      icon: Building2,
      href: '/admin/master-data/profile',
      description: 'Wings - E-business Services',
    },
    {
      id: 'pan',
      title: 'PAN Master',
      icon: CreditCard,
      href: '/admin/master-data/pan',
      description: 'PAN Number, Name, Address, Contact',
    },
    {
      id: 'gstin',
      title: 'GSTIN Master',
      icon: FileText,
      href: '/admin/master-data/gst',
      description: 'GSTIN Details with Bank Information',
    },
    {
      id: 'hsn',
      title: 'HSN/SAC Master',
      icon: FileText,
      href: '/admin/master-data/hsn',
      description: 'HSN/SAC Codes with GST Tax Rates',
    },
    {
      id: 'ddo-mapping',
      title: 'DDO Mapping Master',
      icon: MapPin,
      href: '/admin/master-data/ddo-mapping',
      description: 'Map DDOs to GSTINs',
    },
    {
      id: 'reports',
      title: 'MIS Reports',
      icon: BarChart3,
      href: '/admin/reports',
      description: 'Management Information System Reports',
    },
  ];

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="gradient-text">Admin Master Data Management</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Manage all master data configurations from one place
          </p>
        </div>

        {/* Profile Section - Always visible */}
        <ProfileMaster />

        {/* Other Master Data Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sections.slice(1).map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.id}
                href={section.href}
                className="group premium-card p-4 sm:p-6 block hover:scale-105 transition-transform duration-300"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg group-hover:rotate-6 transition-transform duration-300 flex-shrink-0">
                    <Icon className="text-white" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-primary)] transition-colors truncate">
                      {section.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] line-clamp-2">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--color-border)]">
                  <span className="text-xs sm:text-sm text-[var(--color-primary)] font-medium group-hover:underline">
                    Manage →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

