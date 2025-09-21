# Todo任务数据结构重构方案

## 背景
当前TodoListData中每个清单都包含自己的tasks数组，为了更好地管理数据关系，需要将任务拆分到单独的数组中，通过listId字段关联清单。

## 当前数据结构
```typescript
// TodoListData结构
interface TodoListData {
  id: string;
  title: string;
  emoji?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  tasks: Todo[]; // 内嵌的任务数组
}

// Todo结构
interface Todo {
  id: string;
  title: string;
  text?: string;
  completed: boolean;
  priority: number;
  datetimeLocal?: string;
  deadline?: string;
  parentId?: string | null;
  depth: number;
  tags?: string[];
  listId?: string; // 已有此字段，但数据中实际用的是groupId
}
```

## 重构方案

### 1. 修改类型定义
```typescript
// 修改src/types/index.ts

// 新的TodoListData接口（移除tasks字段）
export interface TodoListData {
  id: string;
  title: string;
  emoji?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  // tasks: Todo[]; // 移除此字段
}

// 确保Todo接口中使用统一的listId字段
export interface Todo {
  id: string;
  title: string;
  text?: string;
  completed: boolean;
  priority: number;
  datetimeLocal?: string;
  deadline?: string;
  parentId?: string | null;
  depth: number;
  tags?: string[];
  listId: string; // 确保此字段存在
}
```

### 2. 修改todoStore.ts状态定义
```typescript
// 修改src/store/todoStore.ts

// 完整的状态类型定义
interface TodoState {
  // 核心数据 - 持久化存储
  todoListData: TodoListData[];
  todoTags: Tag[];
  activeGroupId: string;
  selectTodoId: string | null;
  bin: Todo[]; // 回收站数据
  tasks: Todo[]; // 新增：独立的任务数组

  // 其他字段保持不变...
}

// 初始化状态修改
export const useTodoStore = create<TodoState>()(
  (set, get) => ({
    // 初始化状态
    todoListData: todoListData.map(list => ({
      ...list,
      tasks: undefined // 移除内嵌的tasks
    })),
    todoTags: todoTag as Tag[],
    activeGroupId: "a",
    selectTodoId: null,
    bin: binData as Todo[],
    // 提取所有任务到独立数组
    tasks: todoListData.flatMap(list => 
      list.tasks.map(task => ({
        ...task,
        listId: task.groupId || list.id // 统一使用listId
      }))
    ),

    // 其他字段保持不变...
  })
);
```

### 3. 修改reducer逻辑
```typescript
// 修改src/store/todoStore.ts中的dispatchTodo函数

// 处理todo相关的action
dispatchTodo: (action: TodoActionExtended) => {
  set(
    produce((draftState) => {
      switch (action.type) {
        case "completedAll": {
          const { completeOrUncomplete, showType = ShowType.all, listId } = action;
          
          // 查找所有需要更新的任务
          const tasksToUpdate = draftState.tasks.filter(task => {
            if (task.listId !== listId) return false;
            
            // 根据showType过滤任务
            switch (showType) {
              case ShowType.all:
                return true;
              case ShowType.completed:
                return task.completed;
              case ShowType.uncompleted:
                return !task.completed;
              case ShowType.overdue:
                return task.deadline && new Date(task.deadline) < new Date() && !task.completed;
              default:
                return true;
            }
          });
          
          // 更新任务状态
          tasksToUpdate.forEach(task => {
            task.completed = completeOrUncomplete;
          });
          
          // 更新清单的更新时间
          const targetGroup = draftState.todoListData.find(group => group.id === listId);
          if (targetGroup) {
            targetGroup.updatedAt = dayjs().format();
          }
          break;
        }

        case "toggle": {
          const { todoId, newCompleted } = action;
          const todo = draftState.tasks.find(t => t.id === todoId);
          
          if (todo) {
            todo.completed = newCompleted;
            
            // 同步子任务状态（逻辑保持不变，但需要在tasks数组中查找）
            // ...子任务同步逻辑
            
            // 更新清单的更新时间
            const targetGroup = draftState.todoListData.find(group => group.id === todo.listId);
            if (targetGroup) {
              targetGroup.updatedAt = dayjs().format();
            }
          }
          break;
        }

        // 其他case也需要类似修改...
        case "added": {
          const { title, completed, parentId, depth, listId } = action;
          
          // 直接添加到tasks数组
          draftState.tasks.push({
            id: uuidv4(),
            title: title,
            listId: listId,
            completed: completed,
            priority: Priority.None,
            parentId: parentId || null,
            depth: depth || 0,
          });
          
          // 更新清单的更新时间
          const targetGroup = draftState.todoListData.find(group => group.id === listId);
          if (targetGroup) {
            targetGroup.updatedAt = dayjs().format();
          }
          break;
        }

        case "changed": {
          const { todo } = action;
          const index = draftState.tasks.findIndex(d => d.id === todo.id);
          if (index !== -1) {
            draftState.tasks[index] = todo;
            
            // 更新清单的更新时间
            const targetGroup = draftState.todoListData.find(group => group.id === todo.listId);
            if (targetGroup) {
              targetGroup.updatedAt = dayjs().format();
            }
          }
          break;
        }

        case "deleted": {
          const { deleteId } = action;
          const todoIndex = draftState.tasks.findIndex(t => t.id === deleteId);
          
          if (todoIndex !== -1) {
            const todo = draftState.tasks[todoIndex];
            draftState.tasks.splice(todoIndex, 1);
            
            // 更新清单的更新时间
            const targetGroup = draftState.todoListData.find(group => group.id === todo.listId);
            if (targetGroup) {
              targetGroup.updatedAt = dayjs().format();
            }
          }
          break;
        }

        // 其他case也需要类似修改...
      }
    }),
  );
},
```

