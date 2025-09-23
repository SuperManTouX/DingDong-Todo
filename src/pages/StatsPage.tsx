import React from "react";
import { Card, Statistic, Row, Col } from "antd";
import {
  PieChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
} from "@ant-design/icons";

/**
 * 统计页面组件
 * 显示待办事项的统计信息
 */
const StatsPage: React.FC = () => {
  return (
    <div style={{ padding: "24px" }}>
      <h1>统计信息</h1>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总待办事项"
              value={100}
              prefix={<CheckSquareOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已完成"
              value={60}
              suffix="%"
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="逾期"
              value={5}
              valueStyle={{ color: "#cf1322" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: "16px" }}>
        <Col span={12}>
          <Card title="任务分类" extra={<PieChartOutlined />}>
            <div
              style={{
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p>饼图统计区域</p>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="完成趋势" extra={<LineChartOutlined />}>
            <div
              style={{
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p>折线图统计区域</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatsPage;

// 需要导入的图标组件
const CheckSquareOutlined = PieChartOutlined;
const CheckCircleOutlined = BarChartOutlined;
const ClockCircleOutlined = LineChartOutlined;
