import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';

// Demo DDO data for immediate display
const DEMO_DDO_LIST = [
  { id: '1', ddoCode: '0200PO0032', ddoName: 'DCP CAR HQ', gstin: '29AAAGO1111W1ZB' },
  { id: '2', ddoCode: '0200PO0033', ddoName: 'DCP South Division', gstin: '29AAAGO1111W1ZB' },
  { id: '3', ddoCode: '0200PO0034', ddoName: 'DCP North Division', gstin: '29AAAGO1111W1ZB' },
  { id: '4', ddoCode: '0200PO0035', ddoName: 'DCP West Division', gstin: '29AAAGO1111W1ZB' },
  { id: '5', ddoCode: '0200PO0036', ddoName: 'DCP East Division', gstin: '29AAAGO1111W1ZB' },
  { id: '6', ddoCode: '0200PO0037', ddoName: 'DCP Traffic Division', gstin: '29AAAGO1111W1ZB' },
  { id: '7', ddoCode: '0200PO0038', ddoName: 'DCP Crime Branch', gstin: '29AAAGO1111W1ZB' },
];

export function useDdoList(gstin) {
  const [ddoList, setDdoList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gstin) {
      setDdoList([]);
      return;
    }

    // Show demo data immediately for instant UI
    const filteredDemo = DEMO_DDO_LIST.filter(ddo => ddo.gstin === gstin);
    setDdoList(filteredDemo);

    // Then try to fetch real data from API
    fetchDdoList(gstin);
  }, [gstin]);

  const fetchDdoList = async (gstinNumber) => {
    if (!gstinNumber) return;

    setLoading(true);
    try {
      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.DDO_LIST}?gstin=${gstinNumber}`);
      if (response?.status === 'success' && response?.data) {
        // Transform API response to match expected format
        const transformedDDOs = response.data.map((item) => ({
          id: item.id || item.ddoId || String(Date.now() + Math.random()),
          ddoCode: item.ddoCode || item.code || '',
          ddoName: item.ddoName || item.name || '',
          gstin: gstinNumber
        }));
        setDdoList(transformedDDOs);
      } else {
        // Keep demo data if API fails
        const filteredDemo = DEMO_DDO_LIST.filter(ddo => ddo.gstin === gstinNumber);
        setDdoList(filteredDemo);
      }
    } catch (error) {
      console.error('Error fetching DDO list:', error);
      // Keep demo data on error
      const filteredDemo = DEMO_DDO_LIST.filter(ddo => ddo.gstin === gstinNumber);
      setDdoList(filteredDemo);
    } finally {
      setLoading(false);
    }
  };

  return { ddoList, loading, refetch: () => fetchDdoList(gstin) };
}

