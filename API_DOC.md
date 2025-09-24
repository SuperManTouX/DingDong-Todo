# 叮咚待办 (DingDongTodo) 后端API文档

## 基础信息

- **API基础URL**: `http://localhost:3000`
- **请求格式**: JSON
- **响应格式**: JSON
- **认证方式**: JWT认证（Bearer Token）
- **CORS配置**: 已允许来自 `http://localhost` 的5000以内端口的请求

## 任务管理接口 (Todos)

### 1. 获取待办事项信息 (单复数统一接口)

**说明**: 该接口是对任务管理的统一入口，提供与/todos相同的功能，用于兼容性支持。

**请求**
- 方法: `GET`
- 路径: `/todo`
- 权限: 需要认证（JWT）
- 请求参数: 无

**响应**
- 状态码: `200 OK`
- 响应体: 任务数组，每个任务包含以下字段

```json
[
  {
    "id": "string", // 任务唯一ID
    "title": "string", // 任务标题
    "completed": boolean, // 完成状态
    "priority": number, // 优先级 (0-3，数字越大优先级越高)
    "datetimeLocal": "string", // 日期时间
    "deadline": "string", // 截止日期
    "parentId": "string|null", // 父任务ID
    "depth": number, // 任务深度（用于子任务）
    "tags": ["string"], // 标签ID数组
    "listId": "string", // 所属清单ID
    "groupId": "string|null", // 所属分组ID
    "userId": "string", // 所属用户ID
    "createdAt": "string", // 创建时间
    "updatedAt": "string" // 更新时间
  }
]
```

> **说明**: 此接口为`/todos`的别名接口，提供完全相同的功能，用于兼容性支持。

### 2. 获取当前用户的所有任务

**请求**
- 方法: `GET`
- 路径: `/todos`
- 权限: 需要认证（JWT）
- 请求参数: 无

**响应**
- 状态码: `200 OK`
- 响应体: 任务数组，每个任务包含以下字段

```json
[
  {
    "id": "string", // 任务唯一ID
    "title": "string", // 任务标题
    "completed": boolean, // 完成状态
    "priority": number, // 优先级 (0-3，数字越大优先级越高)
    "datetimeLocal": "string", // 日期时间
    "deadline": "string", // 截止日期
    "parentId": "string|null", // 父任务ID
    "depth": number, // 任务深度（用于子任务）
    "tags": ["string"], // 标签ID数组
    "listId": "string", // 所属清单ID
    "groupId": "string|null", // 所属分组ID
    "userId": "string" // 所属用户ID
  }
]
```

### 2. 获取当前用户的单个任务

**请求**
- 方法: `GET`
- 路径: `/todos/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 任务ID

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (任务不存在或无权限)
- 响应体: 单个任务对象

```json
{
  "id": "string",
  "title": "string",
  "completed": boolean,
  "priority": number,
  "datetimeLocal": "string",
  "deadline": "string",
  "parentId": "string|null",
  "depth": number,
  "tags": ["string"],
  "listId": "string",
  "groupId": "string|null",
  "userId": "string"
}
```

### 3. 创建新任务

**请求**
- 方法: `POST`
- 路径: `/todos`
- 权限: 需要认证（JWT）
- 请求体: 任务对象（userId会自动设置为当前用户ID）

```json
{
  "id": "string", // 可选，任务ID，如不提供将生成 `task-timestamp` 格式
  "title": "string", // 必需，任务标题
  "completed": boolean, // 可选，默认false
  "priority": number, // 可选，默认0
  "datetimeLocal": "string", // 可选，日期时间
  "deadline": "string", // 可选，截止日期
  "parentId": "string|null", // 可选，父任务ID
  "depth": number, // 可选，默认0
  "tags": ["string"], // 可选，标签ID数组
  "listId": "string", // 必需，所属清单ID
  "groupId": "string|null" // 可选，所属分组ID
}
```

**响应**
- 状态码: `201 Created`
- 响应体: 创建的任务对象（包含生成的ID和标签信息）

### 4. 更新任务

**请求**
- 方法: `PUT`
- 路径: `/todos/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 任务ID
- 请求体: 要更新的任务字段

```json
{
  "title": "string", // 可选，任务标题
  "completed": boolean, // 可选，完成状态
  "priority": number, // 可选，优先级
  "datetimeLocal": "string", // 可选，日期时间
  "deadline": "string", // 可选，截止日期
  "parentId": "string|null", // 可选，父任务ID
  "depth": number, // 可选，任务深度
  "listId": "string", // 可选，所属清单ID
  "groupId": "string|null", // 可选，所属分组ID
  "tags": ["string"] // 可选，标签ID数组
}
```

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (任务不存在或无权限)
- 响应体: 更新后的任务对象

### 5. 删除任务

