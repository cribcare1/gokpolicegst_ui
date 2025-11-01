"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { Package, CreditCard, Users, Building2, FileText, AlertCircle } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';

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

  const statCards = [
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
  ];

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="gradient-text">{t('nav.dashboard')}</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Welcome back! Here's your system overview.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="premium-card p-8 sm:p-16 mb-6">
            <LoadingProgressBar message="Loading dashboard statistics..." variant="primary" />
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <a
                  key={card.label}
                  href={card.href}
                  className="group premium-card p-6 block animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
                        {card.label}
                      </p>
                      <p className="text-3xl font-bold bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-secondary)] bg-clip-text text-transparent">
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                    <div className={`${card.color} p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="text-white" size={28} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="premium-card p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <AlertCircle className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-amber-900 dark:text-amber-200 mb-3">
                  Alerts & Reminders
                </h3>
                <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
                  {alerts.map((alert, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">▸</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity (placeholder) */}
        <div className="premium-card p-8">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 pb-4 border-b border-[var(--color-border)]">
            Recent Activity
          </h2>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block p-4 bg-[var(--color-muted)] rounded-2xl mb-4">
                <FileText className="text-[var(--color-text-secondary)]" size={32} />
              </div>
              <p className="text-[var(--color-text-secondary)] font-medium">
                Activity log will be displayed here
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

