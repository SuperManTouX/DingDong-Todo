import React, { useEffect } from "react";
import dayjs from "dayjs";
import {
  Avatar,
  Calendar,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  Modal,
  Layout,
  List,
  Menu,
  Row,
  Space,
  Statistic,
  Typography,
  Radio,
  DatePicker,
  InputNumber,
  TimePicker,
  Switch,
  Select,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FireFilled,
  PlusOutlined,
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
// 导入习惯服务
import { habitService } from "@/services/habitService";
// 解构Layout组件
const { Header, Content } = Layout;
const { TextArea } = Input;

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
  // 状态管理：当前日历面板显示的月份
  const [currentPanelMonth, setCurrentPanelMonth] = React.useState<string>(
    dayjs().format("YYYY-MM"),
  );
  // 状态管理：控制添加习惯模态框的显示
  const [isAddModalVisible, setIsAddModalVisible] = React.useState(false);
  const [habitForm] = Form.useForm();

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
  };

  // 处理添加新习惯
  const handleAddHabit = () => {
    // 重置表单
    habitForm.resetFields();
    // 打开添加习惯模态框
    setIsAddModalVisible(true);
  };

  const handleAddModalOk = () => {
    habitForm
      .validateFields()
      .then((values) => {
        // 准备提交数据，将前端字段转换为后端需要的格式
        const habitData = {
          name: values.name,
          description: values.description || '',
          frequency: values.frequency,
          // 对于永远的习惯，target_days设置为null
          target_days: values.targetDays,
          // start_date使用用户选择的开始日期，无论是否为永久习惯
          start_date: values.startDate.format('YYYY-MM-DD'),
          color: values.color,
          is_reminder_enabled: 0, // 默认关闭提醒
          reminder_time: null,    // 默认无提醒时间
          emoji: '',              // 默认无表情
          is_deleted: 0           // 默认未删除
        };
        
        console.log("表单验证成功，习惯数据:", habitData);
        
        // 发送添加习惯的请求
        habitService.createHabit(habitData)
          .then(() => {
            message.success("习惯添加成功");
            setIsAddModalVisible(false);
            // 重新加载习惯列表
            loadHabits();
          })
          .catch((error) => {
            console.error("添加习惯失败:", error);
            message.error("添加习惯失败，请重试");
          });
      })
      .catch((info) => {
        console.log("表单验证失败:", info);
        message.error("请填写完整的习惯信息");
      });
  };

  const handleAddModalCancel = () => {
    setIsAddModalVisible(false);
    habitForm.resetFields();
  };

  // 监听永久选项变化，控制目标天数输入框状态
  const handlePermanentChange = (checked) => {
    habitForm.setFieldsValue({ isPermanent: checked });
  };
  // 使用store中的习惯数据，如果没有则使用空数组
  const data = habits.length > 0 ? habits : [];

  // 处理面板变化
  const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>["mode"]) => {
    // 更新当前显示的面板月份
    const monthParam = value.format("YYYY-MM");
    setCurrentPanelMonth(monthParam);
    // 只有在模式为'month'时才重新请求数据，避免日视图切换也触发请求
    if (mode === "month" && currentHabitId) {
      console.log(`切换到月份: ${monthParam}`);
      // 重新加载习惯详情，带上月份参数
      loadHabitDetail(currentHabitId, monthParam);
    }
  };

  // 处理日期点击事件 - 切换完成/未完成/放弃状态
  const handleDateClick = async (
    date: Dayjs,
    status?: "completed" | "abandoned" | null,
    isCurrentMonth = true,
  ) => {
    if (!currentHabit || !isCurrentMonth) return;

    const dateStr = date.format("YYYY-MM-DD");
    console.log(`点击了日期: ${dateStr}`);

    // 检查日期是否大于当前系统时间
    const today = dayjs().startOf("day"); // 使用dayjs的startOf方法获取今天00:00:00时间点
    if (dayjs(date).isAfter(today, "day")) {
      message.warning("打卡时间不能超过当前时间");
      return;
    }

    // 检查日期是否早于习惯的开始日期
    const startDate = dayjs(currentHabit.startDate).startOf("day");
    if (dayjs(date).isBefore(startDate, "day")) {
      message.warning("打卡时间不能早于习惯开始日期");
      return;
    }

    // 查找当前日期的状态
    const existingStatus =
      dateStatuses?.find((item) => item.date === dateStr)?.status || null;
    console.log(dateStr, existingStatus);

    // 如果没有指定状态，则根据现有状态自动切换
    let newStatus: "completed" | "abandoned" | null = status;
    if (newStatus === undefined) {
      // 自动切换逻辑
      switch (existingStatus) {
        case "completed":
          newStatus = null;
          break;
        case "abandoned":
          // 单击放弃状态的记录，设置为未完成(null)
          newStatus = null;
          break;
        case null:
          newStatus = "completed";
          break;
        default:
          newStatus = "completed";
      }
    }

    // 立即更新UI以提供即时反馈（使用从store解构的函数）
    updateSingleDateStatus(currentHabit.id, dateStr, newStatus);
    console.log(currentHabit.id);
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

  // 处理右键菜单的标记放弃操作
  const handleMarkAsAbandoned = (date: Dayjs, isCurrentMonth: boolean) => {
    if (!currentHabit || !isCurrentMonth) return;
    handleDateClick(date, "abandoned", isCurrentMonth);
  };

  // 自定义日期单元格渲染
  const dateCellRender = (current: Dayjs) => {
    const dateStr = current.format("YYYY-MM-DD");
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
                style={{ color: "#52c41a", fontSize: "24px" }}
              />
            </div>
          );

        case "abandoned":
          return (
            <div className="flex justify-center mt-1">
              <CloseCircleOutlined
                style={{ color: "#ff4d4f", fontSize: "24px" }}
              />
            </div>
          );
        case null:
          // 明确处理null状态，显示为灰色圆圈
          return (
            <div className="flex justify-center mt-1">
              <div
                style={{
                  width: "24px",
                  height: "24px",
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
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#d9d9d9",
                }}
              />
            </div>
          );
      }
    };

    // 获取单元格日期的月份（YYYY-MM格式）
    const cellMonth = current.format("YYYY-MM");
    // 通过比较单元格日期的月份与当前显示面板的月份来判断是否为本月日期
    const isCurrentMonth = cellMonth === currentPanelMonth;

    // 右键菜单配置
    const menu = (
      <Menu>
        <Menu.Item
          key="1"
          onClick={() => handleMarkAsAbandoned(current, isCurrentMonth)}
          disabled={!isCurrentMonth}
        >
          标记为放弃
        </Menu.Item>
      </Menu>
    );

    // 检查日期是否大于当前系统时间
    const today = dayjs().startOf("day"); // 使用dayjs的startOf方法获取今天00:00:00时间点
    const isFutureDate = dayjs(current).isAfter(today, "day");

    // 检查日期是否早于习惯的开始日期
    const startDate = currentHabit?.startDate
      ? dayjs(currentHabit.startDate).startOf("day")
      : null;
    const isBeforeStartDate =
      startDate && dayjs(current).isBefore(startDate, "day");

    // 如果是未来日期、非本月日期或早于开始日期，设置为半透明
    const isDisabled = !isCurrentMonth || isFutureDate || isBeforeStartDate;

    return (
      <Dropdown overlay={menu} trigger={["contextMenu"]}>
        <div
          className={`text-center p-1 cursor-pointer ${isDisabled ? "opacity-30" : ""}`}
          onClick={() => handleDateClick(current, undefined, isCurrentMonth)}
          title={
            isDisabled
              ? isFutureDate
                ? "未来日期，不可打卡"
                : isBeforeStartDate
                  ? "早于习惯开始日期，不可打卡"
                  : "非本月日期，不可点击"
              : "左键: 切换完成/未完成状态, 右键: 打开菜单"
          }
        >
          {renderStatusIndicator()}
        </div>
      </Dropdown>
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
            {/*习惯页面标题和添加按钮*/}
            <Row className={"h-100"} justify="space-between" align="middle">
              <Typography.Title className={"m-0"} level={4}>
                习惯
              </Typography.Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleAddHabit()}
                size="small"
              >
                添加
              </Button>
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

      {/* 添加习惯的模态框 */}
      <Modal
        title="添加新习惯"
        open={isAddModalVisible}
        onOk={handleAddModalOk}
        onCancel={handleAddModalCancel}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={habitForm}
          layout="vertical"
          initialValues={{
            name: '',
            description: '',
            color: '#1890ff',
            frequency: 'daily',
            reminderTime: null,
            startDate: dayjs(),
            targetDays: null,
            targetType: '永远'
          }}
        >
          <Form.Item
            label="习惯名称"
            name="name"
            rules={[
              { required: true, message: "请输入习惯名称" },
              { max: 50, message: "习惯名称最多50个字符" },
            ]}
          >
            <Input placeholder="请输入习惯名称" />
          </Form.Item>

          <Form.Item
            label="习惯描述"
            name="description"
            rules={[{ max: 200, message: "习惯描述最多200个字符" }]}
          >
            <Input.TextArea rows={3} placeholder="请输入习惯描述（可选）" />
          </Form.Item>

          <Form.Item label="习惯颜色" name="color">
            <Input type="color" />
          </Form.Item>

          <Form.Item
            label="开始日期"
            name="startDate"
            rules={[{ required: true, message: "请选择开始日期" }]}
          >
            <DatePicker placeholder="请选择开始日期" />
          </Form.Item>

          <Form.Item
            label="频率"
            name="frequency"
            rules={[{ required: true, message: "请选择习惯频率" }]}
          >
            <Radio.Group>
              <Radio value="daily">每天</Radio>
              <Radio value="weekly">每周</Radio>
              <Radio value="monthly">每月</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="目标天数"
            name="targetDays"
            rules={[
              {
                validator: (_, value, callback) => {
                  const targetType = habitForm.getFieldValue("targetType");
                  if (targetType === "自定义" && (!value || value < 1)) {
                    callback("请输入有效的目标天数");
                  } else {
                    callback();
                  }
                },
              },
            ]}
          >
            <Space
              style={{
                width: "100%",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Form.Item noStyle name="targetType">
                <Select
                  placeholder="请选择目标类型"
                  style={{ width: 120 }}
                  onChange={() => {
                    const targetType = habitForm.getFieldValue("targetType");
                    if (targetType !== "自定义") {
                      // 根据选择设置对应的天数
                      const optionMap: Record<string, number | null> = {
                        "7天": 7,
                        "21天": 21,
                        "30天": 30,
                        "100天": 100,
                        "365天": 365,
                        "永远": null
                      };
                      habitForm.setFieldValue("targetDays", optionMap[targetType] || null);
                    }
                  }}
                  options={[
                    { label: '7天', value: '7天' },
                    { label: '21天', value: '21天' },
                    { label: '30天', value: '30天' },
                    { label: '100天', value: '100天' },
                    { label: '365天', value: '365天' },
                    { label: '永远', value: '永远' },
                    { label: '自定义', value: '自定义' }
                  ]}
                />
              </Form.Item>

              {/* 仅当选择自定义时显示输入框 */}
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.targetType !== currentValues.targetType
                }
              >
                {({ getFieldValue }) => 
                  getFieldValue("targetType") === "自定义" && (
                    <InputNumber
                      min={1}
                      placeholder="请输入目标天数"
                      style={{ width: 120, marginTop: 8 }}
                    />
                  )
                }
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
