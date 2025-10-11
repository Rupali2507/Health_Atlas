import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Signin from "./Pages/Signin";
import SignUp from "./Pages/SignUp";
import Dashboard from "./Pages/Dashboard";
import Upload from "./Pages/Upload";
import Provider from "./Pages/Provider";
import ProviderDetail from "./Pages/ProviderDetail"; // Make sure this file exists

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Signin />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/provider" element={<Provider />} />
        <Route path="/provider-detail" element={<ProviderDetail />} />
      </Routes>
    </div>
  );
};

export default App;