import React from "react";
import { DatePicker, Popover, Button, List } from "antd";
import type { Dayjs } from "dayjs";
import { BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { dispatchTodo } from "@/store/todoStore";
import type { Todo } from "@/types";
import { MESSAGES } from "@/constants/messages";
import { message } from "@/utils/antdStatic";

// 定义组件属性接口
interface TaskDateTimePickerProps {
  todo: Todo;
}
export default function TaskDateTimePicker({ todo }: TaskDateTimePickerProps) {
  // 处理日期变化
  const handleDateChange = (date: Dayjs | null) => {
    console.log("date", date);
    // 使用ISO格式保存截止日期
    dispatchTodo({
      type: "changed",
      todo: {
        ...todo,
        deadline: date === null ? date : date.toISOString(),
        is_reminded: false,
        reminder_at: null,
      },
    });
  };

  // 计算提醒时间选项
  const reminderOptions = [
    { key: "15min", label: "15分钟前", minutes: 15 },
    { key: "30min", label: "30分钟前", minutes: 30 },
    { key: "1hour", label: "1小时前", hours: 1 },
    { key: "2hours", label: "2小时前", hours: 2 },
    { key: "1day", label: "1天前", days: 1 },
  ];

  // 处理提醒选项点击
  const handleReminderSelect = (option: {
    key: string;
    minutes?: number;
    hours?: number;
    days?: number;
  }) => {
    // 如果没有截止日期，无法设置提醒
    if (!todo.deadline) {
      console.log("请先设置截止日期");
      return;
    }

    // 使用dayjs计算提醒时间
    const deadlineDate = dayjs(todo.deadline);
    let reminderDate = deadlineDate.clone();

    // 减去相应的时间
    if (option.minutes)
      reminderDate = reminderDate.subtract(option.minutes, "minute");
    if (option.hours)
      reminderDate = reminderDate.subtract(option.hours, "hour");
    if (option.days) reminderDate = reminderDate.subtract(option.days, "day");

    console.log(reminderDate.format("YYYY-MM-DD HH:mm:ss"));
    // 确保提醒时间不早于当前时间
    const now = dayjs();
    if (reminderDate.isBefore(now)) {
      console.log("提醒时间不能早于当前时间");
      return;
    }

    // 使用dayjs的toISOString方法设置提醒时间
    onReminderChange(reminderDate.toISOString());
  };

  // 格式化当前提醒时间显示 - 使用dayjs
  const formatReminderTime = () => {
    if (!todo.reminder_at) return "设置提醒";
    const date = dayjs(todo.reminder_at);
    return `提醒: ${date.format("YYYY-MM-DD HH:mm:ss")}`;
  };
  // 处理提醒时间改变
  const onReminderChange = (reminderDate: string) => {
    dispatchTodo({
      type: "changed",
      todo: {
        ...todo,
        reminder_at: reminderDate,
        is_reminded: false,
      },
    });
    message.info(MESSAGES.SUCCESS.TASK_UPDATED);
  };

  // 创建Popover内容
  const popoverContent = (
    <div>
      {todo.reminder_at && (
        <div
          style={{
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>
            当前提醒时间:
          </div>
          <div>{formatReminderTime()}</div>
        </div>
      )}
      <div style={{ fontWeight: "bold", marginBottom: 8 }}>设置提醒:</div>
      <List
        size="small"
        dataSource={reminderOptions}
        renderItem={(option) => (
          <List.Item
            onClick={() => handleReminderSelect(option)}
            style={{ cursor: "pointer", padding: "4px 0" }}
            className="hover:bg-gray-50"
          >
            {option.label}
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <DatePicker
        presets={[
          { label: "今天", value: dayjs() },
          { label: "下周", value: dayjs().add(+7, "d") },
          { label: "昨天", value: dayjs().add(-1, "d") },
          { label: "上周", value: dayjs().add(-7, "d") },
          { label: "上月", value: dayjs().add(-1, "month") },
        ]}
        value={todo.deadline ? dayjs(todo.deadline) : undefined}
        style={{ width: 220 }}
        showTime
        needConfirm
        placeholder="Borderless"
        variant="borderless"
        format="YYYY-MM-DD HH:mm"
        onChange={handleDateChange}
        showNow={false}
      />

      <Popover
        content={popoverContent}
        title={todo.reminder_at ? "提醒设置" : "设置提醒时间"}
        trigger="hover"
        placement="bottomRight"
      >
        <Button
          icon={<BellOutlined />}
          type="text"
          style={{
            color: todo.reminder_at ? "#1677ff" : undefined,
            border: "none",
            background: "none",
            boxShadow: "none",
            minWidth: 40,
            padding: "4px 12px",
          }}
          title={todo.reminder_at ? formatReminderTime() : "设置提醒"}
        />
      </Popover>
    </div>
  );
}
