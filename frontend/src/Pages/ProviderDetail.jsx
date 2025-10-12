import React from "react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { useHealthContext } from "../Context/HealthContext";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

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
              {renderDetailSection(
                "Final Verified Profile",
                selectedProvider.final_profile
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
