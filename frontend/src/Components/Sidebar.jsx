import React from "react";
import assets from "../assets/assets";
import { FiDivideSquare } from "react-icons/fi";
import { MdDashboard, MdUpload } from "react-icons/md";
import { HiOutlineChevronLeft, HiUsers } from "react-icons/hi";
import { useHealthContext } from "../Context/HealthContext";
const Sidebar = () => {
  const { navigate } = useHealthContext();
  return (
    <div className="fixed top-0 h-screen w-[20%] border-r-2 border-gray-300 shadow-lg">
      <div className="flex justify-between items-center ">
        <div className="w-25">
          <img src={assets.logo} alt="" />
        </div>
        <HiOutlineChevronLeft
          color="gray"
          className="w-5 h-5 mr-5 cursor-pointer"
        />
      </div>
      <div
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-4 p-3  shadow-xs hover:bg-gray-100 "
      >
        <MdDashboard className=" w-5 h-5" />
        <div>Dashboard</div>
      </div>
      <div
        onClick={() => navigate("/upload")}
        className="flex items-center gap-4 p-3  shadow-xs  hover:bg-gray-100"
      >
        <MdUpload className=" w-5 h-5" />
        <div>Upload Data</div>
      </div>
      <div
        onClick={() => navigate("/provider")}
        className="flex items-center gap-4 p-3  shadow-xs  hover:bg-gray-100"
      >
        <HiUsers className=" w-5 h-5" />
        <div>Providers</div>
      </div>
    </div>
  );
};

export default Sidebar;
