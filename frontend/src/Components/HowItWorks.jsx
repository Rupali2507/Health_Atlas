import React from "react";
import { useHealthContext } from "../Context/HealthContext";

const HowItWorks = () => {
  const { Dark } = useHealthContext();
  return (
    <div>
      <h1 className="text-3xl font-[poppins] ml-15 mt-30 text-blue-900 dark:text-blue-400 ">
        How It Works
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  gap-2 lg:gap-4 px-20 py-10">
        <div
          className={`border rounded-2xl shadow-lg py-3 px-2   flex flex-col gap-3 lg:p-7 bg-blue-50 border-gray-700 ${
            Dark ? "bg-gray-500" : ""
          }`}
        >
          <div className="text-lg font-[Inter] text-center font-medium">
            Upload Provider Data
          </div>
          <div className="text-gray-400 text-md">
            Import provider lists or sample datasets to start automated
            validation.
          </div>
        </div>
        <div
          className={`border rounded-2xl shadow-lg py-3 px-2   flex flex-col gap-3 lg:p-7 bg-blue-50 border-gray-700 ${
            Dark ? "bg-gray-600" : ""
          }`}
        >
          <div className="text-lg font-[Inter] text-center">
            AI Validation & Scraping
          </div>
          <div className="text-gray-400">
            AI cross-checks provider info against public sources, verifying
            contact details and credentials.
          </div>
        </div>
        <div
          className={`border rounded-2xl shadow-lg py-3 px-2   flex flex-col gap-3 lg:p-7 bg-blue-50 border-gray-700 ${
            Dark ? "bg-gray-700" : ""
          }`}
        >
          <div className="text-lg font-[Inter] text-center">
            Confidence Scoring & Insights
          </div>
          <div className="text-gray-400">
            Assigns reliability scores and generates real-time insights into
            data accuracy.
          </div>
        </div>
        <div
          className={`border rounded-2xl shadow-lg py-3 px-2   flex flex-col gap-3 lg:p-7 bg-blue-50 border-gray-700 ${
            Dark ? "bg-gray-800" : ""
          }`}
        >
          <div className="text-lg font-[Inter] text-center">
            Alerts & Updates
          </div>
          <div className="text-gray-400">
            Flags inconsistent entries for review and updates directories
            automatically.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
