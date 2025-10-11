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

  return (
    <div
      className={`${
        Dark ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-900"
      } transition-colors duration-500`}
    >
      {/* Navbar */}
      <Navbar
        scrollToFeatures={scrollToFeatures}
        scrollToHowItWorks={scrollToHowItWorks}
        scrollToAbout={scrollToAbout}
        scrollToContact={scrollToContact}
      />

      {/* Hero Section */}
      <div className="flex flex-col-reverse md:flex-row items-center pt-24 md:pt-32 px-5 md:px-20 gap-10 md:gap-0 mt-25">
        {/* Text Content */}
        <div className="md:w-1/2 flex flex-col gap-4 md:gap-6">
          <h1 className="text-2xl md:text-4xl font-bold font-[Poppins]">
            AI-Powered Healthcare Provider Validation
          </h1>
          <p className="text-md md:text-xl text-gray-400">
            Reduce manual verification time from hours to minutes
          </p>
          <p className="text-sm md:text-base text-gray-400">
            Automate provider data validation with AI to save time and reduce
            errors. Gain real-time insights into your provider network, track
            confidence scores, and quickly identify inconsistencies.
          </p>
          <button
            onClick={() => navigate("/signUp")}
            className=" px-5 py-3 mt-3 rounded-2xl bg-blue-950 text-white  w-1/2"
          >
            Sign in to Dashboard
          </button>
        </div>

        {/* Hero Image */}
        <div className="md:w-1/2 flex justify-center">
          <img src={assets.Hero} alt="Hero" className="w-full max-w-lg" />
        </div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="mt-20">
        <Features />
      </div>

      {/* How It Works Section */}
      <div ref={howItWorksRef} className="mt-20">
        <HowItWorks />
      </div>

      {/* About Section */}
      <div ref={aboutRef} className="mt-20">
        <About />
      </div>

      {/* Contact Section */}
      <div
        ref={contactRef}
        className={`mt-20 py-10 px-5 md:px-20 rounded-xl ${
          Dark ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"
        }`}
      >
        <Contact />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
