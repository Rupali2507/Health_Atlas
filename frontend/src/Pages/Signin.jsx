import React, { useState } from "react";
import { useHealthContext } from "../Context/HealthContext";
import assets from "../assets/assets";
import Navbar from "../Components/Navbar";
import Navbar_II from "../Components/Navbar_II";

const Signin = () => {
  const { navigate } = useHealthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add your authentication logic here
    console.log("Email:", email, "Password:", password);
    // Navigate to dashboard after login
    navigate("/dashboard");
  };

  return (
    <div>
      <Navbar_II />

      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 ">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={assets.logo} alt="Logo" className="w-24 h-24" />
          </div>

          <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full border px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full py-2 px-4 rounded-2xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/signUp")}
              className="text-blue-900 cursor-pointer hover:underline"
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
