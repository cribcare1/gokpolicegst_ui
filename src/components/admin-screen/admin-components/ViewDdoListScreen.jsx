"use client";
import { useState, useEffect } from 'react';
import { Search, XCircle, Eye, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import DDODetailsView from './ViewDdoDetailsScreen';
import { API_ENDPOINTS } from "@/components/api/api_const";
import ApiService from "@/components/api/api_service";
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNetworkStatus } from '@/components/utils/network';



export default function DDOManagementSystem() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDDO, setSelectedDDO] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ddoData, setDdos] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const isOnline = useNetworkStatus();

  const router = useRouter();


  // Responsive items per page
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) setItemsPerPage(4);
      else if (width < 1024) setItemsPerPage(5);
      else setItemsPerPage(6);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Fetch DDOs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setError("User not logged in");
          return;
        }

        const queryParams = new URLSearchParams({
          adminId: userId,
          page: '0',
          size: '100',
        });

        //const fullUrl = `${API_ENDPOINTS.GET_ALL_DDO}?${queryParams.toString()}`; TODO needed for pagination
        const result = await ApiService.handleGetRequest(API_ENDPOINTS.GET_ALL_DDO);
        const ddoList = result.ddoList || []; // <-- Fixed this line
        setDdos(ddoList);
        setFilteredData(ddoList);

      } catch (err) {
        setError("Failed to fetch DDO data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search
  useEffect(() => {
    const filtered = ddoData.filter(ddo =>
      ddo.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ddo.tanNumber?.toLowerCase().includes(searchTerm.toLowerCase()) 
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, ddoData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentItems.length === 0 && filteredData.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredData, currentItems.length]);

  const handleClear = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (selectedDDO) {
    return <DDODetailsView ddo={selectedDDO} onBack={() => setSelectedDDO(null)} />;
  }

  if (isLoading) return <div className="p-6 text-center text-blue-500">Loading DDOs...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  if(!isOnline){
    return (<div><p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p></div>);
   }
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-8xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 md:p-6 text-center text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">DDO Management System</h1>
          <p>View and manage Drawing and Disbursing Officers</p>
        </div>

        <div className="p-4 md:p-6">
          <div className="relative mb-6">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
              <Search className="ml-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by DDO Name, TAN or Code"
                className="w-full p-3 focus:outline-none text-gray-700"
              />
              {searchTerm && (
                <button onClick={handleClear} className="mr-3 text-gray-500 hover:text-gray-700">
                  <XCircle size={20} />
                </button>
              )}
            </div>
          </div>

          <div className="mb-4 text-gray-700 font-medium">
            Found {filteredData.length} DDO record(s)
          </div>

          <div className="overflow-x-auto mb-6 border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <th className="p-3 text-left font-semibold w-16">Sl No</th>
                  <th className="p-3 text-left font-semibold">Name of DDO</th>
                  <th className="p-3 text-left font-semibold">TAN of DDO</th>
                  <th className="p-3 text-center font-semibold w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((ddo, index) => (
                    <tr key={ddo.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200 hover:bg-blue-50`}>
                      <td className="p-3 text-gray-700">{indexOfFirstItem + index + 1}</td>
                      <td className="p-3 font-medium text-gray-800">{ddo.fullName}</td>
                      <td className="p-3 text-gray-700">{ddo.tanNumber}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedDDO(ddo)}
                          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                  
                ) : (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
                      No DDO records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
              </div>

              <div className="flex items-center space-x-1">
              <button
  onClick={() => setCurrentPage(1)}
  disabled={currentPage === 1}
  className="p-2 text-blue-600 hover:bg-blue-100 rounded-md disabled:opacity-50"
>
  <ChevronsLeft size={18} />
</button>


                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) pageNumber = i + 1;
                  else if (currentPage <= 3) pageNumber = i + 1;
                  else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + i;
                  else pageNumber = currentPage - 2 + i;

                  return (
                    <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-md disabled:opacity-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  );
                })}

<button
  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
  disabled={currentPage === totalPages}
  className="p-2 text-blue-600 hover:bg-blue-100 rounded-md disabled:opacity-50"
>
  <ChevronRight size={18} />
</button>

<button
  onClick={() => setCurrentPage(totalPages)}
  disabled={currentPage === totalPages}
  className="p-2 text-blue-600 hover:bg-blue-100 rounded-md disabled:opacity-50"
>
  <ChevronsRight size={18} />
</button>

              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <button onClick={handleClear} className="p-3 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 flex items-center justify-center">
              <XCircle size={18} className="mr-2" /> Clear Search
            </button>
            {/* <button className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center">
              <Home size={18} className="mr-2" /> Return to Dashboard
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
