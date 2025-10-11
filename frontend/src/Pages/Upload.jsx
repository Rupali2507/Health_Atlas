import React, { useState } from "react";

// --- SVG Icons (Self-Contained) ---
// These replace the 'react-icons' dependency to fix the error.
const FiUploadCloud = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l5-5m0 0l-5-5m5 5H7" /></svg>
);
const FiFile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
);
const FiX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);
const FiZap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
);
const FiCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);


const Upload = () => {
  // --- STATE MANAGEMENT ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [log, setLog] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // --- FILE HANDLING ---
  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setSelectedFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => e.preventDefault();
  const handleClear = () => {
    setSelectedFile(null);
    setLog([]);
    setResults([]);
    setIsLoading(false);
    setIsFinished(false);
  };

  // --- BACKEND COMMUNICATION ---
  const handleValidate = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setIsFinished(false);
    setLog(["Starting validation process..."]);
    setResults([]);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/validate-file", {
        method: "POST",
        body: formData,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setIsLoading(false);
          setIsFinished(true);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const dataStr = line.substring(5);
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.type === 'log') {
                  setLog((prevLog) => [...prevLog, data.content]);
                } else if (data.type === 'result') {
                  setResults((prevResults) => [...prevResults, data.data]);
                } else if (data.type === 'close') {
                  setIsLoading(false);
                  setIsFinished(true);
                }
              } catch (e) {
                // Ignore parsing errors for potentially incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error during validation:", error);
      setLog((prevLog) => [...prevLog, `ERROR: Could not connect to the backend. Is it running? Details: ${error.message}`]);
      setIsLoading(false);
    }
  };

  // --- UI RENDERING ---
  return (
    // Removed Sidebar and Navbar components to make this file self-contained
    <div className="flex min-h-screen bg-gray-50 font-[Inter]">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <h1 className="font-bold text-3xl text-gray-800 mb-6">
          Upload & Validate Provider Data
        </h1>

        {/* --- UPLOAD VIEW --- */}
        {!isFinished && (
          <div className="border border-gray-200 bg-white rounded-2xl p-5 sm:p-8 shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-1 text-gray-800">Upload Provider File</h2>
            <p className="text-gray-500 text-sm mb-6">Drag and drop your provider files (CSV or PDF) here.</p>
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition cursor-pointer text-center" onDrop={handleDrop} onDragOver={handleDragOver}>
              <FiUploadCloud />
              <span className="font-medium text-gray-700 text-base mt-2">Click to upload or drag and drop</span>
              <span className="text-xs text-gray-400 mt-1">CSV or PDF (max. 50MB)</span>
              <input id="file-upload" type="file" accept=".csv,.pdf" className="hidden" onChange={handleFileChange} />
            </label>
            {selectedFile && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-700">Selected file: <span className="font-medium">{selectedFile.name}</span></p>
                <button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-600"><FiX /></button>
              </div>
            )}
            <button className="mt-6 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 px-6 rounded-lg transition w-full sm:w-auto disabled:bg-gray-400" onClick={handleValidate} disabled={!selectedFile || isLoading}>
              {isLoading ? 'Validating...' : 'Start Validation Cycle'}
            </button>
          </div>
        )}
        
        {/* --- LOG & RESULTS VIEW --- */}
        <div>
          {/* Live Log Display */}
          {isLoading && (
            <div className="border border-gray-200 bg-white rounded-2xl p-5 sm:p-8 shadow-sm mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800"><FiZap />Live Validation Log</h2>
              <div className="bg-gray-900 text-white font-mono text-xs rounded-lg p-4 h-64 overflow-y-auto">
                {log.map((entry, index) => <p key={index} className="whitespace-pre-wrap">{`> ${entry}`}</p>)}
              </div>
            </div>
          )}
          
          {/* Final Results View */}
          {isFinished && (
            <div className="border border-gray-200 bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center text-gray-800"><FiCheckCircle />Validation Complete</h2>
                <button onClick={handleClear} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition text-sm">
                  Start New Validation
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-6">Review the validation results and confidence scores below.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="p-3 font-semibold">Provider Name</th>
                      <th className="p-3 font-semibold">NPI</th>
                      <th className="p-3 font-semibold hidden md:table-cell">Verified Address</th>
                      <th className="p-3 font-semibold">Confidence Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3 text-gray-800 font-medium">{result.final_profile?.provider_name || result.original_data.full_name}</td>
                        <td className="p-3 text-gray-700 font-mono">{result.final_profile?.npi || 'N/A'}</td>
                        <td className="p-3 text-gray-700 hidden md:table-cell">{result.final_profile?.address || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${result.confidence_score >= 0.7 ? 'bg-green-100 text-green-800' : result.confidence_score >= 0.4 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {`${(result.confidence_score * 100).toFixed(0)}%`}
                          </span>
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
