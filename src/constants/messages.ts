// src/constants/messages.ts
export const MESSAGES = {
  // 成功消息
  SUCCESS: {
    LIST_ADDED: "清单添加成功",
    LIST_UPDATED: "清单更新成功",
    LIST_DELETED: "清单已删除",
    TAG_DELETED: "标签已删除",
    TAG_ADDED: "标签添加成功",
    TAG_UPDATED: "标签更新成功",
    TASK_DELETED: "删除成功",
    TASK_RESTORED: "恢复完成",
    TASK_PINNED: "置顶完成",
    TASK_PERMANENTLY_DELETED: "删除完成",
    USER_LOGGED_OUT: "用户已成功注销",
  },

  // 信息消息
  INFO: {
    TIME_UPDATED: "时间更改成功",
    TAG_ALREADY_ADDED: "该标签已添加",
    TAG_ADDED_TO_TASK: "已添加标签: {tagName}",
    TASK_COMPLETED: "已完成",
    TAGS_UPDATED: "该标签已更新",
    TAG_REMOVED_FROM_TASK: "已移除标签: {tagName}",
    ALL_COMPLETED: "已完成全部",
    DELETE_CANCELLED: "已取消删除",
    TAG_UPDATED: "标签更新成功",
    DEADLINE_UPDATED: "日期更新成功",
  },

  // 警告消息
  WARNING: {
    EMPTY_LIST_NAME: "清单名称不能为空",
    EMPTY_TAG_NAME: "标签名称不能为空",
    SUBTASK_NOT_AVAILABLE: "添加子任务功能不可用",
    LOGOUT_FAILED: "注销失败，请重试",
  },

  // 错误消息
  ERROR: {
    OPERATION_FAILED: "操作失败，请重试",
  },
};

// 消息格式化工具函数
export const formatMessage = (
  template: string,
  replacements: Record<string, string>,
) => {
  let message = template;
  Object.keys(replacements).forEach((key) => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    message = message.replace(regex, replacements[key]);
  });
  return message;
};
