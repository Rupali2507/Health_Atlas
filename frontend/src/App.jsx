import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";

import Signin from "./Pages/Signin";
import SignUp from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import Upload from "./Pages/Upload";
import Provider from "./Pages/Provider";

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
      </Routes>
    </div>
  );
};

export default App;
