import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTasksByList } from "@/hooks/useTasksByList";
import {
  Dropdown,
  Layout,
  Row,
  Tabs,
  type MenuProps,
  type TabsProps,
  Typography,
  Button,
  Col,
  Select,
  message,
} from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { CheckOutlined, RightOutlined } from "@ant-design/icons";
import { useTodoStore } from "@/store/todoStore";
import type { TodoListData } from "@/types";
import dayjs from "dayjs";
import { focusService } from "@/services/focusService";
import { websocketService } from "@/services/websocketService";

interface FocusTimerProps {
  onStartFocus: () => void;
  onStopFocus: () => void;
  isFocusing: boolean;
  fetchAllFocusRecords: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  onStartFocus,
  onStopFocus,
  fetchAllFocusRecords,
  isFocusing,
}) => {
  const [activeFocusKey, setActiveFocusKey] = React.useState<string>("2");
  // 添加状态变量，用于保存当前选中的任务项
  const [selectedTodo, setSelectedTodo] = useState<any>(null);

  // 计时相关状态
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 默认25分钟倒计时（秒）
  const [elapsedTime, setElapsedTime] = useState<number>(0); // 已用时间（秒）
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null); // 开始时间戳
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null); // 结束时间戳
  const [isPaused, setIsPaused] = useState<boolean>(false); // 暂停状态
  const [pausedTime, setPausedTime] = useState<number>(0); // 上次暂停时的累计暂停时间
  const [lastPauseTimestamp, setLastPauseTimestamp] = useState<number | null>(
    null,
  ); // 上次暂停的时间戳
  const [focusRecordId, setFocusRecordId] = useState<string | null>(null); // 专注记录ID
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // 从todoStore中获取数据
  const { todoListData, getActiveListData } = useTodoStore();
  
  // 设置默认的listId为第一个可用的清单，避免初始为undefined
  const [focusActiveListId, setFocusActiveListId] = useState(todoListData[0]?.id || null);
  // 获取当前激活列表的数据，添加空值检查
  const currentListData = getActiveListData(focusActiveListId) || {};
  // 使用自定义hook获取任务列表
  const { tasks: currentListTasks } = useTasksByList(currentListData.id || '');
  console.log("currentListTasks", currentListTasks);

  // 准备Select组件的选项数据
  const selectOptions = todoListData.map((list: TodoListData) => ({
    value: list.id,
    label: list.title,
  }));

  // 构建dropdown菜单项目 - 包含清单选择器和当前清单的任务
  const menuItems: MenuProps["items"] = useMemo(() => {
    const items = [
      // 自定义渲染包含Select组件的菜单项
      {
        key: "list-selector",
        label: (
          <div className="p-2 w-full">
            <Typography.Text strong className="block mb-2">
              选择清单：
            </Typography.Text>
            <Select
              value={focusActiveListId}
              onChange={(value) => setFocusActiveListId(value)}
              options={selectOptions}
              style={{ width: "100%" }}
              placeholder="请选择清单"
              allowClear={false}
            />
          </div>
        ),
        disabled: true,
      },
      // 添加分隔线
      { type: "divider" },
      // 添加当前清单的任务列表
      {
        type: "group",
        label: `${currentListData.title || '选择的'} 清单的任务`,
        children: currentListTasks.map((todo) => ({
          key: `todo-${todo.id}`,
          label: (
            <div className="w-full text-left flex items-center gap-2">
              {todo.completed ? (
                <CheckOutlined className="text-green-500" />
              ) : (
                <div className="w-5 h-5 border border-gray-300 rounded-full" />
              )}
              <span
                className={todo.completed ? "line-through text-gray-500" : ""}
              >
                {todo.title}
              </span>
            </div>
          ),
          // 修改onClick事件，将当前点击的todo保存到selectedTodo变量中
          onClick: () => {
            console.log("选择任务:", todo.title);
            setSelectedTodo(todo);
          },
        })),
      },
    ];

    if (currentListTasks.length === 0) {
      // 如果当前清单没有任务，添加提示
      items.push({
        key: "no-todos",
        label: "此清单暂无任务",
        disabled: true,
      });
    }

    return items;
  }, [currentListTasks, currentListData, focusActiveListId, selectOptions, setSelectedTodo]);

  // 处理计时逻辑
  useEffect(() => {
    // 仅在isFocusing或activeFocusKey变化时执行
    if (isFocusing && !isPaused) {
      // 开始计时或继续计时
      if (!startTimestamp) {
        // 首次开始
        const now = Date.now();
        setStartTimestamp(now);
        setEndTimestamp(null);
        setPausedTime(0);

        // 根据当前激活的标签设置初始时间
        if (activeFocusKey === "1") {
          // 番茄计时 - 倒计时25分钟
          setTimeLeft(25 * 60);
          setElapsedTime(0);
        } else {
          // 正计时 - 从0开始
          setElapsedTime(0);
          setTimeLeft(0);
        }
      } else if (lastPauseTimestamp) {
        // 从暂停状态恢复，更新累计暂停时间
        const now = Date.now();
        const additionalPausedTime = now - lastPauseTimestamp;
        setPausedTime((prev) => prev + additionalPausedTime);
        setLastPauseTimestamp(null);
      }

      // 启动计时器
      timerRef.current = setInterval(() => {
        if (activeFocusKey === "1") {
          // 番茄计时（倒计时）
          setTimeLeft((prev) => {
            if (prev <= 1) {
              // 计时结束
              clearInterval(timerRef.current!);
              timerRef.current = null;
              const endTime = Date.now();
              setEndTimestamp(endTime);

              // 使用dayjs格式化时间戳
              const formattedStartTime = dayjs(startTimestamp).format(
                "YYYY-MM-DD HH:mm:ss",
              );
              const formattedEndTime = dayjs(endTime).format(
                "YYYY-MM-DD HH:mm:ss",
              );

              // 计时结束，记录已在创建时包含结束时间，无需再次更新
              console.log("计时结束，专注记录已保存:", {
                startTimestamp: formattedStartTime,
                endTimestamp: formattedEndTime,
              });
              message.success("专注记录已保存");
              onStopFocus(); // 自动结束专注
              return 0;
            }
            return prev - 1;
          });
        } else {
          // 正计时（最高60分钟）
          setElapsedTime((prev) => {
            if (prev >= 60 * 60 - 1) {
              // 达到最大时间限制
              clearInterval(timerRef.current!);
              timerRef.current = null;
              const endTime = Date.now();
              setEndTimestamp(endTime);

              // 使用dayjs格式化时间戳
              const formattedStartTime = dayjs(startTimestamp).format(
                "YYYY-MM-DD HH:mm:ss",
              );
              const formattedEndTime = dayjs(endTime).format(
                "YYYY-MM-DD HH:mm:ss",
              );

              // 达到最大时间限制，记录已在创建时包含结束时间，无需再次更新
              console.log("达到最大时间限制，专注记录已保存:", {
                startTimestamp: formattedStartTime,
                endTimestamp: formattedEndTime,
              });
              message.success("专注记录已保存");

              onStopFocus(); // 自动结束专注
              return 0; // 计时归零
            }
            return prev + 1;
          });
        }
      }, 1000);
    } else if (isFocusing && isPaused) {
      // 暂停计时
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setLastPauseTimestamp(Date.now());
      }
    } else {
      // 停止计时
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // 记录结束时间并调用API更新记录（传入结束时间）
      if (startTimestamp && !endTimestamp) {
        const endTime = Date.now();
        setEndTimestamp(endTime);

        // 使用dayjs格式化时间戳为ISO格式
        const startTimeISO = dayjs(startTimestamp).toISOString();
        const endTimeISO = dayjs(endTime).toISOString();
        // 调用API创建专注记录
              const createFocusRecord = async () => {
                try {
                  if (selectedTodo?.id) {
                    const mode = activeFocusKey === "1" ? "pomodoro" : "normal";
                    const response = await focusService.createFocusRecord({
                      task_id: selectedTodo.id,
                      start_time: startTimeISO,
                      end_time: endTimeISO,
                      mode: mode,
                      completed: false,
                    });
                    message.success("创建专注记录成功:");
                    // 更新focusRecordId，用于WebSocket事件匹配
                    setFocusRecordId(response.id);
                  } else {
                    message.warning("请先选择一个任务");
                    fetchAllFocusRecords();
                    onStopFocus(); // 自动结束专注
                  }
                } catch (error) {
                  console.error("创建专注记录失败:", error);
                  message.error("创建专注记录失败，请重试");
                }
              };
        createFocusRecord();
      }
      // 重置暂停状态
      setIsPaused(false);
      clearStatus();
      setLastPauseTimestamp(null);
    }

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isFocusing,
    activeFocusKey,
    onStopFocus,
    isPaused,
    selectedTodo?.id,
    focusRecordId,
  ]);

  // 处理标签切换
  const onChange = (key: string) => {
    setActiveFocusKey(key);
    // 如果当前正在计时，重置计时状态
    if (isFocusing) {
      onStopFocus();
      // 这里可以添加提示，告诉用户切换计时类型将重置当前计时
    }
  };

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

  const handleButtonClick = () => {
    if (!isFocusing) {
      // 未开始状态 -> 开始
      // 检查是否选择了任务
      if (!selectedTodo?.id) {
        message.warning("请先选择一个专注任务");
        return;
      }
      onStartFocus();
    } else if (isPaused) {
      // 暂停状态 -> 继续
      setIsPaused(false);
    } else {
      // 正在进行状态 -> 暂停
      setIsPaused(true);
    }
  };
  // 清空状态
  const clearStatus = () => {
    setElapsedTime(0);
    setTimeLeft(25 * 60);
    setStartTimestamp(null);
    setEndTimestamp(null);
    setFocusRecordId(null); // 清除专注记录ID
  };

  const handleStopClick = () => {
    // 无论何种状态，直接结束
    onStopFocus();
    // clearStatus();
  };

  // 确定按钮文本
  const getButtonText = () => {
    if (!isFocusing) return "开始";
    if (isPaused) return "继续";
    return "暂停";
  };

  // WebSocket事件订阅
  useEffect(() => {
    // 订阅专注记录创建事件
    const handleFocusCreated = (data: any) => {
      console.log('收到专注记录创建事件:', data);
      // 可以在这里更新UI或执行其他逻辑
      if (data.task_id === selectedTodo?.id) {
        message.success('检测到新的专注记录');
        // 如果需要，可以更新focusRecordId
        setFocusRecordId(data.id);
      }
    };

    // 订阅专注记录更新事件
    const handleFocusUpdated = (data: any) => {
      console.log('收到专注记录更新事件:', data);
      // 如果更新的是当前正在处理的专注记录
      if (data.id === focusRecordId) {
        // 更新相关状态
        if (data.end_time) {
          setEndTimestamp(new Date(data.end_time).getTime());
          // 如果计时器仍在运行，停止它
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          onStopFocus();
          message.success('专注记录已更新');
        }
      }
    };

    // 订阅专注记录删除事件
    const handleFocusDeleted = (data: any) => {
      console.log('收到专注记录删除事件:', data);
      // 如果删除的是当前正在处理的专注记录
      if (data.id === focusRecordId) {
        // 清理计时器和状态
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        clearStatus();
        onStopFocus();
        message.info('专注记录已删除');
      }
    };

    // 订阅WebSocket事件
    websocketService.subscribe('focus:created', handleFocusCreated);
    websocketService.subscribe('focus:updated', handleFocusUpdated);
    websocketService.subscribe('focus:deleted', handleFocusDeleted);

    // 组件卸载时取消订阅
    return () => {
      websocketService.unsubscribe('focus:created', handleFocusCreated);
      websocketService.unsubscribe('focus:updated', handleFocusUpdated);
      websocketService.unsubscribe('focus:deleted', handleFocusDeleted);
    };
  }, [focusRecordId, selectedTodo?.id, onStopFocus]);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 计算显示的时间
  const displayTime =
    activeFocusKey === "1" ? formatTime(timeLeft) : formatTime(elapsedTime);

  return (
    <Layout className="w-50">
      <Header className="theme-color">
        <Row justify="space-between" align="middle">
          <Col>
            <Typography.Title level={5}>番茄专注</Typography.Title>
          </Col>
          <Col>
            <Tabs
              activeKey={activeFocusKey}
              items={items}
              onChange={onChange}
            />
          </Col>
          <Col>
            <Typography.Title
              style={{ color: "transparent", userSelect: "none" }}
              level={5}
            >
              占位定位
            </Typography.Title>
          </Col>
        </Row>
      </Header>
      <Content className="h-100">
        {/* 时钟本体 */}
        <Row className="h-100" justify="center" align="middle">
          <Col>
            {/* 专注清单选择器 - 点击后在dropdown中显示选择器和任务 */}
            <Dropdown
              menu={{
                items: menuItems,
                style: { maxHeight: "300px", overflowY: "auto" },
              }}
            >
              <Typography.Title level={5} className="cursor-pointer">
                {selectedTodo?.title ? selectedTodo?.title : "专注"}
                <RightOutlined />
              </Typography.Title>
            </Dropdown>

            <div className="text-center mb-5 mt-5">
              <Typography.Title level={1} style={{ margin: 0 }}>
                {displayTime}
              </Typography.Title>
            </div>

            <Row
              className="w-100"
              justify="center"
              align="middle"
              gutter={[16, 0]}
            >
              <Col span={12}>
                <Button block type="primary" onClick={handleButtonClick}>
                  {getButtonText()}
                </Button>
              </Col>
              <Col span={4}>
                {isFocusing && (
                  <Button block danger onClick={handleStopClick}>
                    结束
                  </Button>
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};
