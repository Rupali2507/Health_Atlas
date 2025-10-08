import React from "react";
import assets from "../assets/assets";
import { FiBell, FiMoon, FiSearch, FiSun, FiUser } from "react-icons/fi";

const Navbar_III = () => {
  return (
    <div className=" fixed flex justify-between pr-5 w-[100vw]">
      <div className="w-25 ">
        <img src={assets.logo} alt="" />
      </div>
      <div className="flex items-center   ">
        <input
          type="text"
          placeholder="Search"
          className="border border-gray-200 pl-8 pr-6 w-[40vw] rounded-xl py-2 shadow-md"
        />
        <FiSearch className="absolute ml-2 " />
      </div>
      <div className="flex  items-center gap-7">
        <FiBell className="w-5 h-5 " />
        <FiSun className="w-5 h-5 hidden  " />
        <FiMoon className="w-5 h-5 " />
        <FiUser className="w-5 h-5  " />
      </div>
    </div>
  );
};

export default Navbar_III;
