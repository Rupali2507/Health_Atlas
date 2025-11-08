// src/Components/GlobalLoader.jsx
import React from "react";
import { useLoaderContext } from "../Context/LoaderContext";

const GlobalLoader = () => {
  const { loading, message } = useLoaderContext();

  if (!loading) return null; // Do not render anything if not loading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default GlobalLoader;
