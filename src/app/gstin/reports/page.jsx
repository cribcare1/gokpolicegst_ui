"use client";
import { useState } from 'react';
import Layout from '@/components/shared/Layout';
import { t } from '@/lib/localization';
import Button from '@/components/shared/Button';
import { FileText, Receipt, FileBarChart, Download, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function GstinReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const reports = [
    {
      id: 'invoice',
      title: 'Invoice Report',
      description: 'View and download invoice reports',
      icon: Receipt,
      color: 'bg-blue-500',
      href: '/gstin/reports/invoice',
    },
    {
      id: 'credit-note',
      title: 'Credit Note Report',
      description: 'View and download credit note reports',
      icon: FileText,
      color: 'bg-green-500',
      href: '/gstin/reports/credit-note',
    },
    {
      id: 'gst',
      title: 'GST Report',
      description: 'View and download GST reports',
      icon: FileBarChart,
      color: 'bg-purple-500',
      href: '/gstin/reports/gst',
    },
  ];

  return (
    <Layout role="gstin">
      <div className="space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="gradient-text">DDO Reports</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Generate and view various reports
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Link
                key={report.id}
                href={report.href}
                className="group premium-card p-6 block hover:scale-105 transition-transform duration-300"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`${report.color} p-4 rounded-xl shadow-lg group-hover:rotate-6 transition-transform duration-300`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <span className="text-sm text-[var(--color-primary)] font-medium group-hover:underline flex items-center gap-2">
                    View Report <Download size={16} />
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

