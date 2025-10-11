import { createContext, useContext, useState, useEffect } from "react";

const HealthContext = createContext();

export const useHealthContext = () => useContext(HealthContext);

export const HealthProvider = ({ children }) => {
  const [Dark, setDark] = useState(false);

  const [validationRuns, setValidationRuns] = useState(() => {
    try {
      const savedRuns = localStorage.getItem("validationRuns");
      return savedRuns ? JSON.parse(savedRuns) : [];
    } catch { return []; }
  });

  const [selectedProvider, setSelectedProvider] = useState(() => {
    try {
      const savedProvider = sessionStorage.getItem("selectedProvider");
      return savedProvider ? JSON.parse(savedProvider) : null;
    } catch { return null; }
  });

  useEffect(() => {
    const savedDark = localStorage.getItem("darkMode") === "true";
    setDark(savedDark);
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", Dark);
    document.documentElement.classList.toggle("dark", Dark);
  }, [Dark]);

  useEffect(() => {
    if (selectedProvider) {
      sessionStorage.setItem("selectedProvider", JSON.stringify(selectedProvider));
    } else {
      sessionStorage.removeItem("selectedProvider");
    }
  }, [selectedProvider]);
  
  const addValidationRun = (runDetails) => {
    const newRun = {
      id: new Date().getTime(),
      date: new Date().toISOString(),
      ...runDetails,
    };
    const updatedRuns = [newRun, ...validationRuns];
    setValidationRuns(updatedRuns);
    localStorage.setItem("validationRuns", JSON.stringify(updatedRuns));
  };

  const value = { 
    Dark, setDark,
    validationRuns, addValidationRun,
    selectedProvider, setSelectedProvider 
  };

  return (
    <HealthContext.Provider value={value}>
      {children}
    </HealthContext.Provider>
  );
};