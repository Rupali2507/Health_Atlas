import React, { useState } from "react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { Search, ChevronDown } from "lucide-react";
import { providerData } from "../assets/assets";

const Provider = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");

  // Filter logic
  const filteredProviders = providerData.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || provider.status === statusFilter;

    const matchesSpecialty =
      specialtyFilter === "All" || provider.specialty === specialtyFilter;

    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const uniqueSpecialties = [
    "All",
    ...new Set(providerData.map((p) => p.specialty)),
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar_III />

        <div className="p-6">
          <h1 className="text-3xl font-bold font-[Inter] mb-6">Providers</h1>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 mb-6">
            {/* Search Bar */}
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Updated">Updated</option>
              <option value="Needs Review">Needs Review</option>
            </select>

            {/* Specialty Filter */}
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {uniqueSpecialties.map((spec, i) => (
                <option key={i} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Providers Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="min-w-full text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
                <tr>
                  <th className="py-3 px-6">Provider Name</th>
                  <th className="py-3 px-6">Specialty</th>
                  <th className="py-3 px-6">Phone</th>
                  <th className="py-3 px-6">Address</th>
                  <th className="py-3 px-6">Confidence</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredProviders.length > 0 ? (
                  filteredProviders.map((provider, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        {provider.name}
                      </td>
                      <td className="py-4 px-6">{provider.specialty}</td>
                      <td className="py-4 px-6">{provider.phone}</td>
                      <td className="py-4 px-6">{provider.address}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            provider.confidence >= 80
                              ? "bg-blue-100 text-blue-800"
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
                              ? "bg-teal-100 text-teal-700"
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
                      className="text-center py-6 text-gray-500 italic"
                    >
                      No providers match your search or filters.
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
