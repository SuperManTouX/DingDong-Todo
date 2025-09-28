import type { DatePickerProps } from "antd";
import { DatePicker } from "antd";
import { message } from "@/utils/antdStatic";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { MESSAGES } from "@/constants/messages";
import type { Todo } from "@/types";

interface TaskDateTimePickerProps {
  todo?: Todo;
  todoId?: string;
  initialDate?: string;
  onDateTimeChange?: (
    date: DatePickerProps["value"] | RangePickerProps["value"],
  ) => void;
  onDateChange?: (date: string) => void;
}

export default function TaskDateTimePicker({
  todo,
  initialDate,
  onDateTimeChange,
  onDateChange,
}: TaskDateTimePickerProps) {
  // 处理日期时间选择确认
  const handleOk = (
    date: DatePickerProps["value"] | RangePickerProps["value"],
  ) => {
    // 调用原始的onDateTimeChange回调
    if (onDateTimeChange) {
      onDateTimeChange(date);
    }
    // 同时支持新的onDateChange回调
    if (onDateChange && date) {
      const formattedDate = dayjs(date).format("YYYY-MM-DD");
      onDateChange(formattedDate);
    }
    message.info(MESSAGES.INFO.DEADLINE_UPDATED);
  };

  // 返回DatePicker组件
  return (
    <DatePicker
      value={dayjs(todo?.deadline || initialDate)}
      style={{ backgroundColor: "transparent", borderColor: "transparent" }}
      showTime
      onOk={handleOk}
    />
  );
}