### 4. 修改辅助函数和hooks
```typescript
// 修改src/store/todoStore.ts中的辅助函数

// 辅助方法 - 用于查询和获取特定数据
getTodoById: (id: string) => {
  const state = get();
  // 直接在tasks数组中查找
  const todo = state.tasks.find((t) => t.id === id);
  if (todo) return todo;
  // 如果在正常任务中找不到，在回收站中查找
  return state.bin.find((t) => t.id === id) || null;
},

// 根据任务ID获取所属的任务组
getGroupByTodoId: (todoId: string) => {
  const state = get();
  const todo = state.tasks.find(t => t.id === todoId);
  if (todo) {
    return state.todoListData.find(group => group.id === todo.listId) || null;
  }
  return null;
},

// 修改moveToBin等回收站相关函数
moveToBin: (todo: Todo) => {
  set(
    produce((draftState) => {
      // 从tasks数组中移除任务
      const taskIndex = draftState.tasks.findIndex(task => task.id === todo.id);
      if (taskIndex !== -1) {
        draftState.tasks.splice(taskIndex, 1);
        
        // 更新清单的更新时间
        const targetGroup = draftState.todoListData.find(group => group.id === todo.listId);
        if (targetGroup) {
          targetGroup.updatedAt = dayjs().format();
        }
      }

      // 将任务添加到回收站，并记录删除时间
      const deletedTodo = {
        ...todo,
        deletedAt: dayjs().format(),
      };
      draftState.bin.push(deletedTodo);
    }),
  );
},

// 其他辅助函数也需要类似修改...
```

### 5. 修改辅助hooks
```typescript
// 修改src/store/todoStore.ts中的hooks

export const useActiveGroup = (): TodoListData => {
  const filterData: TodoListData & { tasks: Todo[] } = {
    createdAt: "",
    id: "",
    tasks: [],
    title: "",
    updatedAt: "",
  };

  return useTodoStore((state) => {
    // 安全检查
    if (!state || !state.todoListData || !state.activeGroupId || !state.tasks) {
      return filterData;
    }

    // 如果是普通清单，返回清单和其关联的任务
    if (state.activeGroupId !== "aa" && state.activeGroupId !== "bb" && 
        state.activeGroupId !== "bin" && state.activeGroupId !== "cp") {
      const group = state.todoListData.find(item => item.id === state.activeGroupId);
      if (group) {
        return {
          ...group,
          tasks: state.tasks.filter(task => task.listId === group.id)
        };
      }
    }

    // 其他特殊清单的逻辑保持不变，但从tasks数组中筛选任务
    // ...原有的特殊清单逻辑
    
    return filterData;
  });
};

// 其他hooks也需要类似修改...
```

## 实施步骤

1. **备份数据**：在实施前备份当前的TodoListData.json
2. **修改类型定义**：更新src/types/index.ts文件
3. **修改store状态定义**：更新src/store/todoStore.ts中的TodoState接口和初始化状态
4. **修改reducer逻辑**：更新所有涉及任务操作的reducer逻辑
5. **修改辅助函数**：更新所有辅助函数和hooks
6. **测试验证**：确保所有功能正常工作，特别是任务的增删改查、回收站操作等

## 注意事项

1. **数据一致性**：确保在拆分过程中数据不丢失
2. **字段统一**：修复Todo接口中groupId和listId不一致的问题，统一使用listId
3. **兼容性**：确保现有功能不受影响
4. **性能优化**：对于大型任务列表，可以考虑添加索引以提高查询性能
5. **持久化调整**：如果启用了持久化存储，需要调整存储的字段结构

## 重构后的优势

1. **数据结构更清晰**：任务和清单分离，关系通过外键关联
2. **查询更高效**：可以直接在tasks数组中查询任务，无需遍历所有清单
3. **维护更方便**：新增功能时不需要同时维护多个数据结构
4. **扩展性更好**：更容易实现任务跨清单移动等功能
5. **更符合数据库设计范式**：减少数据冗余，提高数据一致性