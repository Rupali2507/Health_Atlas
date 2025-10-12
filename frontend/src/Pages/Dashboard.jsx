import React from "react";
import { Users, ClipboardList, Clock, ShieldAlert } from "lucide-react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { useHealthContext } from "../Context/HealthContext";

const Dashboard = () => {
  const { validationRuns, Dark } = useHealthContext();

  // --- METRIC CALCULATIONS ---
  const allResults = validationRuns.flatMap((run) => run.results);
  const totalProvidersProcessed = allResults.length;
  const needsReviewCount = allResults.filter(
    (r) => r.confidence_score < 0.7
  ).length;
  const averageConfidenceScore =
    totalProvidersProcessed > 0
      ? (allResults.reduce((acc, r) => acc + r.confidence_score, 0) /
          totalProvidersProcessed) *
        100
      : 0;
  const timeSavedInMinutes = totalProvidersProcessed * 2;
  const timeSavedHours = Math.floor(timeSavedInMinutes / 60);
  const timeSavedMinutes = timeSavedInMinutes % 60;
  const latestRun =
    validationRuns.length > 0
      ? validationRuns[validationRuns.length - 1]
      : null;

  // --- Dynamic Alerts ---
  const highPriorityAlerts = allResults.filter((r) => r.confidence_score < 0.4);

  // --- Dynamic classes based on dark mode ---
  const bgMain = Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = Dark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const textSecondary = Dark ? "text-gray-400" : "text-gray-500";
  const iconColor = Dark ? "text-gray-300" : "text-gray-400";
  const alertBg = Dark
    ? "bg-red-700/20 text-red-100 border-red-600"
    : "bg-red-50 text-red-700 border-red-300";

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      <Sidebar />
      <div className="flex-1 ">
        <Navbar_III />
        <div className="p-6">
          <h1 className="font-bold text-3xl font-[Inter] mb-6">
            Provider Data Validation Dashboard
          </h1>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1 */}
            <div className={`p-6 rounded-2xl shadow-sm border ${cardBg}`}>
              <div className="flex justify-between items-center">
                <p className={`${textSecondary} font-medium`}>
                  Total Providers Processed
                </p>
                <Users className={`w-5 h-5 ${iconColor}`} />
              </div>
              <p className="text-3xl font-semibold mt-3">
                {totalProvidersProcessed}
              </p>
            </div>
            {/* Card 2 */}
            <div className={`p-6 rounded-2xl shadow-sm border ${cardBg}`}>
              <div className="flex justify-between items-center">
                <p className={`${textSecondary} font-medium`}>
                  Providers Needing Review
                </p>
                <ClipboardList className={`w-5 h-5 ${iconColor}`} />
              </div>
              <p className="text-3xl font-semibold mt-3">{needsReviewCount}</p>
            </div>
            {/* Card 3 */}
            <div className={`p-6 rounded-2xl shadow-sm border ${cardBg}`}>
              <div className="flex justify-between items-center">
                <p className={`${textSecondary} font-medium`}>
                  Average Confidence Score
                </p>
                <ShieldAlert className={`w-5 h-5 ${iconColor}`} />
              </div>
              <p className="text-3xl font-semibold mt-3 text-blue-500">
                {averageConfidenceScore.toFixed(1)}%
              </p>
            </div>
            {/* Card 4 */}
            <div className={`p-6 rounded-2xl shadow-sm border ${cardBg}`}>
              <div className="flex justify-between items-center">
                <p className={`${textSecondary} font-medium`}>
                  Time Saved vs Manual
                </p>
                <Clock className={`w-5 h-5 ${iconColor}`} />
              </div>
              <p className="text-3xl font-semibold mt-3">
                {timeSavedHours}h {timeSavedMinutes}m
              </p>
            </div>
          </div>

          {/* Recent Activity + Alerts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className={`border rounded-2xl shadow-sm p-6 ${cardBg}`}>
              <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
              {latestRun ? (
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full text-left text-sm">
                    {/* ... keep your table content ... */}
                  </table>
                </div>
              ) : (
                <p className={`${textSecondary} mt-4`}>
                  No validation activity yet. Upload a file to get started!
                </p>
              )}
            </div>

            {/* High Priority Alerts */}
            <div className={`border rounded-2xl shadow-sm p-6 ${cardBg}`}>
              <h2 className="text-xl font-semibold mb-2">
                High Priority Alerts
              </h2>
              <div className="space-y-3 mt-3">
                {highPriorityAlerts.length > 0 ? (
                  highPriorityAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`border rounded-xl p-4 ${alertBg}`}
                    >
                      <p className="font-semibold">
                        Low Confidence: {alert.original_data.full_name}
                      </p>
                      <p className="text-sm">
                        Confidence score is only{" "}
                        {(alert.confidence_score * 100).toFixed(0)}%. Manual
                        review recommended.
                      </p>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${textSecondary}`}>
                    No high priority alerts found. All records have a confidence
                    score of 40% or higher.
                  </p>
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
