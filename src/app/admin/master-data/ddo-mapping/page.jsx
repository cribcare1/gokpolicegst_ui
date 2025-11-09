"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import Modal from '@/components/shared/Modal';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { useGstinList } from '@/hooks/useGstinList';
import { useDdoList } from '@/hooks/useDdoList';

export default function DDOMappingPage() {
  const { gstinList } = useGstinList();
  const [currentGSTIN, setCurrentGSTIN] = useState('');
  const [targetGSTIN, setTargetGSTIN] = useState('');
  const [selectedDDOs, setSelectedDDOs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use hook for DDO list based on current GSTIN
  const { ddoList, loading: ddoLoading, refetch: refetchDDOs } = useDdoList(currentGSTIN);

  useEffect(() => {
    if (gstinList && gstinList.length > 0 && !currentGSTIN) {
      const firstGSTIN = gstinList[0].gstNumber || gstinList[0].value || '';
      const secondGSTIN = gstinList.length > 1 ? (gstinList[1].gstNumber || gstinList[1].value || '') : '';
      
      if (firstGSTIN) {
        setCurrentGSTIN(firstGSTIN);
      }
      if (secondGSTIN && !targetGSTIN) {
        setTargetGSTIN(secondGSTIN);
      }
      setLoading(false);
    } else if (gstinList && gstinList.length === 0) {
      setLoading(false);
    }
  }, [gstinList, currentGSTIN, targetGSTIN]);

  const handleCurrentGSTINChange = (gstin) => {
    setCurrentGSTIN(gstin);
    setSelectedDDOs(new Set()); // Clear selection when GSTIN changes
    // DDOs will be automatically fetched by useDdoList hook
  };

  const handleSelectAll = () => {
    if (selectedDDOs.size === ddoList.length) {
      setSelectedDDOs(new Set());
    } else {
      setSelectedDDOs(new Set(ddoList.map(ddo => ddo.id)));
    }
  };

  const handleDDOSelect = (ddoId) => {
    const newSelected = new Set(selectedDDOs);
    if (newSelected.has(ddoId)) {
      newSelected.delete(ddoId);
    } else {
      newSelected.add(ddoId);
    }
    setSelectedDDOs(newSelected);
  };

  const handleMove = async () => {
    if (!currentGSTIN) {
      toast.error('Please select current GSTIN');
      return;
    }
    
    if (!targetGSTIN) {
      toast.error('Please select target GSTIN');
      return;
    }
    
    if (currentGSTIN === targetGSTIN) {
      toast.error('Current and target GSTIN cannot be the same');
      return;
    }

    if (selectedDDOs.size === 0) {
      toast.error('Please select at least one DDO');
      return;
    }

    setIsModalOpen(true);
  };

  const confirmMove = async () => {
    try {
      setLoading(true);
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.DDO_MAPPING_UPDATE, {
        sourceGSTIN: currentGSTIN,
        targetGSTIN: targetGSTIN,
        ddoIds: Array.from(selectedDDOs),
      });

      if (response?.status === 'success') {
        toast.success('DDOs mapped successfully');
        setSelectedDDOs(new Set());
        // Refresh DDO list after successful mapping
        refetchDDOs();
      } else {
        toast.error(response?.message || 'Failed to map DDOs');
      }
    } catch (error) {
      toast.error('Failed to map DDOs');
      console.error('Error mapping DDOs:', error);
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  const getGSTINName = (gstin) => {
    if (!gstin || !gstinList) return gstin || '';
    const gstinObj = gstinList.find(g => (g.gstNumber || g.value) === gstin);
    return gstinObj?.name || gstin;
  };

  // Transform GSTIN list for dropdown
  const transformedGstinList = gstinList.map((item, index) => ({
    id: item.id || String(index + 1),
    gstNumber: item.gstNumber || item.value || '',
    name: item.name || ''
  }));

  if (loading && !gstinList.length) {
    return (
      <Layout role="admin">
        <div className="premium-card p-16">
          <LoadingProgressBar message="Loading DDO mapping data..." variant="primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="gradient-text">DDO Mapping</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Map DDOs between different GSTINs
          </p>
        </div>

        <div className="premium-card p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Current GSTIN */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Current GSTIN Mapped
            </label>
            <select
              value={currentGSTIN}
              onChange={(e) => handleCurrentGSTINChange(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {transformedGstinList.map((gstin) => (
                <option key={gstin.id} value={gstin.gstNumber}>
                  {gstin.gstNumber} - {gstin.name}
                </option>
              ))}
            </select>
            {currentGSTIN && (
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {getGSTINName(currentGSTIN)}
              </p>
            )}
          </div>

          {/* DDO Table */}
          {ddoLoading ? (
            <div className="p-8 text-center">
              <LoadingProgressBar message="Loading DDOs..." variant="primary" />
            </div>
          ) : ddoList.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-secondary)]">
              No DDOs mapped to this GSTIN
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                <div className="flex items-center justify-between p-3 bg-[var(--color-muted)] rounded-xl mb-3">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {selectedDDOs.size === ddoList.length && ddoList.length > 0 ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} />
                    )}
                    {selectedDDOs.size === ddoList.length && ddoList.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                {ddoList.map((ddo) => (
              <div
                key={ddo.id}
                onClick={() => handleDDOSelect(ddo.id)}
                className={`premium-card p-4 cursor-pointer transition-all ${
                  selectedDDOs.has(ddo.id) ? 'ring-2 ring-[var(--color-primary)] bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {selectedDDOs.has(ddo.id) ? (
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">{ddo.ddoName}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{ddo.ddoCode}</p>
                  </div>
                </div>
              </div>
            ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--color-muted)]">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors"
                    >
                      {selectedDDOs.size === ddoList.length ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : (
                        <XCircle size={18} />
                      )}
                      Select All
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]">
                    DDO Code
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]">
                    DDO Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {ddoList.map((ddo) => (
                  <tr
                    key={ddo.id}
                    className={`border-b border-[var(--color-border)] hover:bg-[var(--color-muted)] cursor-pointer transition-colors ${
                      selectedDDOs.has(ddo.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleDDOSelect(ddo.id)}
                  >
                    <td className="px-4 py-3">
                      {selectedDDOs.has(ddo.id) ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : (
                        <XCircle size={18} className="text-gray-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                      {ddo.ddoCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                      {ddo.ddoName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </>
          )}

          {/* Move To Section */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center gap-4 p-3 sm:p-4 bg-[var(--color-muted)] rounded-xl">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] whitespace-nowrap">
              Move to:
            </label>
            <select
              value={targetGSTIN}
              onChange={(e) => setTargetGSTIN(e.target.value)}
              className="flex-1 w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Select Target GSTIN</option>
              {transformedGstinList
                .filter((g) => g.gstNumber !== currentGSTIN)
                .map((gstin) => (
                  <option key={gstin.id} value={gstin.gstNumber}>
                    {gstin.gstNumber} - {gstin.name}
                  </option>
                ))}
            </select>
            <Button
              onClick={handleMove}
              variant="primary"
              disabled={selectedDDOs.size === 0 || !targetGSTIN}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              <ArrowRight className="mr-2" size={18} />
              Action
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm DDO Mapping"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-[var(--color-text-primary)]">
            Are you sure you want to move {selectedDDOs.size} DDO(s) from{' '}
            <strong>{currentGSTIN}</strong> to <strong>{targetGSTIN}</strong>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={confirmMove}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

