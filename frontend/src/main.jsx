import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { HealthProvider } from "./Context/HealthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <HealthProvider>
      <App />
    </HealthProvider>
  </BrowserRouter>
);
