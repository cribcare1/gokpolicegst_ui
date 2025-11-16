import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/components/api/api_const';
import ApiService from '@/components/api/api_service';

// Demo GSTIN data for immediate display
const DEMO_GSTIN_LIST = [
  {
    value: '29AAAGO1111W1ZB',
    label: '29AAAGO1111W1ZB - Government of Karnataka- Office of the Director General & Inspector General of Police, Karnataka',
    gstNumber: '29AAAGO1111W1ZB',
    name: 'Government of Karnataka- Office of the Director General & Inspector General of Police, Karnataka',
    address: 'No.1, Police Head Quarterz, Narpathuga Road Opp: Martha\'s Hospital, K R Circle Bengaluru-560001',
    contactNumber: '9902991144',
    email: 'Copadmin@ksp.gov.in'
  },
  {
    value: '29AABCU1234F1Z5',
    label: '29AABCU1234F1Z5 - Karnataka State Police Department',
    gstNumber: '29AABCU1234F1Z5',
    name: 'Karnataka State Police Department',
    address: 'Police Commissioner Office, Bengaluru',
    contactNumber: '9902991145',
    email: 'police@ksp.gov.in'
  },
  {
    value: '29AABPM5678G1Z6',
    label: '29AABPM5678G1Z6 - Karnataka Home Department',
    gstNumber: '29AABPM5678G1Z6',
    name: 'Karnataka Home Department',
    address: 'Vidhana Soudha, Bengaluru',
    contactNumber: '9902991146',
    email: 'home@karnataka.gov.in'
  },
  {
    value: '29AABCE9012H1Z7',
    label: '29AABCE9012H1Z7 - Karnataka Education Department',
    gstNumber: '29AABCE9012H1Z7',
    name: 'Karnataka Education Department',
    address: 'Education Bhavan, Bengaluru',
    contactNumber: '9902991147',
    email: 'education@karnataka.gov.in'
  },
  {
    value: '19ABCDE1234F1Z5',
    label: '19ABCDE1234F1Z5 - XYZ Corporation',
    gstNumber: '19ABCDE1234F1Z5',
    name: 'XYZ Corporation',
    address: '456 Brigade Road, Bangalore',
    contactNumber: '9876543211',
    email: 'xyz@example.com'
  }
];

export function useGstinList() {
  const [gstinList, setGstinList] = useState(DEMO_GSTIN_LIST);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show demo data immediately
    setGstinList(DEMO_GSTIN_LIST);
    // Then try to fetch real data in background
    fetchGstinList();
  }, []);

  const fetchGstinList = async () => {
    setLoading(true);
    try {
      const response = await ApiService.handleGetRequest(API_ENDPOINTS.GST_LIST, 2000);
      if (response?.status === 'success' && response?.data && response.data.length > 0) {
        // Extract GSTIN numbers from the response
        const gstinNumbers = response.data.map(item => {
          const gstinValue = item.gstNumber || item.gstinNumber || item.gstin;
          // Check for name in multiple possible fields
          const gstinName = item.gstName || item.name || item.gstinName || item.gstin_name || '';
          const label = gstinName ? `${gstinValue} - ${gstinName}` : gstinValue;
          return {
            value: gstinValue,
            label: label,
            gstNumber: gstinValue,
            name: gstinName,
            ...item
          };
        });
        // Update with real data if available
        setGstinList(gstinNumbers);
      }
    } catch (error) {
      console.error('Error fetching GSTIN list:', error);
      // Keep demo data on error
      console.log('Using demo GSTIN data');
    } finally {
      setLoading(false);
    }
  };

  return { gstinList, loading, refetch: fetchGstinList };
}

