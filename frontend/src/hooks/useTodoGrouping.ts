import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/types";
import dayjs from "dayjs";
import { SpecialLists } from "@/constants";

// 定义统一的分组显示结构
interface DisplayGroup {
  id?: string;
  title: string;
  tasks: Todo[];
  type: "group" | "time" | "ungrouped";
}

// 定义hook返回类型
interface UseTodoGroupingReturn {
  groupMode: "normal" | "time" | "none";
  displayGroups: DisplayGroup[];
  allTasks: Todo[];
}

// 任务分组相关的hook
export default function useTodoGrouping(tasks: Todo[]): UseTodoGroupingReturn {
  const { getGroupsByListId } = useTodoStore();

  const { activeListId } = useTodoStore.getState();
  const groupMode: "normal" | "time" =
    activeListId in SpecialLists ? "time" : "normal";
  const unCompletedTasks = tasks.filter((task) => !task.completed);
  const displayGroups: DisplayGroup[] = [];

  // 当任务或当前激活列表变化时，重新计算分组
  if (!unCompletedTasks || unCompletedTasks.length === 0) {
    return {
      groupMode,
      displayGroups,
      allTasks: [],
    };
  }

  // 获取当前清单的所有分组
  const groups = getGroupsByListId(activeListId);

  if (groupMode === "normal") {
    // 普通清单模式
    if (groups.length === 0) {
      // 没有分组，所有任务都放入未分组
      displayGroups.push({
        title: "未分组",
        tasks: unCompletedTasks,
        type: "ungrouped",
      });
    } else {
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

      // 转换为统一的显示分组格式
      Object.keys(grouped).forEach((name) => {
        const originalGroup = groups.find((group) => group.groupName === name);
        if (grouped[name].length == 0) {
          const todoExample: Todo = {
            id: "",
            title: "占位Todo",
            text: "占位Todo",
            completed: false,
            priority: 1,
            deadline: undefined,
            parentId: null,
            depth: 0,
            tags: [],
            listId: "",
            groupId: originalGroup?.id,
            userId: "",
          };
          grouped[name].push(todoExample);
        }
        displayGroups.push({
          id:
            originalGroup?.id ||
            `${activeListId}_${name.toLowerCase().replace(/\s+/g, "_")}`,
          title: name,
          tasks: grouped[name],
          type: "group",
        });
      });

      // 添加未分组任务
      if (ungrouped.length > 0) {
        displayGroups.push({
          title: "未分组",
          tasks: ungrouped,
          type: "ungrouped",
        });
      }
    }
  } else {
    // 时间分组模式
    const timeGrouped: { [key: string]: Todo[] } = {};

    // 构建任务ID集合，用于快速检查父任务是否存在
    // 筛选任务：包含有截止日期的顶层任务和找不到父组件的子任务
    const tasksWithDeadlineTop = unCompletedTasks.filter((task) => {
      return activeListId === "bin"
        ? unCompletedTasks.some((taskI) => {
            return task.id === taskI.parentId;
          })
        : task.deadline;
    });
    // 分配时间分组
    unCompletedTasks.forEach((taskO) => {
      const date = dayjs(taskO.deadline).format("YYYY-MM-DD");

      const parentT = tasksWithDeadlineTop.find((taskI) => {
        return taskO.parentId === taskI.id;
      });
      if (parentT && parentT.deadline) {
        // 确保父任务有截止日期
        const parentDate = dayjs(parentT.deadline).format("YYYY-MM-DD");
        // 确保时间分组数组已初始化
        if (!timeGrouped[parentDate]) {
          timeGrouped[parentDate] = [];
        }
        timeGrouped[parentDate].push(taskO);
      } else {
        // 如果父任务不存在或没有截止日期，则使用任务自身的截止日期
        if (!timeGrouped[date]) {
          timeGrouped[date] = [];
        }
        timeGrouped[date].push(taskO);
      }
    });

    // 转换为统一的显示分组格式并排序
    Object.keys(timeGrouped)
      .sort((a, b) => dayjs(a).diff(dayjs(b)))
      .forEach((date) => {
        displayGroups.push({
          title: date,
          tasks: timeGrouped[date],
          type: "time",
        });
      });

    // 添加未设置截止日期的任务
    const tasksWithoutDeadline = unCompletedTasks.filter(
      (task) => !task.deadline,
    );
    if (tasksWithoutDeadline.length > 0) {
      displayGroups.push({
        title: "未设置截止日期",
        tasks: tasksWithoutDeadline,
        type: "ungrouped",
      });
    }
  }

  return {
    groupMode,
    displayGroups,
    allTasks: unCompletedTasks,
  };
}
