import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';

// Demo GSTIN data for immediate display


export function useGstinList() {
  const [gstinList, setGstinList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch if gstinList is empty
    if (gstinList.length === 0) {
      fetchGstinList();
    }
  }, [gstinList]); // depend on gstinList

  const fetchGstinList = async () => {
    setLoading(true);
    try {
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.GST_LIST, 4000);
      if (response?.status === 'success' && response?.data?.length > 0) {
        const gstinNumbers = response.data.map(item => {
          const gstinValue = item.gstNumber || item.gstinNumber || item.gstin;
          const gstinName = item.gstName || item.name || item.gstinName || item.gstin_name || '';
          const label = gstinName ? `${gstinValue} - ${gstinName}` : gstinValue;
          return {
            value: gstinValue,
            label,
            gstNumber: gstinValue,
            name: gstinName,
            ...item
          };
        });
        setGstinList(gstinNumbers);
      }
    } catch (error) {
      console.error('Error fetching GSTIN list:', error);
      console.log('Using demo GSTIN data');
    } finally {
      setLoading(false);
    }
  };

  return { gstinList, loading, refetch: fetchGstinList };
}


