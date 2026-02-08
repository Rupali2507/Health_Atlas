import React, { useState, useEffect } from "react";
import assets from "../assets/assets";
import { MdDashboard, MdUpload } from "react-icons/md";
import {
  HiOutlineChevronLeft,
  HiUsers,
  HiOutlineMenu,
  HiUser,
} from "react-icons/hi";
import { HiOutlineChartBar } from "react-icons/hi";
import { ClipboardCheck } from "lucide-react";
import { useHealthContext } from "../Context/HealthContext";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const { Dark } = useHealthContext();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Conditional classes
  const sidebarBg = Dark ? "bg-gray-800 text-white" : "bg-white text-gray-900";
  const hoverBg = Dark ? "hover:bg-gray-700" : "hover:bg-gray-100";

  // Fetch pending review count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch(
          "http://localhost:8000/api/review-queue?status=PENDING"
        );
        const data = await res.json();
        setPendingCount(data.length); // assuming array response
      } catch (err) {
        console.error("Failed to fetch pending count", err);
      }
    };

    fetchPendingCount();
  }, []);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div
        className="lg:hidden cursor-pointer m-4 z-50 mt-10"
        onClick={toggleSidebar}
      >
        {!isSidebarOpen && (
          <HiOutlineMenu
            className={`w-7 h-7 ${Dark ? "text-white" : "text-gray-700"}`}
          />
        )}
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarBg} lg:translate-x-0 transition-transform duration-300 ease-in-out 
        lg:flex flex-col h-screen w-[70%] sm:w-[50%] md:w-[35%] lg:w-[20%] 
        border-r-2 border-gray-300 shadow-lg z-40`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <div className="w-20">
            <img src={assets.logo} alt="Logo" />
          </div>
          <HiOutlineChevronLeft
            onClick={toggleSidebar}
            className={`w-5 h-5 cursor-pointer lg:hidden ${
              Dark ? "text-white" : "text-gray-700"
            }`}
          />
        </div>

        {/* Nav Items */}
        <div className="flex flex-col mt-2">

          {/* Dashboard */}
          <div
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-4 p-3 cursor-pointer ${hoverBg}`}
          >
            <MdDashboard className="w-5 h-5" />
            <div>Dashboard</div>
          </div>

          {/* Upload */}
          <div
            onClick={() => navigate("/upload")}
            className={`flex items-center gap-4 p-3 cursor-pointer ${hoverBg}`}
          >
            <MdUpload className="w-5 h-5" />
            <div>Upload Data</div>
          </div>

          {/* Providers */}
          <div
            onClick={() => navigate("/provider")}
            className={`flex items-center gap-4 p-3 cursor-pointer ${hoverBg}`}
          >
            <HiUsers className="w-5 h-5" />
            <div>Providers</div>
          </div>

          {/* ✅ Review Queue (ABOVE New Provider) */}
          <div
            onClick={() => navigate("/review-queue")}
            className={`flex items-center gap-4 p-3 cursor-pointer ${hoverBg}`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <div className="flex items-center w-full">
              <span>Review Queue</span>

              {pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
          </div>

          {/* New Provider */}
          <div
            onClick={() => navigate("/new-user")}
            className={`flex items-center gap-4 p-3 cursor-pointer ${hoverBg}`}
          >
            <HiUser className="w-5 h-5" />
            <div>New Provider</div>
          </div>

          {/* Flow Chart */}
          <div
            onClick={() => navigate("/flowchart")}
            className={`flex items-center gap-4 p-3 cursor-pointer ${hoverBg}`}
          >
            <HiOutlineChartBar className="w-5 h-5" />
            <div>Pipeline</div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Sidebar;
