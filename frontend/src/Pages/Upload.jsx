import React, { useState } from "react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { FiUploadCloud, FiFile, FiX } from "react-icons/fi";

const Upload = () => {
  const [files, setFiles] = useState([
    {
      name: "provider_data_q1.csv",
      type: "CSV",
      records: "1500 records",
      status: "Uploaded",
      progress: 100,
    },
    {
      name: "new_clinic_scans.pdf",
      type: "PDF",
      records: "45 pages",
      status: "Uploading",
      progress: 45,
    },
  ]);

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDelete = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">
        <Navbar_III />
        <hr className="border-gray-200" />

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-bold text-2xl sm:text-3xl font-[Inter] mb-6">
            Upload Provider Data
          </h1>

          {/* Upload Section */}
          <div className="border border-gray-200 bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold mb-1">
              Upload Provider Data
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mb-6">
              Drag and drop your provider files (CSV or PDF) here or click to
              browse.
            </p>

            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-40 sm:h-48 border-2 border-dashed border-purple-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition cursor-pointer text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <FiUploadCloud className="text-4xl text-gray-400 mb-2" />
              <span className="font-medium text-gray-700 text-sm sm:text-base">
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
              <div className="mt-4 text-sm text-gray-700">
                Selected file:{" "}
                <span className="font-medium">{selectedFile.name}</span>
              </div>
            )}

            <button
              className="mt-6 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 px-6 rounded-lg transition w-full sm:w-auto"
              onClick={() => alert("Validation started!")}
            >
              Start Validation Cycle
            </button>
          </div>

          {/* File Preview Section */}
          <div className="border border-gray-200 bg-white rounded-2xl p-5 sm:p-8 shadow-sm mt-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-1">
              File Preview
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mb-6">
              Review your uploaded files and their status.
            </p>

            {/* Scrollable table for small screens */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-600 border-b">
                    <th className="pb-3">File Name</th>
                    <th className="pb-3 hidden sm:table-cell">Type</th>
                    <th className="pb-3 hidden md:table-cell">Records/Pages</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {files.map((file, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="py-3 flex items-center gap-2">
                        <FiFile className="text-gray-500" />
                        <span className="text-gray-800 font-medium truncate max-w-[160px] sm:max-w-none">
                          {file.name}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="px-3 py-1 text-xs bg-gray-100 rounded-full font-semibold">
                          {file.type}
                        </span>
                      </td>
                      <td className="text-gray-700 hidden md:table-cell">
                        {file.records}
                      </td>
                      <td>
                        {file.progress === 100 ? (
                          <span className="bg-teal-400 text-white text-xs font-medium px-3 py-1 rounded-full">
                            Uploaded
                          </span>
                        ) : (
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-teal-400 h-2 rounded-full"
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => handleDelete(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <FiX size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout (optional fallback) */}
            <div className="sm:hidden mt-6 space-y-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="border rounded-xl p-4 bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.records}</p>
                    <div className="mt-1">
                      {file.progress === 100 ? (
                        <span className="bg-teal-400 text-white text-xs font-medium px-3 py-1 rounded-full">
                          Uploaded
                        </span>
                      ) : (
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-teal-400 h-2 rounded-full"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
