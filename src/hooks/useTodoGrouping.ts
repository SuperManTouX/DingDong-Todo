import { useEffect, useMemo } from "react";
import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/types";
import type { Group, TimeGroup } from "@/types/group";
import dayjs from "dayjs";
import { SpecialLists } from "@/constants";

// 定义hook返回类型
interface UseTodoGroupingReturn {
  groupMode: "normal" | "time" | "none";
  groupedTasks: (Group & { tasks: Todo[] })[];
  timeGroupedTasks: TimeGroup[];
  ungroupedTasks: Todo[];
}

// 任务分组相关的hook group[]
export default function useTodoGrouping(tasks: Todo[]): UseTodoGroupingReturn {
  const { dispatchTodo, getGroupsByListId } = useTodoStore();

  const { activeListId } = useTodoStore.getState();
  let groupMode: "normal" | "time" =
    activeListId in SpecialLists ? "time" : "normal";
  const unCompletedTasks = tasks.filter((task) => !task.completed);
  let groupedTasks: (Group & { tasks: Todo[] })[] = [];
  let timeGroupedTasks: TimeGroup[] = [];
  let ungroupedTasks: Todo[] = [];

  // 当任务或当前激活列表变化时，重新计算分组
  // useEffect(() => {
  if (!unCompletedTasks || unCompletedTasks.length === 0) {
    groupedTasks = [];
    timeGroupedTasks = [];
    ungroupedTasks = [];
    return {
      groupMode,
      groupedTasks,
      timeGroupedTasks,
      ungroupedTasks,
    };
  }
  // 获取当前清单的所有分组
  const groups = getGroupsByListId(activeListId);
  // 是否为普通清单
  if (groupMode === "normal") {
    // // 如果是普通清单，没有分组，赋值到未分组
    if (groups.length === 0) {
      ungroupedTasks = unCompletedTasks;
      // 提前返回
      return {
        groupMode,
        groupedTasks,
        timeGroupedTasks,
        ungroupedTasks,
      };
    }
    // 普通清单，有分组，按分组
    // 分离已分组和未分组的任务
    const grouped: { [key: string]: Todo[] } = {};
    let ungrouped: Todo[] = [];

    // 初始化分组
    groups.forEach((group) => {
      grouped[group.groupName] = [];
    });

    // 将任务分配到对应的分组
    unCompletedTasks.forEach((task) => {
      if (task.groupId) {
        // 找到任务所属的分组
        const taskGroup = groups.find((group) => group.id === task.groupId);
        if (taskGroup && grouped[taskGroup.groupName]) {
          grouped[taskGroup.groupName].push(task);
        } else {
          ungrouped.push(task);
        }
      } else {
        ungrouped.push(task);
      }
    });

    // 转换为数组格式
    groupedTasks = Object.keys(grouped).map((name) => {
      // 查找原始分组对象以获取id
      const originalGroup = groups.find((group) => group.groupName === name);
      return {
        id:
          originalGroup?.id ||
          `${activeListId}_${name.toLowerCase().replace(/\s+/g, "_")}`,
        listId: activeListId,
        groupName: name,
        tasks: grouped[name],
      };
    });

    ungroupedTasks = ungrouped;
  } else {
    // 计算时间分组
    const timeGrouped: { [key: string]: Todo[] } = {};
    const tasksWithDeadline = unCompletedTasks.filter(
      (task) => task.deadline && task.parentId === null,
    );

    tasksWithDeadline.forEach((task) => {
      const date = dayjs(task.deadline).format("YYYY-MM-DD");
      if (!timeGrouped[date]) {
        timeGrouped[date] = [];
      }
      timeGrouped[date].push(task);
    });

    // 转换为时间分组数组

    timeGroupedTasks = Object.keys(timeGrouped)
      .map((date) => ({
        date: date,
        tasks: timeGrouped[date],
      }))
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
  }

  return {
    groupMode,
    groupedTasks,
    timeGroupedTasks,
    ungroupedTasks,
  };
}
