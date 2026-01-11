import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppV2 from "./AppV2.tsx";
import "./index.css";

// Simple routing based on pathname
const path = window.location.pathname;
const root = createRoot(document.getElementById("root")!);

if (path === "/v2" || path.startsWith("/v2/")) {
  root.render(<AppV2 />);
} else {
  root.render(<App />);
}
  