**请求**
- 方法: `DELETE`
- 路径: `/todos/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 任务ID

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (任务不存在或无权限)
- 响应体: 

```json
{
  "message": "任务已移至回收站",
  "binId": "string" // 回收站中任务的ID
}
```

**说明**：任务删除后不会直接从系统中删除，而是移动到回收站，用户可以在回收站中查看、恢复或永久删除这些任务。

### 6. 创建演示任务（带标签）

**请求**
- 方法: `POST`
- 路径: `/todos/demo`
- 权限: 无
- 请求体: 无

**响应**
- 状态码: `201 Created`
- 响应体: 创建的演示任务对象（包含示例标签）

## 清单管理接口 (Todo Lists)

### 1. 获取当前用户的所有清单

**请求**
- 方法: `GET`
- 路径: `/todo-lists`
- 权限: 需要认证（JWT）
- 请求参数: 无

**响应**
- 状态码: `200 OK`
- 响应体: 清单数组

```json
[
  {
    "id": "string", // 清单唯一ID
    "name": "string", // 清单名称
    "userId": "string", // 所属用户ID
    "createdAt": "string", // 创建时间
    "updatedAt": "string" // 更新时间
  }
]
```

### 2. 获取当前用户的单个清单

**请求**
- 方法: `GET`
- 路径: `/todo-lists/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 清单ID

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (清单不存在或无权限)
- 响应体: 单个清单对象

### 3. 创建新清单

**请求**
- 方法: `POST`
- 路径: `/todo-lists`
- 权限: 需要认证（JWT）
- 请求体: 

```json
{
  "name": "string" // 清单名称
}
```

**响应**
- 状态码: `201 Created`
- 响应体: 创建的清单对象

### 4. 更新清单

**请求**
- 方法: `PUT`
- 路径: `/todo-lists/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 清单ID
- 请求体: 

```json
{
  "name": "string" // 新的清单名称
}
```

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (清单不存在或无权限)
- 响应体: 更新后的清单对象

### 5. 删除清单

**请求**
- 方法: `DELETE`
- 路径: `/todo-lists/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 清单ID

**响应**
- 状态码: `200 OK`
- 响应体: 

```json
{
  "message": "清单删除成功"
}
```

## 分组管理接口 (Task Groups)

### 1. 获取当前用户的所有分组

**请求**
- 方法: `GET`
- 路径: `/task-groups`
- 权限: 需要认证（JWT）
- 请求参数: 无

**响应**
- 状态码: `200 OK`
- 响应体: 分组数组

```json
[
  {
    "id": "string", // 分组唯一ID
    "listId": "string", // 所属清单ID
    "groupName": "string", // 分组名称
    "userId": "string", // 所属用户ID
    "createdAt": "string", // 创建时间
    "updatedAt": "string" // 更新时间
  }
]
```

### 2. 获取当前用户的单个分组

**请求**
- 方法: `GET`
- 路径: `/task-groups/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 分组ID

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (分组不存在或无权限)
- 响应体: 单个分组对象

### 3. 创建新分组

**请求**
- 方法: `POST`
- 路径: `/task-groups`
- 权限: 需要认证（JWT）
- 请求体: 

```json
{
  "listId": "string", // 所属清单ID
  "groupName": "string" // 分组名称
}
```

**响应**
- 状态码: `201 Created`
- 响应体: 创建的分组对象

### 4. 更新分组

**请求**
- 方法: `PUT`
- 路径: `/task-groups/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 分组ID
- 请求体: 

```json
{
  "groupName": "string" // 新的分组名称
}
```

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (分组不存在或无权限)
- 响应体: 更新后的分组对象

### 5. 删除分组

**请求**
- 方法: `DELETE`
- 路径: `/task-groups/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 分组ID

**响应**
- 状态码: `200 OK`
- 响应体: 

```json
{
  "message": "分组删除成功"
}
```

## 标签管理接口 (Todo Tags)

### 1. 获取当前用户的所有标签

**请求**
- 方法: `GET`
- 路径: `/todo-tags`
- 权限: 需要认证（JWT）
- 请求参数: 无

**响应**
- 状态码: `200 OK`
- 响应体: 标签数组

```json
[
  {
    "id": "string", // 标签唯一ID
    "name": "string", // 标签名称
    "parentId": "string|null", // 父标签ID（用于标签层级）
    "userId": "string", // 所属用户ID
    "createdAt": "string", // 创建时间
    "updatedAt": "string" // 更新时间
  }
]
```

### 2. 获取当前用户的单个标签

**请求**
- 方法: `GET`
- 路径: `/todo-tags/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 标签ID

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (标签不存在或无权限)
- 响应体: 单个标签对象

### 3. 创建新标签

**请求**
- 方法: `POST`
- 路径: `/todo-tags`
- 权限: 需要认证（JWT）
- 请求体: 

