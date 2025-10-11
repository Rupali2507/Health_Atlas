import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiSearch, FiUser } from "react-icons/fi";
import { HiMoon, HiSun } from "react-icons/hi"; // ✅ Import Sun and Moon icons
import { useHealthContext } from "../Context/HealthContext";

const Navbar_III = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { Dark, setDark } = useHealthContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDark(!Dark);
  };

  return (
    <div className={`relative flex justify-between items-center px-6 py-4 shadow-sm w-full transition-colors duration-300 ${Dark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
      <div className="hidden lg:block font-medium text-lg">
        Hi User
      </div>
      <div className="flex items-center relative w-[50vw] sm:w-[40vw] max-w-md">
        <FiSearch className="absolute left-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search"
          className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors duration-300 ${Dark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}
        />
      </div>
      <div className="flex items-center gap-5 relative">
        {/* Dark Mode Toggle */}
        <div>
          {Dark ? (
            <HiSun onClick={toggleDarkMode} className="w-5 h-5 cursor-pointer" />
          ) : (
            <HiMoon onClick={toggleDarkMode} className="w-5 h-5 cursor-pointer text-gray-700" />
          )}
        </div>
        <div className="relative">
          <FiBell
            className="w-5 h-5 cursor-pointer text-gray-700"
            onClick={() => setShowNotifications(!showNotifications)}
          />
          <span className="absolute top-[-6px] right-[-6px] bg-red-500 text-white text-[10px] font-bold rounded-full px-[5px]">
            3
          </span>
          {showNotifications && (
            <div className={`absolute right-0 mt-3 w-64 shadow-lg rounded-xl z-10 ${Dark ? "bg-gray-700" : "bg-white"}`}>
              {/* Notifications */}
            </div>
          )}
        </div>
        <div className="relative">
          <FiUser
            className="w-5 h-5 cursor-pointer text-gray-700"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          />
          {showProfileMenu && (
            <div className={`absolute right-0 mt-3 w-40 shadow-lg rounded-xl z-10 ${Dark ? "bg-gray-700" : "bg-white"}`}>
              <ul className="text-sm">
                <li className={`px-4 py-2 cursor-pointer ${Dark ? "hover:bg-gray-600" : "hover:bg-gray-100"}`}>Profile</li>
                <li className={`px-4 py-2 cursor-pointer ${Dark ? "hover:bg-gray-600" : "hover:bg-gray-100"}`}>Settings</li>
                <li onClick={handleLogout} className={`px-4 py-2 cursor-pointer text-red-500 ${Dark ? "hover:bg-gray-600" : "hover:bg-gray-100"}`}>
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar_III;