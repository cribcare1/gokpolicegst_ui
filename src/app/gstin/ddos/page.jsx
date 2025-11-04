"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { Search, Users } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';

export default function GstinDDOsPage() {
  const [ddos, setDdos] = useState([]);
  const [filteredDdos, setFilteredDdos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDDOs();
  }, []);

  useEffect(() => {
    filterDDOs();
  }, [searchTerm, ddos]);

  const fetchDDOs = async () => {
    // Demo data - show immediately
    const demoDDOs = [
      { id: '1', ddoCode: '0200PO0032', ddoName: 'DCP CAR HQ' },
      { id: '2', ddoCode: '0200PO0033', ddoName: 'DCP South' },
      { id: '3', ddoCode: '0200PO0034', ddoName: 'DCP North' },
      { id: '4', ddoCode: '0200PO0035', ddoName: 'DCP West' },
      { id: '5', ddoCode: '0200PO0036', ddoName: 'DCP east' },
    ];
    
    // Show demo data immediately - UI ready instantly
    setDdos(demoDDOs);
    setFilteredDdos(demoDDOs);
    setLoading(false);
    
    // Fetch real data in background (non-blocking)
    try {
      // Try to fetch from API with timeout
      const gstinNumber = localStorage.getItem('gstinNumber');
      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.DDO_LIST}?gstin=${gstinNumber}`, 1500);
      if (response?.status === 'success' && response?.data && !response.timeout) {
        setDdos(response.data);
        setFilteredDdos(response.data);
      }
    } catch (error) {
      console.error('Error fetching DDOs:', error);
      // Keep demo data on error
    }
  };

  const filterDDOs = () => {
    let filtered = [...ddos];

    if (searchTerm) {
      filtered = filtered.filter(
        (ddo) =>
          ddo.ddoCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ddo.ddoName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDdos(filtered);
  };

  const columns = [
    {
      key: 'ddoCode',
      label: 'DDO Code',
      render: (code) => (
        <span className="font-medium text-[var(--color-text-primary)]">{code}</span>
      ),
    },
    {
      key: 'ddoName',
      label: 'DDO Name',
    },
  ];

  return (
    <Layout role="gstin">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
              <span className="gradient-text">Mapped DDOs</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              DDOs mapped to your GSTIN
            </p>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
            <input
              type="text"
              placeholder="Search DDOs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading DDOs..." variant="primary" />
            </div>
          ) : filteredDdos.length === 0 ? (
            <div className="p-8 sm:p-16 text-center">
              <Users className="mx-auto text-[var(--color-text-secondary)] mb-4" size={48} />
              <p className="text-[var(--color-text-secondary)]">No DDOs mapped</p>
            </div>
          ) : (
            <Table columns={columns} data={filteredDdos} />
          )}
        </div>
      </div>
    </Layout>
  );
}

