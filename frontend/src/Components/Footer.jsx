import React from "react";
import { useHealthContext } from "../Context/HealthContext";
import { FaLinkedin, FaGithub, FaTwitter, FaEnvelope } from "react-icons/fa";
import assets from "../assets/assets";

const Footer = () => {
  const { Dark } = useHealthContext();

  return (
    <footer
      className={`w-full transition-colors duration-500 ${
        Dark ? "bg-[#1e1e1e] text-[#e0e0e0]" : "bg-blue-100 text-gray-800"
      }`}
    >
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8  border-gray-300 dark:border-gray-700">
        {/* Logo & About */}
        <div>
          <img className="w-35" src={assets.logo} alt="" />
          <p className="text-sm leading-relaxed">
            Empowering healthcare providers with AI-powered verification and
            data accuracy tools.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-blue-600 cursor-pointer">Home</li>
            <li className="hover:text-blue-600 cursor-pointer">Features</li>
            <li className="hover:text-blue-600 cursor-pointer">About</li>
            <li className="hover:text-blue-600 cursor-pointer">Contact</li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-blue-600 cursor-pointer">
              Documentation
            </li>
            <li className="hover:text-blue-600 cursor-pointer">
              API Reference
            </li>
            <li className="hover:text-blue-600 cursor-pointer">Support</li>
            <li className="hover:text-blue-600 cursor-pointer">FAQs</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Contact</h3>
          <p className="text-sm">Email: support@healthatlas.ai</p>
          <p className="text-sm">Phone: +91 98765 43210</p>
          <div className="flex gap-4 mt-4 text-xl">
            <FaLinkedin className="cursor-pointer hover:text-blue-600" />
            <FaGithub className="cursor-pointer hover:text-gray-600" />
            <FaTwitter className="cursor-pointer hover:text-blue-500" />
            <FaEnvelope className="cursor-pointer hover:text-red-500" />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div
        className={`text-center text-sm py-4 ${
          Dark
            ? "bg-[#121212] text-gray-400 border-t border-gray-700"
            : "bg-blue-200 text-gray-700  border-gray-300"
        }`}
      >
        © {new Date().getFullYear()} Health Atlas. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
