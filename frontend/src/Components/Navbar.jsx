import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // ✅ import this
import assets from "../assets/assets";
import { HiMoon, HiSun, HiOutlineMenu, HiX } from "react-icons/hi";
import { useHealthContext } from "../Context/HealthContext";

const Navbar = ({
  scrollToFeatures,
  scrollToHowItWorks,
  scrollToAbout,
  scrollToContact,
}) => {
  const [showSideBar, setShowSideBar] = useState(false);
  const { navigate, Dark, setDark } = useHealthContext();
  const location = useLocation();

  const toggleSideBar = () => setShowSideBar(!showSideBar);

  const toggleDarkMode = () => {
    setDark(!Dark);
    const root = document.documentElement;
    if (!Dark) root.classList.add("dark");
    else root.classList.remove("dark");
  };

  useEffect(() => {
    // Initialize dark mode
    if (Dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [Dark]);

  const isHomePage = location.pathname === "/";

  return (
    <nav
      className={`w-full fixed top-0 left-0 z-50 shadow-md transition-colors duration-300 ${
        Dark ? "bg-black text-white" : "bg-white text-gray-900"
      }`}
    >
      <div className="flex justify-between items-center px-5 py-4">
        {/* Logo */}
        <div
          className="w-24 h-24 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <img src={assets.logo} alt="Logo" />
        </div>

        {/* Desktop Links (Only show on home page) */}
        {isHomePage && (
          <div className="hidden lg:flex gap-6 items-center text-md font-medium">
            <div
              onClick={() => navigate("/dashboard")}
              className="cursor-pointer"
            >
              Home
            </div>
            <div onClick={scrollToFeatures} className="cursor-pointer">
              Features
            </div>
            <div onClick={scrollToHowItWorks} className="cursor-pointer">
              How it works
            </div>
            <div onClick={scrollToAbout} className="cursor-pointer">
              About
            </div>
            <div onClick={scrollToContact} className="cursor-pointer">
              Contact
            </div>
          </div>
        )}

        {/* Buttons + Dark Toggle + Mobile Menu */}
        <div className="flex items-center gap-5">
          <div>
            {Dark ? (
              <HiSun
                onClick={toggleDarkMode}
                className="w-6 h-6 cursor-pointer"
              />
            ) : (
              <HiMoon
                onClick={toggleDarkMode}
                className="w-6 h-6 cursor-pointer"
              />
            )}
          </div>
          <button
            onClick={() => navigate("/login")}
            className={`border-2 px-3.5 py-1 rounded-lg ${
              Dark ? "border-gray-700" : "text-white"
            } bg-blue-900 border-gray-300`}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signUp")}
            className={`border-2 px-3.5 py-1 rounded-lg ${
              Dark ? "border-gray-700" : ""
            }`}
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

      {/* Mobile Sidebar (Only show on home page) */}
      {showSideBar && isHomePage && (
        <div
          className={`lg:hidden flex flex-col gap-5 p-5 border-t shadow-md ${
            Dark ? "bg-black text-white" : "bg-white text-gray-900"
          }`}
        >
          <div
            onClick={() => {
              navigate("/");
              toggleSideBar();
            }}
            className="cursor-pointer"
          >
            Home
          </div>
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
