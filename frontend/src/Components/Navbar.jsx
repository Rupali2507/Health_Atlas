import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
        Dark ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-900 "
      }`}
    >
      <div className="flex justify-between items-center px-5 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="w-24 h-24 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <img src={assets.logo} alt="Logo" className="w-full h-full" />
        </div>

        {/* Desktop Links (Only show on home page) */}
        {isHomePage && (
          <div className="hidden lg:flex gap-6 items-center text-md font-medium">
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer hover:text-teal-500 transition-colors"
            >
              Home
            </div>
            <div
              onClick={scrollToFeatures}
              className="cursor-pointer hover:text-teal-500 transition-colors"
            >
              Features
            </div>
            <div
              onClick={scrollToHowItWorks}
              className="cursor-pointer hover:text-teal-500 transition-colors"
            >
              How it works
            </div>
            <div
              onClick={scrollToAbout}
              className="cursor-pointer hover:text-teal-500 transition-colors"
            >
              About
            </div>
            <div
              onClick={scrollToContact}
              className="cursor-pointer hover:text-teal-500 transition-colors"
            >
              Contact
            </div>
          </div>
        )}

        {/* Buttons + Dark Toggle + Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <div>
            {Dark ? (
              <HiSun
                onClick={toggleDarkMode}
                className="w-6 h-6 cursor-pointer hover:text-teal-400 transition-colors"
              />
            ) : (
              <HiMoon
                onClick={toggleDarkMode}
                className="w-6 h-6 cursor-pointer hover:text-teal-500 transition-colors"
              />
            )}
          </div>

          {/* Auth Buttons */}
          <button
            onClick={() => navigate("/login")}
            className={`px-4 py-1 rounded-lg font-medium transition-colors duration-300 bg-blue-900 text-white hover:bg-blue-950
            }`}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signUp")}
            className={`px-4 py-1 rounded-lg font-medium border-2 transition-colors duration-300 ${
              Dark
                ? "border-gray-600 text-gray-200 hover:bg-gray-800"
                : "border-gray-300 text-gray-900 hover:bg-gray-100"
            }`}
          >
            Signup
          </button>

          {/* Mobile Menu Toggle */}
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
      {showSideBar && isHomePage && (
        <div
          className={`lg:hidden flex flex-col gap-4 p-5 border-t shadow-md transition-colors duration-300 ${
            Dark
              ? "bg-gray-900 text-gray-200 border-gray-700"
              : "bg-gray-50 text-gray-900 border-gray-200"
          }`}
        >
          <div
            onClick={() => {
              navigate("/");
              toggleSideBar();
            }}
            className="cursor-pointer hover:text-teal-500 transition-colors"
          >
            Home
          </div>
          <div
            onClick={() => {
              scrollToFeatures();
              toggleSideBar();
            }}
            className="cursor-pointer hover:text-teal-500 transition-colors"
          >
            Features
          </div>
          <div
            onClick={() => {
              scrollToHowItWorks();
              toggleSideBar();
            }}
            className="cursor-pointer hover:text-teal-500 transition-colors"
          >
            How it works
          </div>
          <div
            onClick={() => {
              scrollToAbout();
              toggleSideBar();
            }}
            className="cursor-pointer hover:text-teal-500 transition-colors"
          >
            About
          </div>
          <div
            onClick={() => {
              scrollToContact();
              toggleSideBar();
            }}
            className="cursor-pointer hover:text-teal-500 transition-colors"
          >
            Contact
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
