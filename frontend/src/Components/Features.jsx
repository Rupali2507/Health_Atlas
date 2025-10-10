import React from "react";
import { useHealthContext } from "../Context/HealthContext";

const Features = () => {
  const { Dark } = useHealthContext();
  return (
    <div className="sm:h-[80vh]">
      <h1 className="text-3xl font-[poppins] ml-15 m-5  text-blue-900 dark:text-blue-400 ">
        Features
      </h1>
      <div
        className={`flex sm:h-[50%] flex-col  sm:flex-row ${
          Dark ? "border border-gray-700" : ""
        }`}
      >
        <div className="sm:w-[50%]  py-20 pl-10 h-full items-center sm:justify-end flex ">
          <div className="sm:w-[80%] flex flex-col sm:justify-end   gap-2 ">
            <div className="text-2xl font-[Inter] ">
              Automated Data Validation
            </div>
            <div className="text-gray-500">
              AI automatically verifies provider contact details, specialties,
              and credentials across multiple public sources, reducing manual
              effort and errors.
            </div>
          </div>
        </div>
        <div
          className={`py-10 sm:py-0 sm:w-[50%]  flex items-center bg-blue-200 ${
            Dark ? " bg-blue-950" : ""
          } `}
        >
          <div
            className={`w-[80%] flex flex-col  sm:justify-start p-10 gap-2 `}
          >
            <div className="text-2xl font-[Inter] ">Confidence Scoring</div>
            <div className="text-gray-500">
              Each data point is assigned a reliability score based on source
              credibility and cross-verification, helping prioritize manual
              review efficiently.
            </div>
          </div>
        </div>
      </div>
      <div
        className={`flex h-[50%] flex-col-reverse sm:flex-row ${
          Dark ? "border border-[#1e293b]" : ""
        }`}
      >
        <div
          className={`sm:w-[50%] h-full items-center justify-end flex pr-10 bg-gray-200 ${
            Dark ? "text-black bg-gray-400" : ""
          }`}
        >
          <div className="sm:w-[80%] py-20  flex flex-col justify-end pl-10  gap-2 ">
            <div className="text-2xl font-[Inter] ">Real-Time Insights</div>
            <div className="text-gray-700">
              Monitor validation progress and trends instantly with live
              dashboards, providing immediate visibility into your provider data
              quality.
            </div>
          </div>
        </div>
        <div className={`sm:w-[50%]  flex items-center `}>
          <div className="w-[80%] flex flex-col py-20 pl-10 justify-start sm:p-10 gap-2">
            <div className="text-2xl font-[Inter] ">
              Credential Verification
            </div>
            <div className="text-gray-500">
              Cross-check provider licenses, certifications, and network
              affiliations through public databases and NPI registry to maintain
              up-to-date, trustworthy directories.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
