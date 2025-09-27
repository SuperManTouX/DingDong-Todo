import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { TodoTagService } from './todo-tag.service';
import { TodoTag } from './todo-tag.entity';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../todo/todo.entity';
import { TaskTag } from '../task-tag/task-tag.entity';

@Controller('todo-tags')
export class TodoTagController {
  constructor(
    private readonly todoTagService: TodoTagService,
    @InjectRepository(TaskTag) 
    private taskTagRepository: Repository<TaskTag>,
    @InjectRepository(Task) 
    private taskRepository: Repository<Task>,
  ) {}

  /**
   * 获取当前用户的所有标签
   */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req): Promise<TodoTag[]> {
    const userId = req.user.id;
    return this.todoTagService.findAllByUserId(userId);
  }

  /**
   * 获取当前用户的单个标签
   */
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req): Promise<TodoTag> {
    const userId = req.user.id;
    return this.todoTagService.findOne(id, userId);
  }

  /**
   * 创建新标签
   */
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createDto: { name: string; parentId?: string; color?: string }, @Req() req): Promise<TodoTag> {
    const userId = req.user.id;
    return this.todoTagService.create(createDto.name, userId, createDto.parentId, createDto.color);
  }

  /**
   * 更新标签信息
   */
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: { name?: string; color?: string }, @Req() req): Promise<TodoTag> {
    const userId = req.user.id;
    return this.todoTagService.update(id, { name: updateDto.name, color: updateDto.color }, userId);
  }

  /**
   * 删除标签
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.todoTagService.delete(id, userId);
    return { message: '标签删除成功' };
  }

  /**
   * 获取task_tag对应关系
   */
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