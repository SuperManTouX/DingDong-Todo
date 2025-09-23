import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { TaskService } from './todo.service';

@Controller('todos')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
async findAll(): Promise<any[]> {
    return this.taskService.findAll();
  }

  @Get(':id')
async findOne(@Param('id') id: string): Promise<any | null> {
    const task = await this.taskService.findOne(id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  @Post()
async create(@Body() task: any): Promise<any> {
    return this.taskService.create(task);
  }

  @Put(':id')
async update(@Param('id') id: string, @Body() task: any): Promise<any | null> {
    const updatedTask = await this.taskService.update(id, task);
    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return updatedTask;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    const deleted = await this.taskService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return { message: 'Task deleted successfully' };
  }
  
  // 创建一个用于演示的带标签任务
  @Post('/demo')
  async createDemoTask() {
    return this.taskService.createTestTask();
  }
}