import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpStatus, HttpCode, Patch, Query } from '@nestjs/common';
import { TaskService } from './todo.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BatchUpdateOrderDto } from './dto/batch-update-order.dto';
import { UpdateParentIdDto } from './dto/update-parent-id.dto';
import { NotFoundException } from '@nestjs/common';

@ApiTags('任务管理')
@Controller('todos')
export class TodoController {
  constructor(private todoService: TaskService) {}

  /**
   * 分页获取已完成任务
   * @param page 页码（从1开始，默认1）
   * @param pageSize 每页数量（默认20）
   * @param type 任务类型过滤（today、nearlyWeek、bin、cp或todolist-{id}、tag-{id}）
   * @param req 请求对象，用于获取用户信息
   * @returns 分页结果
   */
  @ApiOperation({
    summary: '分页获取已完成任务',
    description: '分页获取当前用户的已完成任务，支持多种类型过滤',
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', description: '页码', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false, example: 20 })
  @ApiQuery({ 
    name: 'type', 
    description: '任务类型过滤：today、nearlyWeek、bin、cp或todolist-{id}、tag-{id}', 
    required: false, 
    example: 'today'
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get('completed')
  async getCompletedTasks(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('type') type?: string
  ) {
    // 确保页码和每页数量有效
    const validPage = Math.max(1, Number(page) || 1);
    const validPageSize = Math.max(1, Math.min(100, Number(pageSize) || 20));
    
    return this.todoService.getCompletedTasksWithPagination(
      req.user.id,
      validPage,
      validPageSize,
      type
    );
  }

  // 获取所有任务
  @ApiOperation({
    summary: '获取所有任务',
    description: '获取当前用户的所有任务',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req) {
    return this.todoService.findAll(req.user.id);
  }

  // 获取置顶任务
  @ApiOperation({
    summary: '获取置顶任务',
    description: '获取当前用户的所有置顶任务',
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'listId', description: '清单ID', required: true })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get('pinned')
  async getPinnedTodos(@Query('listId') listId: string, @Req() req) {
    return this.todoService.getPinnedTodos(req.user.id, listId);
  }

  /**
   * 根据类型获取任务列表
   * @param type 任务类型：today、nearlyWeek、cp、bin 或普通列表ID
   * @param request 请求对象，用于获取用户信息
   * @returns 任务列表
   */
  @ApiOperation({
    summary: '根据类型获取任务列表',
    description: '获取不同类型的任务列表',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'type', description: '任务类型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get('type/:type')
  async getTasksByType(@Param('type') type: string, @Req() req) {
    return this.todoService.getTasksByType(req.user.id, type);
  }

  /**
   * 按关键词搜索任务
   * @param keyword 搜索关键词，支持空格分隔多个关键词
   * @param request 请求对象，用于获取用户信息
   * @returns 匹配的任务列表
   */
  @ApiOperation({
    summary: '按关键词搜索任务',
    description: '根据关键词搜索当前用户的任务',
  })
  @ApiBearerAuth()
  // 创建演示任务
  @ApiOperation({
    summary: '创建演示任务',
    description: '创建带标签的演示任务',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Post('demo')
  @HttpCode(HttpStatus.CREATED)
  async createDemo() {
    return this.todoService.createDemo();
  }

  // 获取单个任务 - 动态路由移到静态路由之后
  @ApiOperation({
    summary: '获取单个任务',
    description: '根据ID获取单个任务详情',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.todoService.findOne(id, req.user.id);
  }

  // 创建任务
  @ApiOperation({
    summary: '创建新任务',
    description: '创建一个新的任务',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '任务ID（可选）' },
        title: { type: 'string', description: '任务标题', example: '完成项目文档' },
        text: { type: 'string', description: '任务描述（可选）' },
        completed: { type: 'boolean', description: '完成状态（可选，默认false）' },
        priority: { type: 'number', description: '优先级 0-3（可选）' },
        datetimeLocal: { type: 'string', description: '日期时间（可选）' },
        deadline: { type: 'string', description: '截止日期（可选）' },
        parentId: { type: 'string', description: '父任务ID（可选）' },
        depth: { type: 'number', description: '任务深度（可选）' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签ID数组（可选）' },
        listId: { type: 'string', description: '所属清单ID' },
        groupId: { type: 'string', description: '所属分组ID（可选）' },
        is_pinned: { type: 'boolean', description: '是否置顶（可选，默认false）' },
        pinned_at: { type: 'string', description: '置顶时间（可选）' },
        reminder_at: { type: 'string', description: '提醒时间（可选）' },
        is_reminded: { type: 'boolean', description: '是否已提醒（可选，默认false）' },
      },
      required: ['title', 'listId'],
    },
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() todoData: any, @Req() req) {
    // 确保用户ID是当前登录用户的ID
    todoData.userId = req.user.id;
    return this.todoService.create(todoData);
  }

  // 更新任务
  @ApiOperation({
    summary: '更新任务',
    description: '更新指定ID的任务信息',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '任务标题' },
        text: { type: 'string', description: '任务描述' },
        completed: { type: 'boolean', description: '完成状态' },
        priority: { type: 'number', description: '优先级 0-3' },
        datetimeLocal: { type: 'string', description: '日期时间' },
        deadline: { type: 'string', description: '截止日期' },
        parentId: { type: 'string', description: '父任务ID' },
        depth: { type: 'number', description: '任务深度' },
        listId: { type: 'string', description: '所属清单ID' },
        groupId: { type: 'string', description: '所属分组ID' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签ID数组' },
        is_pinned: { type: 'boolean', description: '是否置顶' },
        pinned_at: { type: 'string', description: '置顶时间' },
        reminder_at: { type: 'string', description: '提醒时间' },
        is_reminded: { type: 'boolean', description: '是否已提醒' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() todoData: any, @Req() req) {
    return this.todoService.update(id, todoData, req.user.id);
  }

  // 切换任务置顶状态
  @ApiOperation({
    summary: '切换任务置顶状态',
    description: '切换任务的置顶状态',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/pin')
  async togglePin(@Param('id') id: string, @Req() req) {
    return this.todoService.togglePin(id, req.user.id);
  }
  
  // 切换任务完成状态
  @ApiOperation({
    summary: '切换任务完成状态',
    description: '切换任务的完成状态，并同步更新所有子任务的完成状态',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/completed')
  async toggleTaskCompleted(@Param('id') id: string, @Req() req) {
    return this.todoService.toggleTaskCompleted(id, req.user.id);
  }

  // 更新任务的父任务ID
  @ApiOperation({
    summary: '更新任务的父任务ID',
    description: '更新任务的父任务ID，并自动计算和更新depth值，同时更新所有子任务的depth',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiBody({
    type: UpdateParentIdDto,
    description: '新的父任务ID信息',
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiResponse({ status: 400, description: '参数错误或循环引用' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/parent')
  async updateParentId(@Param('id') id: string, @Body() dto: UpdateParentIdDto, @Req() req) {
    return this.todoService.updateParentId(id, dto.parentId, req.user.id);
  }

  /**
   * 移动任务及其子任务到指定分组
   * @param id 任务ID
   * @param req 请求对象，用于获取用户信息
   * @param body 请求体，包含新的分组ID和清单ID
   * @returns 更新后的任务
   */
  @ApiOperation({
    summary: '移动任务及其子任务到指定分组',
    description: '将指定任务及其所有子任务移动到新的分组',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        groupId: { type: 'string', nullable: true, description: '新的分组ID，null表示无分组' },
        listId: { type: 'string', description: '新的清单ID' },
      },
      required: ['groupId', 'listId'],
    },
  })
  @ApiResponse({ status: 200, description: '移动成功' })
  @ApiResponse({ status: 404, description: '任务或分组不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/move-to-group')
  async moveTaskToGroup(
    @Param('id') id: string,
    @Body() body: { groupId: string | null; listId: string },
    @Req() req
  ) {
    return this.todoService.moveTaskToGroup(id, req.user.id, body.groupId, body.listId);
  }

  /**
   * 移动任务及其子任务到指定清单
   * @param id 任务ID
   * @param request 请求对象，用于获取用户信息
   * @param body 请求体，包含新的清单ID
   * @returns 更新后的任务
   */
  @ApiOperation({
    summary: '移动任务及其子任务到指定清单',
    description: '将指定任务及其所有子任务移动到新的清单，并清空它们的groupId',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        listId: { type: 'string', description: '新的清单ID' },
      },
      required: ['listId'],
    },
  })
  @ApiResponse({ status: 200, description: '移动成功' })
  @ApiResponse({ status: 404, description: '任务或清单不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/move-to-list')
  async moveTaskToList(
    @Param('id') id: string,
    @Body() body: { listId: string },
    @Req() req
  ) {
    return this.todoService.moveTaskToList(id, req.user.id, body.listId);
  }

  // 批量更新任务排序
  @ApiOperation({
    summary: '批量更新任务排序',
    description: '批量更新任务的排序索引',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Post('batch-update-order')
  @HttpCode(HttpStatus.CREATED)
  async batchUpdateOrder(@Body() dto: BatchUpdateOrderDto, @Req() req) {
    return this.todoService.batchUpdateOrder(dto, req.user.id);
  }

  // 恢复已删除的任务
  @ApiOperation({
    summary: '恢复已删除的任务',
    description: '从回收站恢复指定的已删除任务',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @ApiResponse({ status: 404, description: '回收站中未找到该任务' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/restore')
  async restore(@Param('id') id: string, @Req() req) {
    await this.todoService.restore(id, req.user.id);
    return { message: '任务已成功恢复' };
  }

  // 删除任务（软删除）
  @ApiOperation({
    summary: '删除任务',
    description: '将任务移至回收站（软删除）',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.todoService.remove(id, req.user.id);
  }

  // 硬删除单个任务
  @ApiOperation({
    summary: '硬删除单个任务',
    description: '不经过回收站，直接从数据库删除指定任务及其所有子任务',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/hard')
  async hardDelete(@Param('id') id: string, @Req() req): Promise<{ success: boolean; message: string }> {
    await this.todoService.hardDelete(id, req.user.id);
    return { success: true, message: '任务已成功硬删除' };
  }

  // 硬删除所有任务
  @ApiOperation({
    summary: '硬删除所有任务',
    description: '不经过回收站，直接从数据库删除当前用户的所有任务',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('hard/all')
  async hardDeleteAll(@Req() req): Promise<{ success: boolean; message: string }> {
    await this.todoService.hardDeleteAll(req.user.id);
    return { success: true, message: '所有任务已成功硬删除' };
  }

  // 重复的createDemo和searchTasks函数已删除，避免重复定义错误
}

// 单复数统一接口
@ApiTags('任务管理')
@Controller('todo')
export class TodoAliasController {
  constructor(private todoService: TaskService) {}

  @ApiOperation({
    summary: '获取所有任务（别名）',
    description: '与/todos相同的功能，用于兼容性支持',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req) {
    return this.todoService.findAll(req.user.id);
  }
}