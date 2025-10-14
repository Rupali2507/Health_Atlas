import React, { useState, useRef, useMemo } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar_III from "../Components/Navbar_III";
import { useHealthContext } from "../Context/HealthContext";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Explicitly import the function

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// --- SVG Icons ---
const FiUploadCloud = ({ Dark }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`w-10 h-10 ${Dark ? "text-gray-300" : "text-gray-400"}`}
    fill="none"
    viewBox="0 0 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l5-5m0 0l-5-5m5 5H7"
    />
  </svg>
);

const FiCheckCircle = ({ Dark }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`w-5 h-5 mr-2 ${Dark ? "text-green-300" : "text-green-500"}`}
    fill="none"
    viewBox="0 0 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const Upload = () => {
  const { addValidationRun, Dark } = useHealthContext();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [log, setLog] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'priority_score', direction: 'ascending' });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleLabelClick = () => fileInputRef.current.click();

  const handleClear = () => {
    setSelectedFile(null);
    setLog([]);
    setResults([]);
    setIsLoading(false);
    setIsFinished(false);
  };

  const handleValidate = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setIsFinished(false);
    setLog(["Starting validation process..."]);
    let currentRunResults = [];
    setResults([]);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await fetch(`${API_URL}/validate-file`, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const event of events) {
          if (!event.trim()) continue;
          const lines = event.split("\n");
          for (const line of lines) {
            if (line.startsWith("data:")) {
              const dataStr = line.substring(5).trim();
              if (dataStr && dataStr !== "[DONE]") {
                try {
                  const data = JSON.parse(dataStr);
                  if (data.type === "log") {
                    setLog((prev) => [...prev, data.content]);
                  } else if (data.type === "result") {
                    currentRunResults.push(data.data);
                    setResults((prev) => [...prev, data.data]);
                  } else if (data.type === "close" || data.type === "complete") {
                    setIsLoading(false);
                    setIsFinished(true);
                    addValidationRun({ fileName: selectedFile.name, results: currentRunResults });
                  }
                } catch (parseErr) { console.error("JSON parse error:", parseErr, "Data:", dataStr); }
              }
            }
          }
        }
      }
      if (isLoading) {
        setIsLoading(false);
        setIsFinished(true);
        if (currentRunResults.length > 0) {
          addValidationRun({ fileName: selectedFile.name, results: currentRunResults });
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setLog((prev) => [...prev, `ERROR: ${err.message}`]);
      setIsLoading(false);
    }
  };

  const sortedResults = useMemo(() => {
    let itemsWithPriority = results.map(r => {
      const memberCount = parseInt(r.original_data?.member_count || 0, 10);
      const confidence = r.confidence_score || 0;
      const priorityScore = confidence - (1 - confidence) * (memberCount / 1000);
      return { ...r, priority_score: priorityScore };
    });

    if (sortConfig.key !== null) {
      itemsWithPriority.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return itemsWithPriority;
  }, [results, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  let summaryData = null;
  if (isFinished && results.length > 0) {
    const total = results.length;
    const validated = results.filter(r => r.confidence_score >= 0.7).length;
    const flagged = total - validated;
    const flagCounts = results.reduce((acc, r) => {
      if (r.qa_flags && r.qa_flags.length > 0) {
        r.qa_flags.forEach(flag => {
          const flagType = flag.split(':')[0];
          acc[flagType] = (acc[flagType] || 0) + 1;
        });
      }
      return acc;
    }, {});
    summaryData = { total, validated, flagged, flagCounts };
  }

  const bgMain = Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = Dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textSecondary = Dark ? "text-gray-300" : "text-gray-700";
  const buttonBg = Dark ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-teal-500 hover:bg-teal-600 text-white";
  const resetBtn = Dark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700";
  const logBg = Dark ? "bg-gray-700 text-gray-100" : "bg-gray-900/95 text-white";

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      <Sidebar />
      <div className="flex-1 lg:ml-[20vw]">
        <Navbar_III />
        <div className="p-6">
          <h1 className="font-bold text-3xl mb-6">Upload & Validate Provider Data</h1>

          {!isFinished && (
            <div className={`border rounded-2xl p-5 sm:p-8 shadow-sm mb-6 ${cardBg}`}>
              <h2 className={`text-lg font-semibold mb-2 ${textSecondary}`}>Upload Provider Data</h2>
              <div className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer ${Dark ? "border-purple-500 bg-gray-700 hover:bg-gray-600" : "border-purple-300 bg-gray-50 hover:bg-gray-100"}`} onClick={handleLabelClick} onDrop={handleDrop} onDragOver={handleDragOver}>
                <FiUploadCloud Dark={Dark} />
                <span className={`font-medium ${textSecondary}`}>Click to upload or drag and drop</span>
                <span className="text-xs text-gray-400">CSV or PDF (max. 50MB)</span>
              </div>
              <input id="file-upload" type="file" accept=".csv,.pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              {selectedFile && (<p className={`mt-2 ${textSecondary}`}>Selected file: {selectedFile.name}</p>)}
              <button className={`mt-4 py-2 px-6 rounded-lg ${buttonBg}`} onClick={handleValidate} disabled={isLoading || !selectedFile}>
                {isLoading ? "Validating..." : "Start Validation Cycle"}
              </button>
            </div>
          )}

          {isLoading && (
            <div className={`border rounded-2xl p-5 sm:p-8 shadow-sm mb-6 ${cardBg}`}>
              <h2 className={`text-lg font-semibold mb-4 ${textSecondary}`}>Live Validation Log</h2>
              <div className={`font-mono text-xs rounded-lg p-4 h-64 overflow-y-auto ${logBg}`}>
                {log.map((entry, idx) => (<p key={idx} className="whitespace-pre-wrap">{`> ${entry}`}</p>))}
              </div>
            </div>
          )}

          {isFinished && (
            <div className={`border rounded-2xl p-5 sm:p-8 shadow-sm ${cardBg}`}>
              <div className="flex flex-between items-center mb-4 justify-between w-full">
                <h2 className={`text-lg font-semibold flex items-center`}>
                  <FiCheckCircle Dark={Dark} />
                  Validation Complete
                </h2>
                <button onClick={handleClear} className={`py-2 px-4 rounded-lg ${resetBtn}`}>Start New Validation</button>
              </div>

              {summaryData && (
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center`}>
                  <div className={`p-4 rounded-lg ${Dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="text-2xl font-bold">{summaryData.total}</p>
                    <p className="text-sm text-gray-400">Total Processed</p>
                  </div>
                  <div className={`p-4 rounded-lg ${Dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="text-2xl font-bold text-green-500">{summaryData.validated}</p>
                    <p className="text-sm text-gray-400">Auto-Validated</p>
                  </div>
                  <div className={`p-4 rounded-lg ${Dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="text-2xl font-bold text-red-500">{summaryData.flagged}</p>
                    <p className="text-sm text-gray-400">Flagged</p>
                  </div>
                  <div className={`p-4 rounded-lg ${Dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="text-lg font-bold">Common Flags</p>
                    <ul className="text-xs text-left list-disc list-inside text-gray-400">
                      {Object.keys(summaryData.flagCounts).length > 0 ?
                        Object.entries(summaryData.flagCounts).map(([flag, count]) => (
                          <li key={flag}>{flag}: {count}</li>
                        )) : <li>None</li>
                      }
                    </ul>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className={`${Dark ? "text-gray-300 border-gray-700" : "text-gray-600 border-gray-200"} border-b`}>
                      <th className="p-3">Provider Name</th>
                      <th className="p-3 hidden md:table-cell">Member Count</th>
                      <th className="p-3 cursor-pointer" onClick={() => requestSort('priority_score')}>
                        Priority Score
                        {sortConfig.key === 'priority_score' && (<span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>)}
                      </th>
                      <th className="p-3">Confidence</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((r, i) => (
                      <tr key={i} className={`border-b ${Dark ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                        <td className="py-3 px-3">{r.final_profile?.provider_name || r.original_data?.full_name}</td>
                        <td className="py-3 px-3 hidden md:table-cell">{r.original_data?.member_count || 'N/A'}</td>
                        <td className="py-3 px-3 font-mono">{r.priority_score.toFixed(2)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${r.confidence_score >= 0.7 ? (Dark ? "bg-green-600 text-green-100" : "bg-green-100 text-green-800") : r.confidence_score >= 0.4 ? (Dark ? "bg-yellow-600 text-yellow-100" : "bg-yellow-100 text-yellow-800") : (Dark ? "bg-red-600 text-red-100" : "bg-red-100 text-red-800")}`}>
                            {(r.confidence_score * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {r.confidence_score < 0.7 && (
                            <a href={`mailto:review-team@example.com?subject=Provider Review Required: ${r.final_profile?.provider_name || r.original_data?.full_name}&body=Please manually review the following provider:%0D%0A%0D%0AName: ${r.final_profile?.provider_name || r.original_data?.full_name}%0D%0ANPI: ${r.final_profile?.npi || 'N/A'}%0D%0AConfidence Score: ${(r.confidence_score * 100).toFixed(0)}%25%0D%0AMember Count: ${r.original_data?.member_count || 'N/A'}%0D%0A%0D%0AFlags:%0D%0A- ${r.qa_flags?.join('%0D%0A- ') || 'No specific flags.'}%0D%0A%0D%0AThank you.`}
                              className={`px-3 py-1 text-xs font-medium rounded-full ${Dark ? 'bg-red-600 text-red-100 hover:bg-red-500' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
                              Flag for Review
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;