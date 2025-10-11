import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { TodoTagService } from './todo-tag.service';
import { TodoTag } from './todo-tag.entity';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../todo/todo.entity';
import { TaskTag } from '../task-tag/task-tag.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@ApiTags('标签管理')
@Controller('todo-tags')
export class TodoTagController {
  constructor(
    private readonly todoTagService: TodoTagService,
    @InjectRepository(TaskTag) 
    private taskTagRepository: Repository<TaskTag>,
    @InjectRepository(Task) 
    private taskRepository: Repository<Task>,
    @Inject(EventEmitter2)
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * 获取当前用户的所有标签
   */
  @ApiOperation({
    summary: '获取所有标签',
    description: '获取当前用户创建的所有标签列表',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req): Promise<TodoTag[]> {
    const userId = req.user.id;
    return this.todoTagService.findAllByUserId(userId);
  }

  /**
   * 获取当前用户的单个标签
   */
  @ApiOperation({
    summary: '获取单个标签',
    description: '根据ID获取特定标签的详细信息',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req): Promise<TodoTag> {
    const userId = req.user.id;
    return this.todoTagService.findOne(id, userId);
  }

  /**
   * 创建新标签
   */
  @ApiOperation({
    summary: '创建标签',
    description: '创建一个新的任务标签',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '标签名称', example: '重要' },
        parentId: { type: 'string', description: '父标签ID', nullable: true },
        color: { type: 'string', description: '标签颜色', example: '#ff0000' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createDto: { name: string; parentId?: string; color?: string }, @Req() req): Promise<TodoTag> {
    const userId = req.user.id;
    const createdTag = await this.todoTagService.create(createDto.name, userId, createDto.parentId, createDto.color);
    
    // 触发标签更新事件
    this.eventEmitter.emit('tag.updated', {
      type: 'create',
      tag: createdTag,
      userId,
      timestamp: new Date(),
    });
    
    return createdTag;
  }

  /**
   * 更新标签信息
   */
  @ApiOperation({
    summary: '更新标签',
    description: '更新指定ID的标签信息',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '标签名称' },
        color: { type: 'string', description: '标签颜色' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: { name?: string; color?: string }, @Req() req): Promise<TodoTag> {
    const userId = req.user.id;
    const updatedTag = await this.todoTagService.update(id, { name: updateDto.name, color: updateDto.color }, userId);
    
    // 触发标签更新事件
    this.eventEmitter.emit('tag.updated', {
      type: 'update',
      tag: updatedTag,
      userId,
      timestamp: new Date(),
    });
    
    return updatedTag;
  }

  /**
   * 删除标签
   */
  @ApiOperation({
    summary: '删除标签',
    description: '删除指定ID的标签',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.todoTagService.delete(id, userId);
    
    // 触发标签更新事件
    this.eventEmitter.emit('tag.updated', {
      type: 'delete',
      tag: null, // 删除操作不返回标签数据
      tagId: id, // 但需要提供被删除的标签ID
      userId,
      timestamp: new Date(),
    });
    
    return { message: '标签删除成功' };
  }

  /**
   * 获取task_tag对应关系
   */
  @ApiOperation({
    summary: '获取标签映射关系',
    description: '获取当前用户任务与标签的映射关系',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get('task-tag-mappings')
  async getTaskTagMappings(@Req() req): Promise<Array<{ taskId: string; tagId: string }>> {
    const userId = req.user.id;
    
    // 获取当前用户的所有任务
    const userTasks = await this.taskRepository.find({
      where: { userId },
      select: ['id'],
    });
    
    const taskIds = userTasks.map(task => task.id);
    
    // 获取这些任务的标签映射关系
    const mappings = await this.taskTagRepository.find({
      where: { taskId: In(taskIds) },
      select: ['taskId', 'tagId'],
    });
    
    return mappings;
  }
}