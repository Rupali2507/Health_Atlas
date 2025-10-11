import React, { useState } from "react";
import { Search } from "lucide-react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { useHealthContext } from "../Context/HealthContext";
import { useNavigate } from "react-router-dom";

const Provider = () => {
  const { validationRuns, setSelectedProvider } = useHealthContext();
  const navigate = useNavigate();

  // --- HELPER FUNCTION TO FORMAT ADDRESS ---
  // ✅ FIX: This new function safely handles both string and object addresses.
  const formatAddress = (address) => {
    if (typeof address === 'string') {
      return address;
    }
    if (typeof address === 'object' && address !== null) {
      // Joins the values of the address object into a single string
      return Object.values(address).join(', ');
    }
    return "N/A"; // Fallback for invalid data
  };

  const providerData = (Array.isArray(validationRuns) ? validationRuns : []).flatMap(run => 
    (Array.isArray(run.results) ? run.results : []).map(result => {
      const score = result.confidence_score || 0;
      return {
        name: result.final_profile?.provider_name || result.original_data?.full_name || "Unknown Provider",
        specialty: result.final_profile?.specialty || "N/A",
        phone: result.final_profile?.phone || "N/A",
        // ✅ FIX: Use the new helper function to ensure address is always a string
        address: formatAddress(result.final_profile?.address || result.original_data?.address),
        confidence: Math.round(score * 100),
        status: score >= 0.7 ? "Updated" : "Needs Review",
        fullResult: result 
      };
    })
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");

  const filteredProviders = providerData.filter((provider) => {
    const matchesSearch =
      (provider.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.specialty || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.address || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || provider.status === statusFilter;
    const matchesSpecialty = specialtyFilter === "All" || provider.specialty === specialtyFilter;
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const uniqueSpecialties = [
    "All",
    ...new Set(providerData.map((p) => p.specialty).filter(s => s && s !== "N/A")),
  ];

  const handleProviderClick = (provider) => {
    setSelectedProvider(provider.fullResult);
    navigate('/provider-detail');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar_III />
        <div className="p-6">
          <h1 className="text-3xl font-bold font-[Inter] mb-6">Providers</h1>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 mb-6">
            <div className="relative w-full sm:w-1/3">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, specialty, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Updated">Updated</option>
              <option value="Needs Review">Needs Review</option>
            </select>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {uniqueSpecialties.map((spec, i) => (
                <option key={i} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Providers Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
                <tr>
                  <th className="py-3 px-6">Provider Name</th>
                  <th className="py-3 px-6 hidden sm:table-cell">Specialty</th>
                  <th className="py-3 px-6 hidden sm:table-cell">Phone</th>
                  <th className="py-3 px-6 hidden md:table-cell">Address</th>
                  <th className="py-3 px-6">Confidence</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProviders.length > 0 ? (
                  filteredProviders.map((provider, index) => (
                    <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleProviderClick(provider)}>
                      <td className="py-4 px-6 font-semibold text-gray-900">{provider.name}</td>
                      <td className="py-4 px-6 hidden sm:table-cell">{provider.specialty}</td>
                      <td className="py-4 px-6 hidden sm:table-cell">{provider.phone}</td>
                      <td className="py-4 px-6 hidden md:table-cell">{provider.address}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${provider.confidence >= 80 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-700"}`}>
                          {provider.confidence}%
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${provider.status === "Updated" ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-600"}`}>
                          {provider.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-500 italic">
                      No providers found. Please run a validation on the Upload page first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Provider;