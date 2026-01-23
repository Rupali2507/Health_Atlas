import React, { useState, useRef, useMemo, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar_III from "../Components/Navbar_III";
import { useHealthContext } from "../Context/HealthContext";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Activity,
  Terminal,
  Play,
  Download
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Upload = () => {
  const { addValidationRun, Dark } = useHealthContext();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [log, setLog] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'priority_score', direction: 'ascending' });

  // --- Enhanced Progress State ---
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [currentStage, setCurrentStage] = useState(null);
  const [stageHistory, setStageHistory] = useState([]);

  // --- Pipeline Stages (matching agent.py workflow) ---
  const pipelineStages = [
    { id: 'npi_tool', label: 'NPI Registry', icon: '🔍', description: 'Validating provider credentials' },
    { id: 'address_tool', label: 'Address Check', icon: '📍', description: 'Verifying location data' },
    { id: 'enrichment', label: 'Enrichment', icon: '✨', description: 'Gathering additional info' },
    { id: 'quality_assurance', label: 'Quality Check', icon: '🔬', description: 'Surgical logic validation' },
    { id: 'synthesis', label: 'Synthesis', icon: '⚡', description: 'Compiling final profile' },
    { id: 'scorer', label: 'Scoring', icon: '📊', description: 'Calculating confidence' }
  ];

  // --- Smart Stage Detection from Logs ---
  useEffect(() => {
    if (log.length === 0) return;

    const lastLog = log[log.length - 1].message.toLowerCase();

    // Match log messages to pipeline stages
    if (lastLog.includes('npi check') || lastLog.includes('npi registry')) {
      setCurrentStage('npi_tool');
    } else if (lastLog.includes('address check') || lastLog.includes('address validation')) {
      setCurrentStage('address_tool');
    } else if (lastLog.includes('enrichment') || lastLog.includes('scraping')) {
      setCurrentStage('enrichment');
    } else if (lastLog.includes('quality assurance') || lastLog.includes('surgical logic')) {
      setCurrentStage('quality_assurance');
    } else if (lastLog.includes('synthesis') || lastLog.includes('directory management')) {
      setCurrentStage('synthesis');
    } else if (lastLog.includes('scoring') || lastLog.includes('confidence')) {
      setCurrentStage('scorer');
    }
  }, [log]);

  // Track stage completion
  useEffect(() => {
    if (currentStage && !stageHistory.includes(currentStage)) {
      setStageHistory(prev => [...prev, currentStage]);
    }
  }, [currentStage]);

  // --- Timer Logic for Aesthetics ---
  useEffect(() => {
    let interval;
    if (isLoading && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - startTime) / 1000);
        const mins = Math.floor(diff / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        setElapsedTime(`${mins}:${secs}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading, startTime]);

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
    setElapsedTime("00:00");
    setCurrentStage(null);
    setStageHistory([]);
  };

  const handleValidate = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setIsFinished(false);
    setStartTime(Date.now());

    // Add initial system log
    setLog([{
      message: "Initializing validation sequence...",
      type: "info",
      timestamp: new Date().toLocaleTimeString()
    }]);

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
                    // --- NEW: Smart Log Parsing Logic ---
                    let type = "info";
                    if (data.content.toLowerCase().includes("error") || data.content.toLowerCase().includes("fail")) type = "error";
                    if (data.content.toLowerCase().includes("success") || data.content.toLowerCase().includes("verified")) type = "success";

                    setLog((prev) => [...prev, {
                      message: data.content,
                      type: type,
                      timestamp: new Date().toLocaleTimeString()
                    }]);

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
      setLog((prev) => [...prev, { message: `CRITICAL ERROR: ${err.message}`, type: "error", timestamp: new Date().toLocaleTimeString() }]);
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

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.text("Provider Validation Report", 14, 15);
    const tableColumn = ["Provider Name", "Member Count", "Priority Score", "Confidence", "Status"];
    const tableRows = [];

    sortedResults.forEach(item => {
      const confidencePercent = (item.confidence_score * 100).toFixed(0) + '%';
      const status = item.confidence_score < 0.7 ? "Flagged" : "Validated";
      const providerData = [
        item.final_profile?.provider_name || item.original_data?.full_name,
        item.original_data?.member_count || 'N/A',
        item.priority_score.toFixed(2),
        confidencePercent,
        status
      ];
      tableRows.push(providerData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save('provider_validation_report.pdf');
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

  // --- Theme Variables ---
  const bgMain = Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = Dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textSecondary = Dark ? "text-gray-400" : "text-gray-500";
  const buttonBg = Dark ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-teal-500 hover:bg-teal-600 text-white";
  const resetBtn = Dark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700";

  // --- Scroll log to bottom ---
  const logContainerRef = useRef(null);
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      <Sidebar />
      <div className="flex-1 lg:ml-[20vw]">
        <Navbar_III />
        <div className="p-6">
          <h1 className="font-bold text-3xl mb-6 font-[Inter]">Upload & Validate Provider Data</h1>

          {/* --- UPLOAD SECTION --- */}
          {!isFinished && !isLoading && (
            <div className={`border rounded-2xl p-5 sm:p-8 shadow-sm mb-6 ${cardBg} transition-all duration-300`}>
              <h2 className={`text-lg font-semibold mb-2 ${textSecondary}`}>Start Validation Cycle</h2>
              <div
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${Dark ? "border-indigo-500/50 bg-gray-800/50 hover:bg-gray-700" : "border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/50"
                  }`}
                onClick={handleLabelClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className={`p-4 rounded-full mb-3 ${Dark ? "bg-gray-700" : "bg-white shadow-sm"}`}>
                  <UploadCloud className={`w-8 h-8 ${Dark ? "text-indigo-400" : "text-indigo-600"}`} />
                </div>
                <span className={`font-medium text-lg ${Dark ? "text-gray-200" : "text-gray-700"}`}>
                  {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                </span>
                <span className={`text-sm mt-1 ${textSecondary}`}>CSV or PDF (max. 50MB)</span>
              </div>
              <input id="file-upload" type="file" accept=".csv,.pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

              <div className="mt-6 flex justify-end">
                <button
                  className={`py-2.5 px-6 rounded-lg font-medium flex items-center gap-2 transition-transform active:scale-95 ${!selectedFile ? "opacity-50 cursor-not-allowed bg-gray-400" : buttonBg}`}
                  onClick={handleValidate}
                  disabled={!selectedFile}
                >
                  <Play size={18} fill="currentColor" />
                  Run AI Validation
                </button>
              </div>
            </div>
          )}

          {/* --- ENHANCED PROGRESS SECTION WITH PIPELINE VISUALIZATION --- */}
          {isLoading && (
            <div className={`border rounded-2xl overflow-hidden shadow-lg mb-6 ${cardBg}`}>
              {/* Header */}
              <div className={`p-4 border-b flex justify-between items-center ${Dark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-gray-50/80"}`}>
                <div className="flex items-center gap-2">
                  <Activity className={`animate-pulse ${Dark ? "text-indigo-400" : "text-indigo-600"}`} size={20} />
                  <span className="font-semibold">Live Validation Stream</span>
                </div>
                <div className={`text-xs font-mono px-2 py-1 rounded ${Dark ? "bg-gray-700" : "bg-gray-200"}`}>
                  Elapsed: {elapsedTime}
                </div>
              </div>

              {/* Pipeline Stage Visualization */}
              <div className="p-6 border-b border-gray-100/10">
                <div className="mb-3 flex items-center justify-between">
                  <span className={`text-sm font-medium ${textSecondary}`}>Pipeline Progress</span>
                  <span className="text-xs font-mono">
                    {stageHistory.length} / {pipelineStages.length} stages
                  </span>
                </div>

                {/* Stage Flow */}
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${(stageHistory.length / pipelineStages.length) * 100}%` }}
                    />
                  </div>

                  {/* Stage Nodes */}
                  <div className="relative flex justify-between">
                    {pipelineStages.map((stage, idx) => {
                      const isCompleted = stageHistory.includes(stage.id);
                      const isCurrent = currentStage === stage.id;
                      const isUpcoming = !isCompleted && !isCurrent;

                      return (
                        <div key={stage.id} className="flex flex-col items-center flex-1">
                          {/* Node Circle */}
                          <div className={`
                  relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg
                  transition-all duration-300 shadow-lg
                  ${isCompleted ? (Dark ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white') : ''}
                  ${isCurrent ? (Dark ? 'bg-indigo-500 text-white animate-pulse ring-4 ring-indigo-500/30' : 'bg-indigo-500 text-white animate-pulse ring-4 ring-indigo-500/30') : ''}
                  ${isUpcoming ? (Dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400') : ''}
                `}>
                            {isCompleted && !isCurrent ? '✓' : stage.icon}
                          </div>

                          {/* Stage Info */}
                          <div className="mt-2 text-center">
                            <p className={`text-xs font-semibold transition-colors ${isCurrent ? (Dark ? 'text-indigo-400' : 'text-indigo-600') :
                                isCompleted ? (Dark ? 'text-emerald-400' : 'text-emerald-600') :
                                  (Dark ? 'text-gray-500' : 'text-gray-400')
                              }`}>
                              {stage.label}
                            </p>

                            {isCurrent && (
                              <p className={`text-[10px] mt-1 ${textSecondary} max-w-[80px] mx-auto`}>
                                {stage.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className={`grid grid-cols-3 gap-4 p-6 border-b ${Dark ? "border-gray-700" : "border-gray-100"}`}>
                <div className={`p-3 rounded-lg ${Dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className="text-2xl font-bold">{results.length}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Processed</p>
                </div>
                <div className={`p-3 rounded-lg ${Dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className="text-2xl font-bold text-emerald-500">
                    {results.filter(r => r.confidence_score >= 0.7).length}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Validated</p>
                </div>
                <div className={`p-3 rounded-lg ${Dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className="text-2xl font-bold text-amber-500">
                    {results.filter(r => r.confidence_score < 0.7).length}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Flagged</p>
                </div>
              </div>

              {/* Terminal-Style Log */}
              <div
                ref={logContainerRef}
                className={`h-72 overflow-y-auto font-mono text-xs ${Dark ? "bg-gray-900" : "bg-slate-900"}`}
              >
                {log.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-500 gap-2">
                    <Loader2 className="animate-spin" /> Initializing Agents...
                  </div>
                )}
                {log.map((entry, idx) => (
                  <div key={idx} className={`p-2 border-b border-gray-800/50 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 hover:bg-white/5`}>
                    <div className="mt-0.5 shrink-0">
                      {entry.type === "error" ? (
                        <AlertCircle size={14} className="text-red-500" />
                      ) : entry.type === "success" ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <Terminal size={14} className="text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`${entry.type === "error" ? "text-red-400" :
                          entry.type === "success" ? "text-emerald-400" :
                            "text-gray-300"
                        }`}>
                        {entry.message}
                      </span>
                    </div>
                    <span className="text-gray-600 shrink-0 text-[10px]">{entry.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- RESULTS SUMMARY --- */}
          {isFinished && (
            <div className={`border rounded-2xl p-5 sm:p-8 shadow-sm ${cardBg} animate-in zoom-in-95 duration-300`}>
              <div className="flex flex-col sm:flex-row items-center mb-6 justify-between w-full gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 size={24} />
                  Validation Complete
                </h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={handleDownloadPdf} className={`flex-1 sm:flex-none py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${buttonBg}`}>
                    <Download size={18} /> Download Report
                  </button>
                  <button onClick={handleClear} className={`flex-1 sm:flex-none py-2 px-4 rounded-lg ${resetBtn}`}>
                    Start New
                  </button>
                </div>
              </div>

              {summaryData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {/* Stat Cards */}
                  {[
                    { label: "Total Processed", value: summaryData.total, color: "text-gray-500", icon: FileText },
                    { label: "Auto-Validated", value: summaryData.validated, color: "text-emerald-500", icon: CheckCircle2 },
                    { label: "Flagged", value: summaryData.flagged, color: "text-red-500", icon: AlertCircle },
                  ].map((stat, i) => (
                    <div key={i} className={`p-4 rounded-xl flex items-center justify-between ${Dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</p>
                      </div>
                      <stat.icon className={`${stat.color} opacity-80`} size={24} />
                    </div>
                  ))}

                  {/* Common Flags Mini-List */}
                  <div className={`p-4 rounded-xl ${Dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Top Issues</p>
                    <div className="text-xs space-y-1 h-12 overflow-y-auto custom-scrollbar">
                      {Object.keys(summaryData.flagCounts).length > 0 ?
                        Object.entries(summaryData.flagCounts).map(([flag, count]) => (
                          <div key={flag} className="flex justify-between text-gray-500">
                            <span>{flag}</span>
                            <span className="font-bold">{count}</span>
                          </div>
                        )) : <span className="text-gray-400 italic">No flags found</span>
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Results Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-100/10">
                <table className="min-w-full text-left text-sm">
                  <thead className={Dark ? "bg-gray-700/50 text-gray-300" : "bg-gray-50 text-gray-600"}>
                    <tr>
                      <th className="p-3 font-semibold">Provider Name</th>
                      <th className="p-3 hidden md:table-cell font-semibold">Member Count</th>
                      <th className="p-3 cursor-pointer font-semibold hover:text-indigo-500 transition-colors" onClick={() => requestSort('priority_score')}>
                        Priority Score {sortConfig.key === 'priority_score' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                      </th>
                      <th className="p-3 font-semibold">Confidence</th>
                      <th className="p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/10">
                    {sortedResults.map((r, i) => (
                      <tr key={i} className={`transition-colors ${Dark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                        <td className="py-3 px-3 font-medium">{r.final_profile?.provider_name || r.original_data?.full_name}</td>
                        <td className="py-3 px-3 hidden md:table-cell text-gray-500">{r.original_data?.member_count || 'N/A'}</td>
                        <td className="py-3 px-3 font-mono text-xs opacity-80">{r.priority_score.toFixed(2)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${r.confidence_score >= 0.7
                              ? (Dark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-100 text-emerald-700 border-emerald-200")
                              : r.confidence_score >= 0.4
                                ? (Dark ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-yellow-100 text-yellow-700 border-yellow-200")
                                : (Dark ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-100 text-red-700 border-red-200")
                            }`}>
                            {(r.confidence_score * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {r.confidence_score < 0.7 && (
                            <a href={`mailto:review-team@example.com?subject=Review: ${r.final_profile?.provider_name}`}
                              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${Dark ? 'bg-red-900/30 text-red-200 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
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
      <style>{`
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

export default Upload;