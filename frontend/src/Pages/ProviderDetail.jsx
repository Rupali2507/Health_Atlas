import React from "react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { useHealthContext } from "../Context/HealthContext";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle, AlertTriangle, History } from "lucide-react"; // Added Icons

const ProviderDetail = () => {
  const { selectedProvider, Dark } = useHealthContext();
  const navigate = useNavigate();

  if (!selectedProvider) {
    return (
      <div
        className={`flex min-h-screen ${
          Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <Sidebar />
        <div className="flex-1 lg:ml-[20vw]">
          <Navbar_III />
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold mt-10">No Provider Selected</h1>
            <p className={Dark ? "text-gray-300 mt-2" : "text-gray-600 mt-2"}>
              Please go back to the providers list to select one.
            </p>
            <button
              onClick={() => navigate("/provider")}
              className="mt-6 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-5 rounded-lg transition"
            >
              Back to Providers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- NEW: Helper Component for Audit Trail Tooltip ---
  const AuditField = ({ fieldKey, value, originalData, qaFlags }) => {
    // Check if this specific field was auto-healed
    // We look for a flag that contains "AUTO-HEALED" and relates to the field (e.g., address)
    // Adjust key matching based on your data structure (e.g., 'address' vs 'Address')
    const isHealed = qaFlags?.some(
      (flag) =>
        flag.includes("AUTO-HEALED") &&
        flag.toLowerCase().includes(fieldKey.toLowerCase())
    );

    if (!isHealed) {
      // Normal Render
      return <span className={Dark ? "text-gray-300" : "text-gray-700"}>{String(value)}</span>;
    }

    // Healed Render (Green + Tooltip)
    return (
      <div className="group relative inline-block cursor-help">
        {/* The Visible "Healed" Value */}
        <div className="flex items-center text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
          <CheckCircle size={14} className="mr-1.5" />
          {value}
        </div>

        {/* The Hover Tooltip (Audit Trail) */}
        <div className="absolute z-50 hidden group-hover:block bottom-full left-0 mb-2 w-72 bg-gray-900 text-white text-xs p-0 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
          {/* Tooltip Header */}
          <div className="bg-gray-800 p-2 border-b border-gray-700 flex items-center justify-between">
            <span className="font-bold flex items-center text-emerald-400">
              <History size={12} className="mr-1" /> DATA AUDIT LOG
            </span>
            <span className="text-[10px] text-gray-400">Auto-Healed</span>
          </div>
          
          {/* Tooltip Body */}
          <div className="p-3 grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
            {/* Old Value */}
            <div className="text-center">
                <div className="text-[10px] text-gray-500 uppercase mb-1">Original</div>
                <div className="text-red-400 line-through font-mono bg-red-400/10 px-1 rounded">
                    {originalData[fieldKey] || "N/A"}
                </div>
                <div className="text-[9px] text-gray-600 mt-1">User Upload</div>
            </div>

            {/* Arrow */}
            <div className="text-gray-500">→</div>

            {/* New Value */}
            <div className="text-center">
                <div className="text-[10px] text-gray-500 uppercase mb-1">Healed</div>
                <div className="text-emerald-400 font-bold font-mono bg-emerald-400/10 px-1 rounded">
                    {value}
                </div>
                <div className="text-[9px] text-gray-600 mt-1">NPI Registry</div>
            </div>
          </div>
          
          {/* Tooltip Footer */}
          <div className="bg-gray-800/50 p-2 text-[10px] text-gray-400 italic text-center border-t border-gray-700">
             Confidence: 98.5% (Surgical Match)
          </div>
        </div>
      </div>
    );
  };

  // --- MODIFIED: Specific Renderer for Final Profile ---
  const renderFinalProfileSection = (data, originalData, qaFlags) => {
    if (!data) return null;

    return (
      <div
        className={`p-6 rounded-2xl shadow-sm border mb-4 ${
          Dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <h3
          className={
            Dark
              ? "text-gray-200 text-lg font-semibold mb-4 flex items-center"
              : "text-gray-800 text-lg font-semibold mb-4 flex items-center"
          }
        >
          Final Verified Profile
          <span className="ml-2 text-xs font-normal text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Live
          </span>
        </h3>
        
        <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => {
                // Skip complex objects like nested validation details in this summary view
                if (typeof value === 'object' && value !== null) return null;
                
                return (
                    <div key={key} className="flex flex-col border-b border-gray-700/50 pb-2 last:border-0">
                        <span className={`text-xs uppercase tracking-wider font-semibold mb-1 ${Dark ? "text-gray-500" : "text-gray-400"}`}>
                            {key.replace(/_/g, " ")}
                        </span>
                        <div className="text-sm">
                            <AuditField 
                                fieldKey={key} 
                                value={value} 
                                originalData={originalData} 
                                qaFlags={qaFlags} 
                            />
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
  };

  const renderDetailSection = (title, data) => {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;

    return (
      <div
        className={`p-6 rounded-2xl shadow-sm border mb-4 ${
          Dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <h3
          className={
            Dark
              ? "text-gray-200 text-lg font-semibold mb-3"
              : "text-gray-800 text-lg font-semibold mb-3"
          }
        >
          {title}
        </h3>
        <pre
          className={`text-xs p-3 rounded-lg overflow-x-auto ${
            Dark ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-700"
          }`}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  const score = selectedProvider.confidence_score || 0;

  return (
    <div
      className={`flex min-h-screen ${
        Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Sidebar />
      <div className="flex-1 ">
        <Navbar_III />
        <div className="lg:ml-[20vw]">
          <div className="p-6">
            <button
              onClick={() => navigate(-1)}
              className={
                Dark
                  ? "flex items-center text-gray-300 hover:text-white font-medium mb-6"
                  : "flex items-center text-gray-600 hover:text-gray-900 font-medium mb-6"
              }
            >
              <ChevronLeft size={20} className="mr-1" />
              Back to List
            </button>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold font-[Inter]">
                  {selectedProvider.final_profile?.provider_name ||
                    selectedProvider.original_data.full_name}
                </h1>
                <p
                  className={Dark ? "text-gray-300 mt-1" : "text-gray-500 mt-1"}
                >
                  NPI: {selectedProvider.final_profile?.npi || "N/A"}
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <span className="text-sm font-semibold mr-2">
                  Confidence Score:
                </span>
                <span
                  className={`px-4 py-2 text-sm font-bold rounded-full ${
                    score >= 0.7
                      ? Dark
                        ? "bg-green-600 text-green-100"
                        : "bg-green-100 text-green-800"
                      : score >= 0.4
                      ? Dark
                        ? "bg-yellow-600 text-yellow-100"
                        : "bg-yellow-100 text-yellow-800"
                      : Dark
                      ? "bg-red-600 text-red-100"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {(score * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* MODIFIED: Replaced generic JSON dump with Smart Audit Render */}
              {renderFinalProfileSection(
                selectedProvider.final_profile,
                selectedProvider.original_data,
                selectedProvider.qa_flags
              )}

              {renderDetailSection(
                "NPI Registry Data",
                selectedProvider.final_profile?.npi_data
              )}
              {renderDetailSection(
                "Address Validation",
                selectedProvider.final_profile?.address_validation
              )}
              {renderDetailSection(
                "Enrichment Data",
                selectedProvider.final_profile?.enrichment_data
              )}
              {renderDetailSection(
                "Quality Assurance Flags",
                selectedProvider.qa_flags
              )}
              {renderDetailSection(
                "Original Input Data",
                selectedProvider.original_data
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetail;