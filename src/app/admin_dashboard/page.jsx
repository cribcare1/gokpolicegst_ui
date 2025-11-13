"use client";
import { useState, useEffect, useMemo, memo } from 'react';
import Layout from '@/components/shared/Layout';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { Package, CreditCard, Users, Building2, FileText, AlertCircle } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalGst: 0,
    totalPan: 0,
    totalDdo: 0,
    totalHsn: 0,
    totalBanks: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Load demo data immediately for instant UI
    const demoData = {
      totalGst: 245,
      totalPan: 180,
      totalDdo: 92,
      totalHsn: 156,
      totalBanks: 38,
    };
    const demoAlerts = [
      '5 DDOs have pending bills for this month',
      '3 GST registrations are expiring soon',
      'Monthly report submission deadline: 3 days remaining'
    ];
    
    // Show demo data immediately
    setStats(demoData);
    setAlerts(demoAlerts);
    setLoading(false);
    
    try {
      setLoading(true);
      // Try to fetch real data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(API_ENDPOINTS.ADMIN_DASHBOARD, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken') || ''}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success') {
          setStats({
            totalGst: data.gstCount || 0,
            totalPan: data.panCount || 0,
            totalDdo: data.ddoCount || 0,
            totalHsn: data.hsnCount || 0,
            totalBanks: data.bankCount || 0,
          });
          setAlerts(data.alerts || []);
        }
      }
    } catch (error) {
      // Keep demo data, API failed or timed out
      console.log('Using demo data');
    } finally {
      setLoading(false);
    }
  };

  // Memoize statCards to prevent unnecessary recalculations
  const statCards = useMemo(() => [
    {
      label: t('dashboard.totalGst'),
      value: stats.totalGst,
      icon: Package,
      color: 'bg-blue-500',
      href: '/admin/master-data/gst',
    },
    {
      label: t('dashboard.totalPan'),
      value: stats.totalPan,
      icon: CreditCard,
      color: 'bg-green-500',
      href: '/admin/master-data/pan',
    },
    {
      label: t('dashboard.totalDdo'),
      value: stats.totalDdo,
      icon: Users,
      color: 'bg-purple-500',
      href: '/admin/master-data/ddo',
    },
    {
      label: t('dashboard.totalHsn'),
      value: stats.totalHsn,
      icon: FileText,
      color: 'bg-orange-500',
      href: '/admin/master-data/hsn',
    },
    {
      label: t('dashboard.totalBanks'),
      value: stats.totalBanks,
      icon: Building2,
      color: 'bg-teal-500',
      href: '/admin/master-data/bank',
    },
  ], [stats, t]);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  href={card.href}
                  prefetch={true}
                  className="group premium-card p-3 sm:p-4 md:p-5 lg:p-6 block animate-fade-in touch-manipulation active:scale-[0.98] transition-transform"
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
                </Link>
              );
            })}
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="premium-card p-4 sm:p-5 md:p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-amber-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
                <AlertCircle className="text-amber-600 dark:text-amber-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg md:text-xl text-amber-900 dark:text-amber-200 mb-2 sm:mb-3">
                  Alerts & Reminders
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                  {alerts.map((alert, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5 sm:mt-1 flex-shrink-0">▸</span>
                      <span className="break-words">{alert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity (placeholder) */}
        <div className="premium-card p-4 sm:p-6 md:p-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[var(--color-border)]">
            Recent Activity
          </h2>
          <div className="flex items-center justify-center py-8 sm:py-10 md:py-12">
            <div className="text-center px-4">
              <div className="inline-block p-3 sm:p-4 bg-[var(--color-muted)] rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
                <FileText className="text-[var(--color-text-secondary)] w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
              </div>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] font-medium">
                Activity log will be displayed here
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

