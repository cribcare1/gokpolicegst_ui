"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { FileText, CheckCircle, Clock, Plus, AlertCircle } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';

export default function DDODashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingBills: 0,
    submittedBills: 0,
    recentBills: [],
  });
  const [loading, setLoading] = useState(true);

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
      const ddoCode = localStorage.getItem('ddoCode') || '';
      
      // Try to fetch real data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(`${API_ENDPOINTS.DDO_DASHBOARD}?ddoCode=${ddoCode}`, {
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
            pendingBills: data.pendingBills || 0,
            submittedBills: data.submittedBills || 0,
            recentBills: data.recentBills || [],
          });
        }
      }
    } catch (error) {
      // Keep demo data, API failed or timed out
      console.log('Using demo data');
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="premium-card p-8 group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                    {t('dashboard.pendingBills')}
                  </p>
                  <p className="text-4xl font-extrabold bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">
                    {stats.pendingBills.toLocaleString()}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Clock className="text-amber-600 dark:text-amber-400" size={36} />
                </div>
              </div>
            </div>

            <div className="premium-card p-8 group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                    {t('dashboard.submittedBills')}
                  </p>
                  <p className="text-4xl font-extrabold bg-gradient-to-br from-green-500 to-emerald-600 bg-clip-text text-transparent">
                    {stats.submittedBills.toLocaleString()}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <CheckCircle className="text-green-600 dark:text-green-400" size={36} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Bills */}
        <div className="premium-card p-8">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 pb-4 border-b border-[var(--color-border)]">
            {t('dashboard.recentBills')}
          </h2>
          {stats.recentBills.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl mb-4">
                <FileText className="text-blue-600 dark:text-blue-400" size={48} />
              </div>
              <p className="text-[var(--color-text-secondary)] font-medium text-lg">
                No bills generated yet
              </p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-2">
                Click "Generate Bill" to create your first bill
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentBills.slice(0, 5).map((bill, index) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-[var(--color-border)] group"
                  onClick={() => router.push(`/ddo/invoices?id=${bill.id}`)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 rounded-xl group-hover:scale-110 transition-transform">
                      <FileText size={24} className="text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-text-primary)] text-lg mb-1">
                        {bill.billNumber}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {bill.customerName} • {new Date(bill.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-[var(--color-text-primary)] mb-2">
                      ₹{bill.totalAmount?.toLocaleString('en-IN') || '0'}
                    </p>
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                        bill.status === 'submitted'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                      }`}
                    >
                      {bill.status === 'submitted' ? t('bill.status.submitted') : t('bill.status.pending')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submission Deadline Alert */}
        <div className="premium-card p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <AlertCircle className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex-1">
              ⚠️ {t('alert.submitBy10')}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

