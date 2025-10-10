import React from "react";
import { useHealthContext } from "../Context/HealthContext";

const About = () => {
  const { navigate } = useHealthContext();
  return (
    <div className="pb-10">
      <h1 className="text-3xl text-blue-900 font-[poppins] ml-15 mt-5 mb-15 dark:text-blue-400">
        About Provider Validation AI Portal
      </h1>
      <div className="border rounded-2xl p-10 lg:mx-20 mx-10 flex flex-col gap-4 items-center pb-10 border-gray-800 ">
        <div className=" font-medium">
          "This AI-powered system automates the validation of healthcare
          provider data, reducing manual verification effort and improving
          directory accuracy. It cross-checks provider information against
          multiple public sources, generates confidence scores, and prioritizes
          entries for review, providing real-time insights for healthcare
          networks."
        </div>
        <div>Ready to Experience Automated Provider Validation?</div>
        <button
          onClick={() => navigate("/signUp")}
          className=" px-5 py-3 mt-3 rounded-2xl bg-blue-950 text-white  w-1/2"
        >
          Sign in to Dashboard
        </button>

        <div className="text-xs text-gray-600">
          Note:Developed for EY Techathon 6.0 by [DevSquad], showcasing
          automated data quality improvement using publicly available and
          synthetic datasets.
        </div>
      </div>
    </div>
  );
};

export default About;
