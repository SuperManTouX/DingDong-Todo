import { produce } from "immer";
import type { Group, TodoState } from "../types";
import {
  createGroup,
  deleteGroup as deleteGroupApi,
  updateGroup as updateGroupApi,
} from "@/services/groupService";

export const groupActions = {
  addGroup: async (
    listId: string,
    groupName: string,
    groupItemIds: string[],
    set: any,
    get: () => TodoState,
  ): Promise<void> => {
    try {
      // 准备新分组数据
      const groupData = {
        listId,
        groupName,
        userId: get().userId,
      };

      // 调用后端API创建分组
      const newGroup = await createGroup(groupData);

      // 更新本地状态
      set(
        produce((draftState: TodoState) => {
          draftState.groups.push(newGroup);

          // 更新任务的groupId
          if (groupItemIds && groupItemIds.length > 0) {
            draftState.tasks.forEach((task: any) => {
              if (groupItemIds.includes(task.id)) {
                task.groupId = newGroup.id;
                task.updatedAt = new Date().toISOString();
              }
            });
          }
        }),
      );
    } catch (error) {
      console.error("添加分组失败:", error);
      throw error;
    }
  },

  updateGroup: async (nGroup: Group, set: any): Promise<void> => {
    try {
      // 调用后端API更新分组
      await updateGroupApi(nGroup.id, nGroup);
      // 更新本地状态
      set(
        produce((draftState: TodoState) => {
          const groupIndex = draftState.groups.findIndex(
            (group: any) => group.id === nGroup.id,
          );
          if (groupIndex !== -1) {
            draftState.groups[groupIndex] = nGroup;
          }
        }),
      );
    } catch (error) {
      console.error("更新分组失败:", error);
      throw error;
    }
  },

  deleteGroup: async (
    listId: string,
    groupName: string,
    set: any,
    get: () => TodoState,
  ): Promise<void> => {
    try {
      // 查找要删除的分组

      const group: Group = get().groups.find(
        (g: any) => g.id === listId && g.groupName === groupName,
      );

      if (!group) return;

      // 调用后端API删除分组
      await deleteGroupApi(group.id);

      // 更新本地状态
      set(
        produce((draftState: TodoState) => {
          // 删除分组
          draftState.groups = draftState.groups.filter(
            (g: any) => g.id !== group.id,
          );

          // 清除相关任务的groupId
          draftState.tasks = draftState.tasks.map((task: any) => {
            if (task.groupId === group.id) {
              return {
                ...task,
                groupId: undefined,
                updatedAt: new Date().toISOString(),
              };
            }
            return task;
          });
        }),
      );
    } catch (error) {
      console.error("删除分组失败:", error);
      throw error;
    }
  },

  getGroupsByListId: (listId: string, get: () => TodoState): Group[] => {
    return get().groups.filter((group: any) => group.listId === listId);
  },
};
