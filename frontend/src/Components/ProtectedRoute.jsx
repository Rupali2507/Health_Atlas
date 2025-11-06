import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // make sure no invalid token sneaks through
  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
