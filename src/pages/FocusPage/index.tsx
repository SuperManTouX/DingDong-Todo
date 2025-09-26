import React, { useState, useEffect } from "react";
import {
  Divider,
  Dropdown,
  Layout,
  message,
  Select,
  Typography,
  Row,
  Col,
  MenuProps,
} from "antd";
import { Content, Header } from "antd/es/layout/layout";
import FocusEditModal from "@/components/FocusEditModal";
import {
  focusService,
  type FocusRecord as ApiFocusRecord,
} from "../../services/focusService";
import dayjs from "dayjs";
import { useTodoStore } from "@/store/todoStore";
import {
  EllipsisOutlined,
  PlusOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useTodoDataLoader } from "@/hooks/useTodoDataLoader";
import { FocusTimer } from "@/pages/FocusPage/FocusTimer";
import { FocusStats } from "@/pages/FocusPage/FocusStats";
import { FocusRecords } from "@/pages/FocusPage/FocusRecords";

export const Index: React.FC = () => {
  // 使用自定义hook加载待办数据
  useTodoDataLoader();
  // 专注状态管理
  const [isFocusing, setIsFocusing] = useState(false);
  // 专注记录管理 - 使用API返回的记录类型
  const [records, setRecords] = useState<ApiFocusRecord[]>([]);
  // 按id找到task
  const getTodoByIdStore = useTodoStore((state) => state.getTodoById);

  // 添加状态变量，用于保存当前选中的任务项
  const [selectedTodo, setSelectedTodo] = useState<any>(null);

  // 按天分组的记录
  const [groupedRecords, setGroupedRecords] = useState<
    Map<string, ApiFocusRecord[]>
  >(new Map());

  // 专注统计信息状态
  const [stats, setStats] = useState({
    todayTomatoes: 0,
    todayHours: 0,
    todayMinutes: 0,
    totalTomatoes: 14,
    totalHours: 123,
    totalMinutes: 45,
  });

  // 获取所有专注记录
  const fetchAllFocusRecords = async () => {
    try {
      const allRecords = await focusService.getAllFocusRecords();
      setRecords(allRecords);

      // 按天分组记录
      const grouped = new Map<string, ApiFocusRecord[]>();

      allRecords.forEach((record) => {
        // 使用开始时间的日期作为分组键
        const dateKey = dayjs(record.start_time).format("YYYY-MM-DD");

        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }

        grouped.get(dateKey)?.push(record);
      });

      // 转换为按日期倒序排列的Map
      const sortedEntries = Array.from(grouped.entries()).sort(
        ([dateA], [dateB]) => dayjs(dateB).unix() - dayjs(dateA).unix(),
      );

      setGroupedRecords(new Map(sortedEntries));
    } catch (error) {
      console.error("获取专注记录失败:", error);
      message.error("获取专注记录失败，请稍后重试");
    }
  };

  // 处理开始专注
  const handleStartFocus = () => {
    setIsFocusing(true);
    // 实际应用中应该调用API开始专注记录
  };

  // 处理结束专注
  const handleStopFocus = () => {
    setIsFocusing(false);
    // 结束专注后重新获取记录，确保显示最新数据
    fetchAllFocusRecords();
  };

  // 获取专注统计信息
  const getFocusStatistics = async () => {
    try {
      const statistics = await focusService.getFocusStatistics();

      // 计算今日统计（这里简化处理，实际应该从后端获取）
      const todayTomatoes = Math.floor(statistics.total_pomodoros * 0.3); // 模拟今日番茄数量

      // 计算小时和分钟
      const totalHours = Math.floor(statistics.total_hours);
      const totalMinutes = Math.round(
        (statistics.total_hours - totalHours) * 60,
      );

      const todayHours = Math.floor(totalHours * 0.3); // 模拟今日小时数
      const todayMinutes = Math.floor(totalMinutes * 0.3); // 模拟今日分钟数

      setStats({
        todayTomatoes,
        todayHours,
        todayMinutes,
        totalTomatoes: statistics.total_pomodoros,
        totalHours,
        totalMinutes,
      });
    } catch (error) {
      console.error("获取专注统计信息失败:", error);
      message.error("获取统计信息失败，请稍后重试");
    }
  };

  // 组件挂载时获取统计信息和记录
  useEffect(() => {
    getFocusStatistics();
    fetchAllFocusRecords();
  }, []);

  // 格式化时间显示
  const formatTime = (dateString: string) => {
    return dayjs(dateString).format("HH:mm");
  };
  // 专注编辑Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ApiFocusRecord | null>(
    null,
  );
  // 取消编辑
  const handleCancelEdit = () => {
    setSelectedTodo(null);
    setCurrentRecord(null);
    setIsEditModalOpen(false);
  };

  // 计算持续时间
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const durationMinutes = end.diff(start, "minute");
    return `${durationMinutes}分钟`;
  };

  // 显示添加对话框
  const showAddModal = () => {
    setCurrentRecord(null); // 添加时不设置记录
    setIsEditModalOpen(true);
  };
  //专注记录更多操作
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: "批量操作",
      onClick: () => {
        console.log("批量操作");
      },
    },
    {
      type: "divider",
    },
    {
      key: "2",
      label: "清空所有",
      extra: "⌘P",
      onClick: () => {
        console.log("清空所有");
      },
    },
  ];

  return (
    <>
      {/*计时时钟*/}
      <FocusTimer
        onStartFocus={handleStartFocus}
        onStopFocus={handleStopFocus}
        isFocusing={isFocusing}
      />
      {/*概况*/}
      <Layout className={"border-start overflow-y-auto"}>
        <Header className="theme-color">
          <Row className={"h100"} align={"middle"}>
            <Col>
              <Typography.Title className={"m-0"} level={5}>
                概览
              </Typography.Title>
            </Col>
          </Row>
        </Header>
        <Content className={"pt-3 pe-5 ps-5"}>
          {/* 统计卡片 */}
          <FocusStats
            todayTomatoes={stats.todayTomatoes}
            todayHours={stats.todayHours}
            todayMinutes={stats.todayMinutes}
            totalTomatoes={stats.totalTomatoes}
            totalHours={stats.totalHours}
            totalMinutes={stats.totalMinutes}
          />

          <Divider>
            专注记录
            <Col>
              <PlusOutlined
                style={{ fontSize: "16px" }}
                className={"me-4 p-1 highlight "}
                onClick={showAddModal}
              />

              <Dropdown menu={{ items }}>
                <EllipsisOutlined
                  style={{ fontSize: "16px" }}
                  className={" p-1 highlight "}
                />
              </Dropdown>
            </Col>
          </Divider>

          {/* 操作按钮区域 */}
          {groupedRecords.size > 0 ? (
            Array.from(groupedRecords.entries()).map(([date, dayRecords]) => {
              // 转换API记录格式为UI组件所需格式
              const formattedRecords = dayRecords.map((record) => ({
                id: record.id,
                startTime: formatTime(record.start_time),
                endTime: formatTime(record.end_time),
                duration: calculateDuration(record.start_time, record.end_time),
                mode: record.mode,
                taskTitle: getTodoByIdStore(record.task_id)?.title,
                note: record.notes || "",
              }));

              return (
                <div key={date} className="mb-6">
                  <FocusRecords
                    records={formattedRecords}
                    date={date}
                    onRecordUpdated={fetchAllFocusRecords}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-center py-10">
              <Typography.Text type="secondary">暂无专注记录</Typography.Text>
            </div>
          )}
        </Content>
        <FocusEditModal
          isOpen={isEditModalOpen}
          mode={currentRecord ? "edit" : "add"}
          record={currentRecord || null}
          selectedTodo={selectedTodo}
          setSelectedTodo={setSelectedTodo}
          onSuccess={async (newRecord) => {
            // 刷新记录数据
            await fetchAllFocusRecords();
            // 关闭模态框并重置状态
            setIsEditModalOpen(false);
            setSelectedTodo(null);
            setCurrentRecord(null);
            // 刷新统计数据
            getFocusStatistics();
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedTodo(null);
            setCurrentRecord(null);
          }}
        />
      </Layout>
    </>
  );
};
