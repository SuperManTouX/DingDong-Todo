import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "../Layout/AppLayout";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PrivateRoute from "./PrivateRoute";
import StatsPage from "../pages/StatsPage";
import SettingsPage from "../pages/SettingsPage";
import TodoPage from "../pages/TodoPage/TodoPage";
import { FocusPage } from "@/pages/FocusPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "",
        element: <TodoPage />,
      },
      {
        path: "todos",
        element: <TodoPage />,
      },
      {
        path: "zhuanZhu",
        element: <FocusPage />,
      },
      {
        path: "stats",
        element: <StatsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
