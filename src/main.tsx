import React from "react";
import { createRoot } from "react-dom/client";
import AppDemo from "./AppDemo.tsx";
import AppV2 from "./AppV2.tsx";
import "./index.css";

// Simple routing based on pathname
const path = window.location.pathname;
const root = createRoot(document.getElementById("root")!);

// AppV2 is now the default (root path)
// AppDemo (old demo version) is accessible at /demo
if (path === "/demo" || path.startsWith("/demo/")) {
  root.render(<AppDemo />);
} else {
  root.render(<AppV2 />);
}
  