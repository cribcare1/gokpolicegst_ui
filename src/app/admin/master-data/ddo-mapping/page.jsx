"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import Modal from '@/components/shared/Modal';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { t } from '@/lib/localization';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { LoadingProgressBar } from '@/components/shared/ProgressBar';

export default function DDOMappingPage() {
  const [gstinList, setGstinList] = useState([]);
  const [ddoList, setDdoList] = useState([]);
  const [currentGSTIN, setCurrentGSTIN] = useState('');
  const [targetGSTIN, setTargetGSTIN] = useState('');
  const [selectedDDOs, setSelectedDDOs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch GSTIN list
      const gstinResponse = await ApiService.handleGetRequest(API_ENDPOINTS.GST_LIST);
      if (gstinResponse?.status === 'success' && gstinResponse?.data) {
        setGstinList(gstinResponse.data);
        if (gstinResponse.data.length > 0) {
          setCurrentGSTIN(gstinResponse.data[0].gstNumber || '');
          setTargetGSTIN(gstinResponse.data.length > 1 ? gstinResponse.data[1].gstNumber : '');
        }
      } else {
        // Demo data
        const demoGSTINs = [
          { id: '1', gstNumber: '29AAAGO1111W1ZB', name: 'Government of Karnataka- Office of the Director General & Inspector General of Police, Karnataka' },
        ];
        setGstinList(demoGSTINs);
        setCurrentGSTIN('29AAAGO1111W1ZB');
        setTargetGSTIN('29AAAGO1111W2ZC');
      }

      // Fetch DDO list
      const ddoResponse = await ApiService.handleGetRequest(API_ENDPOINTS.DDO_LIST);
      if (ddoResponse?.status === 'success' && ddoResponse?.data) {
        setDdoList(ddoResponse.data);
      } else {
        // Demo data
        const demoDDOs = [
          { id: '1', ddoCode: '0200PO0032', ddoName: 'DCP CAR HQ' },
          { id: '2', ddoCode: '0200PO0033', ddoName: 'DCP South' },
          { id: '3', ddoCode: '0200PO0034', ddoName: 'DCP North' },
          { id: '4', ddoCode: '0200PO0035', ddoName: 'DCP West' },
          { id: '5', ddoCode: '0200PO0036', ddoName: 'DCP east' },
        ];
        setDdoList(demoDDOs);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
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
    if (!targetGSTIN) {
      toast.error('Please select target GSTIN');
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
      // API call to map DDOs to target GSTIN
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.ewingstds.com:8443/tds";
      const response = await ApiService.handlePostRequest(API_ENDPOINTS.DDO_MAPPING_UPDATE || `${API_BASE_URL}/ddo/mapping`, {
        sourceGSTIN: currentGSTIN,
        targetGSTIN: targetGSTIN,
        ddoIds: Array.from(selectedDDOs),
      });

      if (response?.status === 'success') {
        toast.success('DDOs mapped successfully');
        setSelectedDDOs(new Set());
        fetchData();
      } else {
        toast.error(response?.message || 'Failed to map DDOs');
      }
    } catch (error) {
      toast.error('Failed to map DDOs');
      console.error(error);
    } finally {
      setIsModalOpen(false);
    }
  };

  const getGSTINName = (gstin) => {
    const gstinObj = gstinList.find(g => g.gstNumber === gstin);
    return gstinObj?.name || gstin;
  };

  if (loading) {
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
            <span className="gradient-text">DDO Mapping Master</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Map DDOs to GSTINs for invoice generation
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
              onChange={(e) => setCurrentGSTIN(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {gstinList.map((gstin) => (
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
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            <div className="flex items-center justify-between p-3 bg-[var(--color-muted)] rounded-xl mb-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
              >
                {selectedDDOs.size === ddoList.length ? (
                  <CheckCircle size={18} className="text-green-500" />
                ) : (
                  <XCircle size={18} />
                )}
                Select All
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
              {gstinList
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

