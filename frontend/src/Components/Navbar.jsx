import React, { useState } from "react";
import assets from "../assets/assets";
import { HiOutlineMenu, HiX } from "react-icons/hi";
const Navbar = () => {
  const [showSideBar, setShowSideBar] = useState(false);
  const toggleSideBar = () => setShowSideBar(!showSideBar);
  return (
    <div>
      <div className="flex justify-between ">
        <div className="w-24 h-24 ">
          <img className="" src={assets.logo} alt="" />
        </div>
        <div className=" gap-6 items-center text-md font-medium hidden lg:flex">
          <div className="cursor-pointer">Home</div>
          <div className="cursor-pointer">Features</div>
          <div className="cursor-pointer">How it works</div>
          <div className="cursor-pointer">About</div>
          <div className="cursor-pointer" s>
            Contact
          </div>
        </div>
        <div className=" flex items-center gap-5 mr-5">
          <button className="border-2 border-blue-500 px-3.5 py-1 rounded-xl cursor-pointer bg-blue-900 text-white">
            Login
          </button>
          <button className="border-2 border-blue-500 px-3.5 py-1 rounded-xl cursor-pointer ">
            SignIn
          </button>
          <div onClick={toggleSideBar} className="lg:hidden cursor-pointer">
            {showSideBar ? (
              <HiX className="w-6 h-6 text-gray-800" />
            ) : (
              <HiOutlineMenu className="w-6 h-6 text-gray-800" />
            )}
          </div>
        </div>
      </div>
      <hr />
      {/* Mobile view sidebar */}
      {showSideBar && (
        <div className="flex flex-col border items-center gap-5 p-5 absolute w-full bg-gray-100 ">
          <div className="">Home</div>

          <div>Features</div>
          <div>How it works</div>
          <div>About</div>
          <div>Contact</div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
