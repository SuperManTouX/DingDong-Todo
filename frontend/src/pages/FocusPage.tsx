import React, { useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Layout,
  List,
  Progress,
  Row,
  Tabs,
  type TabsProps,
  Typography,
} from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { ClockCircleFilled, ThunderboltFilled } from "@ant-design/icons";
const { Title, Text } = Typography;

export const FocusPage: React.FC = () => {
  const [activeFocusKey, setActiveFocusKey] = useState<string>("2");
  const onChange = (key: string) => {
    setActiveFocusKey(key);
  };

  const data = [
    "Racing car sprays burning fuel into crowd.",
    "Japanese princess to wed commoner.",
    "Australian walks 100km after outback crash.",
    "Man charged over missing wedding girl.",
    "Los Angeles battles huge wildfires.",
  ];
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "番茄计时",
    },
    {
      key: "2",
      label: "正计时",
    },
  ];
  return (
    <>
      <Layout className="w-50">
        <Header className="theme-color">
          <Row align={"middle"}>
            <Col>
              <Title level={5}>番茄专注</Title>
            </Col>
            <Col offset={7}>
              <Tabs
                activeKey={activeFocusKey}
                items={items}
                onChange={onChange}
              />
            </Col>
          </Row>
        </Header>
        <Content className={"h-100"}>
          <Row className={"h-100"} justify={"center"} align={"middle"}>
            <Col>
              <Title level={5}>专注</Title>
              <Progress
                className={"mb-5 mt-5"}
                type="circle"
                size={280}
                percent={75}
              />
              <Row className={"w-100"} justify={"center"} align={"middle"}>
                <Col span={16}>
                  <Button block type="primary">
                    开始
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Content>
      </Layout>
      <Layout className={"border-start"}>
        <Header className="theme-color ">
          <Row className={"h100"} align={"middle"}>
            <Col>
              <Title className={"m-0"} level={5}>
                概览
              </Title>
            </Col>
          </Row>
        </Header>
        <Content className={"pt-3 pe-5 ps-5"}>
          <Row className={"mb-3"} gutter={16}>
            <Col className={"mt-2"} span={12}>
              {/*卡片*/}
              <Card size={"small"} className="text-lg-start">
                <Title type="secondary" level={5}>
                  今日番茄
                </Title>
                <Text style={{ fontSize: "24px" }} strong>
                  0
                </Text>
              </Card>
            </Col>
            <Col className={"mt-2"} span={12}>
              {/*卡片*/}
              <Card size={"small"} className="text-lg-start">
                <Title type="secondary" level={5}>
                  今日专注时长
                </Title>
                <Text style={{ fontSize: "24px" }} strong>
                  ?
                </Text>
                <Text strong>h</Text>
                <Text type="secondary" style={{ fontSize: "24px" }} strong>
                  ?
                </Text>
                <Text strong>m</Text>
              </Card>
            </Col>
            <Col className={"mt-2"} span={12}>
              {/*卡片*/}
              <Card size={"small"} className="text-lg-start">
                <Title type="secondary" level={5}>
                  总番茄
                </Title>
                <Text style={{ fontSize: "24px" }} strong>
                  14
                </Text>
              </Card>
            </Col>
            <Col className={"mt-2"} span={12}>
              {/*卡片*/}
              <Card size={"small"} className="text-lg-start">
                <Title type="secondary" level={5}>
                  总专注时长
                </Title>
                <Text style={{ fontSize: "24px" }} strong>
                  123
                </Text>
                <Text strong>h</Text>
                <Text style={{ fontSize: "24px" }} strong>
                  45
                </Text>
                <Text strong>m</Text>
              </Card>
            </Col>
          </Row>
          <Divider>专注记录</Divider>
          <List
            header={
              <div className={"text-lg-start"}>
                <Title type={"secondary"} level={5}>
                  2025-09-25
                </Title>
              </div>
            }
            dataSource={data}
            renderItem={(item) => (
              <List.Item className={"highlight"} key={item}>
                <Row
                  className={"w-100"}
                  justify={"space-between"}
                  align={"middle"}
                >
                  <Col>
                    <ThunderboltFilled
                      style={{ color: "var(--theme-primaryColor)" }}
                    />
                    <ClockCircleFilled
                      style={{ color: "var(--theme-primaryColor)" }}
                    />
                    15:38:27 -15:38:33
                  </Col>
                  <Col>25m</Col>
                </Row>
              </List.Item>
            )}
          />
        </Content>
      </Layout>
    </>
  );
};
