import React, { useState, useEffect } from "react";
import { useHealthContext } from "../Context/HealthContext";
import { useLoaderContext } from "../Context/LoaderContext";

import Navbar from "../Components/Navbar";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const { Dark } = useHealthContext();
  const { loading, message, showLoader, hideLoader } = useLoaderContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (Dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [Dark]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    showLoader(
      "Signing in... (Our backend is on Render free-tier — it may take a few seconds to wake up. Thanks for your patience!)"
    );

    try {
      const response = await fetch(
        "http://health-atlas-2.onrender.com/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Signup failed");
      if (data.user?.name) {
        localStorage.setItem("name", data.user.name);
      } else {
        localStorage.setItem("name", formData.name);
      }
      console.log(localStorage.getItem("name"));
      alert(data.message || "Signup successful! Please login.");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.message || "Error signing up");
    } finally {
      hideLoader(); // hide loader
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 pt-20 ${
        Dark ? "bg-[#020817]" : "bg-gray-100"
      }`}
    >
      <Navbar />

      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
          <div className="text-white flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            <span>{message}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center px-4 pt-20">
        <div
          className={`p-8 rounded-xl shadow-md w-full max-w-md transition-colors duration-500 ${
            Dark ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"
          }`}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className={`border-2 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors duration-300 ${
                Dark
                  ? "bg-gray-900 text-gray-200 border-gray-700 placeholder-gray-500"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className={`border-2 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors duration-300 ${
                Dark
                  ? "bg-gray-900 text-gray-200 border-gray-700 placeholder-gray-500"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={`border-2 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors duration-300 ${
                Dark
                  ? "bg-gray-900 text-gray-200 border-gray-700 placeholder-gray-500"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`border-2 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors duration-300 ${
                Dark
                  ? "bg-gray-900 text-gray-200 border-gray-700 placeholder-gray-500"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition ${
                loading ? "cursor-not-allowed opacity-70" : ""
              }`}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>

          <p
            className={`mt-4 text-center transition-colors duration-300 ${
              Dark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Already have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
