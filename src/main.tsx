import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from "@aws-amplify/ui-react";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import "./amplify-override.css"; // ✅ must come AFTER the Amplify stylesheet
import { AuthHeader } from "./AuthHeader"; // ✅ branded login header

Amplify.configure(outputs);

const components = {
  Header: AuthHeader,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator
      loginMechanisms={["email"]}
      hideSignUp={false}
      components={components} // ✅ injects logo + title above the login form
    >
      <App />
    </Authenticator>
  </React.StrictMode>
);
