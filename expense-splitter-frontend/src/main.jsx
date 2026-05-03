import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { ThemeProvider } from "./context/ThemeContext";
import { store } from "./app/store";
import { setupAxiosAuth } from "./api/setupAxiosAuth";
import "./index.css";

setupAxiosAuth(store);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
