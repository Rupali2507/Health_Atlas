import { useState } from "react";
import assets from "../assets/assets";
import { HiOutlineMenu, HiX } from "react-icons/hi";
import { useHealthContext } from "../Context/HealthContext";
const Navbar_II = () => {
  const { navigate } = useHealthContext();
  return (
    <nav className=" w-full bg-white shadow z-50">
      <div className="flex justify-between items-center px-5 py-4">
        {/* Logo */}
        <div className="w-24 h-24">
          <img src={assets.logo} alt="Logo" />
        </div>

        {/* Buttons + Mobile menu */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate("/login")}
            className="border-2 px-3.5 py-1 rounded-xl bg-blue-900 text-white"
          >
            Signin
          </button>
          <button
            onClick={() => navigate("/signUp")}
            className="border-2 border-blue-900 px-3.5 py-1 rounded-xl"
          >
            Signup
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar_II;
