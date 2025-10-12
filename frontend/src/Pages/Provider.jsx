import React, { useState } from "react";
import { Search } from "lucide-react";
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
      return {
        name:
          result.final_profile?.provider_name ||
          result.original_data?.full_name ||
          "Unknown Provider",
        specialty: result.final_profile?.specialty || "N/A",
        phone: result.final_profile?.phone || "N/A",
        address: formatAddress(
          result.final_profile?.address || result.original_data?.address
        ),
        confidence: Math.round(score * 100),
        status: score >= 0.7 ? "Updated" : "Needs Review",
        fullResult: result,
      };
    })
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");

  const filteredProviders = providerData.filter((provider) => {
    const matchesSearch =
      (provider.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.specialty || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (provider.address || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || provider.status === statusFilter;
    const matchesSpecialty =
      specialtyFilter === "All" || provider.specialty === specialtyFilter;
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const uniqueSpecialties = [
    "All",
    ...new Set(
      providerData.map((p) => p.specialty).filter((s) => s && s !== "N/A")
    ),
  ];

  const handleProviderClick = (provider) => {
    setSelectedProvider(provider.fullResult);
    navigate("/provider-detail");
  };

  // --- Dynamic classes for dark mode ---
  const bgMain = Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = Dark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const inputBg = Dark
    ? "bg-gray-700 text-white border-gray-600"
    : "bg-white text-gray-900 border-gray-300";
  const textSecondary = Dark ? "text-gray-300" : "text-gray-700";
  const tableHeadBg = Dark
    ? "bg-gray-700 text-gray-300"
    : "bg-gray-100 text-gray-600";
  const tableRowHover = Dark ? "hover:bg-gray-700" : "hover:bg-gray-50";

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      <Sidebar />
      <div className="flex-1 ">
        <Navbar_III />
        <div className="p-6">
          <h1 className="text-3xl font-bold font-[Inter] mb-6">Providers</h1>

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
                placeholder="Search by name, specialty, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBg}`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full sm:w-48 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBg}`}
            >
              <option value="All">All Statuses</option>
              <option value="Updated">Updated</option>
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
                    <tr
                      key={index}
                      className={`cursor-pointer ${tableRowHover}`}
                      onClick={() => handleProviderClick(provider)}
                    >
                      <td
                        className={`py-4 px-6 font-semibold ${textSecondary}`}
                      >
                        {provider.name}
                      </td>
                      <td
                        className={`py-4 px-6 hidden sm:table-cell ${textSecondary}`}
                      >
                        {provider.specialty}
                      </td>
                      <td
                        className={`py-4 px-6 hidden sm:table-cell ${textSecondary}`}
                      >
                        {provider.phone}
                      </td>
                      <td
                        className={`py-4 px-6 hidden md:table-cell ${textSecondary}`}
                      >
                        {provider.address}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            provider.confidence >= 80
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
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            provider.status === "Updated"
                              ? Dark
                                ? "bg-teal-600 text-teal-100"
                                : "bg-teal-100 text-teal-700"
                              : Dark
                              ? "bg-red-600 text-red-100"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {provider.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-6 italic text-gray-500"
                    >
                      No providers found. Please run a validation on the Upload
                      page first.
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
