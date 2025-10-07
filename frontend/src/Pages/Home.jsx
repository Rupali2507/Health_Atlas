import React from "react";
import Navbar from "../Components/Navbar";
import assets from "../assets/assets";
import Features from "../Components/Features";
import HowItWorks from "../Components/HowItWorks";
import About from "../Components/About";
import Footer from "../Components/Footer";

const Home = () => {
  return (
    <div>
      <Navbar />
      {/* Hero section */}
      <div className=" flex flex-col-reverse md:flex-row ">
        <div className="md:w-[50%] items-start flex flex-col  pl-15 justify-center gap-2 mb-10 p-5">
          <div className=" text-xl lg:text-3xl  font-[Poppins] flex  ">
            {" "}
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
          {/* CTA */}
          <button className="border px-5 py-3 mt-3 rounded-2xl bg-blue-950 text-white">
            Sign in to Dashboard
          </button>
        </div>
        <div className="md:w-[50%] ">
          <img src={assets.Hero} alt="" />
          <hr className="md:hidden" />
        </div>
      </div>

      <Features />
      <HowItWorks />
      <About />
      <Footer />
    </div>
  );
};

export default Home;
