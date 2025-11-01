"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { Download, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import { LoadingProgressBar, IndeterminateProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [exceptionReports, setExceptionReports] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [selectedMonth]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [monthlyResponse, exceptionResponse] = await Promise.all([
        ApiService.handleGetRequest(`${API_ENDPOINTS.REPORTS_MONTHLY}?month=${selectedMonth}`),
        ApiService.handleGetRequest(API_ENDPOINTS.REPORTS_EXCEPTIONS),
      ]);

      if (monthlyResponse && monthlyResponse.status === 'success') {
        setMonthlyReports(monthlyResponse.data || []);
      } else {
        // Demo data for UI preview
        const demoMonthly = [
          { ddoCode: 'DDO001', ddoName: 'Bangalore North Division', totalBills: 45, submittedBills: 42, pendingBills: 3, totalAmount: 1250000 },
          { ddoCode: 'DDO002', ddoName: 'Bangalore South Division', totalBills: 38, submittedBills: 35, pendingBills: 3, totalAmount: 980000 },
          { ddoCode: 'DDO003', ddoName: 'Mysore Division', totalBills: 52, submittedBills: 50, pendingBills: 2, totalAmount: 1560000 },
          { ddoCode: 'DDO004', ddoName: 'Hubli Division', totalBills: 28, submittedBills: 25, pendingBills: 3, totalAmount: 890000 },
          { ddoCode: 'DDO005', ddoName: 'Mangalore Division', totalBills: 41, submittedBills: 40, pendingBills: 1, totalAmount: 1150000 },
        ];
        setMonthlyReports(demoMonthly);
      }

      if (exceptionResponse && exceptionResponse.status === 'success') {
        setExceptionReports(exceptionResponse.data || []);
      } else {
        // Demo data for UI preview
        const demoExceptions = [
          { ddoCode: 'DDO001', ddoName: 'Bangalore North Division', reason: 'Bills not submitted by deadline', count: 3 },
          { ddoCode: 'DDO004', ddoName: 'Hubli Division', reason: 'Incomplete bill information', count: 2 },
        ];
        setExceptionReports(demoExceptions);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Demo data for UI preview
      const demoMonthly = [
        { ddoCode: 'DDO001', ddoName: 'Bangalore North Division', totalBills: 45, submittedBills: 42, pendingBills: 3, totalAmount: 1250000 },
        { ddoCode: 'DDO002', ddoName: 'Bangalore South Division', totalBills: 38, submittedBills: 35, pendingBills: 3, totalAmount: 980000 },
        { ddoCode: 'DDO003', ddoName: 'Mysore Division', totalBills: 52, submittedBills: 50, pendingBills: 2, totalAmount: 1560000 },
        { ddoCode: 'DDO004', ddoName: 'Hubli Division', totalBills: 28, submittedBills: 25, pendingBills: 3, totalAmount: 890000 },
        { ddoCode: 'DDO005', ddoName: 'Mangalore Division', totalBills: 41, submittedBills: 40, pendingBills: 1, totalAmount: 1150000 },
      ];
      const demoExceptions = [
        { ddoCode: 'DDO001', ddoName: 'Bangalore North Division', reason: 'Bills not submitted by deadline', count: 3 },
        { ddoCode: 'DDO004', ddoName: 'Hubli Division', reason: 'Incomplete bill information', count: 2 },
      ];
      setMonthlyReports(demoMonthly);
      setExceptionReports(demoExceptions);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully');
  };

  return (
    <Layout role="admin">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">{t('nav.reports')}</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              View system reports and analytics
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="premium-input w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl shadow-sm"
            />
          </div>
        </div>

        {/* Monthly Summary Report */}
        <div className="premium-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <TrendingUp size={18} className="sm:w-5 sm:h-5" />
              Monthly Invoice Submission Summary
            </h2>
            <Button
              onClick={() => handleExportCSV(monthlyReports, `monthly-report-${selectedMonth}`)}
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Download className="mr-2" size={16} />
              Export CSV
            </Button>
          </div>
          
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading reports..." variant="primary" />
            </div>
          ) : monthlyReports.length === 0 ? (
            <p className="text-[var(--color-text-secondary)] text-center py-8">No data available for selected month</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="bg-gradient-to-r from-[var(--color-muted)] to-[var(--color-surface)] border-b-2 border-[var(--color-border)]">
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase tracking-wide">DDO Code</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase tracking-wide">DDO Name</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase tracking-wide">Number of Bills</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase tracking-wide">Total Amount</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase tracking-wide">GST Collected</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase tracking-wide">Pending Bills</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyReports.map((report, index) => (
                    <tr key={index} className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]/50 transition-colors">
                      <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{report.ddoCode}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{report.ddoName}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{report.numBills || 0}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">₹{report.totalAmount?.toLocaleString('en-IN') || '0'}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">₹{report.gstCollected?.toLocaleString('en-IN') || '0'}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{report.pendingBills || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Exception Report */}
        <div className="premium-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <AlertCircle size={18} className="sm:w-5 sm:h-5" />
              Exception Report
            </h2>
            <Button
              onClick={() => handleExportCSV(exceptionReports, 'exception-report')}
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Download className="mr-2" size={16} />
              Export CSV
            </Button>
          </div>
          
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading exceptions..." variant="warning" />
            </div>
          ) : exceptionReports.length === 0 ? (
            <p className="text-[var(--color-text-secondary)]">No exceptions found</p>
          ) : (
            <div className="space-y-2">
              {exceptionReports.map((exception, index) => (
                <div
                  key={index}
                  className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                >
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {exception.type}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {exception.message}
                  </p>
                  {exception.billNumber && (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Bill: {exception.billNumber}
                    </p>
                  )}
                  {exception.ddoCode && (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      DDO: {exception.ddoCode}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

