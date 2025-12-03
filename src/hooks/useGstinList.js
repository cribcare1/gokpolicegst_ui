import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';

// Demo GSTIN data for immediate display


export function useGstinList() {
  const [gstinList, setGstinList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // On mount, try to load cached gstinList from localStorage. If present and non-empty,
    // use it and avoid an API call. Otherwise fetch from API.
    if (typeof window === 'undefined') return;

    try {
      const cached = localStorage.getItem('gstinListCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGstinList(parsed);
          return; // skip API call
        }
      }
    } catch (err) {
      console.warn('Failed to read cached gstinList from localStorage', err);
    }

    // no cache found, fetch from API
    fetchGstinList();
  }, []);

  const fetchGstinList = async (force = false) => {
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
        // cache for future mounts
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('gstinListCache', JSON.stringify(gstinNumbers));
          }
        } catch (err) {
          console.warn('Failed to cache gstinList to localStorage', err);
        }
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


