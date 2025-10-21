import {
  Avatar,
  Calendar,
  Card,
  Col,
  Layout,
  List,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";
// 解构Layout组件
const { Header, Content, Footer } = Layout;

export const HabitPage = () => {
  const data = [
    {
      title: "Ant Design Title 1",
    },
    {
      title: "Ant Design Title 2",
    },
    {
      title: "Ant Design Title 3",
    },
    {
      title: "Ant Design Title 4",
    },
    {
      title: "Ant Design Title 4",
    },
    {
      title: "Ant Design Title 4",
    },
    {
      title: "Ant Design Title 4",
    },
    {
      title: "Ant Design Title 4",
    },
  ];
  const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>["mode"]) => {
    console.log(value.format("YYYY-MM-DD"), mode);
  };

  const wrapperStyle: React.CSSProperties = {
    maxWidth: "65rem",
  };
  return (
    <>
      <Layout className={"d-flex flex-row  border-0"}>
        {/*左侧习惯列表*/}
        <Layout className={"w-50 border-end  p-4 pt-0 pb-0"}>
          <Header
            style={{ backgroundColor: "var(--theme--colorBgLayout)" }}
            className="pe-1 ps-1 border-0 "
          >
            {/*习惯页面标题*/}
            <Row className={"h-100"} justify="start" align="middle">
              <Typography.Title className={"m-0"} level={4}>
                习惯
              </Typography.Title>
            </Row>
          </Header>
          <Content>
            {/*习惯列表*/}
            <List
              className={"h-100 "}
              itemLayout="horizontal"
              dataSource={data}
              renderItem={(item, index) => (
                <List.Item className={"background-accent"}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`}
                      />
                    }
                    title={<a href="https://ant.design">{item.title}</a>}
                    description="Ant Design, a design language for background applications, is refined by Ant UED Team"
                  />
                </List.Item>
              )}
            />
          </Content>
        </Layout>
        {/*右侧习惯详细信息*/}
        <Layout className={"overflow-y-auto custom-scrollbar p-4 pt-0 pb-0"}>
          {/*信息头部，显示习惯名*/}
          <Header
            style={{ backgroundColor: "var(--theme--colorBgLayout)" }}
            className="pe-1 ps-1 border-0 "
          >
            <Row className={"h-100"} justify="start" align="middle">
              <Avatar
                src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${1}`}
              />
              <Typography.Title className={"m-0"} level={4}>
                ｛习惯名字｝
              </Typography.Title>
            </Row>
          </Header>
          {/*习惯详细信息*/}
          <Content>
            {/*各种统计数据*/}
            <Row gutter={16}>
              <Col span={12}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ display: "flex" }}
                >
                  <Card className={"background-accent"}>
                    <Statistic
                      title="Active"
                      value={11.28}
                      precision={2}
                      valueStyle={{ color: "#3f8600" }}
                      prefix={<ArrowUpOutlined />}
                      suffix="%"
                    />
                  </Card>
                  <Card className={"background-accent"}>
                    <Statistic
                      title="Active"
                      value={11.28}
                      precision={2}
                      valueStyle={{ color: "#3f8600" }}
                      prefix={<ArrowUpOutlined />}
                      suffix="%"
                    />
                  </Card>
                </Space>
              </Col>
              <Col span={12}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ display: "flex" }}
                >
                  <Card className={"background-accent"}>
                    <Statistic
                      title="Active"
                      value={11.28}
                      precision={2}
                      valueStyle={{ color: "#3f8600" }}
                      prefix={<ArrowUpOutlined />}
                      suffix="%"
                    />
                  </Card>
                  <Card className={"background-accent"}>
                    <Statistic
                      title="Active"
                      value={11.28}
                      precision={2}
                      valueStyle={{ color: "#3f8600" }}
                      prefix={<ArrowUpOutlined />}
                      suffix="%"
                    />
                  </Card>
                </Space>
              </Col>
            </Row>
            {/*完成情况日历*/}
            <div className={"mt-2 mb-2"} style={wrapperStyle}>
              <Calendar fullscreen={false} onPanelChange={onPanelChange} />
            </div>
            {/*当月完成日志*/}
            <List
              itemLayout="horizontal"
              dataSource={data}
              renderItem={(item, index) => (
                <List.Item className={"background-accent"}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`}
                      />
                    }
                    title={<a href="https://ant.design">{item.title}</a>}
                    description="Ant Design, a design language for background applications, is refined by Ant UED Team"
                  />
                </List.Item>
              )}
            />
          </Content>
        </Layout>
      </Layout>
    </>
  );
};
