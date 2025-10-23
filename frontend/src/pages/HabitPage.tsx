import React, { useEffect } from "react";
import dayjs from "dayjs";
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
import {
  ArrowUpOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FireFilled,
  ThunderboltFilled,
} from "@ant-design/icons";
import { Button } from "antd";
import { message } from "@/utils/antdStatic";
import type { Dayjs } from "dayjs";
import type { CalendarProps } from "antd";
// 导入习惯store
import {
  useHabitStore,
  useCurrentHabit,
  useDateStatuses,
} from "@/store/habitStore";
// 解构Layout组件
const { Header, Content, Footer } = Layout;

export const HabitPage = () => {
  // 从store获取习惯列表和加载方法
  const {
    habits,
    loadHabits,
    loadHabitDetail,
    currentHabitId,
    setCurrentHabitId,
    updateHabitCheckIn,
    updateSingleDateStatus,
  } = useHabitStore();
  const currentHabit = useCurrentHabit();
  const dateStatuses = useDateStatuses();
  // 状态管理：控制是否显示最高连续打卡天数
  const [showLongestStreak, setShowLongestStreak] = React.useState(false);

  // 组件挂载时加载习惯列表
  useEffect(() => {
    loadHabits();
  }, []);

  // 处理习惯点击事件
  const handleHabitClick = async (habit) => {
    console.log("选中习惯:", habit);
    setCurrentHabitId(habit.id);
    // 加载习惯详情
    await loadHabitDetail(habit.id);
    console.log(currentHabit?.date);
  };
  // 使用store中的习惯数据，如果没有则使用空数组
  const data = habits.length > 0 ? habits : [];

  // 处理面板变化
  const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>["mode"]) => {
    // 只有在模式为'month'时才重新请求数据，避免日视图切换也触发请求
    if (mode === "month" && currentHabitId) {
      // 格式化为YYYY-MM格式的月份参数
      const monthParam = value.format("YYYY-MM");
      console.log(`切换到月份: ${monthParam}`);
      // 重新加载习惯详情，带上月份参数
      loadHabitDetail(currentHabitId, monthParam);
    }
  };

  // 处理日期点击事件 - 切换完成/未完成状态
  const handleDateClick = async (date: Dayjs, isRightClick = false) => {
    if (!currentHabit) return;

    const dateStr = date.format("YYYY-MM-DD");
    console.log(`${isRightClick ? "右键" : "左键"}点击了日期: ${dateStr}`);

    // 查找当前日期的状态
    const existingStatus =
      dateStatuses?.find((item) => item.date === dateStr)?.status || null;
    console.log(dateStr, existingStatus);
    let newStatus: "completed" | "abandoned" | null;

    // 右键点击：标记为放弃
    if (isRightClick) {
      newStatus = "abandoned";
    }
    // 左键点击：切换completed/null状态
    else {
      switch (existingStatus) {
        case "completed":
          newStatus = null;
          break;
        case "abandoned":
        case null:
          newStatus = "completed";
          break;
        default:
          newStatus = "completed";
      }
    }

    // 立即更新UI以提供即时反馈（使用从store解构的函数）
    updateSingleDateStatus(currentHabit.id, dateStr, newStatus);

    try {
      // 调用API执行实际的状态切换
      await updateHabitCheckIn(currentHabit.id, dateStr, newStatus);
      console.log(
        `成功发送打卡状态切换请求，日期: ${dateStr}，状态: ${newStatus}`,
      );
      message.success("打卡状态更新成功");
    } catch (error) {
      console.error("打卡状态切换失败:", error);
      message.error("更新打卡状态失败");
      // 错误处理已在habitActions中处理，会自动回滚本地状态
    }
  };

  // 自定义日期单元格渲染
  const dateCellRender = (current: Dayjs, info: { type: string }) => {
    const dayjsDate = dayjs(current);
    const dateStr = dayjsDate.format("YYYY-MM-DD");
    // 使用store中的dateStatuses而不是currentHabit.dateStatuses
    const dateStatus = dateStatuses.find((item) => item.date === dateStr);
    const status = dateStatus?.status || null;

    // 渲染状态指示器
    const renderStatusIndicator = () => {
      switch (status) {
        case "completed":
          return (
            <div className="flex justify-center mt-1">
              <CheckCircleOutlined
                style={{ color: "#52c41a", fontSize: "16px" }}
              />
            </div>
          );

        case "abandoned":
          return (
            <div className="flex justify-center mt-1">
              <CloseCircleOutlined
                style={{ color: "#ff4d4f", fontSize: "16px" }}
              />
            </div>
          );
        case null:
          // 明确处理null状态，显示为灰色圆圈
          return (
            <div className="flex justify-center mt-1">
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "#d9d9d9",
                }}
              />
            </div>
          );
        default:
          return (
            <div className="flex justify-center mt-1">
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "#d9d9d9",
                }}
              />
            </div>
          );
      }
    };

    // 处理右键点击事件
    const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault(); // 阻止默认的右键菜单
      handleDateClick(dayjsDate, true);
    };

    return (
      <div
        className={`text-center p-1 cursor-pointer`}
        onClick={() => handleDateClick(dayjsDate)}
        onContextMenu={handleRightClick}
        title="左键: 切换完成/未完成, 右键: 标记为放弃"
      >
        {renderStatusIndicator()}
      </div>
    );
  };

  const wrapperStyle: React.CSSProperties = {
    minWidth: "40rem",
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
                <List.Item
                  className={`background-accent cursor-pointer hover:bg-opacity-90 transition-colors ${
                    item.id === currentHabitId
                      ? "border-l-4 border-blue-500 bg-blue-50 bg-opacity-80"
                      : ""
                  }`}
                  onClick={() => handleHabitClick(item)}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{item.emoji || "习惯"}</Avatar>}
                    title={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span>{item.title}</span>
                        {item.currentStreak > 0 && (
                          <span style={{ color: item.color, fontSize: "12px" }}>
                            🔥 {item.currentStreak}天
                          </span>
                        )}
                      </div>
                    }
                    description={
                      <>
                        <ThunderboltFilled style={{ color: "#0d9fee" }} />
                        {`${item.totalDays}天`}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Content>
        </Layout>
        {/*右侧习惯详细信息*/}
        <Layout
          className={"w-50 overflow-y-auto custom-scrollbar p-4 pt-0 pb-0"}
        >
          {/*信息头部，显示习惯名*/}
          {currentHabit ? (
            <>
              <Header
                style={{ backgroundColor: "var(--theme--colorBgLayout)" }}
                className="pe-1 ps-1 border-0 "
              >
                <Row className={"h-100"} justify="start" align="middle">
                  <Avatar>{currentHabit.emoji || "习惯"}</Avatar>
                  <Typography.Title className="m-0" level={4}>
                    {currentHabit.title}
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
                        <div style={{ position: "relative" }}>
                          <Statistic
                            title={
                              showLongestStreak
                                ? "最高连续天数"
                                : "当前连续天数"
                            }
                            value={
                              showLongestStreak
                                ? currentHabit.longestStreak || 0
                                : currentHabit.currentStreak
                            }
                            valueStyle={{ color: "#ff6b6b" }}
                            prefix={<FireFilled />}
                            suffix="天"
                          />
                          <Button
                            size="small"
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              padding: "2px 8px",
                              fontSize: "12px",
                            }}
                            onClick={() =>
                              setShowLongestStreak(!showLongestStreak)
                            }
                          >
                            {showLongestStreak ? "查看当前" : "查看最高"}
                          </Button>
                        </div>
                      </Card>
                      <Card className={"background-accent"}>
                        <Statistic
                          title="月打卡天数"
                          value={currentHabit.monthCheckInDays || 0}
                          valueStyle={{ color: "#4ecdc4" }}
                          suffix="天"
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
                          title="月打卡率"
                          value={(currentHabit.completionRate || 0) * 100}
                          valueStyle={{ color: "#45b7d1" }}
                          precision={1}
                          suffix="%"
                        />
                      </Card>
                      <Card className={"background-accent"}>
                        <Statistic
                          title="总打卡天数"
                          value={
                            currentHabit.totalCheckInDays ||
                            currentHabit.totalDays
                          }
                          valueStyle={{ color: "#52c41a" }}
                          suffix="天"
                        />
                      </Card>
                    </Space>
                  </Col>
                </Row>

                {/*完成情况日历*/}
                <div className={"mt-2 mb-2"} style={wrapperStyle}>
                  <Calendar
                    fullscreen={false}
                    showWeek={false}
                    onPanelChange={onPanelChange}
                    cellRender={dateCellRender}
                  />
                </div>
                {/*习惯描述*/}
                <Card className="mt-4">
                  <Typography.Title level={5}>习惯描述</Typography.Title>
                  <Typography.Paragraph>
                    {currentHabit.description}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary">
                    开始日期：
                    {dayjs(currentHabit.start_date).format("YYYY-MM-DD")}
                  </Typography.Text>
                </Card>
              </Content>
            </>
          ) : (
            ""
          )}
        </Layout>
      </Layout>
    </>
  );
};
