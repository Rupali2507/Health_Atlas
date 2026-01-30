import React, { useState, useRef, useMemo, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar_III from "../Components/Navbar_III";
import { useHealthContext } from "../Context/HealthContext";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  UploadCloud, CheckCircle2, AlertCircle, Loader2, FileText,
  Activity, Terminal, Play, Download, Shield, AlertTriangle, TrendingUp, Database
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Upload = () => {
  const { addValidationRun, Dark } = useHealthContext();
  const fileInputRef = useRef(null);
  const logContainerRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [log, setLog] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'priority_score', direction: 'ascending' });
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [currentStage, setCurrentStage] = useState(null);
  const [stageHistory, setStageHistory] = useState([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalExpected, setTotalExpected] = useState(0);

  const pipelineStages = [
    { id: 'npi', label: 'NPI', icon: '🔍', keyword: 'npi registry check' },
    { id: 'address', label: 'Address', icon: '📍', keyword: 'address validation' },
    { id: 'web', label: 'Web', icon: '🌐', keyword: 'web enrichment' },
    { id: 'qa', label: 'QA', icon: '🔬', keyword: 'quality assurance' },
    { id: 'synthesis', label: 'Synthesis', icon: '⚡', keyword: 'synthesis' },
    { id: 'scoring', label: 'Score', icon: '📊', keyword: 'confidence scoring' }
  ];

  useEffect(() => {
    if (log.length === 0) return;
    const lastLog = log[log.length - 1].message.toLowerCase();
    
    for (const stage of pipelineStages) {
      if (lastLog.includes(stage.keyword)) {
        setCurrentStage(stage.id);
        break;
      }
    }
    
    const totalMatch = lastLog.match(/found (\d+) records/i);
    if (totalMatch) setTotalExpected(parseInt(totalMatch[1], 10));
    
    const completionMatch = lastLog.match(/\[(\d+)\/(\d+)\]/);
    if (completionMatch) setProcessedCount(parseInt(completionMatch[1], 10));
  }, [log]);

  useEffect(() => {
    if (currentStage && !stageHistory.includes(currentStage)) {
      setStageHistory(prev => [...prev, currentStage]);
    }
  }, [currentStage]);

  useEffect(() => {
    let interval;
    if (isLoading && startTime) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(diff / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        setElapsedTime(`${mins}:${secs}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
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
    setProcessedCount(0);
    setTotalExpected(0);
  };

  const handleValidate = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setIsFinished(false);
    setStartTime(Date.now());
    setProcessedCount(0);
    setTotalExpected(0);

    setLog([{
      message: "🚀 Initializing Health Atlas Provider Validator v2.1...",
      type: "info",
      timestamp: new Date().toLocaleTimeString()
    }]);

    let currentRunResults = [];
    setResults([]);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/validate-file`, { 
        method: "POST", 
        body: formData 
      });
      
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
                    let type = "info";
                    const content = data.content.toLowerCase();
                    
                    if (content.includes("error") || content.includes("❌")) type = "error";
                    else if (content.includes("✅") || content.includes("complete")) type = "success";
                    else if (content.includes("🟢")) type = "success";
                    else if (content.includes("🟡")) type = "warning";
                    else if (content.includes("🔴")) type = "error";

                    setLog((prev) => [...prev, {
                      message: data.content,
                      type,
                      timestamp: new Date().toLocaleTimeString()
                    }]);

                  } else if (data.type === "result") {
                    currentRunResults.push(data.data);
                    setResults((prev) => [...prev, data.data]);

                  } else if (data.type === "close") {
                    setIsLoading(false);
                    setIsFinished(true);
                    if (currentRunResults.length > 0) {
                      addValidationRun({ 
                        fileName: selectedFile.name, 
                        results: currentRunResults,
                        timestamp: new Date().toISOString()
                      });
                    }
                  }
                } catch (parseErr) { 
                  console.error("JSON parse error:", parseErr);
                }
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
      setLog((prev) => [...prev, { 
        message: `❌ ERROR: ${err.message}`, 
        type: "error", 
        timestamp: new Date().toLocaleTimeString() 
      }]);
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

    if (sortConfig.key) {
      itemsWithPriority.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'path') {
          aVal = a.quality_metrics?.path || a.path || 'UNKNOWN';
          bVal = b.quality_metrics?.path || b.path || 'UNKNOWN';
        }
        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
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
    doc.setFontSize(18);
    doc.text("Health Atlas Provider Validation Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const tableColumn = ["Provider", "Path", "Confidence", "Fraud", "QA Issues", "Review"];
    const tableRows = sortedResults.map(item => [
      item.final_profile?.provider_name || item.original_data?.full_name || 'N/A',
      item.quality_metrics?.path || item.path || 'N/A',
      `${(item.confidence_score * 100).toFixed(0)}%`,
      item.fraud_indicators?.length || 0,
      item.qa_flags?.length || 0,
      item.requires_human_review ? 'YES' : 'NO'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 8 }
    });
    
    doc.save(`validation_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  let summaryData = null;
  if (isFinished && results.length > 0) {
    const total = results.length;
    const greenPath = results.filter(r => (r.quality_metrics?.path || r.path) === 'GREEN').length;
    const yellowPath = results.filter(r => (r.quality_metrics?.path || r.path) === 'YELLOW').length;
    const redPath = results.filter(r => (r.quality_metrics?.path || r.path) === 'RED').length;
    const humanReview = results.filter(r => r.requires_human_review).length;
    const fraudDetected = results.filter(r => r.fraud_indicators?.length > 0).length;
    const avgConfidence = (results.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / total * 100).toFixed(1);
    summaryData = { total, greenPath, yellowPath, redPath, humanReview, fraudDetected, avgConfidence };
  }

  const bgMain = Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = Dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textSecondary = Dark ? "text-gray-400" : "text-gray-500";
  const buttonBg = Dark ? "bg-teal-600 hover:bg-teal-700" : "bg-teal-500 hover:bg-teal-600";
  const resetBtn = Dark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300";

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      <Sidebar />
      <div className="flex-1 lg:ml-[20vw]">
        <Navbar_III />
        <div className="p-6">
          <h1 className="font-bold text-3xl mb-6">Upload & Validate Provider Data</h1>

          {!isFinished && !isLoading && (
            <div className={`border rounded-2xl p-8 shadow-sm mb-6 ${cardBg}`}>
              <h2 className={`text-lg font-semibold mb-2 ${textSecondary}`}>Start Validation Cycle</h2>
              <div
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition ${
                  Dark ? "border-indigo-500/50 bg-gray-800/50 hover:bg-gray-700" : "border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/50"
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
                <span className={`text-sm mt-1 ${textSecondary}`}>  CSV, PDF, or Image (JPG/PNG) - max. 50MB
</span>
              </div>
              <input type="file" accept=".csv,.pdf,.jpg,.jpeg,.png" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <div className="mt-6 flex justify-end">
                <button
                  className={`py-2.5 px-6 rounded-lg font-medium flex items-center gap-2 transition text-white ${
                    !selectedFile ? "opacity-50 cursor-not-allowed bg-gray-400" : buttonBg
                  }`}
                  onClick={handleValidate}
                  disabled={!selectedFile}
                >
                  <Play size={18} fill="currentColor" />
                  Run AI Validation
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className={`border rounded-2xl overflow-hidden shadow-lg mb-6 ${cardBg}`}>
              <div className={`p-4 border-b flex justify-between items-center ${Dark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-gray-50/80"}`}>
                <div className="flex items-center gap-2">
                  <Activity className={`animate-pulse ${Dark ? "text-indigo-400" : "text-indigo-600"}`} size={20} />
                  <span className="font-semibold">Live Validation Stream</span>
                </div>
                <div className="flex gap-3">
                  {totalExpected > 0 && (
                    <div className={`text-xs font-mono px-2 py-1 rounded ${Dark ? "bg-gray-700" : "bg-gray-200"}`}>
                      {processedCount}/{totalExpected}
                    </div>
                  )}
                  <div className={`text-xs font-mono px-2 py-1 rounded ${Dark ? "bg-gray-700" : "bg-gray-200"}`}>
                    ⏱️ {elapsedTime}
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-gray-100/10">
                <div className="mb-3 flex justify-between">
                  <span className={`text-sm font-medium ${textSecondary}`}>Pipeline Progress</span>
                  <span className="text-xs font-mono">{stageHistory.length}/{pipelineStages.length}</span>
                </div>
                <div className="relative">
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${(stageHistory.length / pipelineStages.length) * 100}%` }}
                    />
                  </div>
                  <div className="relative flex justify-between">
                    {pipelineStages.map((stage) => {
                      const isCompleted = stageHistory.includes(stage.id);
                      const isCurrent = currentStage === stage.id;
                      const isUpcoming = !isCompleted && !isCurrent;
                      return (
                        <div key={stage.id} className="flex flex-col items-center flex-1">
                          <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg transition shadow-lg ${
                            isCompleted ? 'bg-emerald-500 text-white' :
                            isCurrent ? 'bg-indigo-500 text-white animate-pulse ring-4 ring-indigo-500/30' :
                            Dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {isCompleted && !isCurrent ? '✓' : stage.icon}
                          </div>
                          <p className={`text-xs font-semibold mt-2 ${
                            isCurrent ? (Dark ? 'text-indigo-400' : 'text-indigo-600') :
                            isCompleted ? (Dark ? 'text-emerald-400' : 'text-emerald-600') :
                            Dark ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {stage.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-3 gap-4 p-6 border-b ${Dark ? "border-gray-700" : "border-gray-100"}`}>
                <div className={`p-3 rounded-lg ${Dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className="text-2xl font-bold">{results.length}</p>
                  <p className="text-xs text-gray-400 uppercase">Processed</p>
                </div>
                <div className={`p-3 rounded-lg ${Dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className="text-2xl font-bold text-emerald-500">
                    {results.filter(r => (r.quality_metrics?.path || r.path) === 'GREEN').length}
                  </p>
                  <p className="text-xs text-gray-400 uppercase">Green Path</p>
                </div>
                <div className={`p-3 rounded-lg ${Dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className="text-2xl font-bold text-amber-500">
                    {results.filter(r => r.requires_human_review).length}
                  </p>
                  <p className="text-xs text-gray-400 uppercase">Review</p>
                </div>
              </div>

              <div ref={logContainerRef} className={`h-72 overflow-y-auto font-mono text-xs ${Dark ? "bg-gray-900" : "bg-slate-900"}`}>
                {log.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-500 gap-2">
                    <Loader2 className="animate-spin" /> Initializing...
                  </div>
                )}
                {log.map((entry, idx) => (
                  <div key={idx} className="p-2 border-b border-gray-800/50 flex gap-3 hover:bg-white/5">
                    <div className="mt-0.5">
                      {entry.type === "error" ? <AlertCircle size={14} className="text-red-500" /> :
                       entry.type === "success" ? <CheckCircle2 size={14} className="text-emerald-500" /> :
                       entry.type === "warning" ? <AlertTriangle size={14} className="text-yellow-500" /> :
                       <Terminal size={14} className="text-blue-400" />}
                    </div>
                    <span className={`flex-1 ${
                      entry.type === "error" ? "text-red-400" :
                      entry.type === "success" ? "text-emerald-400" :
                      entry.type === "warning" ? "text-yellow-400" : "text-gray-300"
                    }`}>{entry.message}</span>
                    <span className="text-gray-600 text-[10px]">{entry.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isFinished && (
            <div className={`border rounded-2xl p-8 shadow-sm ${cardBg}`}>
              <div className="flex items-center mb-6 justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 size={24} /> Validation Complete
                </h2>
                <div className="flex gap-2">
                  <button onClick={handleDownloadPdf} className={`py-2 px-4 rounded-lg flex items-center gap-2 text-white ${buttonBg}`}>
                    <Download size={18} /> Report
                  </button>
                  <button onClick={handleClear} className={`py-2 px-4 rounded-lg text-white ${resetBtn}`}>
                    New
                  </button>
                </div>
              </div>

              {summaryData && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Total", value: summaryData.total, color: "text-blue-500", icon: Database, bg: Dark ? "bg-blue-500/10" : "bg-blue-50" },
                      { label: "Green", value: summaryData.greenPath, color: "text-emerald-500", icon: CheckCircle2, bg: Dark ? "bg-emerald-500/10" : "bg-emerald-50" },
                      { label: "Review", value: summaryData.humanReview, color: "text-amber-500", icon: AlertTriangle, bg: Dark ? "bg-amber-500/10" : "bg-amber-50" },
                      { label: "Fraud", value: summaryData.fraudDetected, color: "text-red-500", icon: Shield, bg: Dark ? "bg-red-500/10" : "bg-red-50" },
                    ].map((stat, i) => (
                      <div key={i} className={`p-4 rounded-xl flex justify-between ${stat.bg}`}>
                        <div>
                          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                          <p className="text-xs text-gray-400 uppercase">{stat.label}</p>
                        </div>
                        <stat.icon className={`${stat.color}`} size={24} />
                      </div>
                    ))}
                  </div>

                  <div className={`mb-6 p-4 rounded-xl ${Dark ? 'bg-indigo-500/5 border border-indigo-500/20' : 'bg-indigo-50'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <TrendingUp className={Dark ? "text-indigo-400" : "text-indigo-600"} size={24} />
                        <div>
                          <p className="text-sm text-gray-500">Avg Confidence</p>
                          <p className={`text-2xl font-bold ${Dark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            {summaryData.avgConfidence}%
                          </p>
                        </div>
                      </div>
                      <div className="text-xs font-mono">
                        <span className="text-emerald-500">🟢 {summaryData.greenPath}</span>
                        {' • '}
                        <span className="text-yellow-500">🟡 {summaryData.yellowPath}</span>
                        {' • '}
                        <span className="text-red-500">🔴 {summaryData.redPath}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-100/10">
                <table className="min-w-full text-sm">
                  <thead className={Dark ? "bg-gray-700/50" : "bg-gray-50"}>
                    <tr>
                      <th className="p-3 text-left font-semibold">Provider</th>
                      <th className="p-3 text-left font-semibold cursor-pointer hover:text-indigo-500" onClick={() => requestSort('path')}>
                        Path {sortConfig.key === 'path' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                      </th>
                      <th className="p-3 text-left font-semibold">Confidence</th>
                      <th className="p-3 text-left font-semibold">Fraud</th>
                      <th className="p-3 text-left font-semibold">QA Flags</th>
                      <th className="p-3 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/10">
                    {sortedResults.map((r, i) => {
                      const path = r.quality_metrics?.path || r.path || 'UNKNOWN';
                      const pathColor = path === 'GREEN' ? 'emerald' : path === 'YELLOW' ? 'yellow' : 'red';
                      return (
                        <tr key={i} className={`${Dark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                          <td className="p-3 font-medium">{r.final_profile?.provider_name || r.original_data?.full_name}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              Dark ? `bg-${pathColor}-500/10 text-${pathColor}-400` : `bg-${pathColor}-100 text-${pathColor}-700`
                            }`}>{path}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              r.confidence_score >= 0.7 ? (Dark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-700") :
                              r.confidence_score >= 0.4 ? (Dark ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-100 text-yellow-700") :
                              (Dark ? "bg-red-500/10 text-red-400" : "bg-red-100 text-red-700")
                            }`}>
                              {(r.confidence_score * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="p-3 text-center">{r.fraud_indicators?.length || 0}</td>
                          <td className="p-3 text-center">{r.qa_flags?.length || 0}</td>
                          <td className="p-3">
                            {r.requires_human_review && (
                              <button className={`px-3 py-1 text-xs font-medium rounded ${
                                Dark ? 'bg-red-900/30 text-red-200 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'
                              }`}>Review</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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