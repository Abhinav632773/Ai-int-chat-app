import React from "react";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Login from "../screens/Login";
import Register from "../screens/Register";
import Home from "../screens/Home";
import UserAuth from "../auth/userAuth"; // FIXED: Proper import name
// import { UserContext } from "../context/user.context"; // FIXED: Removed unused import
import Project from "../screens/project"; // FIXED: Proper import name
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserAuth><Home /></UserAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/project/:id" element={<UserAuth><Project /></UserAuth>} /> {/* FIXED: Pass project ID */}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
