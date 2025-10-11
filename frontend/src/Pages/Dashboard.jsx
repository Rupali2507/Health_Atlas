import React from "react";
import { Users, ClipboardList, Clock, ShieldAlert } from "lucide-react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { useHealthContext } from "../Context/HealthContext";

const Dashboard = () => {
  const { validationRuns } = useHealthContext();

  // --- METRIC CALCULATIONS ---
  const allResults = validationRuns.flatMap(run => run.results);
  const totalProvidersProcessed = allResults.length;
  const needsReviewCount = allResults.filter(r => r.confidence_score < 0.7).length;
  const averageConfidenceScore = totalProvidersProcessed > 0
    ? (allResults.reduce((acc, r) => acc + r.confidence_score, 0) / totalProvidersProcessed) * 100
    : 0;
  const timeSavedInMinutes = totalProvidersProcessed * 2;
  const timeSavedHours = Math.floor(timeSavedInMinutes / 60);
  const timeSavedMinutes = timeSavedInMinutes % 60;
  const latestRun = validationRuns.length > 0 ? validationRuns[validationRuns.length - 1] : null;

  // --- NEW: Dynamic Alerts Logic ---
  // An alert is created for any provider with a confidence score below 40%
  const highPriorityAlerts = allResults.filter(r => r.confidence_score < 0.4);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar_III />
        <div className="p-6">
          <h1 className="font-bold text-3xl font-[Inter] mb-6">
            Provider Data Validation Dashboard
          </h1>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-gray-500 font-medium">Total Providers Processed</p>
                <Users className="text-gray-400 w-5 h-5" />
              </div>
              <p className="text-3xl font-semibold mt-3">{totalProvidersProcessed}</p>
            </div>
            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-gray-500 font-medium">Providers Needing Review</p>
                <ClipboardList className="text-gray-400 w-5 h-5" />
              </div>
              <p className="text-3xl font-semibold mt-3">{needsReviewCount}</p>
            </div>
            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-gray-500 font-medium">Average Confidence Score</p>
                <ShieldAlert className="text-gray-400 w-5 h-5" />
              </div>
              <p className="text-3xl font-semibold mt-3 text-blue-700">{averageConfidenceScore.toFixed(1)}%</p>
            </div>
            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-gray-500 font-medium">Time Saved vs Manual</p>
                <Clock className="text-gray-400 w-5 h-5" />
              </div>
              <p className="text-3xl font-semibold mt-3">{timeSavedHours}h {timeSavedMinutes}m</p>
            </div>
          </div>

          {/* Recent Activity + Alerts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
              {latestRun ? (
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full text-left text-sm">
                    {/* ... table content remains the same ... */}
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 mt-4">No validation activity yet. Upload a file to get started!</p>
              )}
            </div>

            {/* High Priority Alerts */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-2">High Priority Alerts</h2>
              {/* ✅ CHANGED: This section is now dynamic */}
              <div className="space-y-3 mt-3">
                {highPriorityAlerts.length > 0 ? (
                  highPriorityAlerts.map((alert, index) => (
                    <div key={index} className="border border-red-300 bg-red-50 text-red-700 rounded-xl p-4">
                      <p className="font-semibold">
                        Low Confidence: {alert.original_data.full_name}
                      </p>
                      <p className="text-sm text-red-600">
                        Confidence score is only { (alert.confidence_score * 100).toFixed(0) }%. Manual review recommended.
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No high priority alerts found. All records have a confidence score of 40% or higher.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

