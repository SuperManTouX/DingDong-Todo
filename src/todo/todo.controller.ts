import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpStatus, HttpCode, Patch, Query } from '@nestjs/common';
import { TaskService } from './todo.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
@ApiTags('任务管理')
@Controller('todos')
export class TodoController {
  constructor(private todoService: TaskService) {}

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

  // 获取单个任务
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

  // 删除任务
  @ApiOperation({
    summary: '删除任务',
    description: '将任务移至回收站',
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

  // 创建演示任务
  @ApiOperation({
    summary: '创建演示任务',
    description: '创建带标签的演示任务',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Post('demo')
  async createDemo() {
    return this.todoService.createDemo();
  }

  // 批量更新任务顺序
  @ApiOperation({
    summary: '批量更新任务顺序',
    description: '批量更新任务的排序信息',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '任务ID' },
          orderIndex: { type: 'number', description: '排序索引' },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Put('batch-order')
  async batchUpdateOrder(@Body() tasks: any[], @Req() req) {
    return this.todoService.batchUpdateOrder(tasks, req.user.id);
  }
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