"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { formatCurrency } from '@/lib/gstUtils';
import CreditNotesList from '@/components/ddo/CreditNotesList';
import { toast } from 'sonner';
import { LOGIN_CONSTANT } from '@/components/utils/constant';

export default function CreditNotesPage() {
  const router = useRouter();
  const [creditNotesList, setCreditNotesList] = useState([]);
  const [filteredCreditNotesList, setFilteredCreditNotesList] = useState([]);
  const [creditNotesSearchTerm, setCreditNotesSearchTerm] = useState('');
  const [creditNotesLoading, setCreditNotesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isCreditNoteCreation, setIsCreditNoteCreation] = useState(false);

  useEffect(() => {
    fetchCreditNotesDetails();
  }, []);

  useEffect(() => {
    if (!creditNotesSearchTerm.trim()) {
      setFilteredCreditNotesList(creditNotesList);
      return;
    }

    const term = creditNotesSearchTerm.toLowerCase();
    const filtered = creditNotesList.filter((record) => {
      return [
        record.creditNoteNumber,
        record.invoiceNumber,
        record.customerName,
        record.serviceType,
        record.creditNoteAmount,
      ].some((value) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(term);
      });
    });
    setFilteredCreditNotesList(filtered);
  }, [creditNotesSearchTerm, creditNotesList]);

  const fetchCreditNotesDetails = async () => { 
    try {
      setCreditNotesLoading(true);
      const ddoId = parseInt(localStorage.getItem(LOGIN_CONSTANT.USER_ID), 10);
      const gstId = parseInt(localStorage.getItem(LOGIN_CONSTANT.GSTID), 10);
      if (!ddoId) {
        toast.error('DDO ID not found. Please login again.');
        setCreditNotesList([]);
        setFilteredCreditNotesList([]);
        return;
      }

      // Demo data for credit notes
      const demoCreditNotes = [
        {
          id: 'CN-2024-001',
          creditNoteNumber: 'CN-2024-001',
          invoiceNumber: 'INV-2024-001',
          customerName: 'ABC Enterprises',
          serviceType: 'Public Administration',
          creditNoteAmount: 5000,
          invoiceAmount: 25000,
          creditNoteDate: new Date().toISOString(),
          invoiceDate: new Date(Date.now() - 86400000).toISOString(),
          signature: null,
        },
        {
          id: 'CN-2024-002',
          creditNoteNumber: 'CN-2024-002',
          invoiceNumber: 'INV-2024-002',
          customerName: 'XYZ Corporation',
          serviceType: 'Public Administration',
          creditNoteAmount: 2500,
          invoiceAmount: 18000,
          creditNoteDate: new Date(Date.now() - 86400000).toISOString(),
          invoiceDate: new Date(Date.now() - 172800000).toISOString(),
          signature: true,
        },
        {
          id: 'CN-2024-003',
          creditNoteNumber: 'CN-2024-003',
          invoiceNumber: 'INV-2024-003',
          customerName: 'Tech Solutions Pvt Ltd',
          serviceType: 'Public Administration',
          creditNoteAmount: 7500,
          invoiceAmount: 32000,
          creditNoteDate: new Date(Date.now() - 172800000).toISOString(),
          invoiceDate: new Date(Date.now() - 259200000).toISOString(),
          signature: null,
        },
        {
          id: 'CN-2024-004',
          creditNoteNumber: 'CN-2024-004',
          invoiceNumber: 'INV-2024-004',
          customerName: 'Global Industries',
          serviceType: 'Public Administration',
          creditNoteAmount: 1200,
          invoiceAmount: 15000,
          creditNoteDate: new Date(Date.now() - 259200000).toISOString(),
          invoiceDate: new Date(Date.now() - 345600000).toISOString(),
          signature: true,
        },
        {
          id: 'CN-2024-005',
          creditNoteNumber: 'CN-2024-005',
          invoiceNumber: 'INV-2024-005',
          customerName: 'Prime Services',
          serviceType: 'Public Administration',
          creditNoteAmount: 3000,
          invoiceAmount: 28000,
          creditNoteDate: new Date(Date.now() - 345600000).toISOString(),
          invoiceDate: new Date(Date.now() - 432000000).toISOString(),
          signature: null,
        },
      ];

      setCreditNotesList(demoCreditNotes);
      setFilteredCreditNotesList(demoCreditNotes);
      setCreditNotesLoading(false);

      // Try to fetch real data (currently using demo data)
      // const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.CREDIT_NOTE_LIST}${ddoId}&gstId=${gstId}&status=SAVED`);
      // Handle response similar to ProformaAdviceList
    } catch (error) {
      console.error('Error fetching credit notes details:', error);
      setCreditNotesList([]);
      setFilteredCreditNotesList([]);
    } finally {
      setCreditNotesLoading(false);
    }
  };

  const handleCreateCreditNote = (record) => {
    if (!record) return;
    
    setIsCreditNoteCreation(true);
    handleOpenEditCreditNote(record);
    toast.success('Opening credit note form for creation');
  };

  const handleOpenEditCreditNote = (record) => {
    if (!record) return;
    
    // TODO: Implement credit note form logic here
    // This would be similar to handleOpenEditProforma but for credit notes
    
    console.log('Opening credit note form for:', record);
    setShowForm(true);
  };

  const handleUpdateCreditNoteInline = (id, updatedFields) => {
    setCreditNotesList(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
    setFilteredCreditNotesList(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
  };

  const handleBackToList = () => {
    setShowForm(false);
    setIsCreditNoteCreation(false);
  };

  return (
    <Layout role="ddo">
      <div className="space-y-3">
        {showForm ? (
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl font-bold mb-1 text-[var(--color-text-primary)]">
                  {isCreditNoteCreation ? 'Create Credit Note' : 'Credit Note Form'}
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {isCreditNoteCreation 
                    ? 'Creating credit note with pre-filled data'
                    : 'Fill credit note details'
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          <CreditNotesList
            creditNotesSearchTerm={creditNotesSearchTerm}
            setCreditNotesSearchTerm={setCreditNotesSearchTerm}
            filteredCreditNotesList={filteredCreditNotesList}
            creditNotesLoading={creditNotesLoading}
            onCreateCreditNote={handleCreateCreditNote}
            onShowForm={handleOpenEditCreditNote}
            onUpdateCreditNote={handleUpdateCreditNoteInline}
          />
        )}
      </div>
    </Layout>
  );
}