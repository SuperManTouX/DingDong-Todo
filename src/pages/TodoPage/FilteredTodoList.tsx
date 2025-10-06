import { Typography, Button, Space, Col, Row, Dropdown, Layout } from "antd";
import React, { memo, useCallback, useMemo } from "react";
import type { Task } from "@dnd-kit/sortable-tree";
import { SortableTree, SimpleTreeItemWrapper } from "dnd-kit-sortable-tree";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import useTodoOperations from "../../hooks/useTodoOperations";
import useTodoGrouping from "../../hooks/useTodoGrouping";
import { useGlobalSettingsStore } from "../../store/globalSettingsStore";
import { useTodoStore, getActiveListTasks } from "../../store/todoStore";
import Controller from "./Controller";
import FilterGroup from "./FilterGroup";
import ContextMenu from "../../components/ContextMenu";
import TodoTask from "./TodoTask";
import type { Todo } from "../../types/Todo";
import { ItemChangedReason } from "dnd-kit-sortable-tree/dist/types";
import App from "@/Test";

const { Header, Content, Footer } = Layout;

// 将TreeItemComponent移到外部，避免每次父组件渲染都创建新的函数引用
const TreeItemComponent = memo(
  React.forwardRef((props: any, ref: React.Ref<any>) => {
    const todo = props.item.data as Todo;
    return (
      <SimpleTreeItemWrapper {...props} ref={ref}>
        <ContextMenu key={todo.id} todo={todo}>
          <div style={{ cursor: "context-menu", width: "100%" }}>
            <TodoTask
              todo={todo}
              hasSubTasks={props.item.children?.length > 0}
              isExpanded={props.item.collapsed !== true}
              onToggleExpand={() => {}}
            />
          </div>
        </ContextMenu>
      </SimpleTreeItemWrapper>
    );
  }),
  // 添加自定义比较函数，只在必要时重新渲染
  (prevProps, nextProps) => {
    // 只有当item数据发生变化时才重新渲染
    const prevTodo = prevProps.item.data;
    const nextTodo = nextProps.item.data;
    // 基本比较：id相同且内容未变时，认为组件不需要重新渲染
    if (prevTodo.id === nextTodo.id) {
      // 可以根据实际需求扩展比较字段
      console.log(
        prevTodo.title === nextTodo.title &&
          prevTodo.completed === nextTodo.completed &&
          prevTodo.priority === nextTodo.priority &&
          prevTodo.dueTime === nextTodo.dueTime &&
          prevTodo.parentId === nextTodo.parentId &&
          prevTodo.depth === nextTodo.depth,
      );
      // return true;
    }
    return false;
  },
);
export default function FilteredTodoList({
  groupName,
  toggleCollapsed,
  collapsed,
}: {
  groupName: string;
  toggleCollapsed: () => void;
  collapsed: boolean;
}) {
  // 获取所有任务，然后根据用户ID过滤
  const tasks = getActiveListTasks();
  const { pinnedTasks, activeListId, dispatchTodo } = useTodoStore();
  // 获取全局设置和操作方法
  const {
    showTaskDetails,
    toggleShowTaskDetails,
    toggleHideCompletedTasks,
    hideCompletedTasks,
  } = useGlobalSettingsStore();

  // 下拉菜单配置
  const menuProps = {
    items: [
      {
        key: "detail",
        label: showTaskDetails ? "隐藏详情" : "显示详情",
      },
      {
        key: "hideCompleted",
        label: "隐藏已完成",
      },
      {
        key: "view",
        label: "视图",
        disabled: true,
      },
    ],
    onClick: (e: any) => {
      switch (e.key) {
        case "detail":
          toggleShowTaskDetails();
          break;
        case "hideCompleted":
          toggleHideCompletedTasks();
          break;
        default:
          break;
      }
    },
  };

  // 使用hooks获取各种功能
  const { groupMode, displayGroups, displayUncompletedCount } =
    useTodoGrouping(tasks);
  const {
    handleAdded,
    handleCompleteAll,
    handleDeleteAllCompleted,
    renderTodos,
    renderOtherTodos,
    isAllDone,
  } = useTodoOperations(tasks);

  // 将Todo对象转换为dnd-kit-sortable-tree的Task对象
  const convertToTreeTasks = useCallback((todos: Todo[]): Task[] => {
    // 创建ID到任务的映射，用于快速查找父任务
    const taskMap = new Map<string, Task>();

    // 递归创建任务树
    const createTask = (todo: Todo): Task => {
      const task: Task = {
        id: todo.id,
        data: todo,
        children: [],
        collapsed: false, // 默认展开
      };
      taskMap.set(todo.id, task);
      return task;
    };

    // 首先创建所有顶级任务（没有parentId的任务）
    const topLevelTasks: Task[] = [];

    todos.forEach((todo) => {
      if (!todo.parentId) {
        topLevelTasks.push(createTask(todo));
      }
    });

    // 然后为每个任务添加子任务
    todos.forEach((todo) => {
      if (todo.parentId && !taskMap.has(todo.id)) {
        createTask(todo); // 确保所有任务都被创建
      }
    });

    // 建立父子关系
    todos.forEach((todo) => {
      if (todo.parentId && taskMap.has(todo.id) && taskMap.has(todo.parentId)) {
        const task = taskMap.get(todo.id)!;
        const parentTask = taskMap.get(todo.parentId)!;
        parentTask.children.push(task);
      }
    });

    return topLevelTasks;
  }, []);

  // 创建防抖函数
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // 批量更新函数，减少dispatch次数
  const batchUpdateTasks = useCallback(
    (
      updates: {
        id: string;
        parentId: string | null;
        depth: number;
        collapsed?: boolean;
      }[],
    ) => {
      if (updates.length === 0) return;

      // 可以考虑添加一个批量更新的action类型
      updates.forEach((update) => {
        const task = tasks.find((t) => t.id === update.id);
        if (task) {
          const updateTodo = {
            ...task,
            parentId: update.parentId,
            depth: update.depth,
          };

          // 如果提供了collapsed字段，则更新它
          if (update.collapsed !== undefined) {
            updateTodo.collapsed = update.collapsed;
          }

          dispatchTodo({
            type: "changed",
            todo: updateTodo,
          });
        }
      });
    },
    [tasks, dispatchTodo],
  );

  // 防抖的批量更新函数
  const debouncedBatchUpdate = useCallback(debounce(batchUpdateTasks, 100), [
    batchUpdateTasks,
  ]);

  // 处理树项目变化
  const handleTreeItemsChanged = useCallback(
    (items: Task[]) => {
      // 直接更新树结构，这是最简单且有效的方法
      // 在dnd-kit-sortable-tree中，应该使用传入的items参数来更新树状态

      // 对于这个实现，我们不需要处理具体的reason类型
      // 因为库已经在内部处理了折叠/展开状态的切换
      // 我们只需要确保树结构被正确更新

      // 优化后的递归更新逻辑，收集所有需要更新的任务
      const collectTasksToUpdate = (
        tasks: Task[],
        parentId: string | null,
        depth: number,
        updates: {
          id: string;
          parentId: string | null;
          depth: number;
          collapsed?: boolean;
        }[],
      ) => {
        tasks.forEach((task) => {
          const todo = task.data as Todo;

          // 收集需要更新的任务信息，包括parentId、depth和collapsed状态
          const update: {
            id: string;
            parentId: string | null;
            depth: number;
            collapsed?: boolean;
          } = {
            id: todo.id,
            parentId,
            depth,
          };

          // 如果task有collapsed属性且与todo的collapsed属性不同，也需要更新
          if (
            task.collapsed !== undefined &&
            task.collapsed !== todo.collapsed
          ) {
            update.collapsed = task.collapsed;
          }

          // 只收集真正需要更新的任务
          if (
            todo.parentId !== parentId ||
            (todo.depth !== undefined && todo.depth !== depth) ||
            update.collapsed !== undefined
          ) {
            updates.push(update);
          }

          // 递归处理子任务
          if (task.children && task.children.length > 0) {
            collectTasksToUpdate(task.children, task.id, depth + 1, updates);
          }
        });
      };

      // 收集需要更新的任务
      const tasksToUpdate: {
        id: string;
        parentId: string | null;
        depth: number;
        collapsed?: boolean;
      }[] = [];
      collectTasksToUpdate(items, null, 0, tasksToUpdate);

      // 使用防抖的批量更新，减少状态更新和重渲染
      debouncedBatchUpdate(tasksToUpdate);
    },
    [debouncedBatchUpdate],
  );

  // 获取要渲染的任务列表
  const todoList = renderTodos();
  const otherTodosList = renderOtherTodos();
  return (
    <>
      {/*标题栏*/}
      <Header
        style={{ backgroundColor: "var(--theme--colorBgLayout)" }}
        className="pt-1 pb-1 border-0 pe-2 ps-2"
      >
        <Row className={"h-100"} align={"middle"} justify="space-between">
          <Col>
            <Button type="text" onClick={toggleCollapsed}>
              {collapsed ? (
                <MenuUnfoldOutlined style={{ cursor: "pointer" }} />
              ) : (
                <MenuFoldOutlined style={{ cursor: "pointer" }} />
              )}
            </Button>
            <Typography.Title level={4} className={"h-100 d-inline-block m-0"}>
              {groupName}
            </Typography.Title>
          </Col>
          <Col>
            <Space>
              <Dropdown menu={menuProps} trigger={["click"]}>
                <EllipsisOutlined
                  style={{ cursor: "pointer", fontSize: "18px" }}
                />
              </Dropdown>
            </Space>
          </Col>
        </Row>
      </Header>

      {/*主内容区*/}
      <Content className="overflow-y-scroll minHeight-large pe-2 ps-2 custom-scrollbar">
        <div className="col p-2 pt-0">
          <Space className="w-100" direction="vertical" size="small">
            {/*顶部控制器组件*/}
            {!(activeListId === "bin" || activeListId === "cp") && (
              <Controller
                isAllDone={isAllDone}
                onCompleteAll={handleCompleteAll}
                onAdded={handleAdded}
                groupMode={groupMode}
              />
            )}

            {/*已置顶分组 - 直接渲染置顶任务列表*/}
            {pinnedTasks.length > 0 && (
              <FilterGroup
                key={"pinned"}
                title={"⭐已置顶"}
                tasks={pinnedTasks}
              >
                <div className="task-group">
                  <SortableTree
                    items={convertToTreeTasks(pinnedTasks)}
                    onItemsChanged={handleTreeItemsChanged}
                    TreeItemComponent={TreeItemComponent}
                  />
                </div>
              </FilterGroup>
            )}

            {/*普通渲染模式 - 使用SortableTree*/}
            {groupMode === "none" && todoList.length > 0 && (
              <div className="task-group">
                <SortableTree
                  items={convertToTreeTasks(todoList)}
                  onItemsChanged={handleTreeItemsChanged}
                  TreeItemComponent={TreeItemComponent}
                />
              </div>
            )}

            {/*分组模式 - 每个分组使用独立的SortableTree*/}
            {groupMode !== "none" &&
              displayGroups.length > 0 &&
              displayGroups.map((group) => (
                <FilterGroup
                  key={group.title}
                  title={group.title}
                  tasks={group.tasks}
                  isUngrouped={group.type === "ungrouped"}
                >
                  <div className="task-group">
                    <SortableTree
                      indicator={true}
                      dropAnimation={null} // ① 关掉被拖节点的飞回动画
                      sortableProps={{
                        animateLayoutChanges: () => false, // ② 关掉其余节点的重排动画
                      }}
                      items={convertToTreeTasks(group.tasks)}
                      onItemsChanged={handleTreeItemsChanged}
                      TreeItemComponent={TreeItemComponent}
                    />
                  </div>
                </FilterGroup>
              ))}

            <App></App>
            {/*虚化显示其他任务*/}
            {otherTodosList.length > 0 &&
              (activeListId === "cp" ||
                activeListId === "bin" ||
                !hideCompletedTasks) && (
                <FilterGroup title="已完成" tasks={otherTodosList}>
                  <div style={{ opacity: `.3` }}>
                    <SortableTree
                      items={convertToTreeTasks(otherTodosList)}
                      onItemsChanged={handleTreeItemsChanged}
                      TreeItemComponent={TreeItemComponent}
                    />
                  </div>
                </FilterGroup>
              )}
          </Space>
        </div>
      </Content>

      {/*底部操作栏*/}
      <Footer className="rounded-bottom">
        <Row align={"middle"} justify={"space-between"}>
          <button
            type="button"
            onClick={() => handleDeleteAllCompleted()}
            className="btn btn-primary btn-sm"
          >
            删除所有已完成
          </button>
          <span>未完成：{displayUncompletedCount + pinnedTasks.length}个</span>
        </Row>
      </Footer>
    </>
  );
}
