import React, { useState } from "react";
import { Col, List, Row, Typography } from "antd";
import { ClockCircleFilled, ThunderboltFilled } from "@ant-design/icons";
import type { FocusRecord } from "@/pages/FocusPage/types";
import message from "antd/es/message";
import FocusEditModal from "@/components/FocusEditModal";

interface FocusRecordsProps {
  records: FocusRecord[];
  date: string;
  onRecordUpdated?: () => void;
}

export const FocusRecords: React.FC<FocusRecordsProps> = ({
  records,
  date,
  onRecordUpdated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FocusRecord | null>(
    null,
  );

  const showModal = (item: FocusRecord) => {
    setSelectedRecord(item);
    setIsModalOpen(true);
  };

  const handleUpdateRecord = async (newRecord: FocusRecord) => {
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
        renderItem={(item) => (
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
                {item.startTime} - {item.endTime}
                {item.taskTitle && (
                  <span className="ml-2">{item.taskTitle}</span>
                )}
              </Col>
              <Col>{item.duration}</Col>
            </Row>
          </List.Item>
        )}
      />
      <FocusEditModal
        isOpen={isModalOpen}
        mode="edit"
        record={selectedRecord}
        onSuccess={handleUpdateRecord}
        onCancel={handleCancelModal}
      />
    </>
  );
};
