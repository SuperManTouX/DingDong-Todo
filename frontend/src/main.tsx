import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
// import './index.css'
import "./currentCSS.css";
import "@ant-design/v5-patch-for-react-19";
// import App from './TicTacToe.tsx'
// import TaskApp from "./TaskApp";
import TODOList from "./TODOList";
import NestedList from "./Test";
import Sider from "antd/es/layout/Sider";
import { Layout } from "antd";

const siderStyle1: React.CSSProperties = {
  textAlign: "center",
  lineHeight: "120px",
  color: "#fff",
  backgroundColor: "#3af152",
};
const siderStyle2: React.CSSProperties = {
  textAlign: "center",
  lineHeight: "120px",
  color: "#fff",
  backgroundColor: "#1677ff",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Layout>
      <Sider width="10%" style={siderStyle1}>
        Sider
      </Sider>
      <Sider width="25%" style={siderStyle2}>
        Sider
      </Sider>
      <Layout>
        <TODOList></TODOList>
      </Layout>
    </Layout>

    <NestedList></NestedList>
  </StrictMode>,
);
