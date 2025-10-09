import React, { useState } from "react";
import assets from "../assets/assets";
import { MdDashboard, MdUpload } from "react-icons/md";
import {
  HiOutlineChevronLeft,
  HiUsers,
  HiOutlineMenu,
  HiX,
} from "react-icons/hi";
import { useHealthContext } from "../Context/HealthContext";

const Sidebar = () => {
  const { navigate } = useHealthContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      {/* Toggle Button for Mobile */}
      <div
        className="lg:hidden cursor-pointer m-4 z-50 mt-10"
        onClick={toggleSidebar}
      >
        {!isSidebarOpen && <HiOutlineMenu className="w-7 h-7 text-gray-700" />}
      </div>

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out bg-white lg:flex flex-col h-screen w-[70%] sm:w-[50%] md:w-[35%] lg:w-[20%] border-r-2 border-gray-300 shadow-lg z-40`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <div className="w-20">
            <img src={assets.logo} alt="Logo" />
          </div>
          <HiOutlineChevronLeft
            onClick={toggleSidebar}
            color="gray"
            className="w-5 h-5 cursor-pointer lg:hidden"
          />
        </div>

        {/* Nav Items */}
        <div className="flex flex-col mt-2">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-4 p-3 hover:bg-gray-100 cursor-pointer"
          >
            <MdDashboard className="w-5 h-5" />
            <div>Dashboard</div>
          </div>

          <div
            onClick={() => navigate("/upload")}
            className="flex items-center gap-4 p-3 hover:bg-gray-100 cursor-pointer"
          >
            <MdUpload className="w-5 h-5" />
            <div>Upload Data</div>
          </div>

          <div
            onClick={() => navigate("/provider")}
            className="flex items-center gap-4 p-3 hover:bg-gray-100 cursor-pointer"
          >
            <HiUsers className="w-5 h-5" />
            <div>Providers</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
