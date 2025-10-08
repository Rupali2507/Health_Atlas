import React, { useRef } from "react";
import Navbar from "../Components/Navbar";
import assets from "../assets/assets";
import Features from "../Components/Features";
import HowItWorks from "../Components/HowItWorks";
import About from "../Components/About";
import Footer from "../Components/Footer";
import { useHealthContext } from "../Context/HealthContext";

const Home = () => {
  const { navigate } = useHealthContext();
  // Refs for each section
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  // Scroll functions
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* Pass all scroll functions to Navbar */}
      <Navbar
        scrollToFeatures={scrollToFeatures}
        scrollToHowItWorks={scrollToHowItWorks}
        scrollToAbout={scrollToAbout}
        scrollToContact={scrollToContact}
      />

      {/* Hero section */}
      <div className="flex flex-col-reverse md:flex-row">
        <div className="md:w-[50%] flex flex-col pl-15 justify-center gap-2 mb-10 p-5">
          <div className="text-xl lg:text-3xl font-[Poppins]">
            AI-Powered Healthcare Provider Validation
          </div>
          <div className="text-md lg:text-xl">
            Reduce manual verification time from hours to minutes
          </div>
          <div className="text-xs md:text-sm">
            Automate provider data validation with AI to save time and reduce
            errors. Gain real-time insights into your provider network, track
            confidence scores, and quickly identify inconsistencies.
          </div>
          <button
            onClick={() => navigate("/signUp")}
            className="border px-5 py-3 mt-3 rounded-2xl bg-blue-950 text-white w-1/2 cursor-pointer "
          >
            Sign in to Dashboard
          </button>
        </div>
        <div className="md:w-[50%]">
          <img src={assets.Hero} alt="Hero" />
          <hr className="md:hidden" />
        </div>
      </div>

      {/* Sections with refs */}
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
        className="h-[300px] flex items-center justify-center bg-gray-100"
      >
        <h2>Contact Section</h2>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
