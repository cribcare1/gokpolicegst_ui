"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import { API_ENDPOINTS } from '@/components/api/api_const';
import { FileText, Users, AlertCircle, Activity, ArrowRight } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';

export default function GstinDashboard() {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    pendingBills: 0,
    approvedBills: 0,
    totalDDOs: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Load demo data immediately for instant UI
    const demoData = {
      totalInvoices: 245,
      totalAmount: 12500000,
      pendingBills: 12,
      approvedBills: 233,
      totalDDOs: 5,
    };
    const demoAlerts = [
      '5 bills pending approval',
      '3 invoices need GSTIN verification',
      'Monthly report due in 5 days'
    ];
    
    // Show demo data immediately - UI is ready instantly
    setStats(demoData);
    setAlerts(demoAlerts);
    setLoading(false);
    
    // Fetch real data in background (non-blocking)
    try {
      // Try to fetch real data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : '';
      const response = await fetch(API_ENDPOINTS.GSTIN_DASHBOARD || API_ENDPOINTS.DDO_DASHBOARD, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken || ''}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success') {
          // Update with real data silently
          setStats({
            totalInvoices: data.totalInvoices || 0,
            totalAmount: data.totalAmount || 0,
            pendingBills: data.pendingBills || 0,
            approvedBills: data.approvedBills || 0,
            totalDDOs: data.totalDDOs || 0,
          });
          setAlerts(data.alerts || []);
        }
      }
    } catch (error) {
      // Keep demo data, API failed or timed out - no UI change needed
      console.log('Using demo data');
    }
  };

  const statCards = [
    {
      label: 'Pending Payment Submission',
      value: stats.pendingBills,
      icon: FileText,
      color: 'from-orange-500 to-amber-600',
      bgColor: 'from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-800/30',
      iconBg: 'bg-orange-500',
      href: '/gstin/pending',
    },
    {
      label: 'Count of DDO',
      value: stats.totalDDOs,
      icon: Users,
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-800/30',
      iconBg: 'bg-teal-500',
      href: '/gstin/ddos',
    },
  ];

  return (
    <Layout role="gstin">
      <div className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3">
                <span className="gradient-text">GSTIN Dashboard</span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)] mb-2">
                Welcome! Here's your GSTIN overview.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-muted)] rounded-xl border border-[var(--color-border)]">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">GSTIN:</span>
                <span className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] font-mono">
                  {typeof window !== 'undefined' ? (localStorage.getItem('gstinNumber') || '29AAAGO1111W1ZB') : '29AAAGO1111W1ZB'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="premium-card p-8 sm:p-16 mb-6">
            <LoadingProgressBar message="Loading dashboard statistics..." variant="primary" />
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <a
                  key={card.label}
                  href={card.href}
                  className="group premium-card relative overflow-hidden p-5 sm:p-6 lg:p-7 block animate-fade-in hover:scale-[1.02] transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 sm:mb-3">
                          {card.label}
                        </p>
                        <p className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-br ${card.color} bg-clip-text text-transparent leading-tight`}>
                          {card.value}
                        </p>
                      </div>
                      <div className={`${card.iconBg} p-3 sm:p-3.5 lg:p-4 rounded-xl sm:rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0`}>
                        <Icon className="text-white" size={24} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="mt-auto pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center text-xs font-medium text-[var(--color-text-secondary)]">
                        <span>View details</span>
                        <ArrowRight className="ml-1" size={14} />
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Alerts & Reminders */}
        {alerts.length > 0 && (
          <div className="premium-card p-6 sm:p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-amber-900/20 border-2 border-amber-200/50 dark:border-amber-800/50 shadow-lg">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg flex-shrink-0">
                <AlertCircle className="text-white" size={28} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl sm:text-2xl text-amber-900 dark:text-amber-100 mb-4 sm:mb-5 flex items-center gap-2">
                  Alerts & Reminders
                </h3>
                <ul className="space-y-3 sm:space-y-4">
                  {alerts.map((alert, index) => (
                    <li key={index} className="flex items-start gap-3 group/item">
                      <div className="mt-1 p-1.5 bg-amber-400/20 dark:bg-amber-500/30 rounded-lg group-hover/item:bg-amber-400/30 dark:group-hover/item:bg-amber-500/40 transition-colors">
                        <div className="w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full" />
                      </div>
                      <span className="text-sm sm:text-base text-amber-800 dark:text-amber-200 font-medium flex-1 leading-relaxed">
                        {alert}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="premium-card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Activity className="text-white" size={24} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                Recent Activity
              </h2>
            </div>
          </div>
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center p-6 bg-gradient-to-br from-[var(--color-muted)] to-[var(--color-surface)] rounded-3xl mb-6 shadow-inner">
                <Activity className="text-[var(--color-text-secondary)]" size={48} strokeWidth={1.5} />
              </div>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)] font-medium mb-2">
                No recent activity
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]/70">
                Activity log will be displayed here once available
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

