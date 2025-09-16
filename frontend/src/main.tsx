import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
// import './index.css'
import "./styles/currentCSS.css";
import "@ant-design/v5-patch-for-react-19";
// import App from './TicTacToe.tsx'
// import TaskApp from "./TaskApp";
// import NestedList from "./Test";
import AppLayout from "./components/AppLayout";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppLayout></AppLayout>

    {/*<NestedList></NestedList>*/}
  </StrictMode>,
);
