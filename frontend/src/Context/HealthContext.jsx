import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const HealthContext = createContext();

export const useHealthContext = () => useContext(HealthContext);

export const HealthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [Dark, setDark] = useState(false);
  return (
    <HealthContext.Provider value={{ navigate, Dark, setDark }}>
      {children}
    </HealthContext.Provider>
  );
};
