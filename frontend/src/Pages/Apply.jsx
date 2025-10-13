import React, { useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar_III from "../Components/Navbar_III";
import { useHealthContext } from "../Context/HealthContext";
import { Upload } from "lucide-react";

const API_DB = "https://health-atlas-2.onrender.com";
const API_AI = "https://health-atlas-backend.onrender.com";

const Apply = () => {
  const { Dark } = useHealthContext();
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
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const bgMain = Dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = Dark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const textSecondary = Dark ? "text-gray-400" : "text-gray-500";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload your credential document.");
      return;
    }

    setLoading(true);
    try {
      const aiForm = new FormData();
      aiForm.append("file", file);

      const aiResponse = await fetch(`${API_AI}/api/validate-credentials`, {
        method: "POST",
        body: aiForm,
      });

      const aiResult = await aiResponse.json();
      console.log("AI validation result:", aiResult);

      const providerForm = new FormData();
      Object.keys(formData).forEach((key) =>
        providerForm.append(key, formData[key])
      );
      providerForm.append("file", file);
      providerForm.append("aiValidation", JSON.stringify(aiResult));

      const response = await fetch(`${API_DB}/api/providers/apply`, {
        method: "POST",
        body: providerForm,
      });

      if (!response.ok) throw new Error("Failed to submit application");

      const result = await response.json();
      alert("✅ Application submitted successfully!");
      console.log(result);

      setFormData({
        name: "",
        email: "",
        phone: "",
        specialty: "",
        licenseNumber: "",
        npiId: "",
        address: "",
      });
      setFile(null);
      setFileName("");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit application. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      <Sidebar />
      <div className="flex-1 lg:ml-[20vw]">
        <Navbar_III />
        <div className="p-6">
          <form
            onSubmit={handleSubmit}
            className={`border rounded-2xl shadow-sm p-8 ${cardBg} max-w-4xl mx-auto`}
          >
            <h1 className="text-2xl font-bold mb-2">
              Apply for Network Inclusion
            </h1>
            <p className={`${textSecondary} mb-8`}>
              Complete the form below to begin the credentialing process.
            </p>

            {/* --- Provider Information --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Dr. John Doe"
                  required
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none ${
                    Dark
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com"
                  required
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none ${
                    Dark
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none ${
                    Dark
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Specialty
                </label>
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="Cardiology"
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none ${
                    Dark
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            </div>

            {/* --- Credentials --- */}
            <h2 className="text-lg font-semibold mb-2">Credentials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="L123456"
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none ${
                    Dark
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">NPI ID</label>
                <input
                  type="text"
                  name="npiId"
                  value={formData.npiId}
                  onChange={handleChange}
                  placeholder="1234567890"
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none ${
                    Dark
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            </div>

            {/* --- Practice Information --- */}
            <h2 className="text-lg font-semibold mb-2">Practice Information</h2>
            <div className="mb-6">
              <label className="block mb-1 text-sm font-medium">
                Primary Practice Address
              </label>
              <textarea
                rows="2"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Medical Lane, Healthville, ST 12345"
                className={`w-full px-4 py-2 rounded-xl border focus:outline-none ${
                  Dark
                    ? "bg-gray-900 border-gray-700 text-white"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                }`}
              ></textarea>
            </div>

            {/* --- Upload Credentials --- */}
            <h2 className="text-lg font-semibold mb-2">
              Upload Credential Documents
            </h2>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${
                Dark
                  ? "border-gray-700 hover:bg-gray-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
              onClick={() => document.getElementById("fileUpload").click()}
            >
              <input
                id="fileUpload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="mx-auto mb-2 w-6 h-6 opacity-70" />
              <p className="font-medium">
                {fileName ? fileName : "Click to upload or drag and drop"}
              </p>
              <p className={`${textSecondary} text-sm`}>
                PDF, DOCX, or JPG (max. 10MB)
              </p>
            </div>

            {/* --- Submit Button --- */}
            <div className="mt-8 text-center">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Apply;
