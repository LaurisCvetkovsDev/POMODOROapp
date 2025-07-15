import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import Stopwatch from "./components/Stopwatch";
import "./fonts.css";
import "./index.css";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

// Set global compact mode flag
(window as any).COMPACT_MODE = true;

// Add compact mode classes to ensure transparency
document.documentElement.classList.add("compact-mode");
document.body.classList.add("compact-mode");
document.getElementById("root")?.classList.add("compact-mode");

// Also try URL approach as backup
const url = new URL(window.location.href);
url.searchParams.set("compact", "true");
window.history.replaceState({}, "", url.toString());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Stopwatch />
    </AuthProvider>
  </React.StrictMode>
);
