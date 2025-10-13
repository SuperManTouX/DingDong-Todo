import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "../Layout/AppLayout";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PrivateRoute from "./PrivateRoute";
import StatsPage from "../pages/StatsPage";
import SettingsPage from "../pages/SettingsPage";
import Index from "../pages/TodoPage";
import { Index as FocusPage } from "@/pages/FocusPage/index.tsx";
import SearchResultPage from "../pages/SearchResultPage";

// 添加路由配置日志

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
        element: <Index />,
      },
      {
        path: "todos",
        element: <Index />,
      },
      {
        path: "zhuanZhu",
        element: <FocusPage />,
      },
      {
        path: "status",
        element: <StatsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "search",
        element: <SearchResultPage />,
      },
      {
        path: "search/:keyword",
        element: <SearchResultPage />,
      },
    ],
  },
]);

// 包装路由组件添加调试日志
const AppRouterWithDebug: React.FC = () => {
  return <RouterProvider router={router} />;
};

export const AppRouter = AppRouterWithDebug;
