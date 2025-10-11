import React, { useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar_III from "../Components/Navbar_III";
import { useHealthContext } from "../Context/HealthContext";

// --- SVG Icons ---
const FiUploadCloud = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-10 h-10 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
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

const FiCheckCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5 mr-2 text-green-500"
    fill="none"
    viewBox="0 0 24 24"
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
  const { addValidationRun } = useHealthContext();

  const [selectedFile, setSelectedFile] = useState(null);
  const [log, setLog] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setSelectedFile(e.dataTransfer.files[0]);
  };
  const handleDragOver = (e) => e.preventDefault();
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
      const response = await fetch("http://127.0.0.1:8000/validate-file", {
        method: "POST",
        body: formData,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const dataStr = line.substring(5);
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.type === "log")
                  setLog((prev) => [...prev, data.content]);
                else if (data.type === "result") {
                  currentRunResults.push(data.data);
                  setResults((prev) => [...prev, data.data]);
                } else if (data.type === "close") {
                  setIsLoading(false);
                  setIsFinished(true);
                  addValidationRun({
                    fileName: selectedFile.name,
                    results: currentRunResults,
                  });
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      setLog((prev) => [...prev, `ERROR: ${err.message}`]);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar_III />
        <div className="p-6">
          <h1 className="font-bold text-3xl mb-6">
            Upload & Validate Provider Data
          </h1>

          {/* Upload Section */}
          {!isFinished && (
            <div className="border border-gray-200 bg-white rounded-2xl p-5 sm:p-8 shadow-sm mb-6">
              <h2 className="text-lg font-semibold mb-2">
                Upload Provider Data
              </h2>
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-purple-300 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer text-center"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <FiUploadCloud />
                <span className="font-medium text-gray-700">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-400">
                  CSV or PDF (max. 50MB)
                </span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {selectedFile && (
                <p className="mt-2 text-gray-700">
                  Selected file: {selectedFile.name}
                </p>
              )}
              <button
                className="mt-4 bg-teal-500 hover:bg-teal-600 text-white py-2 px-6 rounded-lg"
                onClick={handleValidate}
                disabled={isLoading || !selectedFile}
              >
                {isLoading ? "Validating..." : "Start Validation Cycle"}
              </button>
            </div>
          )}

          {/* Live Log */}
          {isLoading && (
            <div className="border border-gray-200 bg-white rounded-2xl p-5 sm:p-8 shadow-sm mb-6">
              <h2 className="text-lg font-semibold mb-4">
                Live Validation Log
              </h2>
              <div className="bg-gray-900 text-white font-mono text-xs rounded-lg p-4 h-64 overflow-y-auto">
                {log.map((entry, idx) => (
                  <p
                    key={idx}
                    className="whitespace-pre-wrap"
                  >{`> ${entry}`}</p>
                ))}
              </div>
            </div>
          )}

          {/* Results Section */}
          {isFinished && (
            <div className="border border-gray-200 bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiCheckCircle />
                  Validation Complete
                </h2>
                <button
                  onClick={handleClear}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg"
                >
                  Start New Validation
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-600 border-b">
                      <th className="p-3">Provider Name</th>
                      <th className="p-3">NPI</th>
                      <th className="p-3 hidden md:table-cell">
                        Verified Address
                      </th>
                      <th className="p-3">Confidence Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          {r.final_profile?.provider_name ||
                            r.original_data.full_name}
                        </td>
                        <td className="py-3">
                          {r.final_profile?.npi || "N/A"}
                        </td>
                        <td className="py-3 hidden md:table-cell">
                          {r.final_profile?.address || "N/A"}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full ${
                              r.confidence_score >= 0.7
                                ? "bg-green-100 text-green-800"
                                : r.confidence_score >= 0.4
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {(r.confidence_score * 100).toFixed(0)}%
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
