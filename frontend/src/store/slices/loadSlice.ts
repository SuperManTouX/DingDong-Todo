import { getAllTodos, getAllTodoLists, getAllTags, getAllGroups, getBinItems } from "@/services/todoService";
import type { TodoState } from "../types";

export const loadActions = {
  // 加载所有数据
  loadData: async (
    set: any,
    get: any
  ): Promise<void> => {
    try {
      const authState = get().userId || (await import("@/store/authStore")).useAuthStore.getState().userId;
      
      if (!authState) {
        console.warn("用户未登录，无法加载数据");
        return;
      }
      
      // 并行加载所有数据
      const [todos, lists, tags, groups, binItems] = await Promise.all([
        getAllTodos(authState),
        getAllTodoLists(authState),
        getAllTags(authState),
        getAllGroups(authState),
        getBinItems(authState)
      ]);
      
      // 更新本地状态
      set({
        tasks: todos || [],
        todoListData: lists || [],
        todoTags: tags || [],
        groups: groups || [],
        bin: binItems || [],
        userId: authState
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
};