import React from "react";
import { useEffect } from "react";
import { 
  Users, 
  ClipboardList, 
  Clock, 
  ShieldAlert, 
  TrendingDown, 
  Activity, 
  Calendar, 
  Zap 
} from "lucide-react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { useHealthContext } from "../Context/HealthContext";

const Dashboard = () => {
  const { validationRuns, Dark, navigate } = useHealthContext();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") {
      navigate("/signin");
    }
  }, [navigate]);

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

  // --- 🧠 AI PREDICTIVE MATH CALCULATIONS ---
  // We bucket providers based on the 'data_health' score from Python
  let highRiskCount = 0; // Reliability < 0.5 (Decaying fast)
  let mediumRiskCount = 0; // Reliability < 0.8 (Stale)
  let healthyCount = 0; // Reliability > 0.8 (Fresh)

  allResults.forEach((r) => {
    // Default to 1.0 (Healthy) if logic hasn't run yet to avoid scary dashboard on empty state
    const reliability = r.final_profile?.data_health?.current_reliability ?? 1.0;
    
    if (reliability < 0.5) highRiskCount++;
    else if (reliability < 0.8) mediumRiskCount++;
    else healthyCount++;
  });

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
    ? "bg-red-900/20 text-red-200 border-red-800"
    : "bg-red-50 text-red-700 border-red-300";

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      <Sidebar />
      <div className="flex-1 lg:ml-[20vw]">
        <Navbar_III />
        <div className="p-6">
          <div className="flex justify-between items-end mb-6">
            <div>
               <h1 className="font-bold text-3xl font-[Inter]">
              Provider Data Validation Dashboard
            </h1>
            <p className={textSecondary + " mt-1"}>
                Real-time overview of network accuracy and AI operations.
            </p> 
            </div>
            {/* AI Badge */}
             <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border ${Dark ? "bg-indigo-900/30 border-indigo-500/50 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-700"}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                AI Predictive Engine Active
             </div>
          </div>

          {/* --- NEW: PREDICTIVE MAINTENANCE SCHEDULE (The "Data Decay" Visual) --- */}
          <div className={`mb-8 rounded-2xl p-1 overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg`}>
            <div className={`${Dark ? "bg-gray-900" : "bg-white"} rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 flex items-center gap-2">
                            <Activity className="text-purple-600" size={20}/>
                            Predictive Data Health Forecast
                        </h2>
                        <p className={`text-sm ${textSecondary} mt-1`}>
                            Based on Exponential Decay Model: <span className="font-mono text-xs opacity-70">R(t) = R₀e^(-λt)</span>
                        </p>
                    </div>
                    <button className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors">
                        Auto-Schedule Revalidation
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Urgent / High Risk */}
                    <div className={`p-4 rounded-xl border-l-4 border-red-500 ${Dark ? "bg-gray-800" : "bg-gray-50"}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Critical Decay</p>
                                <p className="text-2xl font-bold">{highRiskCount}</p>
                                <p className={`text-xs ${textSecondary} mt-1`}>Re-validate within 7 days</p>
                            </div>
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <TrendingDown size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Medium Risk */}
                     <div className={`p-4 rounded-xl border-l-4 border-yellow-500 ${Dark ? "bg-gray-800" : "bg-gray-50"}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Stale Data</p>
                                <p className="text-2xl font-bold">{mediumRiskCount}</p>
                                <p className={`text-xs ${textSecondary} mt-1`}>Re-validate within 30 days</p>
                            </div>
                            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                <Clock size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Healthy */}
                     <div className={`p-4 rounded-xl border-l-4 border-emerald-500 ${Dark ? "bg-gray-800" : "bg-gray-50"}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Healthy</p>
                                <p className="text-2xl font-bold">{healthyCount}</p>
                                <p className={`text-xs ${textSecondary} mt-1`}>Next check: 90 days</p>
                            </div>
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                <Calendar size={18} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1 */}
            <div className={`p-6 rounded-2xl shadow-sm border ${cardBg}`}>
              <div className="flex justify-between items-center">
                <p className={`${textSecondary} font-medium`}>
                  Total Providers
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
                  Needing Review
                </p>
                <ClipboardList className={`w-5 h-5 ${iconColor}`} />
              </div>
              <p className="text-3xl font-semibold mt-3">{needsReviewCount}</p>
            </div>
            {/* Card 3 */}
            <div className={`p-6 rounded-2xl shadow-sm border ${cardBg}`}>
              <div className="flex justify-between items-center">
                <p className={`${textSecondary} font-medium`}>
                  Avg Confidence
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
                  Time Saved
                </p>
                <Zap className={`w-5 h-5 text-yellow-500`} />
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
                    {/* Simplified for brevity, add your table headers/rows back here */}
                    <thead className={`border-b ${Dark ? "border-gray-700" : "border-gray-100"}`}>
                        <tr>
                            <th className="pb-2 font-medium">Provider</th>
                            <th className="pb-2 font-medium">Status</th>
                            <th className="pb-2 font-medium">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {latestRun.results.slice(0, 5).map((r, i) => (
                            <tr key={i} className="border-b border-gray-100/10">
                                <td className="py-2">{r.original_data.full_name}</td>
                                <td className="py-2">
                                    <span className={`px-2 py-0.5 rounded text-xs ${r.confidence_score > 0.7 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                        {r.confidence_score > 0.7 ? "Verified" : "Review"}
                                    </span>
                                </td>
                                <td className="py-2 font-mono">{(r.confidence_score * 100).toFixed(0)}%</td>
                            </tr>
                        ))}
                    </tbody>
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
                      <p className="font-semibold flex items-center gap-2">
                        <ShieldAlert size={16}/>
                        Low Confidence: {alert.original_data.full_name}
                      </p>
                      <p className="text-sm mt-1 opacity-90">
                        Confidence score is only{" "}
                        {(alert.confidence_score * 100).toFixed(0)}%. Manual
                        review recommended.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className={`text-sm ${textSecondary} flex flex-col items-center justify-center h-40`}>
                     <ShieldAlert size={40} className="mb-2 opacity-20"/>
                    <p>No critical alerts found.</p>
                    <p className="text-xs opacity-70">System running optimally.</p>
                  </div>
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