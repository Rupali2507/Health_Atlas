import React, { useState, useRef } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar_III from "../Components/Navbar_III";
import { useHealthContext } from "../Context/HealthContext";
import { Upload as UploadIcon } from "lucide-react";

const API_AI = "https://health-atlas-backend.onrender.com";
const API_DB = "https://health-atlas-backend.onrender.com/api/providers/apply";

const Apply = () => {
  const { Dark } = useHealthContext();
  const fileInputRef = useRef(null);

  // --- States ---
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    licenseNumber: "",
    npiId: "",
    address: "",
  });
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // --- Style helpers ---
  const bgMain = Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = Dark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const textSecondary = Dark ? "text-gray-400" : "text-gray-500";
  const logBg = Dark
    ? "bg-gray-700 text-gray-100"
    : "bg-gray-900/95 text-white";

  // --- Handlers ---
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
      setLogs([]);
      setSubmitStatus(null);
    }
  };

  const handleAIValidation = async () => {
    if (!file) {
      alert("Please upload your credential document first.");
      return;
    }

    setLogs(["Starting AI validation..."]);
    setProgress(0);
    setIsValidating(true);
    setIsComplete(false);

    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch(`${API_AI}/validate-file`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let aiResult = {};

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
              const dataStr = line.slice(5).trim();
              if (dataStr === "[DONE]") continue;

              try {
                const data = JSON.parse(dataStr);

                if (data.type === "log") {
                  setLogs((prev) => [...prev, data.content]);
                  setProgress((prev) => Math.min(prev + 10, 95));
                } else if (data.type === "result") {
                  aiResult = data.data;
                } else if (data.type === "complete") {
                  setProgress(100);
                  setLogs((prev) => [...prev, "AI validation completed."]);
                }
              } catch {
                console.error("Parse error:", dataStr);
              }
            }
          }
        }
      }

      // Done
      setIsValidating(false);
      setIsComplete(true);
      await handleSubmitToDB(aiResult);
    } catch (err) {
      console.error(err);
      setLogs((prev) => [...prev, `❌ AI validation failed: ${err.message}`]);
      setIsValidating(false);
    }
  };

  const handleSubmitToDB = async (aiResult) => {
    setLogs((prev) => [...prev, "Sending data to database..."]);

    const dbForm = new FormData();
    dbForm.append("fullName", formData.name);
    dbForm.append("email", formData.email);
    dbForm.append("phoneNumber", formData.phone);
    dbForm.append("speciality", formData.specialty);
    dbForm.append("licenseNumber", formData.licenseNumber);
    dbForm.append("npiId", formData.npiId);
    dbForm.append("practiceAddress", formData.address);
    dbForm.append("aiRawResult", JSON.stringify(aiResult.raw || aiResult));
    dbForm.append(
      "aiParsedResult",
      JSON.stringify(aiResult.parsed || aiResult)
    );
    dbForm.append("file", file);

    try {
      const res = await fetch(API_DB, {
        method: "POST",
        body: dbForm,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setSubmitStatus("success");
      setLogs((prev) => [...prev, "✅ User successfully added to database."]);
      alert("✅ Provider successfully added to database!");
      console.log("DB response:", data);
    } catch (err) {
      setSubmitStatus("error");
      setLogs((prev) => [
        ...prev,
        `❌ Database submission failed: ${err.message}`,
      ]);
      alert("❌ Failed to add provider to database.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName("");
    setLogs([]);
    setProgress(0);
    setIsValidating(false);
    setIsComplete(false);
    setSubmitStatus(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      specialty: "",
      licenseNumber: "",
      npiId: "",
      address: "",
    });
  };

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      <Sidebar />
      <div className="flex-1 lg:ml-[20vw]">
        <Navbar_III />
        <div className="p-6">
          <div
            className={`border rounded-2xl shadow-sm p-8 ${cardBg} max-w-4xl mx-auto`}
          >
            <h1 className="text-2xl font-bold mb-2">
              Apply for Network Inclusion
            </h1>
            <p className={`${textSecondary} mb-8`}>
              Fill the form and upload credentials. AI will validate before
              submission.
            </p>

            {/* Provider Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                ["name", "Full Name", "Dr. John Doe"],
                ["email", "Email", "john@example.com"],
                ["phone", "Phone Number", "(555) 123-4567"],
                ["specialty", "Specialty", "Cardiology"],
                ["licenseNumber", "License Number", "L123456"],
                ["npiId", "NPI ID", "1234567890"],
              ].map(([field, label, placeholder]) => (
                <div key={field}>
                  <label className="block mb-1 text-sm font-medium">
                    {label}
                  </label>
                  <input
                    type="text"
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={field === "name" || field === "email"}
                    className={`w-full px-4 py-2 rounded-xl border focus:outline-none ${
                      Dark
                        ? "bg-gray-900 border-gray-700 text-white"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Address */}
            <label className="block mb-1 text-sm font-medium">
              Practice Address
            </label>
            <textarea
              rows="2"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Health Ave, City, State"
              className={`w-full mb-6 px-4 py-2 rounded-xl border focus:outline-none ${
                Dark
                  ? "bg-gray-900 border-gray-700 text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              }`}
            />

            {/* Upload */}
            <h2 className="text-lg font-semibold mb-2">
              Upload Credential Document
            </h2>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer mb-4 ${
                Dark
                  ? "border-gray-700 hover:bg-gray-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                id="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <UploadIcon className="mx-auto mb-2 w-6 h-6 opacity-70" />
              <p className="font-medium">
                {fileName ? fileName : "Click to upload or drag and drop"}
              </p>
            </div>

            {/* Progress + Logs */}
            {isValidating && (
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div
                  className={`font-mono text-xs rounded-lg p-4 h-40 overflow-y-auto ${logBg}`}
                >
                  {logs.map((entry, i) => (
                    <p
                      key={i}
                      className="whitespace-pre-wrap"
                    >{`> ${entry}`}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 text-center space-x-3">
              {!isComplete ? (
                <button
                  onClick={handleAIValidation}
                  disabled={isValidating}
                  className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isValidating ? "Validating..." : "Start Validation & Submit"}
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl"
                >
                  Start New Application
                </button>
              )}
            </div>

            {submitStatus === "success" && (
              <p className="mt-4 text-green-500 text-center font-medium">
                ✅ Provider successfully added to database!
              </p>
            )}
            {submitStatus === "error" && (
              <p className="mt-4 text-red-500 text-center font-medium">
                ❌ Failed to add provider. Check logs.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apply;
