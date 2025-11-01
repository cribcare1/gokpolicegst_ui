"use client";
import { useNetworkStatus } from '@/components/utils/network';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { LOGIN_CONSTANT } from '@/components/utils/constant';


export default function DDOProfile() {
  const isOnline = useNetworkStatus();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem(LOGIN_CONSTANT.USER_ID);
        if (!userId) {
          setError("User not logged in");
          return;
        }

        const result = await ApiService.handleGetRequest(API_ENDPOINTS.GET_DDO_DETAILS + userId);
        const ddoDetails = result.ddo_data;
        setProfile(ddoDetails);
      } catch (err) {
        setError("Failed to fetch DDO data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
  
      fetchData();
    
  }, []);

  if (isLoading) {
    return <div className="p-6 text-center text-blue-600 font-medium">Loading DDO details...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600 font-medium">{error}</div>;
  }

  if (!profile) {
    return null; // Or a loading/fallback UI
  }
  const formatLabel = (key) => {
    return key.replace(/([A-Z])/g, ' $1').trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleChange = (key, value) => {
    setProfile({
      ...profile,
      [key]: value
    });
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  if(!isOnline){
    return (<div><p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p></div>);
   }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4 md:p-6 flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto">
        {/* Card with shadow and border */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
          
          {/* Header with reduced height */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-4 relative">
            <div className="absolute left-0 right-0 bottom-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-12">
                <path fill="#ffffff" fillOpacity="1" d="M0,128L48,144C96,160,192,192,288,186.7C384,181,480,139,576,138.7C672,139,768,181,864,186.7C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
            </div>
            <div className="flex items-center justify-center mb-2">
              <div className="bg-white p-2 rounded-full shadow-md">
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white h-12 w-12 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">DDO</span>
                </div>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white text-center mb-1">DDO Profile</h1>
          </div>
          
          {/* Content with reduced spacing */}
          <div className="p-4 md:p-6">
            <div className="space-y-3">
              {Object.entries(profile).map(([key, value]) => (
                <div key={key} className="flex flex-col md:flex-row md:items-center border-b border-gray-100 pb-3 transition-all hover:bg-purple-50 hover:rounded-lg px-2">
                  <div className="w-full md:w-1/3 text-gray-600 font-medium flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-purple-400 inline-block"></span>
                    <span>{formatLabel(key)}</span>
                  </div>
                  <div className="w-full md:w-2/3 mt-1 md:mt-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full p-1.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      />
                    ) : (
                      <span className="text-gray-800 font-medium py-1 block">{value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Buttons with reduced margins */}
            <div className="mt-5 flex justify-end space-x-3">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}