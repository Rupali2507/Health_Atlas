import React, { useState, useEffect } from "react";
import { useHealthContext } from "../Context/HealthContext";
import assets from "../assets/assets";
import Navbar from "../Components/Navbar";
import { useNavigate } from "react-router-dom"; // ✅ 1. Import useNavigate

const Signin = () => {
  const { Dark } = useHealthContext(); // ✅ 2. Removed 'navigate' from here
  const navigate = useNavigate(); // ✅ 3. Get the navigate function directly
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (Dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [Dark]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email:", email, "Password:", password);
    navigate("/dashboard");
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 pt-20 ${
        Dark ? "bg-[#020817]" : "bg-gray-100"
      }`}
    >
      <Navbar />

      <div className="flex items-center justify-center px-4 pt-20">
        <div
          className={`max-w-md w-full p-8 rounded-2xl shadow-lg transition-colors duration-500 ${
            Dark ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"
          }`}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={assets.logo} alt="Logo" className="w-24 h-24" />
          </div>

          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 transition-colors ${
                  Dark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={`w-full border px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                  Dark
                    ? "bg-gray-900 text-gray-200 border-gray-700 placeholder-gray-500"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 transition-colors ${
                  Dark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className={`w-full border px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                  Dark
                    ? "bg-gray-900 text-gray-200 border-gray-700 placeholder-gray-500"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full py-2 px-4 rounded-2xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition"
            >
              Login
            </button>
          </form>

          <p
            className={`text-center text-sm mt-4 transition-colors duration-300 ${
              Dark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/signUp")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signin;