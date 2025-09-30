import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import type { FC } from "react";
import "@/styles/FilteredTodoList.css";

dayjs.extend(isoWeek);

interface TimeCountDownNodeProps {
  deadline?: string;
  datetimeLocal?: string;
}

/**
 * 时间倒计时组件，用于显示任务截止日期的相对时间
 * @param deadline - 任务截止日期
 * @param datetimeLocal - 任务时间
 * @returns 显示相对时间的 React 节点
 */
const TimeCountDownNode: FC<TimeCountDownNodeProps> = ({
  deadline,
  datetimeLocal,
}) => {
  if (!deadline && !datetimeLocal) return null;

  const leftDay = dayjs(deadline).diff(dayjs(), "day");

  // 计算本周下周
  const countWeek = () => {
    if (dayjs(deadline).isoWeek() - dayjs().isoWeek() === 0) {
      return "本";
    } else if (dayjs(deadline).isoWeek() - dayjs().isoWeek() === 1) {
      return "下";
    } else {
      return "";
    }
  };

  // 计算周几
  const deadDay = () => {
    let d: string;
    switch (dayjs(deadline).day()) {
      case 0:
        d = "日";
        break;
      case 1:
        d = "一";
        break;
      case 2:
        d = "二";
        break;
      case 3:
        d = "三";
        break;
      case 4:
        d = "四";
        break;
      case 5:
        d = "五";
        break;
      case 6:
        d = "六";
        break;
      default:
        d = "";
    }
    return d;
  };

  let text = "";
  if (leftDay < 0) {
    text = `${dayjs(deadline).format("MM月DD日")}`;
  } else {
    if (leftDay > 1)
      if (countWeek() !== "") {
        // 本周下周之内
        text = `${countWeek()}周${deadDay()}`;
      } else {
        //   大于下周
        text = `${leftDay}天`;
      }
    if (leftDay == 0) {
      text = "今天";
    }
    if (leftDay == 1) {
      text = "明天";
    }
  }

  return (
    <span
      className={`${leftDay < 0 ? "theme-textColor-errorColor" : "theme-textColor-dateColor"} d-inline-block text-end`}
    >
      {text}
    </span>
  );
};

export default TimeCountDownNode;