```json
{
  "name": "string", // 标签名称
  "parentId": "string|null" // 可选，父标签ID
}
```

**响应**
- 状态码: `201 Created`
- 响应体: 创建的标签对象

### 4. 更新标签

**请求**
- 方法: `PUT`
- 路径: `/todo-tags/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 标签ID
- 请求体: 

```json
{
  "name": "string" // 新的标签名称
}
```

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (标签不存在或无权限)
- 响应体: 更新后的标签对象

### 5. 删除标签

**请求**
- 方法: `DELETE`
- 路径: `/todo-tags/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 标签ID

**响应**
- 状态码: `200 OK`
- 响应体: 

```json
{
  "message": "标签删除成功"
}
```

### 6. 获取task_tag对应关系

**请求**
- 方法: `GET`
- 路径: `/todo-tags/task-tag-mappings`
- 权限: 需要认证（JWT）
- 请求参数: 无

**响应**
- 状态码: `200 OK`
- 响应体: 任务-标签映射数组

```json
[
  {
    "taskId": "string", // 任务ID
    "tagId": "string" // 标签ID
  }
]
```

## 回收站管理接口 (Bin)

### 1. 获取当前用户的回收站内容

**请求**
- 方法: `GET`
- 路径: `/bin`
- 权限: 需要认证（JWT）
- 请求参数: 无

**响应**
- 状态码: `200 OK`
- 响应体: 回收站项目数组

```json
[
  {
    "id": "string", // 回收站项目唯一ID
    "title": "string", // 任务标题
    "text": "string", // 任务描述（可选）
    "completed": boolean, // 完成状态
    "priority": number, // 优先级
    "datetimeLocal": "string", // 日期时间（可选）
    "deadline": "string", // 截止日期（可选）
    "parentId": "string", // 父任务ID（可选）
    "depth": number, // 任务深度
    "listId": "string", // 所属清单ID
    "groupId": "string", // 所属分组ID（可选）
    "userId": "string", // 所属用户ID
    "createdAt": "string", // 创建时间
    "updatedAt": "string", // 更新时间
    "deletedAt": "string" // 删除时间
  }
]
```

### 2. 恢复回收站中的任务

**请求**
- 方法: `POST`
- 路径: `/bin/:id/restore`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 回收站项目ID

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (回收站项目不存在或无权限)
- 响应体: 

```json
{
  "message": "任务已恢复",
  "taskId": "string" // 恢复的任务ID
}
```

### 3. 永久删除回收站中的任务

**请求**
- 方法: `DELETE`
- 路径: `/bin/:id`
- 权限: 需要认证（JWT）
- URL参数: 
  - `id`: 回收站项目ID

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (回收站项目不存在或无权限)
- 响应体: 

```json
{
  "message": "任务已永久删除"
}
```

### 4. 清空回收站

**请求**
- 方法: `DELETE`
- 路径: `/bin/empty`
- 权限: 需要认证（JWT）
- 请求参数: 无

**响应**
- 状态码: `200 OK`
- 响应体: 

```json
{
  "message": "回收站已清空"
}
```

## 认证接口 (Auth)

### 1. 用户登录（返回token）

**请求**
- 方法: `POST`
- 路径: `/auth/login`
- 权限: 无
- 请求体:

```json
{
  "username": "string", // 用户名
  "password": "string" // 密码
}
```

**响应**
- 状态码: `200 OK` (成功) / `401 Unauthorized` (用户名或密码错误)
- 响应体:

