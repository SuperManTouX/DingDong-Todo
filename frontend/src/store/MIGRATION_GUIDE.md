# Zustand 迁移指南

本指南将帮助你从原来的 useImmerReducer 迁移到新创建的 zustand store。

## 迁移前的准备

1. 确保已安装必要的依赖：
```bash
npm install zustand auto-zustand-selectors-hooks
```

2. 检查 `src/store/todoStore.ts` 是否已正确创建

## 核心数据迁移

我们已经将以下核心数据迁移到 zustand store 中：

1. `todoListGroups` - 所有任务组及其任务
2. `todoTags` - 所有标签
3. `activeGroupId` - 当前激活的任务组ID
4. `selectTodoId` - 当前选中的任务ID

以及所有相关的操作方法（actions）：
- `dispatchTodo` - 处理任务相关操作
- `dispatchTag` - 处理标签相关操作
- `setActiveGroupId` - 设置当前激活的任务组
- `setSelectTodoId` - 设置当前选中的任务

## 组件迁移示例

### 1. AppLayout 组件迁移

**原代码（使用 useImmerReducer）：**
```tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useImmerReducer } from 'use-immer';
import { reducer } from '@/utils/reducer';
import { getInitialState } from '@/utils/initData';
import { TagAction, tagReducer } from '@/utils/tagReducer';
import { getInitialTags } from '@/utils/tagReducer';

function AppLayout() {
  const [state, dispatch] = useImmerReducer(reducer, getInitialState());
  const [todoTags, tagDispatch] = useImmerReducer(tagReducer, getInitialTags());
  const [activeGroupId, setActiveGroupId] = useState('a');
  const [selectTodoId, setSelectTodoId] = useState<string | null>(null);
  // ...
}
```

**迁移后（使用 zustand）：**
```tsx
import React from 'react';
import { useTodoStore, useActiveGroup, useSelectTodo } from '@/store/todoStore';

function AppLayout() {
  const { todoListGroups, todoTags, dispatchTodo, dispatchTag, setActiveGroupId, setSelectTodoId } = useTodoStore();
  const activeGroup = useActiveGroup();
  const selectTodo = useSelectTodo();
  // ...
}
```

### 2. 移除 dispatchWithGroupId 工具函数

**原代码：**
```tsx
const dispatchWithGroupId = useCallback(
  (action: TodoAction) => {
    return dispatch({
      ...action,
      groupId: activeGroupId,
    });
  },
  [dispatch, activeGroupId]
);
```

**迁移后：**
- 不需要这个工具函数了，直接使用 `dispatchTodo` 并传递完整的 action（包含 groupId）
- 或者创建一个自定义 hook 来简化这个过程

### 3. TODOList 组件迁移

**原代码：**
```tsx
interface TODOListProps {
  groupName: string;
  todoList: Todo[];
  dispatch: (action: TodoActionExtended) => void;
  onTodoSelect: (todoId: string | null) => void;
}

const TODOList: React.FC<TODOListProps> = ({ groupName, todoList, dispatch, onTodoSelect }) => {
  // ...
}
```

**迁移后：**
```tsx
import { useTodoStore, useActiveGroup } from '@/store/todoStore';

const TODOList: React.FC = () => {
  const { dispatchTodo, setSelectTodoId } = useTodoStore();
  const activeGroup = useActiveGroup();
  const groupName = activeGroup.title;
  const todoList = activeGroup.tasks;
  // ...
}
```

### 4. 任务操作示例

**原代码（添加任务）：**
```tsx
const handleAddTodo = (title: string, parentId?: string, depth?: number) => {
  dispatchWithGroupId({
    type: 'added',
    title,
    completed: false,
    parentId,
    depth,
  });
};
```

**迁移后：**
```tsx
const handleAddTodo = (title: string, parentId?: string, depth?: number) => {
  const { activeGroupId } = useTodoStore.getState();
  dispatchTodo({
    type: 'added',
    title,
    completed: false,
    parentId,
    depth,
    groupId: activeGroupId,
  });
};
```

### 5. 标签管理组件迁移

**原代码：**
```tsx
interface TagManagerProps {
  tags: Tag[];
  tagDispatch: (action: TagAction) => void;
}

const TagManager: React.FC<TagManagerProps> = ({ tags, tagDispatch }) => {
  // ...
}
```

**迁移后：**
```tsx
import { useTodoStore } from '@/store/todoStore';

const TagManager: React.FC = () => {
  const { todoTags, dispatchTag } = useTodoStore();
  // ...
}
```

## 优化建议

1. **组件解耦**
   - 移除组件之间通过 props 传递的 dispatch 函数
   - 每个组件直接从 zustand store 中获取所需的数据和方法

2. **性能优化**
   - 使用 `useSelector` 钩子只选择需要的数据，避免不必要的重渲染
   - 对于复杂计算，考虑使用 memoize 来缓存计算结果

3. **代码组织**
   - 将与 store 相关的自定义 hooks 放在 store 目录下
   - 考虑将大型组件拆分为更小的组件，每个组件只关注特定的功能

## 常见问题

### 1. 如何获取当前选中的任务？

使用提供的 `useSelectTodo` hook：
```tsx
import { useSelectTodo } from '@/store/todoStore';

// 在组件中
const selectedTodo = useSelectTodo();
```

### 2. 如何获取当前激活的任务组？

使用提供的 `useActiveGroup` hook：
```tsx
import { useActiveGroup } from '@/store/todoStore';

// 在组件中
const activeGroup = useActiveGroup();
```

### 3. 如何在非组件环境中访问 store？

使用 `getState` 方法：
```tsx
import { useTodoStore } from '@/store/todoStore';

// 在任何地方
const currentState = useTodoStore.getState();
const dispatchTodo = useTodoStore.getState().dispatchTodo;
```

## 迁移步骤

1. **创建 store 目录和文件** - 已完成
2. **修改 AppLayout 组件** - 使用 zustand 替代 useImmerReducer
3. **修改 TODOList 组件** - 从 store 获取数据，移除 props
4. **修改 TagManager 组件** - 从 store 获取标签数据
5. **修改 ListGroupManager 组件** - 使用 store 中的方法管理任务组
6. **修改其他子组件** - 移除对 dispatch 的依赖，直接使用 store
7. **测试所有功能** - 确保所有功能正常工作
8. **移除旧的 reducer 和状态管理代码** - 清理不需要的文件

## 持久化说明

zustand 已经配置了本地存储持久化，你的任务和标签数据会自动保存到 localStorage 中，页面刷新后数据不会丢失。

## 下一步

完成以上迁移后，你可以考虑：
1. 进一步优化组件结构
2. 实现更复杂的状态管理逻辑
3. 考虑添加异步操作支持（如数据同步到云端）

如果在迁移过程中遇到任何问题，请参考 zustand 官方文档或联系开发人员寻求帮助。