import React from "react";
import assets from "../assets/assets";

const Footer = () => {
  return (
    <div className="bg-gray-400 grid grid-cols-1 sm:grid-cols-4 justify-between flex-col sm:flex-row ">
      <div>
        <img src={assets.logo} alt="" />
      </div>
      <div className="p-10">
        <div className="text-lg font-medium  ">Quick Links</div>
        <li>Home</li>
        <li>Features</li>
        <li>How it Works</li>
        <li>About</li>
        <li>Sign In</li>
      </div>
      <div className="p-10">
        <span className="font-medium">LinkedIn:</span>
        <span> HealthAtlas LinkedIn</span>
        <br />
        <span className="font-medium">Twitter/X: </span>
        <span>@HealthAtlas</span>
        <br />
        <span className="font-medium">Email: </span>
        <span>contact@healthatlas.com</span>
      </div>
      <div className=" mt-20">
        <div>
          Subscribe to receive the latest updates, feature releases, and
          insights on AI-powered provider validation.
        </div>
        <input
          type="email"
          className="border rounded-2xl px-10 py-4 m-5 text-black"
          placeholder="Email"
        />
        <button>Subscribe</button>
      </div>
    </div>
  );
};

export default Footer;
