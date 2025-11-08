// src/Components/GlobalLoader.jsx
import React from "react";
import { useLoader } from "../Context/LoaderContext";

const GlobalLoader = () => {
  const { loading, message } = useLoader();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
      <p className="mt-4 text-white text-sm">{message}</p>
    </div>
  );
};

export default GlobalLoader;
