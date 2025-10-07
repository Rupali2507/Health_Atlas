import React from "react";

const Features = () => {
  return (
    <div className="sm:h-[80vh]">
      <h1 className="text-3xl font-[poppins] ml-15 mt-5 ">Features</h1>
      <div className="flex sm:h-[50%] flex-col  sm:flex-row ">
        <div className="sm:w-[50%]  py-20 pl-10 h-full items-center sm:justify-end flex ">
          <div className="sm:w-[80%] flex flex-col sm:justify-end   gap-2 ">
            <div className="text-2xl font-[Inter] ">
              Automated Data Validation
            </div>
            <div>
              AI automatically verifies provider contact details, specialties,
              and credentials across multiple public sources, reducing manual
              effort and errors.
            </div>
          </div>
        </div>
        <div className=" py-10 sm:py-0 sm:w-[50%]  flex items-center bg-blue-200">
          <div className="w-[80%] flex flex-col  sm:justify-start p-10 gap-2">
            <div className="text-2xl font-[Inter] ">Confidence Scoring</div>
            <div>
              Each data point is assigned a reliability score based on source
              credibility and cross-verification, helping prioritize manual
              review efficiently.
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[50%] flex-col-reverse sm:flex-row">
        <div className="sm:w-[50%] h-full items-center justify-end flex pr-10 bg-gray-200">
          <div className="sm:w-[80%] py-20  flex flex-col justify-end pl-10  gap-2 ">
            <div className="text-2xl font-[Inter] ">Real-Time Insights</div>
            <div>
              Monitor validation progress and trends instantly with live
              dashboards, providing immediate visibility into your provider data
              quality.
            </div>
          </div>
        </div>
        <div className="sm:w-[50%]  flex items-center ">
          <div className="w-[80%] flex flex-col py-20 pl-10 justify-start sm:p-10 gap-2">
            <div className="text-2xl font-[Inter] ">
              Credential Verification
            </div>
            <div>
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
