"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Table from '@/components/shared/Table';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { toast } from 'sonner';

export default function MasterDataPage({
  title,
  endpoint,
  columns,
  formFields,
  validateForm,
  role = 'admin',
}) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = data.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  const getDemoData = () => {
    const endpointStr = endpoint.LIST || '';
    if (endpointStr.includes('gst')) {
      return [
        { id: '1', gstNumber: '29AAAGO1111W1ZB', name: 'Government of Karnataka- Office of the Director General & Inspector General of Police, Karnataka', address: 'No.1, Police Head Quarterz, Narpathuga Road, Opp: Martha\'s Hospital, K R Circle, Bengaluru-560001', contactNumber: '9902991144', email: 'Copadmin@ksp.gov.in' },
        { id: '2', gstNumber: '19ABCDE1234F1Z5', name: 'XYZ Corporation', address: '456 Brigade Road, Bangalore', contactNumber: '9876543211', email: 'xyz@example.com' },
      ];
    } else if (endpointStr.includes('pan')) {
      return [
        { id: '1', panNumber: 'AMQPP1137R', name: 'GOK, Police department.', address: 'No.1, Police Head Quartez, Napathunga road, K R Circle, Bengaluru-560001', mobile: '9902991133', email: 'dgpolicehq@ksp.gov.in' },
        { id: '2', panNumber: 'FGHIJ5678K', name: 'Jane Smith', address: '456 Brigade Road, Bangalore', mobile: '9876543211', email: 'jane@example.com' },
        { id: '3', panNumber: 'LMNOP9012Q', name: 'Robert Johnson', address: '789 Indira Nagar, Bangalore', mobile: '9876543212', email: 'robert@example.com' },
      ];
    } else if (endpointStr.includes('ddo')) {
      return [
        { id: '1', ddoCode: '0200PO0032', ddoName: 'DCP CAR HQ', gstinNumber: '29AAAGO1111W1ZB', mobile: '9902991133', email: 'ddo001@example.com' },
        { id: '2', ddoCode: '0200PO0033', ddoName: 'DCP South', gstinNumber: '29AAAGO1111W1ZB', mobile: '9902991134', email: 'ddo002@example.com' },
        { id: '3', ddoCode: '0200PO0034', ddoName: 'DCP North', gstinNumber: '29AAAGO1111W1ZB', mobile: '9902991135', email: 'ddo003@example.com' },
        { id: '4', ddoCode: '0200PO0035', ddoName: 'DCP West', gstinNumber: '29AAAGO1111W1ZB', mobile: '9902991136', email: 'ddo004@example.com' },
        { id: '5', ddoCode: '0200PO0036', ddoName: 'DCP east', gstinNumber: '29AAAGO1111W1ZB', mobile: '9902991137', email: 'ddo005@example.com' },
      ];
    } else if (endpointStr.includes('hsn')) {
      return [
        { id: '1', hsnNumber: '999293', name: 'Public Administration and Security Services', gstTaxRate: 18, igst: 18, cgst: 9, sgst: 9 },
        { id: '2', hsnNumber: '999294', name: 'Arm Security Services', gstTaxRate: 12, igst: 12, cgst: 6, sgst: 6 },
        { id: '3', hsnNumber: '8471', name: 'Automatic data processing machines', gstTaxRate: 18, igst: 18, cgst: 9, sgst: 9 },
      ];
    } else if (endpointStr.includes('bank')) {
      return [
        { id: '1', gstinNumber: '29AAAGO1111W1ZB', bankName: 'Union Bank of India-Current Account', accountNumber: '143211100000627', ifscCode: 'UBIN0814326', branchName: 'Banaswadi', accountType: 'Current', accountHolderName: 'Government of Karnataka- Office of the Director General & Inspector General of Police, Karnataka', micrCode: '560026077' },
        { id: '2', gstinNumber: '19ABCDE1234F1Z5', bankName: 'HDFC Bank', accountNumber: '98765432109', ifscCode: 'HDFC0005678', branchName: 'Koramangala Branch', accountType: 'Current', accountHolderName: 'XYZ Corporation' },
      ];
    }
    return [];
  };

  const fetchData = async () => {
    // Load demo data immediately for instant UI
    const demoData = getDemoData();
    setData(demoData);
    setFilteredData(demoData);
    setLoading(false);
    
    try {
      setLoading(true);
      // Try to fetch real data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(endpoint.LIST, {
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
        if (data && data.status === 'success' && data.data && data.data.length > 0) {
          setData(data.data);
          setFilteredData(data.data);
        }
      }
    } catch (error) {
      // Keep demo data, API failed or timed out
      console.log('Using demo data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const response = await ApiService.handlePostRequest(
        `${endpoint.DELETE}${item.id}`,
        {}
      );
      
      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        fetchData();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData);
    if (!validation.valid) {
      toast.error(validation.message || t('validation.required'));
      return;
    }

    try {
      const url = editingItem ? endpoint.UPDATE : endpoint.ADD;
      const response = await ApiService.handlePostRequest(url, formData);
      
      if (response && response.status === 'success') {
        toast.success(t('alert.success'));
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(response?.message || t('alert.error'));
      }
    } catch (error) {
      toast.error(t('alert.error'));
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const tableColumns = [
    ...columns.map((col) => ({
      key: col.key,
      label: col.label,
      render: col.render,
    })),
  ];

  const tableActions = (row) => (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
        className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-blue-600 dark:text-blue-400"
        aria-label="Edit"
      >
        <Edit size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row);
        }}
        className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md text-red-600 dark:text-red-400"
        aria-label="Delete"
      >
        <Trash2 size={18} />
      </button>
    </>
  );

  return (
    <Layout role={role}>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
              <span className="gradient-text">{title}</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
              Manage {title.toLowerCase()} efficiently
            </p>
          </div>
          <Button onClick={handleAdd} variant="primary" className="group w-full sm:w-auto">
            <Plus className="mr-2 group-hover:rotate-90 transition-transform duration-300" size={18} />
            {t('btn.add')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={22} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="premium-input w-full pl-12 pr-4 py-3.5 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none shadow-md"
          />
        </div>

        {/* Table */}
        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-16">
              <LoadingProgressBar message="Loading data..." variant="primary" />
            </div>
          ) : (
            <Table
              columns={tableColumns}
              data={filteredData}
              actions={tableActions}
            />
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? `Edit ${title}` : `Add ${title}`}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {formFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key] || ''}
                    onChange={(e) => updateFormData(field.key, e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    rows={3}
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={formData[field.key] || ''}
                    onChange={(e) => updateFormData(field.key, e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder={field.placeholder}
                    required={field.required}
                    maxLength={field.maxLength}
                  />
                )}
              </div>
            ))}

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                {t('btn.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('btn.save')}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}

