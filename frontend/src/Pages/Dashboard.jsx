import React from "react";
import { Users, ClipboardList, Clock, ShieldAlert } from "lucide-react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">
        <Navbar_III />

        <div className="p-6">
          <h1 className="font-bold text-3xl font-[Inter] mb-6">
            Provider Data Validation Dashboard
          </h1>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-gray-500 font-medium">
                  Providers Processed Today
                </p>
                <Users className="text-gray-400 w-5 h-5" />
              </div>
              <p className="text-3xl font-semibold mt-3">16</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-gray-500 font-medium">
                  Providers Needing Review
                </p>
                <ClipboardList className="text-gray-400 w-5 h-5" />
              </div>
              <p className="text-3xl font-semibold mt-3">100</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-gray-500 font-medium">
                  Average Confidence Score
                </p>
                <ShieldAlert className="text-gray-400 w-5 h-5" />
              </div>
              <p className="text-3xl font-semibold mt-3 text-blue-700">74.8%</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-gray-500 font-medium">
                  Time Saved vs Manual
                </p>
                <Clock className="text-gray-400 w-5 h-5" />
              </div>
              <p className="text-3xl font-semibold mt-3">212 hours</p>
            </div>
          </div>

          {/* Recent Activity + Alerts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
              <p className="text-gray-500">
                Recent validation activities will be shown here.
              </p>
            </div>

            {/* High Priority Alerts */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-2">
                High Priority Alerts
              </h2>
              <div className="border border-red-300 bg-red-50 text-red-700 rounded-xl p-4 mt-3">
                <p className="font-semibold">
                  Dr. Emily Carter&apos;s license expired
                </p>
                <p className="text-sm text-red-600">
                  License #L12345 expired on 10/4/2025.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
