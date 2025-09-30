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
  groupMode: "normal" | "time" | "none" | "list";
  displayGroups: DisplayGroup[];
  allTasks: Todo[];
  uncompletedCount: number;
}

// 任务分组相关的hook
export default function useTodoGrouping(
  tasks: Todo[],
  searchText: string,
): UseTodoGroupingReturn {
  const { getGroupsByListId, todoListData } = useTodoStore();

  const { activeListId } = useTodoStore.getState();
  const searchTasks = tasks.filter(
    (task) => task.title.indexOf(searchText) !== -1,
  );
  // 根据activeListId确定分组模式和过滤逻辑
  let groupMode: "normal" | "time" | "list" = "normal";
  let filteredTasks = [...searchTasks];

  let isCompletedMode = false;

  // 特殊activeListId处理
  if (activeListId.indexOf("tag") !== -1) {
    // 当激活的列表ID包含"tag"时，按不同list分组
    groupMode = "normal";
    // 保持所有任务，不需要特殊过滤
    filteredTasks = [...searchTasks];
  } else if (activeListId === "today") {
    // 只显示今天的任务
    groupMode = "time";
    const today = dayjs().format("YYYY-MM-DD");
    filteredTasks = searchTasks.filter(
      (task) =>
        task.deadline && dayjs(task.deadline).format("YYYY-MM-DD") === today,
    );
  } else if (activeListId === "nearlyWeek") {
    // 只显示最近七天的任务
    groupMode = "time";
    const today = dayjs();
    const sevenDaysFromNow = dayjs().add(7, "day");
    filteredTasks = searchTasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = dayjs(task.deadline);
      return (
        taskDate.isValid() &&
        (taskDate.isSame(today, "day") ||
          (taskDate.isAfter(today) &&
            taskDate.isBefore(sevenDaysFromNow, "day")))
      );
    });
  } else if (activeListId === "cp") {
    // 只显示已完成的任务
    groupMode = "time"; // 已完成任务也使用时间分组模式
    filteredTasks = [];
    isCompletedMode = true;
  } else if (activeListId in SpecialLists) {
    // 其他特殊列表保持原有的时间分组模式
    groupMode = "time";
  }

  // 在已完成模式下，显示所有已完成任务；否则只显示未完成任务
  const displayTasks = isCompletedMode
    ? filteredTasks
    : filteredTasks.filter((task) => !task.completed);
  const displayGroups: DisplayGroup[] = [];

  // 当任务或当前激活列表变化时，重新计算分组
  if (!displayTasks || displayTasks.length === 0) {
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
    if (activeListId.indexOf("tag") !== -1) {
      // 当激活的列表ID包含"tag"时，按不同list分组
      const listGrouped: { [key: string]: Todo[] } = {};

      // 初始化分组并按listId分组任务
      displayTasks.forEach((task) => {
        const listId = task.listId || "未分类";
        if (!listGrouped[listId]) {
          listGrouped[listId] = [];
        }
        listGrouped[listId].push(task);
      });

      // 转换为统一的显示分组格式
      Object.keys(listGrouped).forEach((listId) => {
        // 查找listId对应的标题，如果找不到则使用listId
        const listTitle =
          listId === "未分类"
            ? "未分类"
            : todoListData.find((list) => list.id === listId)?.title || listId;

        displayGroups.push({
          id: `list_${listId}`,
          title: listTitle,
          tasks: listGrouped[listId],
          type: "group",
        });
      });
    } else if (groups.length === 0) {
      // 没有分组，所有任务都放入未分组
      displayGroups.push({
        title: "未分组",
        tasks: displayTasks,
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
      displayTasks.forEach((task) => {
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
    // 预定义的特殊时间分组
    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
    const sevenDaysFromNow = dayjs().add(7, "day");

    // 初始化分组对象
    const timeGrouped: { [key: string]: Todo[] } = {
      今天: [],
      明天: [],
      最近七天: [],
      之后: [],
    };

    // 构建任务ID集合，用于快速检查父任务是否存在
    // 筛选任务：包含有截止日期的顶层任务和找不到父组件的子任务
    const tasksWithDeadlineTop = displayTasks.filter((task) => {
      return activeListId === "bin"
        ? displayTasks.some((taskI) => {
            return task.id === taskI.parentId;
          })
        : task.deadline;
    });

    // 分配时间分组
    displayTasks.forEach((taskO) => {
      const taskDate = dayjs(taskO.deadline);
      if (!taskDate.isValid()) return;

      const date = taskDate.format("YYYY-MM-DD");
      const parentT = tasksWithDeadlineTop.find((taskI) => {
        return taskO.parentId === taskI.id;
      });

      // 确定任务应该属于哪个时间分组
      let targetGroup = "之后";

      if (date === today) {
        targetGroup = "今天";
      } else if (date === tomorrow) {
        targetGroup = "明天";
      } else if (
        taskDate.isAfter(dayjs()) &&
        taskDate.isBefore(sevenDaysFromNow, "day")
      ) {
        targetGroup = "最近七天";
      }

      if (parentT && parentT.deadline) {
        // 如果有父任务且父任务有截止日期，使用父任务的截止日期来确定分组
        const parentDate = dayjs(parentT.deadline);
        if (!parentDate.isValid()) return;

        if (parentDate.format("YYYY-MM-DD") === today) {
          targetGroup = "今天";
        } else if (parentDate.format("YYYY-MM-DD") === tomorrow) {
          targetGroup = "明天";
        } else if (
          parentDate.isAfter(dayjs()) &&
          parentDate.isBefore(sevenDaysFromNow, "day")
        ) {
          targetGroup = "最近七天";
        }
      }

      // 将任务添加到相应的分组
      timeGrouped[targetGroup].push(taskO);
    });

    // 转换为统一的显示分组格式，只添加有任务的分组
    const groupOrder = ["今天", "明天", "最近七天", "之后"];
    groupOrder.forEach((groupName) => {
      if (timeGrouped[groupName].length > 0) {
        displayGroups.push({
          title: groupName,
          tasks: timeGrouped[groupName],
          type: "time",
        });
      }
    });

    // 添加未设置截止日期的任务
    const tasksWithoutDeadline = displayTasks.filter((task) => !task.deadline);
    if (tasksWithoutDeadline.length > 0) {
      displayGroups.push({
        title: "未设置截止日期",
        tasks: tasksWithoutDeadline,
        type: "ungrouped",
      });
    }
  }

  // 计算displayGroups中的任务总数
  const displayTasksCount = displayGroups.reduce((total, group) => {
    // 过滤掉占位任务
    const validTasks = group.tasks.filter(task => task.id !== '' || task.title !== '占位Todo');
    return total + validTasks.length;
  }, 0);

  return {
    groupMode,
    displayGroups,
    uncompletedCount: displayTasksCount,
    allTasks: displayTasks,
  };
}
