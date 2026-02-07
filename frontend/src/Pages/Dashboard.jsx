import React, { useState, useEffect } from "react";
import { 
  Users, 
  ClipboardList, 
  Clock, 
  ShieldAlert, 
  TrendingDown, 
  Activity, 
  Calendar, 
  Zap,
  RefreshCw 
} from "lucide-react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { useHealthContext } from "../Context/HealthContext";

const Dashboard = () => {
  const { Dark, navigate } = useHealthContext();
  
  // State for dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    total_providers: 0,
    needs_review: 0,
    avg_confidence: 0,
    path_distribution: {},
    fraud_detected: 0,
    recent_activity: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") {
      navigate("/signin");
    }
  }, [navigate]);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/api/analytics/dashboard-stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.stats) {
        setDashboardStats(data.stats);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchDashboardData();
    
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // --- METRIC CALCULATIONS FROM API DATA ---
  const totalProvidersProcessed = dashboardStats.total_providers || 0;
  const needsReviewCount = dashboardStats.needs_review || 0;
  const averageConfidenceScore = dashboardStats.avg_confidence || 0;

  // Calculate time saved (2 minutes per provider)
  const timeSavedInMinutes = totalProvidersProcessed * 2;
  const timeSavedHours = Math.floor(timeSavedInMinutes / 60);
  const timeSavedMinutes = timeSavedInMinutes % 60;

  // --- PATH DISTRIBUTION (GREEN, YELLOW, RED) ---
  const pathDistribution = dashboardStats.path_distribution || {};
  const greenCount = pathDistribution.GREEN || 0;
  const yellowCount = pathDistribution.YELLOW || 0;
  const redCount = pathDistribution.RED || 0;

  // Recent activity from API
  const recentActivity = dashboardStats.recent_activity || [];
  
  // High priority alerts (confidence < 40%)
  const highPriorityAlerts = recentActivity.filter((r) => r.confidence_score < 0.4);

  // --- Dynamic classes based on dark mode ---
  const bgMain = Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = Dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textSecondary = Dark ? "text-gray-400" : "text-gray-500";
  const iconColor = Dark ? "text-gray-300" : "text-gray-400";
  const alertBg = Dark ? "bg-red-900/20 text-red-200 border-red-800" : "bg-red-50 text-red-700 border-red-300";

  // Loading state
  if (loading && totalProvidersProcessed === 0) {
    return (
      <div className={`flex min-h-screen ${bgMain}`}>
        <Sidebar />
        <div className="flex-1 lg:ml-[20vw]">
          <Navbar_III />
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className={textSecondary}>Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && totalProvidersProcessed === 0) {
    return (
      <div className={`flex min-h-screen ${bgMain}`}>
        <Sidebar />
        <div className="flex-1 lg:ml-[20vw]">
          <Navbar_III />
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-500 font-semibold mb-2">Failed to load dashboard data</p>
              <p className={`${textSecondary} mb-4`}>{error}</p>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <p className={`${textSecondary} mt-1`}>
                Real-time overview of network accuracy and AI operations.
              </p> 
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all ${
                Dark 
                  ? "bg-indigo-900/30 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/50" 
                  : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Updating...' : 'Refresh'}
            </button>
          </div>

          {/* Data Health Overview (Path Distribution) */}
          <div className={`mb-8 rounded-2xl border shadow-sm ${cardBg} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Activity size={22}/>
                  Validation Path Distribution
                </h2>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  Provider confidence scores across GREEN, YELLOW, and RED paths
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* GREEN Path */}
              <div className={`p-5 rounded-xl border ${Dark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-lg ${Dark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
                    <Calendar size={20} className="text-emerald-600" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${Dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-200 text-emerald-700"}`}>
                    GREEN
                  </span>
                </div>
                <p className="text-3xl font-bold mb-1">{greenCount}</p>
                <p className="text-sm font-semibold text-emerald-600 mb-1">Auto-Approved</p>
                <p className={`text-xs ${textSecondary}`}>High confidence (85%+)</p>
              </div>

              {/* YELLOW Path */}
              <div className={`p-5 rounded-xl border ${Dark ? "bg-yellow-500/5 border-yellow-500/20" : "bg-yellow-50 border-yellow-200"}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-lg ${Dark ? "bg-yellow-500/10" : "bg-yellow-100"}`}>
                    <Clock size={20} className="text-yellow-600" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${Dark ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-200 text-yellow-700"}`}>
                    YELLOW
                  </span>
                </div>
                <p className="text-3xl font-bold mb-1">{yellowCount}</p>
                <p className="text-sm font-semibold text-yellow-600 mb-1">Needs Review</p>
                <p className={`text-xs ${textSecondary}`}>Medium confidence (65-84%)</p>
              </div>

              {/* RED Path */}
              <div className={`p-5 rounded-xl border ${Dark ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-200"}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-lg ${Dark ? "bg-red-500/10" : "bg-red-100"}`}>
                    <TrendingDown size={20} className="text-red-600" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${Dark ? "bg-red-500/20 text-red-400" : "bg-red-200 text-red-700"}`}>
                    RED
                  </span>
                </div>
                <p className="text-3xl font-bold mb-1">{redCount}</p>
                <p className="text-sm font-semibold text-red-600 mb-1">Critical Issues</p>
                <p className={`text-xs ${textSecondary}`}>Low confidence (&lt;65%)</p>
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
              {recentActivity.length > 0 ? (
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full text-left text-sm">
                    <thead className={`border-b ${Dark ? "border-gray-700" : "border-gray-100"}`}>
                      <tr>
                        <th className="pb-2 font-medium">Provider</th>
                        <th className="pb-2 font-medium">Path</th>
                        <th className="pb-2 font-medium">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.slice(0, 5).map((r, i) => {
                        const pathColor = 
                          r.path === 'GREEN' ? 'bg-green-100 text-green-700' :
                          r.path === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700';
                        
                        return (
                          <tr key={i} className={`border-b ${Dark ? "border-gray-700/30" : "border-gray-100"}`}>
                            <td className="py-2">{r.provider_name || 'Unknown'}</td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${pathColor}`}>
                                {r.path || 'N/A'}
                              </span>
                            </td>
                            <td className="py-2 font-mono">{(r.confidence_score * 100).toFixed(0)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`${textSecondary} mt-4 flex flex-col items-center justify-center h-40`}>
                  <Activity size={40} className="mb-2 opacity-20"/>
                  <p>No validation activity yet.</p>
                  <p className="text-xs opacity-70">Upload a file to get started!</p>
                </div>
              )}
            </div>

            {/* High Priority Alerts */}
            <div className={`border rounded-2xl shadow-sm p-6 ${cardBg}`}>
              <h2 className="text-xl font-semibold mb-2">
                High Priority Alerts
              </h2>
              <div className="space-y-3 mt-3">
                {highPriorityAlerts.length > 0 ? (
                  highPriorityAlerts.slice(0, 5).map((alert, index) => (
                    <div
                      key={index}
                      className={`border rounded-xl p-4 ${alertBg}`}
                    >
                      <p className="font-semibold flex items-center gap-2">
                        <ShieldAlert size={16}/>
                        Low Confidence: {alert.provider_name || 'Unknown Provider'}
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