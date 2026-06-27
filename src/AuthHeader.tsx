// AuthHeader.tsx
// Drop this into your Authenticator's `components` prop in main.tsx
// See usage comment at the bottom of this file.

export function AuthHeader() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "2rem",
        paddingBottom: "1.5rem",
        gap: "0.75rem",
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(79, 70, 229, 0.35)",
        }}
      >
        <span style={{ color: "white", fontSize: "2rem", fontWeight: "bold", lineHeight: 1 }}>
          $
        </span>
      </div>

      {/* App name */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#6366f1",
            marginBottom: "2px",
          }}
        >
          Personal Finance
        </div>
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "#1e1b4b",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Money Tracker
        </div>
        <div
          style={{
            marginTop: "6px",
            fontSize: "0.8rem",
            color: "#94a3b8",
            fontWeight: 400,
          }}
        >
          Track every dollar, every day.
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// USAGE — paste this into your main.tsx (or wherever you
// render <Authenticator>):
//
// import { Authenticator } from "@aws-amplify/ui-react";
// import { AuthHeader } from "./AuthHeader";
//
// const components = {
//   Header: AuthHeader,
// };
//
// <Authenticator components={components}>
//   {({ user }) => <App />}
// </Authenticator>
// ===========================================================
