import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HealthContext = createContext();

export const useHealthContext = () => useContext(HealthContext);

export const HealthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [Dark, setDark] = useState(false);
  useEffect(() => {
    const savedDark = localStorage.getItem("darkMode") === "true";
    setDark(savedDark);
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", Dark);
    const root = document.documentElement;
    if (Dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [Dark]);

  return (
    <HealthContext.Provider value={{ navigate, Dark, setDark }}>
      {children}
    </HealthContext.Provider>
  );
};
