import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Filter,
  Search,
  Clock,
  User,
  FileText,
  Shield,
  TrendingDown,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { useHealthContext } from "../Context/HealthContext";

const ReviewQueue = () => {
  const { Dark, navigate } = useHealthContext();

  // State
  const [reviewItems, setReviewItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("PENDING"); // PENDING, APPROVED, REJECTED, ALL
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") {
      navigate("/signin");
    }
  }, [navigate]);

  // Fetch review queue
  const fetchReviewQueue = async () => {
    try {
      setLoading(true);
      setError(null);

      const url =
        filter === "ALL"
          ? "http://localhost:8000/api/review-queue?status=ALL"
          : `http://localhost:8000/api/review-queue?status=${filter}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setReviewItems(data.items || []);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching review queue:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReviewQueue();
  }, [filter]);

  // Handle approve
  const handleApprove = async (reviewId) => {
    if (!reviewerNotes.trim()) {
      alert("Please add reviewer notes before approving");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/review-queue/${reviewId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewer_name: localStorage.getItem("userEmail") || "admin@healthatlas.com",
            reviewer_notes: reviewerNotes,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to approve");

      const data = await response.json();
      alert(data.message || "Provider approved successfully!");

      // Close modal and refresh
      setShowModal(false);
      setSelectedReview(null);
      setReviewerNotes("");
      fetchReviewQueue();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Handle reject
  const handleReject = async (reviewId) => {
    if (!reviewerNotes.trim()) {
      alert("Please add reviewer notes before rejecting");
      return;
    }

    if (!window.confirm("Are you sure you want to REJECT this provider?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/review-queue/${reviewId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewer_name: localStorage.getItem("userEmail") || "admin@healthatlas.com",
            reviewer_notes: reviewerNotes,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to reject");

      const data = await response.json();
      alert(data.message || "Provider rejected successfully!");

      // Close modal and refresh
      setShowModal(false);
      setSelectedReview(null);
      setReviewerNotes("");
      fetchReviewQueue();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Toggle row expansion
  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Filter items by search
  const filteredItems = reviewItems.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.provider_name?.toLowerCase().includes(searchLower) ||
      item.npi?.includes(searchTerm) ||
      item.review_reason?.toLowerCase().includes(searchLower)
    );
  });

  // Dynamic classes
  const bgMain = Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = Dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textSecondary = Dark ? "text-gray-400" : "text-gray-500";
  const inputBg = Dark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300";
  const hoverBg = Dark ? "hover:bg-gray-700" : "hover:bg-gray-50";

  // Get priority badge color
  const getPriorityColor = (priority) => {
    if (priority === "HIGH")
      return Dark
        ? "bg-red-500/20 text-red-400 border-red-500/30"
        : "bg-red-100 text-red-700 border-red-300";
    return Dark
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-yellow-100 text-yellow-700 border-yellow-300";
  };

  // Get status badge color
  const getStatusColor = (status) => {
    if (status === "APPROVED")
      return Dark
        ? "bg-green-500/20 text-green-400"
        : "bg-green-100 text-green-700";
    if (status === "REJECTED")
      return Dark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700";
    return Dark
      ? "bg-yellow-500/20 text-yellow-400"
      : "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      <Sidebar />
      <div className="flex-1 lg:ml-[20vw]">
        <Navbar_III />
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="font-bold text-3xl font-[Inter] flex items-center gap-3">
                <AlertTriangle className="text-yellow-500" size={32} />
                Review Queue
              </h1>
              <p className={`${textSecondary} mt-1`}>
                Providers requiring human verification and approval
              </p>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchReviewQueue}
              disabled={loading}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                Dark
                  ? "bg-indigo-900/30 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/50"
                  : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Updating..." : "Refresh"}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-xl border ${cardBg}`}>
              <div className="flex items-center gap-3">
                <Clock className="text-yellow-500" size={24} />
                <div>
                  <p className={`text-sm ${textSecondary}`}>Pending</p>
                  <p className="text-2xl font-bold">
                    {reviewItems.filter((r) => r.status === "PENDING").length}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${cardBg}`}>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <p className={`text-sm ${textSecondary}`}>Approved</p>
                  <p className="text-2xl font-bold">
                    {reviewItems.filter((r) => r.status === "APPROVED").length}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${cardBg}`}>
              <div className="flex items-center gap-3">
                <XCircle className="text-red-500" size={24} />
                <div>
                  <p className={`text-sm ${textSecondary}`}>Rejected</p>
                  <p className="text-2xl font-bold">
                    {reviewItems.filter((r) => r.status === "REJECTED").length}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${cardBg}`}>
              <div className="flex items-center gap-3">
                <AlertCircle className="text-orange-500" size={24} />
                <div>
                  <p className={`text-sm ${textSecondary}`}>High Priority</p>
                  <p className="text-2xl font-bold">
                    {reviewItems.filter((r) => r.priority === "HIGH").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className={`p-4 rounded-xl border ${cardBg} mb-6`}>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex-1">
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>
                  <Filter size={16} className="inline mr-2" />
                  Filter by Status
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${inputBg} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                >
                  <option value="PENDING">Pending Only</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="REJECTED">Rejected Only</option>
                  <option value="ALL">All Items</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex-1">
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>
                  <Search size={16} className="inline mr-2" />
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, NPI, or reason..."
                  className={`w-full px-4 py-2 rounded-lg border ${inputBg} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                />
              </div>
            </div>
          </div>

          {/* Review Table */}
          <div className={`rounded-xl border ${cardBg} overflow-hidden`}>
            {loading && filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className={textSecondary}>Loading review queue...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-500 font-semibold mb-2">
                    Failed to load review queue
                  </p>
                  <p className={textSecondary}>{error}</p>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p className={`${textSecondary} font-semibold`}>
                    No items in review queue
                  </p>
                  <p className={`${textSecondary} text-sm mt-2`}>
                    {filter === "PENDING"
                      ? "All providers have been reviewed!"
                      : `No ${filter.toLowerCase()} items found`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={`border-b ${Dark ? "border-gray-700" : "border-gray-200"}`}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Provider</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">NPI</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Confidence</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Priority</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr
                          className={`border-b ${Dark ? "border-gray-700/30" : "border-gray-100"} ${hoverBg} transition-colors cursor-pointer`}
                          onClick={() => toggleRow(item.id)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {expandedRows.has(item.id) ? (
                                <ChevronUp size={16} className={textSecondary} />
                              ) : (
                                <ChevronDown size={16} className={textSecondary} />
                              )}
                              <div>
                                <p className="font-semibold">{item.provider_name || "Unknown"}</p>
                                <p className={`text-xs ${textSecondary} truncate max-w-xs`}>
                                  {item.review_reason}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-sm">{item.npi || "N/A"}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`font-semibold ${
                                (item.confidence_score || 0) >= 0.7
                                  ? "text-green-500"
                                  : (item.confidence_score || 0) >= 0.5
                                  ? "text-yellow-500"
                                  : "text-red-500"
                              }`}
                            >
                              {((item.confidence_score || 0) * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                                item.priority
                              )}`}
                            >
                              {item.priority || "NORMAL"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                item.status
                              )}`}
                            >
                              {item.status || "PENDING"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              {item.status === "PENDING" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedReview(item);
                                    setShowModal(true);
                                  }}
                                  className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-1"
                                >
                                  <Eye size={14} />
                                  Review
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row Details */}
                        {expandedRows.has(item.id) && (
                          <tr className={`${Dark ? "bg-gray-700/30" : "bg-gray-50"}`}>
                            <td colSpan="7" className="px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className={`font-semibold mb-2 ${textSecondary}`}>
                                    Review Reason:
                                  </p>
                                  <p>{item.review_reason || "N/A"}</p>
                                </div>

                                {item.flags && item.flags.length > 0 && (
                                  <div>
                                    <p className={`font-semibold mb-2 ${textSecondary}`}>
                                      QA Flags:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {item.flags.map((flag, idx) => (
                                        <li key={idx} className="text-yellow-600">
                                          {flag}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {item.fraud_indicators && item.fraud_indicators.length > 0 && (
                                  <div>
                                    <p className={`font-semibold mb-2 text-red-500`}>
                                      Fraud Indicators:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {item.fraud_indicators.map((indicator, idx) => (
                                        <li key={idx} className="text-red-600">
                                          {indicator}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {item.reviewer_notes && (
                                  <div>
                                    <p className={`font-semibold mb-2 ${textSecondary}`}>
                                      Reviewer Notes:
                                    </p>
                                    <p className="italic">{item.reviewer_notes}</p>
                                    <p className={`text-xs mt-1 ${textSecondary}`}>
                                      Reviewed by: {item.reviewer_name} on{" "}
                                      {new Date(item.reviewed_at).toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className={`${cardBg} rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText size={24} className="text-blue-500" />
                    Review Provider
                  </h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>
                    ID: {selectedReview.id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedReview(null);
                    setReviewerNotes("");
                  }}
                  className={`p-2 rounded-lg ${hoverBg}`}
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* Provider Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <p className={`text-sm ${textSecondary} mb-1`}>Provider Name</p>
                  <p className="font-semibold text-lg">
                    {selectedReview.provider_name || "Unknown"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1`}>NPI</p>
                    <p className="font-mono">{selectedReview.npi || "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1`}>Confidence Score</p>
                    <p
                      className={`font-semibold ${
                        (selectedReview.confidence_score || 0) >= 0.7
                          ? "text-green-500"
                          : (selectedReview.confidence_score || 0) >= 0.5
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    >
                      {((selectedReview.confidence_score || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div>
                  <p className={`text-sm ${textSecondary} mb-1`}>Review Reason</p>
                  <p className="text-yellow-600">{selectedReview.review_reason || "N/A"}</p>
                </div>

                {selectedReview.flags && selectedReview.flags.length > 0 && (
                  <div>
                    <p className={`text-sm ${textSecondary} mb-2`}>QA Flags</p>
                    <div className="space-y-1">
                      {selectedReview.flags.map((flag, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border ${
                            Dark
                              ? "bg-yellow-500/10 border-yellow-500/30"
                              : "bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          <p className="text-sm text-yellow-600">{flag}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReview.fraud_indicators &&
                  selectedReview.fraud_indicators.length > 0 && (
                    <div>
                      <p className={`text-sm text-red-500 mb-2 font-semibold`}>
                        ⚠️ Fraud Indicators
                      </p>
                      <div className="space-y-1">
                        {selectedReview.fraud_indicators.map((indicator, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border ${
                              Dark
                                ? "bg-red-500/10 border-red-500/30"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            <p className="text-sm text-red-600">{indicator}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Reviewer Notes */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>
                  <User size={16} className="inline mr-2" />
                  Reviewer Notes (Required)
                </label>
                <textarea
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Enter your review notes... (e.g., 'Called state board - license verified active')"
                  className={`w-full px-4 py-3 rounded-lg border ${inputBg} focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px]`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedReview.id)}
                  disabled={!reviewerNotes.trim()}
                  className={`flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors ${
                    !reviewerNotes.trim() ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <CheckCircle size={20} />
                  Approve & Add to Network
                </button>
                <button
                  onClick={() => handleReject(selectedReview.id)}
                  disabled={!reviewerNotes.trim()}
                  className={`flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors ${
                    !reviewerNotes.trim() ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <XCircle size={20} />
                  Reject Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;