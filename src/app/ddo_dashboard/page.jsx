"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { FileText, CheckCircle, Clock, Plus, AlertCircle, Building2, Users, CreditCard, ArrowRight } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';

export default function DDODashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingBills: 0,
    submittedBills: 0,
    recentBills: [],
  });
  const [loading, setLoading] = useState(true);
  const quickActions = [
    {
      key: 'bank-details',
      label: 'nav.bank',
      href: '/ddo/bank',
      icon: Building2,
      bgClass: 'from-blue-500/80 to-cyan-500/80'
    },
    {
      key: 'customer-master',
      label: 'nav.customers',
      href: '/ddo/customers',
      icon: Users,
      bgClass: 'from-amber-500/80 to-orange-500/80'
    },
    {
      key: 'proforma-advice',
      label: 'nav.generateBill',
      href: '/ddo/generate-bill',
      icon: FileText,
      bgClass: 'from-purple-500/80 to-pink-500/80'
    },
    {
      key: 'credit-note',
      label: 'nav.invoiceList',
      href: '/ddo/credit-notes',
      icon: CreditCard,
      bgClass: 'from-emerald-500/80 to-green-500/80'
    }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Load demo data immediately for instant UI
    const demoStats = {
      pendingBills: 12,
      submittedBills: 48,
      recentBills: [
        {
          id: 'BILL-2024-001',
          billNumber: 'BILL-2024-001',
          customerName: 'ABC Enterprises',
          date: new Date().toISOString(),
          totalAmount: 125000,
          status: 'pending'
        },
        {
          id: 'BILL-2024-002',
          billNumber: 'BILL-2024-002',
          customerName: 'XYZ Corporation',
          date: new Date(Date.now() - 86400000).toISOString(),
          totalAmount: 98000,
          status: 'submitted'
        },
        {
          id: 'BILL-2024-003',
          billNumber: 'BILL-2024-003',
          customerName: 'Tech Solutions Pvt Ltd',
          date: new Date(Date.now() - 172800000).toISOString(),
          totalAmount: 156750,
          status: 'pending'
        },
        {
          id: 'BILL-2024-004',
          billNumber: 'BILL-2024-004',
          customerName: 'Global Industries',
          date: new Date(Date.now() - 259200000).toISOString(),
          totalAmount: 89500,
          status: 'submitted'
        },
        {
          id: 'BILL-2024-005',
          billNumber: 'BILL-2024-005',
          customerName: 'Prime Services',
          date: new Date(Date.now() - 345600000).toISOString(),
          totalAmount: 234000,
          status: 'submitted'
        }
      ]
    };
    
    // Show demo data immediately
    setStats(demoStats);
    setLoading(false);
    
    try {
      setLoading(true);
      
      // Get gstId from localStorage (DDO might be associated with a GSTIN)
      // If not available, try to get from DDO code or use default
      const gstId = typeof window !== 'undefined' ? localStorage.getItem('gstId') : null;
      const ddoCode = typeof window !== 'undefined' ? localStorage.getItem('ddoCode') : '';
      
      // Build API URL - try with gstId first, fallback to ddoCode if needed
      let apiUrl;
      if (gstId) {
        apiUrl = `${API_ENDPOINTS.ADMIN_DASHBOARD}?gstId=${gstId}`;
      } else if (ddoCode) {
        // If no gstId, try the DDO dashboard endpoint
        apiUrl = `${API_ENDPOINTS.DDO_DASHBOARD}?ddoCode=${ddoCode}`;
      } else {
        console.log('No gstId or ddoCode found, using demo data');
        return;
      }
      
      // Use ApiService to fetch data
      const result = await ApiService.handleGetRequest(apiUrl, 5000);
      
      if (result && result.status === 'success' && result.data && !result.error) {
        const data = result.data;
        
        // If using getDashboardStats endpoint (with gstId)
        if (gstId) {
          setStats({
            pendingBills: data.pendingInvoice || 0,
            submittedBills: data.completeInvoice || 0,
            recentBills: demoStats.recentBills, // Keep demo recent bills as API doesn't provide this
          });
        } else {
          // If using DDO dashboard endpoint
          setStats({
            pendingBills: data.pendingBills || 0,
            submittedBills: data.submittedBills || 0,
            recentBills: data.recentBills || demoStats.recentBills,
          });
        }
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

  return (
    <Layout role="ddo">
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
              <span className="gradient-text">{t('nav.dashboard')}</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
              Manage your bills and invoices efficiently
            </p>
          </div>
          <Button
            onClick={() => router.push('/ddo/generate-bill')}
            variant="primary"
            size="lg"
            className="group w-full sm:w-auto"
          >
            <Plus className="mr-2 group-hover:rotate-90 transition-transform duration-300" size={20} />
            {t('btn.generateBill')}
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="premium-card p-8 sm:p-16 mb-6">
            <LoadingProgressBar message="Loading dashboard data..." variant="primary" />
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="premium-card p-4 sm:p-6 lg:p-8 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2 sm:mb-3 truncate">
                      {t('dashboard.pendingBills')}
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">
                      {stats.pendingBills.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 lg:p-5 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl sm:rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
                    <Clock className="text-amber-600 dark:text-amber-400" size={24} />
                  </div>
                </div>
              </div>

              <div className="premium-card p-4 sm:p-6 lg:p-8 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2 sm:mb-3 truncate">
                      {t('dashboard.submittedBills')}
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-br from-green-500 to-emerald-600 bg-clip-text text-transparent">
                      {stats.submittedBills.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 lg:p-5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl sm:rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
              </div>
            </div>

            <div className="premium-card p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                  {t('dashboard.quickActions')}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.key}
                      onClick={() => router.push(action.href)}
                      className="flex items-center justify-between gap-3 sm:gap-4 px-4 py-4 sm:py-5 bg-gradient-to-br from-[var(--color-muted)] to-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:shadow-xl hover:scale-[1.01] transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
                    >
                      <div className={`p-3 rounded-2xl text-white bg-gradient-to-br ${action.bgClass} shadow-md`}>
                        <Icon size={20} />
                      </div>
                      <span className="flex-1 font-semibold text-[var(--color-text-primary)]">{t(action.label)}</span>
                      <ArrowRight className="text-[var(--color-text-secondary)]" size={18} />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Submission Deadline Alert */}
        <div className="premium-card p-4 sm:p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-500/20 rounded-xl flex-shrink-0">
              <AlertCircle className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-200 flex-1">
              ⚠️ {t('alert.submitBy10')}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

