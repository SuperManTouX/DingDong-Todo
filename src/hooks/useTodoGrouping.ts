import { useEffect } from "react";
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
  let groupedTasks: (Group & { tasks: Todo[] })[] = [];
  let timeGroupedTasks: TimeGroup[] = [];
  let ungroupedTasks: Todo[] = [];

  // 当任务或当前激活列表变化时，重新计算分组
  // useEffect(() => {
  if (!tasks || tasks.length === 0) {
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
      ungroupedTasks = tasks;
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
    const taskIdsInGroups = new Set<string>();
    // 初始化分组
    groups.forEach((group) => {
      grouped[group.groupName] = [];
      group.groupItemIds.forEach((id) => taskIdsInGroups.add(id));
    });

    // 将任务分配到对应的分组
    tasks.forEach((task) => {
      if (taskIdsInGroups.has(task.id)) {
        // 找到任务所属的分组
        const taskGroup = groups.find((group) =>
          group.groupItemIds.includes(task.id),
        );
        if (taskGroup) {
          grouped[taskGroup.groupName].push(task);
        }
      } else {
        ungrouped.push(task);
      }
    });

    // 转换为数组格式

    groupedTasks = Object.keys(grouped).map((name) => ({
      listId: activeListId,
      groupName: name,
      groupItemIds: grouped[name].map((task) => task.id),
      tasks: grouped[name],
    }));

    ungroupedTasks = ungrouped;
  } else {
    // 计算时间分组
    const timeGrouped: { [key: string]: Todo[] } = {};
    const tasksWithDeadline = tasks.filter((task) => task.deadline);

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
  // }, [tasks, getGroupsByListId]);
  console.log(ungroupedTasks);

  return {
    groupMode,
    groupedTasks,
    timeGroupedTasks,
    ungroupedTasks,
  };
}
