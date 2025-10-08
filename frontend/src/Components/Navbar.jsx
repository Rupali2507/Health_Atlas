import { useState } from "react";
import assets from "../assets/assets";
import { HiOutlineMenu, HiX } from "react-icons/hi";
import { useHealthContext } from "../Context/HealthContext";
const Navbar = ({
  scrollToFeatures,
  scrollToHowItWorks,
  scrollToAbout,
  scrollToContact,
}) => {
  const [showSideBar, setShowSideBar] = useState(false);
  const toggleSideBar = () => setShowSideBar(!showSideBar);
  const { navigate } = useHealthContext();
  return (
    <nav className=" w-full bg-white shadow z-50">
      <div className="flex justify-between items-center px-5 py-4">
        {/* Logo */}
        <div className="w-24 h-24">
          <img src={assets.logo} alt="Logo" />
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex gap-6 items-center text-md font-medium">
          <a href="/" className="cursor-pointer hover:text-blue-600">
            Home
          </a>
          <div
            onClick={scrollToFeatures}
            className="cursor-pointer hover:text-blue-600"
          >
            Features
          </div>
          <div
            onClick={scrollToHowItWorks}
            className="cursor-pointer hover:text-blue-600"
          >
            How it works
          </div>
          <div
            onClick={scrollToAbout}
            className="cursor-pointer hover:text-blue-600"
          >
            About
          </div>
          <div
            onClick={() => {
              navigate("/dashboard");
            }}
            className="cursor-pointer hover:text-blue-600"
          >
            Contact
          </div>
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
          <div className="lg:hidden cursor-pointer" onClick={toggleSideBar}>
            {showSideBar ? (
              <HiX className="w-6 h-6" />
            ) : (
              <HiOutlineMenu className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {showSideBar && (
        <div className="lg:hidden flex flex-col gap-5 p-5 bg-white border-t shadow-md">
          <a href="/" className="cursor-pointer" onClick={toggleSideBar}>
            Home
          </a>
          <div
            onClick={() => {
              scrollToFeatures();
              toggleSideBar();
            }}
            className="cursor-pointer"
          >
            Features
          </div>
          <div
            onClick={() => {
              scrollToHowItWorks();
              toggleSideBar();
            }}
            className="cursor-pointer"
          >
            How it works
          </div>
          <div
            onClick={() => {
              scrollToAbout();
              toggleSideBar();
            }}
            className="cursor-pointer"
          >
            About
          </div>
          <div
            onClick={() => {
              scrollToContact();
              toggleSideBar();
            }}
            className="cursor-pointer"
          >
            Contact
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
