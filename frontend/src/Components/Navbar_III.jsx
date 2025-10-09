import React, { useState } from "react";
import assets from "../assets/assets";
import { FiBell, FiSearch, FiUser } from "react-icons/fi";
import { useHealthContext } from "../Context/HealthContext";

const Navbar_III = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { Dark, setDark } = useHealthContext();

  return (
    <div className="relative flex justify-between items-center px-6 py-4 bg-white shadow-sm w-full transition-colors duration-300">
      {/* Greeting */}
      <div className="hidden lg:block font-medium text-gray-800 text-lg">
        Hi User
      </div>

      {/* Search */}
      <div className="flex items-center relative w-[50vw] sm:w-[40vw] max-w-md">
        <FiSearch className="absolute left-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search"
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors duration-300"
        />
      </div>

      {/* Icons */}
      <div className="flex items-center gap-5 relative">
        {/* Notifications */}
        <div className="relative">
          <FiBell
            className="w-5 h-5 cursor-pointer text-gray-700"
            onClick={() => setShowNotifications(!showNotifications)}
          />
          <span className="absolute top-[-6px] right-[-6px] bg-red-500 text-white text-[10px] font-bold rounded-full px-[5px]">
            3
          </span>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-64 bg-white shadow-lg rounded-xl z-10">
              <div className="p-3 border-b border-gray-200 font-semibold">
                Notifications
              </div>
              <ul className="max-h-60 overflow-y-auto text-sm text-gray-700">
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  Provider file uploaded successfully.
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  Validation report ready for download.
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  2 new provider entries added.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative">
          <FiUser
            className="w-5 h-5 cursor-pointer text-gray-700"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          />

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-40 bg-white shadow-lg rounded-xl z-10">
              <ul className="text-sm text-gray-700">
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  Profile
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  Settings
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500">
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