```json
{
  "access_token": "string", // JWT访问令牌
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "avatar": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### 2. 用户注册

**请求**
- 方法: `POST`
- 路径: `/auth/register`
- 权限: 无
- 请求体:

```json
{
  "username": "string", // 用户名（唯一）
  "email": "string", // 邮箱（唯一）
  "password": "string" // 密码
}
```

**响应**
- 状态码: `201 Created` (成功) / `409 Conflict` (用户名或邮箱已存在)
- 响应体: 同登录接口响应

### 3. 刷新令牌

**请求**
- 方法: `POST`
- 路径: `/auth/refresh`
- 权限: 无
- 请求体:

```json
{
  "token": "string" // 原JWT令牌
}
```

**响应**
- 状态码: `200 OK` (成功) / `401 Unauthorized` (令牌无效)
- 响应体:

```json
{
  "access_token": "string" // 新的JWT访问令牌
}
```

### 4. 获取用户信息

**请求**
- 方法: `GET`
- 路径: `/auth/profile`
- 权限: 需要认证（Authorization头中包含Bearer Token）
- 请求参数: 无

**响应**
- 状态码: `200 OK` (成功) / `401 Unauthorized` (未认证或认证失败)
- 响应体: 当前用户信息（同登录接口返回的user对象）

### 5. 用户注销

**请求**
- 方法: `POST`
- 路径: `/auth/logout`
- 权限: 需要认证（Authorization头中包含Bearer Token）
- 请求参数: 无

**响应**
- 状态码: `200 OK` (成功) / `401 Unauthorized` (未认证或认证失败)
- 响应体:

```json
{
  "message": "用户已成功注销"
}```

## 系统接口

### 1. 健康检查

**请求**
- 方法: `GET`
- 路径: `/`
- 权限: 无
- 请求参数: 无

**响应**
- 状态码: `200 OK`
- 响应体: 

```
Hello World!
```

## 数据模型说明

### Bin (回收站) 实体结构

```typescript
interface Bin {
  id: string; // 主键
  title: string; // 任务标题
  text?: string; // 任务描述
  completed: boolean; // 完成状态
  priority: number; // 优先级
  datetimeLocal?: Date; // 日期时间
  deadline?: Date; // 截止日期
  parentId?: string; // 父任务ID
  depth: number; // 任务深度
  listId: string; // 所属清单ID
  groupId?: string; // 所属分组ID
  userId: string; // 所属用户ID
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  deletedAt: Date; // 删除时间
}
```

### User (用户) 实体结构

```typescript
interface User {
  id: string; // 主键
  username: string; // 用户名（唯一）
  email: string; // 邮箱（唯一）
  password: string; // 加密后的密码
  avatar?: string; // 头像URL
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  // 关联关系
  todoLists: TodoList[]; // 所属清单列表
  tags: TodoTag[]; // 所属标签列表
  tasks: Task[]; // 所属任务列表
}
```

### Task (任务) 实体结构

```typescript
interface Task {
  id: string; // 主键
  title: string; // 任务标题
  completed: boolean; // 完成状态
  priority: number; // 优先级
  datetimeLocal?: Date; // 日期时间
  deadline?: Date; // 截止日期
  parentId?: string; // 父任务ID
  depth: number; // 任务深度
  listId: string; // 所属清单ID
  groupId?: string; // 所属分组ID
  userId: string; // 所属用户ID
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  // 关联关系
  list: TodoList; // 所属清单
  group?: TaskGroup; // 所属分组
  user: User; // 所属用户
  taskTags: TaskTag[]; // 任务标签关联
}
```

### TodoList (清单) 实体结构

```typescript
interface TodoList {
  id: string; // 主键
  name: string; // 清单名称
  userId: string; // 所属用户ID
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  // 关联关系
  user: User; // 所属用户
  taskGroups: TaskGroup[]; // 包含的分组
  tasks: Task[]; // 包含的任务
}
```

### TaskGroup (任务分组) 实体结构

```typescript
interface TaskGroup {
  id: string; // 主键
  listId: string; // 所属清单ID
  groupName: string; // 分组名称
  userId: string; // 所属用户ID
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  // 关联关系
  list: TodoList; // 所属清单
  user: User; // 所属用户
  tasks: Task[]; // 包含的任务
}
```

### TodoTag (标签) 实体结构

```typescript
interface TodoTag {
  id: string; // 主键
  name: string; // 标签名称
  parentId?: string; // 父标签ID
  userId: string; // 所属用户ID
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  // 关联关系
  user: User; // 所属用户
  children: TodoTag[]; // 子标签
  taskTags: TaskTag[]; // 任务标签关联
}
```

## 标签处理说明

- 标签信息存储在内存映射中，通过`taskTagsMap`进行管理
- 创建任务时可以通过`tags`字段传入标签ID数组
- 查询任务时会自动从内存映射中获取并附加标签信息
- 获取task_tag对应关系接口返回当前用户所有任务的标签映射关系

## 开发注意事项

1. 后端服务默认运行在 `http://localhost:3000`
2. 数据库配置可在 `.env` 文件中修改
3. 支持的数据库类型包括 MySQL 和 SQLite
4. 项目使用 TypeORM 进行数据库操作
5. CORS已配置为允许来自前端开发服务器的请求
6. 所有需要认证的接口都需要在请求头中包含 `Authorization: Bearer {token}`

## 错误处理

- 资源不存在时返回 `404 Not Found` 状态码和错误消息
- 认证失败返回 `401 Unauthorized` 状态码和错误消息（如"用户名或密码错误"、"无效的令牌"）
- 冲突错误返回 `409 Conflict` 状态码和错误消息（如"用户名已存在"、"邮箱已存在"）
- 其他错误会返回相应的HTTP状态码和错误信息

## 认证说明

1. 所有需要认证的接口都需要在请求头中包含 `Authorization: Bearer {token}`
2. JWT令牌有效期默认为24小时
3. 令牌过期后可以通过刷新令牌接口获取新令牌
4. 用户登录后，所有操作都限制为只能访问和修改自己的数据

---

document generation time: 2024-01-10 15:00:00