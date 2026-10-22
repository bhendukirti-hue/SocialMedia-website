
import React from "react";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { routes } from "./routes/AppRoutes";
import IncomingCall from "./pages/messages/IncomingCall";
import CallScreen from "./pages/messages/CallScreen";



const App = () => {
  return (
    <>
      <RouterProvider router={routes} />

      <IncomingCall/>
      <CallScreen/>
    </>
  );
};

export default App;
