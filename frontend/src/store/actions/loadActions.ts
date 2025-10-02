import { getAllTodos } from "@/services/todoService";
import type { TodoState } from "../types";
import { getAllTags } from "@/services/tagService";
import { getAllGroups } from "@/services/groupService";
import { getBinItems } from "@/services/binService";
import { getAllTodoLists } from "@/services/listService";
import { getListPinnedTodos } from "@/services/todoService";

export const loadActions = {
  // 加载所有数据
  loadDataAll: async (set: any, get: () => TodoState): Promise<void> => {
    try {
      const authState =
        get().userId ||
        (await import("@/store/authStore")).useAuthStore.getState().userId;

      if (!authState) {
        console.warn("用户未登录，无法加载数据");
        return;
      }

      // 并行加载所有数据
      const [todos, lists, tags, groups, binItems] = await Promise.all([
        getAllTodos(),
        getAllTodoLists(),
        getAllTags(),
        getAllGroups(),
        getBinItems(),
      ]);

      // 更新本地状态
      set({
        tasks: todos || [],
        todoListData: lists || [],
        todoTags: tags || [],
        groups: groups || [],
        bin: binItems || [],
        userId: authState,
      });

      // 如果没有激活的列表，设置第一个列表为激活状态
      let currentActiveListId = get().activeListId;
      if (!currentActiveListId && lists && lists.length > 0) {
        currentActiveListId = lists[0].id;
        set({ activeListId: currentActiveListId });
      }

      // 检查激活的列表ID是否包含"todolist-"，如果是则加载该列表的置顶任务
      if (currentActiveListId && currentActiveListId.includes("todolist-")) {
        try {
          const pinnedTasks = await getListPinnedTodos(currentActiveListId);
          set({ pinnedTasks });
        } catch (error) {
          console.error(`加载清单 ${currentActiveListId} 的置顶任务失败:`, error);
          // 设置为空数组而不是保持可能的旧数据
          set({ pinnedTasks: [] });
        }
      } else {
        // 如果不是有效的待办清单ID，清空置顶任务
        set({ pinnedTasks: [] });
      }
    } catch (error) {
      console.error("加载数据失败:", error);
      throw error;
    }
  },

  // 加载所有标签数据并更新到state
  loadTags: async (set: any, get: () => TodoState): Promise<void> => {
    try {
      const authState =
        get().userId ||
        (await import("@/store/authStore")).useAuthStore.getState().userId;

      if (!authState) {
        console.warn("用户未登录，无法加载标签数据");
        return;
      }

      // 调用getAllTags获取所有标签
      const tags = await getAllTags();

      // 更新本地标签状态
      set({
        todoTags: tags || [],
      });

      console.log("标签数据加载成功");
    } catch (error) {
      console.error("加载标签数据失败:", error);
      throw error;
    }
  },
  
  // 加载所有任务数据并更新到state
  loadTodos: async (set: any, get: () => TodoState): Promise<void> => {
    try {
      const authState =
        get().userId ||
        (await import("@/store/authStore")).useAuthStore.getState().userId;

      if (!authState) {
        console.warn("用户未登录，无法加载任务数据");
        return;
      }

      // 调用getAllTodos获取所有任务
      const todos = await getAllTodos();

      // 更新本地任务状态
      set({
        tasks: todos || [],
      });

      console.log("任务数据加载成功");
    } catch (error) {
      console.error("加载任务数据失败:", error);
      throw error;
    }
  },

  // 加载所有待办清单数据并更新到state
  loadTodoLists: async (set: any, get: () => TodoState): Promise<void> => {
    try {
      const authState =
        get().userId ||
        (await import("@/store/authStore")).useAuthStore.getState().userId;

      if (!authState) {
        console.warn("用户未登录，无法加载待办清单数据");
        return;
      }

      // 调用getAllTodoLists获取所有待办清单
      const lists = await getAllTodoLists();

      // 更新本地待办清单状态
      set({
        todoListData: lists || [],
      });

      // 如果没有激活的列表，设置第一个列表为激活状态
      let currentActiveListId = get().activeListId;
      if (!currentActiveListId && lists && lists.length > 0) {
        currentActiveListId = lists[0].id;
        set({ activeListId: currentActiveListId });
        
        // 加载该列表的置顶任务
        try {
          const pinnedTasks = await getListPinnedTodos(currentActiveListId);
          set({ pinnedTasks });
        } catch (error) {
          console.error(`加载清单 ${currentActiveListId} 的置顶任务失败:`, error);
          set({ pinnedTasks: [] });
        }
      }

      console.log("待办清单数据加载成功");
    } catch (error) {
      console.error("加载待办清单数据失败:", error);
      throw error;
    }
  },

  // 加载所有分组数据并更新到state
  loadGroups: async (set: any, get: () => TodoState): Promise<void> => {
    try {
      const authState =
        get().userId ||
        (await import("@/store/authStore")).useAuthStore.getState().userId;

      if (!authState) {
        console.warn("用户未登录，无法加载分组数据");
        return;
      }

      // 调用getAllGroups获取所有分组
      const groups = await getAllGroups();

      // 更新本地分组状态
      set({
        groups: groups || [],
      });

      console.log("分组数据加载成功");
    } catch (error) {
      console.error("加载分组数据失败:", error);
      throw error;
    }
  },

  // 加载所有回收站数据并更新到state
  loadBinItems: async (set: any, get: () => TodoState): Promise<void> => {
    try {
      const authState =
        get().userId ||
        (await import("@/store/authStore")).useAuthStore.getState().userId;

      if (!authState) {
        console.warn("用户未登录，无法加载回收站数据");
        return;
      }

      // 调用getBinItems获取所有回收站项目
      const binItems = await getBinItems();

      // 更新本地回收站状态
      set({
        bin: binItems || [],
      });

      console.log("回收站数据加载成功");
    } catch (error) {
      console.error("加载回收站数据失败:", error);
      throw error;
    }
  },
  
  // 加载置顶任务数据并更新到state
  loadPinnedTasks: async (set: any, get: () => TodoState, listId?: string): Promise<void> => {
    try {
      const authState =
        get().userId ||
        (await import("@/store/authStore")).useAuthStore.getState().userId;

      if (!authState) {
        console.warn("用户未登录，无法加载置顶任务数据");
        return;
      }

      // 如果没有提供listId，则使用当前激活的列表ID
      const targetListId = listId || get().activeListId;
      
      if (!targetListId || !targetListId.includes("todolist-")) {
        console.warn("无效的列表ID，无法加载置顶任务");
        set({ pinnedTasks: [] });
        return;
      }

      // 调用getListPinnedTodos获取置顶任务
      const pinnedTasks = await getListPinnedTodos(targetListId);

      // 更新本地置顶任务状态
      set({
        pinnedTasks: pinnedTasks || [],
      });

      console.log(`清单 ${targetListId} 的置顶任务加载成功`);
    } catch (error) {
      console.error("加载置顶任务数据失败:", error);
      // 设置为空数组而不是保持可能的旧数据
      set({ pinnedTasks: [] });
      throw error;
    }
  },
};
