import React, { useState } from "react";
import { Col, List, Row, Typography } from "antd";
import { ClockCircleFilled, ThunderboltFilled } from "@ant-design/icons";
import type { FocusRecord } from "@/pages/FocusPage/types";
import type { ApiFocusRecord } from "@/services/focusService";
import message from "antd/es/message";
import FocusEditModal from "@/pages/FocusPage/FocusEditModal";
import dayjs from "dayjs";
import { useTodoStore } from "@/store/todoStore";

interface FocusRecordsProps {
  records: ApiFocusRecord[];
  date: string;
  onRecordUpdated?: () => void;
}

export const FocusRecords: React.FC<FocusRecordsProps> = ({
  records,
  date,
  onRecordUpdated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ApiFocusRecord | null>(
    null,
  );

  // 获取按ID查找任务的函数
  const getTodoByIdStore = useTodoStore((state) => state.getTodoById);

  // 格式化时间显示
  const formatTime = (dateString: string) => {
    return dayjs(dateString).format("HH:mm");
  };

  // 计算持续时间
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const durationMinutes = end.diff(start, "minute");
    return `${durationMinutes}分钟`;
  };

  // 格式化记录为UI组件所需格式
  const formatRecordForUI = (record: ApiFocusRecord): FocusRecord => ({
    id: record.id,
    startTime: formatTime(record.start_time),
    endTime: formatTime(record.end_time),
    duration: calculateDuration(record.start_time, record.end_time),
    mode: record.mode,
    taskTitle: getTodoByIdStore(record.task_id)?.title,
    note: record.notes || "",
    // 添加原始数据以供编辑使用
    ...record,
  });

  const showModal = (item: ApiFocusRecord) => {
    setSelectedRecord(item);
    console.log(item);
    setIsModalOpen(true);
  };

  const handleUpdateRecord = async (newRecord: ApiFocusRecord) => {
    try {
      // 调用回调函数通知父组件更新记录
      if (onRecordUpdated) {
        onRecordUpdated();
      }
    } catch (error) {
      console.error("更新专注记录失败:", error);
      message.error("更新专注记录失败，请稍后重试");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      // 调用回调函数通知父组件更新记录
      if (onRecordUpdated) {
        onRecordUpdated();
      }
    } catch (error) {
      console.error("删除专注记录失败:", error);
      message.error("删除专注记录失败，请稍后重试");
    }
  };

  const handleCancelModal = () => {
    setSelectedRecord(null);
    setIsModalOpen(false);
  };

  return (
    <>
      <List
        header={
          // 专注记录头部 显示当前分组时间的地方
          <Row
            className="text-lg-start"
            justify={"space-between"}
            align={"middle"}
          >
            <Col>
              <Typography.Title type="secondary" level={5}>
                {date}
              </Typography.Title>
            </Col>
          </Row>
        }
        dataSource={records}
        renderItem={(item) => {
          // 在渲染时格式化记录
          const formattedItem = formatRecordForUI(item);
          return (
            // 专注记录列表
            <List.Item className="highlight" key={item.id}>
              <Row
                onClick={() => {
                  showModal(item);
                }}
                className="w-100 pe-3 ps-3 cursor-pointer"
                justify="space-between"
                align="middle"
              >
                <Col>
                  {item.mode === "normal" ? (
                    // 正计时闪电icon
                    <ThunderboltFilled
                      className={"me-1 bg-priColor"}
                      style={{ color: "var(--theme-primaryColor)" }}
                    />
                  ) : (
                    // 番茄计时时钟icon
                    <ClockCircleFilled
                      className={"me-1 bg-priColor"}
                      style={{ color: "var(--theme-primaryColor)" }}
                    />
                  )}
                  {formattedItem.startTime} - {formattedItem.endTime}
                  {formattedItem.taskTitle && (
                    <span className="ml-2">{formattedItem.taskTitle}</span>
                  )}
                </Col>
                <Col>{formattedItem.duration}</Col>
              </Row>
            </List.Item>
          );
        }}
      />
      <FocusEditModal
        isOpen={isModalOpen}
        mode="edit"
        record={selectedRecord}
        onSuccess={handleUpdateRecord}
        onDelete={handleDeleteRecord}
        onCancel={handleCancelModal}
      />
    </>
  );
};
