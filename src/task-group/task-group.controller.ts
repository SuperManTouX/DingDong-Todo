import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { TaskGroupService } from './task-group.service';
import { TaskGroup } from './task-group.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('task-groups')
export class TaskGroupController {
  constructor(private readonly taskGroupService: TaskGroupService) {}

  /**
   * 获取当前用户的所有分组
   */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req): Promise<TaskGroup[]> {
    const userId = req.user.id;
    return this.taskGroupService.findAllByUserId(userId);
  }

  /**
   * 获取当前用户的单个分组
   */
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req): Promise<TaskGroup> {
    const userId = req.user.id;
    return this.taskGroupService.findOne(id, userId);
  }

  /**
   * 创建新分组
   */
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createDto: { listId: string; groupName: string }, @Req() req): Promise<TaskGroup> {
    const userId = req.user.id;
    return this.taskGroupService.create(createDto.listId, createDto.groupName, userId);
  }

  /**
   * 更新分组信息
   */
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: { groupName: string }, @Req() req): Promise<TaskGroup> {
    const userId = req.user.id;
    return this.taskGroupService.update(id, updateDto.groupName, userId);
  }

  /**
   * 删除分组
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.taskGroupService.delete(id, userId);
    return { message: '分组删除成功' };
  }
}