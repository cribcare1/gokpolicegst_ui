"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import Modal from '@/components/shared/Modal';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';
import { useGstinList } from '@/hooks/useGstinList';
import { useDdoList } from '@/hooks/useDdoList';

export default function DDOMappingPage() {
  const { gstinList } = useGstinList();
  const [sourceGSTIN, setSourceGSTIN] = useState('');
  const [targetGSTIN, setTargetGSTIN] = useState('');
  const [selectedSourceDDOs, setSelectedSourceDDOs] = useState(new Set());
  const [selectedTargetDDOs, setSelectedTargetDDOs] = useState(new Set());
  const [targetDDOs, setTargetDDOs] = useState([]); // DDOs selected for mapping
  const [movedDDOIds, setMovedDDOIds] = useState(new Set()); // Track DDOs moved to target
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use hooks for DDO lists
  const { ddoList: sourceDDOsFromAPI, loading: sourceLoading, refetch: refetchSource } = useDdoList(sourceGSTIN);
  const { ddoList: targetDDOsFromAPI, loading: targetLoading, refetch: refetchTarget } = useDdoList(targetGSTIN);

  // Filter out moved DDOs from source list
  const sourceDDOs = sourceDDOsFromAPI.filter(ddo => !movedDDOIds.has(ddo.id));

  useEffect(() => {
    if (gstinList && gstinList.length > 0 && !sourceGSTIN) {
      const firstGSTIN = gstinList[0].gstNumber || gstinList[0].value || '';
      const secondGSTIN = gstinList.length > 1 ? (gstinList[1].gstNumber || gstinList[1].value || '') : '';
      
      if (firstGSTIN) {
        setSourceGSTIN(firstGSTIN);
      }
      if (secondGSTIN && !targetGSTIN) {
        setTargetGSTIN(secondGSTIN);
      }
      setLoading(false);
    } else if (gstinList && gstinList.length === 0) {
      setLoading(false);
    }
  }, [gstinList, sourceGSTIN, targetGSTIN]);


  const handleSourceGSTINChange = (gstin) => {
    setSourceGSTIN(gstin);
    setSelectedSourceDDOs(new Set());
    setMovedDDOIds(new Set()); // Reset moved DDOs when source GSTIN changes
    setTargetDDOs([]); // Clear target DDOs when source changes
    // DDOs will be automatically fetched by useDdoList hook
  };

  const handleTargetGSTINChange = (gstin) => {
    setTargetGSTIN(gstin);
    setSelectedTargetDDOs(new Set());
    setTargetDDOs([]); // Clear mapped DDOs when GSTIN changes
    setMovedDDOIds(new Set()); // Reset moved DDOs when target GSTIN changes
    // DDOs will be automatically fetched by useDdoList hook
  };

  const handleSourceSelectAll = () => {
    if (selectedSourceDDOs.size === sourceDDOs.length) {
      setSelectedSourceDDOs(new Set());
    } else {
      setSelectedSourceDDOs(new Set(sourceDDOs.map(ddo => ddo.id)));
    }
  };

  const handleTargetSelectAll = () => {
    if (selectedTargetDDOs.size === targetDDOs.length) {
      setSelectedTargetDDOs(new Set());
    } else {
      setSelectedTargetDDOs(new Set(targetDDOs.map(ddo => ddo.id)));
    }
  };

  const handleSourceDDOSelect = (ddoId) => {
    const newSelected = new Set(selectedSourceDDOs);
    if (newSelected.has(ddoId)) {
      newSelected.delete(ddoId);
    } else {
      newSelected.add(ddoId);
    }
    setSelectedSourceDDOs(newSelected);
  };

  const handleTargetDDOSelect = (ddoId) => {
    const newSelected = new Set(selectedTargetDDOs);
    if (newSelected.has(ddoId)) {
      newSelected.delete(ddoId);
    } else {
      newSelected.add(ddoId);
    }
    setSelectedTargetDDOs(newSelected);
  };

  const handleMoveToTarget = () => {
    if (selectedSourceDDOs.size === 0) {
      toast.error('Please select at least one DDO to move');
      return;
    }

    if (!targetGSTIN) {
      toast.error('Please select target GSTIN first');
      return;
    }

    const selectedDDOs = sourceDDOs.filter(ddo => selectedSourceDDOs.has(ddo.id));
    
    // Add to target list and mark as moved
    setTargetDDOs([...targetDDOs, ...selectedDDOs]);
    setMovedDDOIds(new Set([...movedDDOIds, ...selectedDDOs.map(ddo => ddo.id)]));
    setSelectedSourceDDOs(new Set());
  };

  const handleMoveToSource = () => {
    if (selectedTargetDDOs.size === 0) {
      toast.error('Please select at least one DDO to move back');
      return;
    }

    const selectedDDOs = targetDDOs.filter(ddo => selectedTargetDDOs.has(ddo.id));
    const remainingDDOs = targetDDOs.filter(ddo => !selectedTargetDDOs.has(ddo.id));
    
    // Remove from target and unmark as moved
    setTargetDDOs(remainingDDOs);
    const newMovedIds = new Set(movedDDOIds);
    selectedDDOs.forEach(ddo => newMovedIds.delete(ddo.id));
    setMovedDDOIds(newMovedIds);
    setSelectedTargetDDOs(new Set());
  };

  const handleSaveMapping = async () => {
    if (!sourceGSTIN) {
      toast.error('Please select source GSTIN');
      return;
    }
    
    if (!targetGSTIN) {
      toast.error('Please select target GSTIN');
      return;
    }
    
    if (sourceGSTIN === targetGSTIN) {
      toast.error('Source and target GSTIN cannot be the same');
      return;
    }

    if (targetDDOs.length === 0) {
      toast.error('No DDOs selected for mapping');
      return;
    }

    setIsModalOpen(true);
  };

  const confirmSave = async () => {
    try {
      setLoading(true);
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.DDO_MAPPING_UPDATE, {
        sourceGSTIN: sourceGSTIN,
        targetGSTIN: targetGSTIN,
        ddoIds: targetDDOs.map(ddo => ddo.id),
      });

      if (response?.status === 'success') {
        toast.success('DDOs mapped successfully');
        setSelectedSourceDDOs(new Set());
        setSelectedTargetDDOs(new Set());
        setTargetDDOs([]);
        setMovedDDOIds(new Set()); // Clear moved DDOs after successful mapping
        // Refresh DDOs after successful mapping
        refetchSource();
        if (targetGSTIN) {
          refetchTarget();
        }
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
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="gradient-text">DDO Mapping Master</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Map DDOs between different GSTINs
          </p>
        </div>

        <div className="premium-card p-4 sm:p-6 space-y-6">
          {/* GSTIN Selection Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* Source GSTIN */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                From GSTIN
              </label>
              <select
                value={sourceGSTIN}
                onChange={(e) => handleSourceGSTINChange(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)] transition-colors"
              >
                {transformedGstinList.map((gstin) => (
                  <option key={gstin.id} value={gstin.gstNumber}>
                    {gstin.gstNumber} - {gstin.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                {getGSTINName(sourceGSTIN)}
              </p>
            </div>

            {/* Arrow Icon - Center */}
            <div className="hidden lg:flex items-center justify-center pt-6">
              <div className="bg-[var(--color-primary)]/10 p-3 rounded-full">
                <ArrowRight className="text-[var(--color-primary)]" size={24} />
              </div>
            </div>

            {/* Target GSTIN */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                To GSTIN
              </label>
              <select
                value={targetGSTIN}
                onChange={(e) => handleTargetGSTINChange(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)] transition-colors"
              >
                <option value="">Select Target GSTIN</option>
                {transformedGstinList
                  .filter((g) => g.gstNumber !== sourceGSTIN)
                  .map((gstin) => (
                    <option key={gstin.id} value={gstin.gstNumber}>
                      {gstin.gstNumber} - {gstin.name}
                    </option>
                  ))}
              </select>
              {targetGSTIN && (
                <p className="text-xs text-[var(--color-text-secondary)] truncate">
                  {getGSTINName(targetGSTIN)}
                </p>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
            {/* Source DDOs Column */}
            <div className="xl:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Available DDOs
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {sourceDDOs.length} items
                  </span>
                  <button
                    onClick={handleSourceSelectAll}
                    className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {selectedSourceDDOs.size === sourceDDOs.length && sourceDDOs.length > 0 ? (
                      <CheckCircle size={16} className="text-[var(--color-success)]" />
                    ) : (
                      <XCircle size={16} className="text-[var(--color-text-secondary)]" />
                    )}
                    {selectedSourceDDOs.size === sourceDDOs.length && sourceDDOs.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="bg-[var(--color-muted)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                {/* Mobile Card View */}
                <div className="block sm:hidden max-h-96 overflow-y-auto">
                  {sourceDDOs.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-secondary)]">
                      No DDOs available
                    </div>
                  ) : (
                    <div className="space-y-2 p-2">
                      {sourceDDOs.map((ddo) => (
                        <div
                          key={ddo.id}
                          onClick={() => handleSourceDDOSelect(ddo.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-all border ${
                            selectedSourceDDOs.has(ddo.id) 
                              ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30' 
                              : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-muted)]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {selectedSourceDDOs.has(ddo.id) ? (
                              <CheckCircle size={18} className="text-[var(--color-success)] flex-shrink-0" />
                            ) : (
                              <XCircle size={18} className="text-[var(--color-text-secondary)] flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--color-text-primary)] truncate">
                                {ddo.ddoName}
                              </p>
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                {ddo.ddoCode}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block max-h-96 overflow-y-auto">
                  {sourceDDOs.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-secondary)]">
                      No DDOs available
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-[var(--color-muted)] sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Select
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                            DDO Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                            DDO Name
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {sourceDDOs.map((ddo) => (
                          <tr
                            key={ddo.id}
                            onClick={() => handleSourceDDOSelect(ddo.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedSourceDDOs.has(ddo.id) 
                                ? 'bg-[var(--color-primary)]/10' 
                                : 'hover:bg-[var(--color-muted)]'
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              {selectedSourceDDOs.has(ddo.id) ? (
                                <CheckCircle size={18} className="text-[var(--color-success)]" />
                              ) : (
                                <XCircle size={18} className="text-[var(--color-text-secondary)]" />
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
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons Column */}
            <div className="xl:col-span-2 flex xl:flex-col items-center justify-center gap-3 py-2 xl:py-8">
              <Button
                onClick={handleMoveToTarget}
                variant="primary"
                disabled={selectedSourceDDOs.size === 0 || !targetGSTIN}
                className="w-full xl:w-auto flex items-center justify-center gap-2"
                size="sm"
              >
                <ChevronRight size={18} />
                <span className="hidden sm:inline">Move to Target</span>
                <span className="sm:hidden">Move</span>
              </Button>
              
              <Button
                onClick={handleMoveToSource}
                variant="secondary"
                disabled={selectedTargetDDOs.size === 0}
                className="w-full xl:w-auto flex items-center justify-center gap-2"
                size="sm"
              >
                <ChevronLeft size={18} />
                <span className="hidden sm:inline">Move Back</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>

            {/* Target DDOs Column */}
            <div className="xl:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  DDOs to be Mapped
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {targetDDOs.length} items
                  </span>
                  <button
                    onClick={handleTargetSelectAll}
                    className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {selectedTargetDDOs.size === targetDDOs.length && targetDDOs.length > 0 ? (
                      <CheckCircle size={16} className="text-[var(--color-success)]" />
                    ) : (
                      <XCircle size={16} className="text-[var(--color-text-secondary)]" />
                    )}
                    {selectedTargetDDOs.size === targetDDOs.length && targetDDOs.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="bg-[var(--color-muted)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                {/* Mobile Card View */}
                <div className="block sm:hidden max-h-96 overflow-y-auto">
                  {targetDDOs.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-secondary)]">
                      No DDOs selected for mapping
                    </div>
                  ) : (
                    <div className="space-y-2 p-2">
                      {targetDDOs.map((ddo) => (
                        <div
                          key={ddo.id}
                          onClick={() => handleTargetDDOSelect(ddo.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-all border ${
                            selectedTargetDDOs.has(ddo.id) 
                              ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30' 
                              : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-muted)]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {selectedTargetDDOs.has(ddo.id) ? (
                              <CheckCircle size={18} className="text-[var(--color-success)] flex-shrink-0" />
                            ) : (
                              <XCircle size={18} className="text-[var(--color-text-secondary)] flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--color-text-primary)] truncate">
                                {ddo.ddoName}
                              </p>
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                {ddo.ddoCode}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block max-h-96 overflow-y-auto">
                  {targetDDOs.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-secondary)]">
                      No DDOs selected for mapping
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-[var(--color-muted)] sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Select
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                            DDO Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                            DDO Name
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {targetDDOs.map((ddo) => (
                          <tr
                            key={ddo.id}
                            onClick={() => handleTargetDDOSelect(ddo.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedTargetDDOs.has(ddo.id) 
                                ? 'bg-[var(--color-primary)]/10' 
                                : 'hover:bg-[var(--color-muted)]'
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              {selectedTargetDDOs.has(ddo.id) ? (
                                <CheckCircle size={18} className="text-[var(--color-success)]" />
                              ) : (
                                <XCircle size={18} className="text-[var(--color-text-secondary)]" />
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
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSaveMapping}
              variant="primary"
              disabled={targetDDOs.length === 0 || !targetGSTIN}
              className="px-8 py-3"
            >
              Save Mapping
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
            Are you sure you want to map <strong>{targetDDOs.length} DDO(s)</strong> from{' '}
            <strong>{sourceGSTIN}</strong> to <strong>{targetGSTIN}</strong>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={confirmSave}>
              Confirm Mapping
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}   