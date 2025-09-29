import { useEffect } from "react";
import { useTodoStore } from "@/store/todoStore";
import { useAuthStore } from "@/store/authStore";

/**
 * 用于检测并加载初始状态下的待办数据
 * 当检测到todoListData为空或只有fallback数据且用户已登录时，自动加载数据
 */
export const useTodoDataLoader = () => {
  const todoStoreState = useTodoStore.getState();
  const { loadDataAll } = useTodoStore();

  useEffect(() => {
    // 检查数据是否为初始化状态的条件
    const isInitialState =
      // 检查todoListData是否为空或只有fallback数据
      (todoStoreState.todoListData.length === 0 ||
        (todoStoreState.todoListData.length === 1 &&
          todoStoreState.todoListData[0].id === "fallback_list")) &&
      // 检查用户是否已登录
      useAuthStore.getState().isAuthenticated;

    if (isInitialState) {
      console.log("检测到初始状态，加载数据...");
      loadDataAll();
    }
  }, [loadDataAll]);
};
