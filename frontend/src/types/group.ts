import type { TodoListData, Todo } from "./index";

// 定义全局Group数组的类型
export interface Group {
  listId: TodoListData["id"];
  groupName: string;
  groupItemIds: Todo["id"][];
}

// 定义FilterGroup组件的属性类型
export interface FilterGroupProps {
  title: string | object | undefined;
  tasks: Todo[];
  children?: React.ReactNode;
}

// 定义时间分组的结构
export interface TimeGroup {
  date: dayjs.Dayjs;
  tasks: Todo[];
}