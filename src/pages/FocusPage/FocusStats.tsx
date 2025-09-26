import React from "react";
import { Card, Col, Row, Typography } from "antd";

interface FocusStatsProps {
  todayTomatoes: number;
  todayHours: number;
  todayMinutes: number;
  totalTomatoes: number;
  totalHours: number;
  totalMinutes: number;
}

export const FocusStats: React.FC<FocusStatsProps> = ({
  todayTomatoes,
  todayHours,
  todayMinutes,
  totalTomatoes,
  totalHours,
  totalMinutes,
}) => {
  return (
    <Row className="mb-3" gutter={16}>
      <Col className="mt-2" span={12}>
        <Card size="small" className="text-lg-start">
          <Typography.Title type="secondary" level={5}>
            今日番茄
          </Typography.Title>
          <Typography.Text style={{ fontSize: "24px" }} strong>
            {todayTomatoes}
          </Typography.Text>
        </Card>
      </Col>
      <Col className="mt-2" span={12}>
        <Card size="small" className="text-lg-start">
          <Typography.Title type="secondary" level={5}>
            今日专注时长
          </Typography.Title>
          <Typography.Text style={{ fontSize: "24px" }} strong>
            {todayHours}
          </Typography.Text>
          <Typography.Text strong>h</Typography.Text>
          <Typography.Text style={{ fontSize: "24px" }} strong>
            {todayMinutes}
          </Typography.Text>
          <Typography.Text strong>m</Typography.Text>
        </Card>
      </Col>
      <Col className="mt-2" span={12}>
        <Card size="small" className="text-lg-start">
          <Typography.Title type="secondary" level={5}>
            总番茄
          </Typography.Title>
          <Typography.Text style={{ fontSize: "24px" }} strong>
            {totalTomatoes}
          </Typography.Text>
        </Card>
      </Col>
      <Col className="mt-2" span={12}>
        <Card size="small" className="text-lg-start">
          <Typography.Title type="secondary" level={5}>
            总专注时长
          </Typography.Title>
          <Typography.Text style={{ fontSize: "24px" }} strong>
            {totalHours}
          </Typography.Text>
          <Typography.Text strong>h</Typography.Text>
          <Typography.Text style={{ fontSize: "24px" }} strong>
            {totalMinutes}
          </Typography.Text>
          <Typography.Text strong>m</Typography.Text>
        </Card>
      </Col>
    </Row>
  );
};
