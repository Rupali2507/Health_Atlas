import React, { createContext, useContext, useState } from "react";

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Loading...");

  const showLoader = (msg = "Loading...") => {
    setMessage(msg);
    setLoading(true);
  };

  const hideLoader = () => setLoading(false);

  return (
    <LoaderContext.Provider
      value={{ loading, message, showLoader, hideLoader }}
    >
      {children}
    </LoaderContext.Provider>
  );
};

// ✅ Named export matches your import
export function useLoaderContext() {
  return useContext(LoaderContext);
}
