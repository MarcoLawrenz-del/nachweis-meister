import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/styles/brand.css";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="subfix-ui-theme">
    <App />
  </ThemeProvider>
);
