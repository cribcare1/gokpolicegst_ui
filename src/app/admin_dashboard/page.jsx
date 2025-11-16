"use client";
import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/shared/Layout';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { Package, Users, Receipt, Clock } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    gstInCount: 0,
    ddoCount: 0,
    totalBillingCount: 0,
    pendingPaymentSubmission: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Load demo data immediately for instant UI
    const demoData = {
      gstInCount: 245,
      ddoCount: 92,
      totalBillingCount: 156,
      pendingPaymentSubmission: 38,
    };
    
    // Show demo data immediately
    setStats(demoData);
    setLoading(false);
    
    try {
      setLoading(true);
      
      // Get gstId from localStorage or use default value
      const gstId = localStorage.getItem('gstId') || '4';
      
      // Build API URL with gstId parameter
      const apiUrl = `${API_ENDPOINTS.ADMIN_DASHBOARD}?gstId=${gstId}`;
      
      // Use ApiService to fetch data
      const result = await ApiService.handleGetRequest(apiUrl, 5000);
      
      if (result && result.status === 'success' && result.data && !result.error) {
        const data = result.data;
        setStats({
          gstInCount: data.totalGst || 0,
          ddoCount: data.totalDdo || 0,
          totalBillingCount: (data.completeInvoice || 0) + (data.pendingInvoice || 0),
          pendingPaymentSubmission: data.pendingInvoice || 0,
        });
      } else {
        console.log('API response not successful, using demo data');
      }
    } catch (error) {
      // Keep demo data, API failed or timed out
      console.log('API error, using demo data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Memoize statCards to prevent unnecessary recalculations
  const statCards = useMemo(() => [
    {
      label: 'GstIn Count',
      value: stats.gstInCount,
      icon: Package,
      color: 'bg-blue-500',
      href: '/admin/master-data/gst',
    },
    {
      label: 'DDO Count',
      value: stats.ddoCount,
      icon: Users,
      color: 'bg-purple-500',
      href: '/admin/master-data/ddo',
    },
    {
      label: 'Total Billing Count',
      value: stats.totalBillingCount,
      icon: Receipt,
      color: 'bg-green-500',
      href: '#',
    },
    {
      label: 'Pending Payment Submission',
      value: stats.pendingPaymentSubmission,
      icon: Clock,
      color: 'bg-orange-500',
      href: '#',
    },
  ], [stats]);

  return (
    <Layout role="admin">
      <div className="space-y-4 sm:space-y-5 lg:space-y-6">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 sm:mb-2">
            <span className="gradient-text">{t('nav.dashboard')}</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)]">
            Welcome back! Here's your system overview.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="premium-card p-4 sm:p-6 md:p-8 lg:p-16 mb-4 sm:mb-6">
            <LoadingProgressBar message="Loading dashboard statistics..." variant="primary" />
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              const CardWrapper = card.href !== '#' ? Link : 'div';
              const wrapperProps = card.href !== '#' ? { href: card.href, prefetch: true } : {};
              
              return (
                <CardWrapper
                  key={card.label}
                  {...wrapperProps}
                  className={`group premium-card p-3 sm:p-4 md:p-5 lg:p-6 block animate-fade-in touch-manipulation active:scale-[0.98] transition-transform ${card.href !== '#' ? 'cursor-pointer' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] xs:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 sm:mb-2 line-clamp-1">
                        {card.label}
                      </p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-secondary)] bg-clip-text text-transparent break-words">
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                    <div className={`${card.color} p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0`}>
                      <Icon className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    </div>
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

