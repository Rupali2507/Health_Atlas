import React from "react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";

const Dashboard = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div>
        <Navbar_III />
        <h1 className="font-bold text-3xl  font-[Inter] pl-6 pt-6">
          Provider Data Validation Dashboard
        </h1>
        <div className="border border-gray-200 m-5 rounded-2xl p-7">
          <div className="grid grid-col-1 sm:grid-col-2 lg:grid-col-4">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
