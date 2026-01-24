import React, { useState } from "react";
import { Search, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { useHealthContext } from "../Context/HealthContext";
import { useNavigate } from "react-router-dom";

const Provider = () => {
  const { validationRuns, setSelectedProvider, Dark } = useHealthContext();
  const navigate = useNavigate();

  const formatAddress = (address) => {
    if (typeof address === "string") return address;
    if (typeof address === "object" && address !== null)
      return Object.values(address).join(", ");
    return "N/A";
  };

  const providerData = (
    Array.isArray(validationRuns) ? validationRuns : []
  ).flatMap((run) =>
    (Array.isArray(run.results) ? run.results : []).map((result) => {
      const score = result.confidence_score || 0;
      const path = result.quality_metrics?.path || result.path || 'UNKNOWN';
      const fraudCount = result.fraud_indicators?.length || 0;
      const qaFlagsCount = result.qa_flags?.length || 0;
      
      return {
        name:
          result.final_profile?.provider_name ||
          result.original_data?.full_name ||
          "Unknown Provider",
        specialty: result.final_profile?.specialty || result.original_data?.specialty || "N/A",
        phone: result.final_profile?.phone || result.original_data?.phone || "N/A",
        address: formatAddress(
          result.final_profile?.address || result.original_data?.address
        ),
        npi: result.final_profile?.NPI || result.original_data?.NPI || "N/A",
        confidence: Math.round(score * 100),
        path: path,
        fraudCount: fraudCount,
        qaFlagsCount: qaFlagsCount,
        requiresReview: result.requires_human_review || false,
        reviewReason: result.review_reason || "",
        status: score >= 0.7 ? "Validated" : "Needs Review",
        fullResult: result,
      };
    })
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");
  const [pathFilter, setPathFilter] = useState("All");

  const filteredProviders = providerData.filter((provider) => {
    const matchesSearch =
      (provider.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.specialty || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.npi || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || provider.status === statusFilter;
    const matchesSpecialty =
      specialtyFilter === "All" || provider.specialty === specialtyFilter;
    const matchesPath =
      pathFilter === "All" || provider.path === pathFilter;
      
    return matchesSearch && matchesStatus && matchesSpecialty && matchesPath;
  });

  const uniqueSpecialties = [
    "All",
    ...new Set(
      providerData.map((p) => p.specialty).filter((s) => s && s !== "N/A")
    ),
  ];

  const handleProviderClick = (provider) => {
    setSelectedProvider(provider.fullResult);
    navigate("/provider-detail", { 
      state: { selectedProvider: provider.fullResult } 
    });
  };

  // --- Dynamic classes for dark mode ---
  const bgMain = Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = Dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const inputBg = Dark ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300";
  const textSecondary = Dark ? "text-gray-300" : "text-gray-700";
  const tableHeadBg = Dark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600";
  const tableRowHover = Dark ? "hover:bg-gray-700" : "hover:bg-gray-50";

  // Summary stats
  const totalProviders = providerData.length;
  const greenPath = providerData.filter(p => p.path === 'GREEN').length;
  const yellowPath = providerData.filter(p => p.path === 'YELLOW').length;
  const redPath = providerData.filter(p => p.path === 'RED').length;
  const fraudDetected = providerData.filter(p => p.fraudCount > 0).length;

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      <Sidebar />
      <div className="flex-1 lg:ml-[20vw]">
        <Navbar_III />
        <div className="p-6">
          <h1 className="text-3xl font-bold font-[Inter] mb-6">Providers Directory</h1>

          {/* Summary Stats */}
          {totalProviders > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className={`p-4 rounded-xl ${Dark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{totalProviders}</p>
              </div>
              <div className={`p-4 rounded-xl ${Dark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                <p className="text-sm text-emerald-600">Green Path</p>
                <p className="text-2xl font-bold text-emerald-500">{greenPath}</p>
              </div>
              <div className={`p-4 rounded-xl ${Dark ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'}`}>
                <p className="text-sm text-yellow-600">Yellow Path</p>
                <p className="text-2xl font-bold text-yellow-500">{yellowPath}</p>
              </div>
              <div className={`p-4 rounded-xl ${Dark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                <p className="text-sm text-red-600">Red Path</p>
                <p className="text-2xl font-bold text-red-500">{redPath}</p>
              </div>
              <div className={`p-4 rounded-xl ${Dark ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'}`}>
                <p className="text-sm text-orange-600">Fraud Flags</p>
                <p className="text-2xl font-bold text-orange-500">{fraudDetected}</p>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 mb-6">
            <div className="relative w-full sm:w-1/3">
              <Search
                className={`absolute left-3 top-2.5 w-5 h-5 ${
                  Dark ? "text-gray-400" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                placeholder="Search by name, specialty, NPI, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBg}`}
              />
            </div>
            
            <select
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value)}
              className={`w-full sm:w-40 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBg}`}
            >
              <option value="All">All Paths</option>
              <option value="GREEN">🟢 Green</option>
              <option value="YELLOW">🟡 Yellow</option>
              <option value="RED">🔴 Red</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full sm:w-40 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBg}`}
            >
              <option value="All">All Statuses</option>
              <option value="Validated">Validated</option>
              <option value="Needs Review">Needs Review</option>
            </select>
            
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className={`w-full sm:w-48 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBg}`}
            >
              {uniqueSpecialties.map((spec, i) => (
                <option key={i} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Providers Table */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-sm overflow-x-auto ${cardBg}`}
          >
            <table className="min-w-full text-left">
              <thead className={`${tableHeadBg} uppercase text-sm`}>
                <tr>
                  <th className="py-3 px-6">Provider Name</th>
                  <th className="py-3 px-6 hidden lg:table-cell">NPI</th>
                  <th className="py-3 px-6 hidden sm:table-cell">Specialty</th>
                  <th className="py-3 px-6 hidden xl:table-cell">Phone</th>
                  <th className="py-3 px-6">Path</th>
                  <th className="py-3 px-6">Confidence</th>
                  <th className="py-3 px-6 hidden md:table-cell">Flags</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProviders.length > 0 ? (
                  filteredProviders.map((provider, index) => (
                    <tr
                      key={index}
                      className={`cursor-pointer ${tableRowHover} transition-colors`}
                      onClick={() => handleProviderClick(provider)}
                    >
                      <td className={`py-4 px-6 font-semibold ${textSecondary}`}>
                        <div className="flex items-center gap-2">
                          {provider.name}
                          {provider.requiresReview && (
                            <AlertTriangle size={16} className="text-amber-500" title="Requires Human Review" />
                          )}
                        </div>
                      </td>
                      
                      <td className={`py-4 px-6 hidden lg:table-cell font-mono text-xs ${textSecondary}`}>
                        {provider.npi}
                      </td>
                      
                      <td className={`py-4 px-6 hidden sm:table-cell ${textSecondary}`}>
                        {provider.specialty}
                      </td>
                      
                      <td className={`py-4 px-6 hidden xl:table-cell ${textSecondary}`}>
                        {provider.phone}
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          provider.path === 'GREEN' 
                            ? Dark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : provider.path === 'YELLOW'
                            ? Dark ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            : provider.path === 'RED'
                            ? Dark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-100 text-red-700 border border-red-200'
                            : Dark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {provider.path === 'GREEN' && '🟢'}
                          {provider.path === 'YELLOW' && '🟡'}
                          {provider.path === 'RED' && '🔴'}
                          {provider.path !== 'GREEN' && provider.path !== 'YELLOW' && provider.path !== 'RED' && '⚪'}
                          {' '}{provider.path}
                        </span>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            provider.confidence >= 70
                              ? Dark
                                ? "bg-blue-600 text-blue-100"
                                : "bg-blue-100 text-blue-800"
                              : Dark
                              ? "bg-red-600 text-red-100"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {provider.confidence}%
                        </span>
                      </td>
                      
                      <td className="py-4 px-6 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {provider.fraudCount > 0 && (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              Dark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                            }`}>
                              <Shield size={12} />
                              {provider.fraudCount}
                            </span>
                          )}
                          {provider.qaFlagsCount > 0 && (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              Dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                            }`}>
                              <AlertTriangle size={12} />
                              {provider.qaFlagsCount}
                            </span>
                          )}
                          {provider.fraudCount === 0 && provider.qaFlagsCount === 0 && (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit ${
                            provider.status === "Validated"
                              ? Dark
                                ? "bg-teal-600 text-teal-100"
                                : "bg-teal-100 text-teal-700"
                              : Dark
                              ? "bg-red-600 text-red-100"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {provider.status === "Validated" ? (
                            <CheckCircle size={14} />
                          ) : (
                            <AlertTriangle size={14} />
                          )}
                          {provider.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center py-8 italic text-gray-500"
                    >
                      No providers found. {totalProviders === 0 ? "Please run a validation on the Upload page first." : "Try adjusting your filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
          {filteredProviders.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Showing {filteredProviders.length} of {totalProviders} providers
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Provider;