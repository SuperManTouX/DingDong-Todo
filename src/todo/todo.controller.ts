import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { TaskService } from './todo.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('todos')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  /**
   * 获取当前用户的所有任务
   */
  @UseGuards(AuthGuard('jwt'))
  @Get()
async findAll(@Req() req): Promise<any[]> {
    const userId = req.user.id;
    return this.taskService.findAllByUserId(userId);
  }

  /**
   * 获取当前用户的单个任务
   */
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
async findOne(@Param('id') id: string, @Req() req): Promise<any | null> {
    const userId = req.user.id;
    return this.taskService.findOne(id, userId);
  }

  /**
   * 创建新任务
   */
  @UseGuards(AuthGuard('jwt'))
  @Post()
async create(@Body() task: any, @Req() req): Promise<any> {
    // 确保任务属于当前用户
    task.userId = req.user.id;
    return this.taskService.create(task);
  }

  /**
   * 更新任务信息
   */
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
async update(@Param('id') id: string, @Body() task: any, @Req() req): Promise<any | null> {
    const userId = req.user.id;
    const updatedTask = await this.taskService.update(id, task, userId);
    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return updatedTask;
  }

  /**
   * 删除任务
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.taskService.delete(id, userId);
    return { message: 'Task deleted successfully' };
  }
  
  // 创建一个用于演示的带标签任务
  @Post('/demo')
  async createDemoTask() {
    return this.taskService.createTestTask();
  }
}