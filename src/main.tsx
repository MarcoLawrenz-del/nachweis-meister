import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/styles/brand.css";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import { AuthProvider } from "@/auth/AuthContext";

// Screenshot mode detection
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('screenshot') === '1') {
  document.documentElement.setAttribute('screenshot', '1');
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="subfix-ui-theme">
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);
