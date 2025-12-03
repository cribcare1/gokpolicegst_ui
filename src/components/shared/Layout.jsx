"use client";
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { t, getLanguage, setLanguage as setLang, translations } from '@/lib/localization';
import { applyTheme, getTheme, getMode, setTheme } from '@/lib/theme';
import { Menu, X, LogOut, Settings, Moon, Sun, Languages } from 'lucide-react';
import Link from 'next/link';

const Layout = memo(function Layout({ children, role = 'admin' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    setLanguage(getLanguage());
    const mode = getMode();
    setDarkMode(mode === 'dark');
    // Apply theme on mount
    if (typeof window !== 'undefined') {
      const theme = getTheme();
      applyTheme();
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'kn' : 'en';
    setLanguage(newLang);
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', newLang);
      // Force re-render instead of full page reload
      router.refresh();
    }
  }, [language, router]);

  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    const theme = getTheme();
    setTheme(theme, newMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    if (role === 'admin') {
      router.push('/adminlogin');
    } else if (role === 'gstin') {
      router.push('/gstinlogin');
    } else {
      router.push('/ddologin');
    }
  }, [role, router]);

  const adminNavItems = [
    { href: '/admin_dashboard', label: 'nav.dashboard', icon: 'dashboard' },
    { href: '/admin/profile', label: 'Profile', icon: 'profile' },
    { href: '/admin/master-data/pan', label: 'nav.pan', icon: 'pan' },
    { href: '/admin/master-data/gst', label: 'nav.gst', icon: 'gst' },
    { href: '/admin/master-data/ddo', label: 'nav.ddo', icon: 'ddo' },
    { href: '/admin/master-data/hsn', label: 'nav.hsn', icon: 'hsn' },
    { href: '/admin/master-data/bank', label: 'nav.bank', icon: 'bank' },
    { href: '/admin/reports', label: 'nav.reports', icon: 'reports' },
  
  ];

  const ddoNavItems = [
    { href: '/ddo_dashboard', label: 'nav.dashboard', icon: 'dashboard' },
    { href: '/ddo/profile', label: 'Profile', icon: 'profile' },
    { href: '/ddo/customers', label: 'nav.customers', icon: 'customers' },
    { href: '/ddo/generate-bill', label: 'nav.generateBill', icon: 'bill' },
    { href: '/ddo/invoices', label: 'nav.invoiceList', icon: 'invoices' },
    { href: '/ddo/ddo_gstmonthlyreport_list', label: 'nav.gstmonthlyreports', icon: 'reports' },
    // { href: '/ddo/quarterly_tds_list', label: 'nav.tdsquarterlyreports', icon: 'reports' },
  ];

  const gstinNavItems = [
    { href: '/gstin_dashboard', label: 'nav.dashboard', icon: 'dashboard' },
    { href: '/gstin/profile', label: 'Profile', icon: 'profile' },
    { href: '/gstin/ddo-registration', label: 'DDO Registration', icon: 'ddo' },
    { href: '/gstin/reports', label: 'nav.reports', icon: 'reports' },
  ];

  const navItems = role === 'admin' ? adminNavItems : role === 'gstin' ? gstinNavItems : ddoNavItems;

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)] shadow-lg">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 lg:px-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-[var(--color-muted)] rounded-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={20} className="sm:w-6 sm:h-6" /> : <Menu size={20} className="sm:w-6 sm:h-6" />}
            </button>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold gradient-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent truncate">
              KSP Bandobast GST {role === 'admin' ? '- Admin' : role === 'gstin' ? '- GSTIN' : role === 'ddo' ? '- DDO' : ''}
            </h1>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
            <button
              onClick={toggleLanguage}
              className="p-2 sm:p-2.5 hover:bg-[var(--color-muted)] rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              aria-label="Toggle language"
            >
              <Languages size={18} className="sm:w-5 sm:h-5 text-[var(--color-text-secondary)]" />
              <span className="sr-only">{language === 'en' ? 'Switch to Kannada' : 'Switch to English'}</span>
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 sm:p-2.5 hover:bg-[var(--color-muted)] rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} className="sm:w-5 sm:h-5 text-amber-500" /> : <Moon size={18} className="sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />}
            </button>
            <Link
              href="/settings"
              className="p-2 sm:p-2.5 hover:bg-[var(--color-muted)] rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md hidden sm:block"
              aria-label="Settings"
            >
              <Settings size={18} className="sm:w-5 sm:h-5 text-[var(--color-text-secondary)]" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 sm:p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-[var(--color-error)]"
              aria-label="Logout"
            >
              <LogOut size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:fixed left-0 z-40
            top-[56px] sm:top-[64px] lg:top-[56px] xl:top-[64px]
            h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] lg:h-[calc(100vh-56px)] xl:h-[calc(100vh-64px)]
            w-64 sm:w-72 flex-shrink-0 bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-muted)] border-r border-[var(--color-border)]
            transform transition-transform duration-300 ease-in-out shadow-xl lg:shadow-lg
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 overflow-y-auto
          `}
        >
          <nav className="p-3 sm:p-4 md:p-6 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl
                    transition-all duration-200 font-medium text-sm sm:text-base
                    touch-manipulation min-h-[44px]
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-lg scale-105'
                        : 'hover:bg-[var(--color-muted)] text-[var(--color-text-primary)] hover:scale-105 hover:shadow-md active:scale-95'
                    }
                  `}
                >
                  <span suppressHydrationWarning>
                    {item.label.startsWith('nav.') ? (mounted ? t(item.label) : (translations[item.label]?.en || item.label)) : item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 w-full lg:ml-64 xl:ml-72 bg-gradient-to-br from-[var(--color-background)] via-[var(--color-surface)] to-[var(--color-background)] min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] lg:min-h-screen">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 animate-fade-in max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;

