/**
 * main.tsx  —  SQLite / offline-first version
 *
 * Removes AWS Amplify entirely.
 * On Android, Capacitor boots first (via defineCustomElements in index.html),
 * then we init the DB before rendering React.
 *
 * For web/browser development, install the jeepSQLite web component:
 *   npm install jeep-sqlite
 * and uncomment the jeepSQLite block below.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initDB } from "./db";

// ── Optional: web/browser SQLite shim (dev only) ──────────────────────────
// import { Capacitor } from "@capacitor/core";
// import { CapacitorSQLite } from "@capacitor-community/sqlite";
// import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";
// if (Capacitor.getPlatform() === "web") {
//   jeepSqlite(window);
//   const jeepEl = document.createElement("jeep-sqlite");
//   document.body.appendChild(jeepEl);
//   await customElements.whenDefined("jeep-sqlite");
//   await CapacitorSQLite.initWebStore();
// }
// ──────────────────────────────────────────────────────────────────────────

async function bootstrap() {
  try {
    await initDB();
  } catch (err) {
    console.error("SQLite init failed:", err);
    // App will still render; individual db calls will show errors inline.
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
