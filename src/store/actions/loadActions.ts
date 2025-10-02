import { getAllTodos } from "@/services/todoService";
import type { TodoState } from "../types";
import { getAllTags } from "@/services/tagService";
import { getAllGroups } from "@/services/groupService";
import { getBinItems } from "@/services/binService";
import { getAllTodoLists } from "@/services/listService";

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
      if (!get().activeListId && lists && lists.length > 0) {
        set({ activeListId: lists[0].id });
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
};
