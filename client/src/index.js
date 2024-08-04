import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Import your main App component
// import "./index.css"; // Import your global styles

// Get the root element from the HTML file
const rootElement = document.getElementById("root");

// Create a root using the createRoot method from ReactDOM
const root = ReactDOM.createRoot(rootElement);

// Render the App component into the root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
