import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { installDemoApi } from "./demo";

// No-op unless REACT_APP_DEMO === "true". Must run before App mounts so the
// first request is already intercepted.
installDemoApi();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
