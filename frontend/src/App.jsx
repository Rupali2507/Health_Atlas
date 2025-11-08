import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Signin from "./Pages/Signin";
import SignUp from "./Pages/SignUp";
import Dashboard from "./Pages/Dashboard";
import Upload from "./Pages/Upload";
import Provider from "./Pages/Provider";
import ProviderDetail from "./Pages/ProviderDetail";
import Apply from "./Pages/Apply";
import ProtectedRoute from "./Components/ProtectedRoute";
import GlobalLoader from "./Components/GlobalLoader";
import { useLoaderContext } from "./Context/LoaderContext";

const App = () => {
  const { showLoader, hideLoader } = useLoaderContext();

  useEffect(() => {
    const wakeServer = async () => {
      showLoader("Loading... ");
      try {
        await fetch("https://health-atlas-2.onrender.com/api/health");
        console.log(" Backend awake!");
      } catch (err) {
        console.error(" Backend wake-up failed:", err);
      } finally {
        hideLoader();
      }
    };

    wakeServer();
  }, []);

  return (
    <div>
      {/* <GlobalLoader /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Signin />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route path="/provider" element={<Provider />} />
        <Route path="/provider-detail" element={<ProviderDetail />} />
        <Route path="/new-user" element={<Apply />} />
      </Routes>
    </div>
  );
};

export default App;
