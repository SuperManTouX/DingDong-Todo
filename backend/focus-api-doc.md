# 专注记录接口文档

## 概述
本文档详细描述专注记录相关的API接口，包括创建、查询、更新和删除专注记录的功能。

## 接口列表

### 1. 获取专注记录列表

**请求**
- 方法: `GET`
- 路径: `/focus-records`
- 权限: 需要认证（JWT）

**响应**
- 状态码: `200 OK`
- 响应体:
```json
[
  {
    "id": "string",
    "user_id": "string",
    "task_id": "string",
    "start_time": "2024-01-01T12:00:00Z",
    "end_time": "2024-01-01T12:25:00Z",
    "notes": "string",
    "completed": true,
    "mode": "pomodoro",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:25:00Z"
  }
]
```

### 2. 获取单个专注记录

**请求**
- 方法: `GET`
- 路径: `/focus-records/:id`
- 权限: 需要认证（JWT）
- URL参数:
  - `id`: 专注记录ID

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (记录不存在或无权限)
- 响应体: 单个专注记录对象（同列表接口响应中的单个记录结构）

### 3. 创建新的专注记录

**请求**
- 方法: `POST`
- 路径: `/focus-records`
- 权限: 需要认证（JWT）
- 请求体:

```json
{
  "task_id": "string", // 必需，关联的任务ID
  "start_time": "string", // 必需，开始时间
  "end_time": "string", // 必需，结束时间
  "mode": "string" // 必需，模式：'pomodoro'或'normal'
}
```

**响应**
- 状态码: `201 Created` (成功) / `400 Bad Request` (参数错误) / `404 Not Found` (任务不存在)
- 响应体: 创建的专注记录对象

### 4. 更新专注记录

**请求**
- 方法: `PUT`
- 路径: `/focus-records/:id`
- 权限: 需要认证（JWT）
- URL参数:
  - `id`: 专注记录ID
- 请求体:

```json
{
  "end_time": "string", // 可选，结束时间
  "notes": "string", // 可选，备注
  "completed": boolean, // 可选，完成状态
  "mode": "string" // 可选，模式
}
```

**响应**
- 状态码: `200 OK` (成功) / `404 Not Found` (记录不存在或无权限)
- 响应体: 更新后的专注记录对象

### 5. 删除专注记录

**请求**
- 方法: `DELETE`
- 路径: `/focus-records/:id`
- 权限: 需要认证（JWT）
- URL参数:
  - `id`: 专注记录ID

**响应**
- 状态码: `204 No Content` (成功) / `404 Not Found` (记录不存在或无权限)

### 6. 获取指定任务的专注记录

**请求**
- 方法: `GET`
- 路径: `/focus-records/task/:taskId`
- 权限: 需要认证（JWT）
- URL参数:
  - `taskId`: 任务ID

**响应**
- 状态码: `200 OK`
- 响应体: 专注记录列表（同获取专注记录列表接口的响应体结构）

### 7. 获取专注统计信息

**请求**
- 方法: `GET`
- 路径: `/focus-records/stats/summary`
- 权限: 需要认证（JWT）

**响应**
- 状态码: `200 OK`
- 响应体:
```json
{
  "total_records": 10,
  "total_pomodoros": 8,
  "total_normal_sessions": 2,
  "total_minutes": 320,
  "total_hours": 5.33
}
```

## 数据模型

### 专注记录实体

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string | 是 | 专注记录ID |
| user_id | string | 是 | 用户ID，关联用户表 |
| task_id | string | 是 | 任务ID，关联任务表 |
| start_time | datetime | 是 | 专注开始时间 |
| end_time | datetime | 是 | 专注结束时间 |
| notes | string | 否 | 备注信息 |
| completed | boolean | 否 | 是否完成 |
| mode | string | 是 | 模式：'pomodoro'或'normal' |
| created_at | datetime | 是 | 创建时间 |
| updated_at | datetime | 是 | 更新时间 |

## 错误处理

所有接口可能返回的通用错误：

- `401 Unauthorized`: 未授权，JWT token无效或过期
- `403 Forbidden`: 禁止访问，没有权限执行操作
- `500 Internal Server Error`: 服务器内部错误

特定接口的错误已在各接口描述中列出。