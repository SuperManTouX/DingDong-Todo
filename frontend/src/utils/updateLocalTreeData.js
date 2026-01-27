/** 
 * React 环境下任务树(Todo[])扁平化数据的本地增删改联动更新工具函数 
 * 支持场景：任务的增删改、父子任务关系维护、任务状态更新等
 * @param {Array<Todo>} currentTodos - 当前组件中存储的任务扁平化数组（来自 zustand 状态管理）
 * @param {Object} updateData - 本地操作的更新数据
 * @param {string} updateData.action - 操作标识：'add'|'update'|'delete'|'update_with_children'
 * @param {Todo|Array<Todo>|string|Array<string>} updateData.data - 要更新的数据项/数组或ID/ID数组
 * @param {Object} [updateData.options={}] - 可选配置项
 * @param {boolean} [updateData.options.cascadeDelete=false] - 是否级联删除（删除父任务时同时删除所有子任务）
 * @param {boolean} [updateData.options.updateTimestamp=true] - 更新时是否自动更新updatedAt时间戳
 * @returns {Array<Todo>} 不可变的更新后任务数组（用于 zustand 状态更新）
 */ 
const updateLocalTodoData = (currentTodos, updateData) => {
  // 解构更新数据，设置默认值避免解构报错
  const {
    action = '',
    data = {},
    options = { cascadeDelete: false, updateTimestamp: true }
  } = updateData;

  // 确保currentTodos是数组
  if (!Array.isArray(currentTodos)) {
    currentTodos = [];
  }

  // 复制原数据（遵循 React 不可变状态原则，避免直接修改原数组）
  let newTodos = [...currentTodos];

  // 根据不同的操作类型执行相应的更新逻辑
  switch (action) {
    case 'add': {
      // 添加任务（单个或多个）
      if (Array.isArray(data)) {
        // 为每个新任务添加必要的时间戳和默认属性
        const tasksToAdd = data.map(task => ({
          ...task,
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString(),
          completed: task.completed || false,
          depth: task.depth || 0,
          parentId: task.parentId || null,
        }));
        newTodos = [...newTodos, ...tasksToAdd];
      } else if (data && (data.id || data.title)) {
        // 单个任务，添加必要属性
        const taskToAdd = {
          ...data,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          completed: data.completed || false,
          depth: data.depth || 0,
          parentId: data.parentId || null,
        };
        newTodos = [...newTodos, taskToAdd];
      }
      break;
    }

    case 'update': {
      // 更新任务（单个或多个）
      if (Array.isArray(data)) {
        data.forEach(task => {
          if (!task.id) return; // 过滤无 id 的无效数据
          const taskIndex = newTodos.findIndex(item => item.id === task.id);
          if (taskIndex > -1) {
            newTodos[taskIndex] = {
              ...newTodos[taskIndex],
              ...task,
              // 根据配置自动更新时间戳
              ...(options.updateTimestamp && { updatedAt: new Date().toISOString() })
            };
          }
        });
      } else if (data && data.id) {
        const taskIndex = newTodos.findIndex(item => item.id === data.id);
        if (taskIndex > -1) {
          newTodos[taskIndex] = {
            ...newTodos[taskIndex],
            ...data,
            // 根据配置自动更新时间戳
            ...(options.updateTimestamp && { updatedAt: new Date().toISOString() })
          };
        }
      }
      break;
    }

    case 'delete': {
      // 删除任务（单个或多个）
      let deleteIdList = [];
      
      if (Array.isArray(data)) {
        deleteIdList = data
          .map(item => typeof item === 'string' ? item : item.id)
          .filter(Boolean);
      } else if (data) {
        deleteIdList = [typeof data === 'string' ? data : data.id].filter(Boolean);
      }
      
      if (deleteIdList.length) {
        if (options.cascadeDelete) {
          // 级联删除：找出所有要删除的任务及其子任务
          const getAllDescendants = (ids) => {
            let allIds = [...ids];
            let hasNewDescendants = true;
            
            while (hasNewDescendants) {
              hasNewDescendants = false;
              const descendants = newTodos
                .filter(task => allIds.includes(task.parentId))
                .map(task => task.id);
              
              const newIds = descendants.filter(id => !allIds.includes(id));
              if (newIds.length) {
                allIds = [...allIds, ...newIds];
                hasNewDescendants = true;
              }
            }
            
            return allIds;
          };
          
          deleteIdList = getAllDescendants(deleteIdList);
        }
        
        newTodos = newTodos.filter(task => !deleteIdList.includes(task.id));
      }
      break;
    }

    case 'update_with_children': {
      // 复杂更新：同时更新任务和其子任务
      const { parent = { id: '' }, childrenChanges = { add: [], update: [], delete: [] } } = data;
      
      // 1. 处理父任务更新
      if (parent.id) {
        const parentIndex = newTodos.findIndex(task => task.id === parent.id);
        if (parentIndex > -1) {
          newTodos[parentIndex] = {
            ...newTodos[parentIndex],
            ...parent,
            ...(options.updateTimestamp && { updatedAt: new Date().toISOString() })
          };
        }
      }
      
      // 2. 处理子任务变更
      const { add: addTasks, update: updateTasks, delete: deleteTasks } = childrenChanges;
      
      // 2.1 新增子任务
      if (addTasks?.length) {
        const tasksToAdd = addTasks.map(task => ({
          ...task,
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString(),
          completed: task.completed || false,
          depth: task.depth || 0,
          parentId: task.parentId || parent.id || null,
        }));
        newTodos = [...newTodos, ...tasksToAdd];
      }
      
      // 2.2 更新子任务
      if (updateTasks?.length) {
        updateTasks.forEach(task => {
          if (!task.id) return;
          const taskIndex = newTodos.findIndex(item => item.id === task.id);
          if (taskIndex > -1) {
            newTodos[taskIndex] = {
              ...newTodos[taskIndex],
              ...task,
              ...(options.updateTimestamp && { updatedAt: new Date().toISOString() })
            };
          }
        });
      }
      
      // 2.3 删除子任务
      if (deleteTasks?.length) {
        const deleteIdList = deleteTasks
          .map(task => typeof task === 'string' ? task : task.id)
          .filter(Boolean);
        newTodos = newTodos.filter(task => !deleteIdList.includes(task.id));
      }
      break;
    }

    default:
      // 不支持的操作类型，返回原数据
      return currentTodos;
  }

  return newTodos;
};

export default updateLocalTodoData;