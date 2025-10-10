import React, { useRef } from "react";
import Navbar from "../Components/Navbar";
import assets from "../assets/assets";
import Features from "../Components/Features";
import HowItWorks from "../Components/HowItWorks";
import About from "../Components/About";
import Footer from "../Components/Footer";
import { useHealthContext } from "../Context/HealthContext";
import Contact from "../Components/Contact";

const Home = () => {
  const { navigate, Dark } = useHealthContext();

  // Refs for scrolling
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  // Scroll functions
  const scrollToFeatures = () =>
    featuresRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToHowItWorks = () =>
    howItWorksRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  const scrollToAbout = () =>
    aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToContact = () =>
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Apply CSS variables to Home wrapper
  const homeStyle = {
    backgroundColor: Dark ? "#020817" : "#f9f9f9",
    color: Dark ? "#e0e0e0" : "#000000",
  };

  return (
    <div style={homeStyle}>
      {/* Navbar with scroll functions */}
      <Navbar
        scrollToFeatures={scrollToFeatures}
        scrollToHowItWorks={scrollToHowItWorks}
        scrollToAbout={scrollToAbout}
        scrollToContact={scrollToContact}
      />

      {/* Hero Section */}
      <div className="flex flex-col-reverse md:flex-row pt-30">
        <div className="md:w-[50%] flex flex-col pl-15 justify-center gap-2 mb-10 p-5 ">
          <div className="text-xl lg:text-3xl font-[Poppins]">
            AI-Powered Healthcare Provider Validation
          </div>
          <div className="text-md lg:text-xl">
            Reduce manual verification time from hours to minutes
          </div>
          <div className="text-xs md:text-sm text-gray-400">
            Automate provider data validation with AI to save time and reduce
            errors. Gain real-time insights into your provider network, track
            confidence scores, and quickly identify inconsistencies.
          </div>
          <button
            onClick={() => navigate("/signUp")}
            className={`px-5 py-3 mt-3 rounded-2xl w-1/2 cursor-pointer ${
              Dark ? "bg-blue-950" : "bg-blue-900 text-white"
            }`}
          >
            SignUp to Dashboard
          </button>
        </div>
        <div className="md:w-[50%]">
          <img src={assets.Hero} alt="Hero" />
          <hr className="md:hidden" />
        </div>
      </div>

      {/* Sections */}
      <div ref={featuresRef}>
        <Features />
      </div>
      <div ref={howItWorksRef}>
        <HowItWorks />
      </div>
      <div ref={aboutRef}>
        <About />
      </div>
      <div
        ref={contactRef}
        className="flex items-center justify-center m-5"
        style={{
          backgroundColor: "var(--card-bg-color)",
          color: "var(--text-color)",
        }}
      >
        <Contact />
      </div>

      <Footer />
    </div>
  );
};

export default Home;
