import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';
import { useGstinList } from '@/hooks/useGstinList';
// // Demo DDO data for immediate display
// const DEMO_DDO_LIST = [
//   { id: '1', ddoCode: '0200PO0032', ddoName: 'DCP CAR HQ', gstin: '29AAAGO1111W1ZB' },
//   { id: '2', ddoCode: '0200PO0033', ddoName: 'DCP South Division', gstin: '29AAAGO1111W1ZB' },
//   { id: '3', ddoCode: '0200PO0034', ddoName: 'DCP North Division', gstin: '29AAAGO1111W1ZB' },
//   { id: '4', ddoCode: '0200PO0035', ddoName: 'DCP West Division', gstin: '29AAAGO1111W1ZB' },
//   { id: '5', ddoCode: '0200PO0036', ddoName: 'DCP East Division', gstin: '29AAAGO1111W1ZB' },
//   { id: '6', ddoCode: '0200PO0037', ddoName: 'DCP Traffic Division', gstin: '29AAAGO1111W1ZB' },
//   { id: '7', ddoCode: '0200PO0038', ddoName: 'DCP Crime Branch', gstin: '29AAAGO1111W1ZB' },
// ];

export function useDdoList(gstin) {
  const [ddoList, setDdoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { gstinList } = useGstinList();

  useEffect(() => {
    setDdoList([]);
    if (!gstin) {
      
      return;
    }

    // Show demo data immediately for instant UI
    // const filteredDemo = DEMO_DDO_LIST.filter(ddo => ddo.gstin === gstin);
    // setDdoList(filteredDemo);

    // Then try to fetch real data from API
    fetchDdoList(gstin);
  }, [gstin]);

  const fetchDdoList = async (gstinNumber) => {
    if (!gstinNumber) return;

    setLoading(true);
    try {
      const gstId = gstinList.find(item => item.gstNumber.trim().toUpperCase() === gstinNumber.trim().toUpperCase())?.gstId || null;
      const response = await ApiService.handleGetRequest(`${API_ENDPOINTS.DDO_LIST}${gstId}`);
      if (response?.status === 'success' && response?.data) {
        // Transform API response to match expected format
        const transformedDDOs = response.data.ddos;
        setDdoList(transformedDDOs);
      } 
    } catch (error) {
      console.error('Error fetching DDO list:', error);
      
    } finally {
      setLoading(false);
    }
  };

  return { ddoList, loading, refetch: () => fetchDdoList(gstin) };
}

