import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { TaskGroupService } from './task-group.service';
import { TaskGroup } from './task-group.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('分组管理')
@Controller('task-groups')
export class TaskGroupController {
  constructor(private readonly taskGroupService: TaskGroupService) {}

  /**
   * 获取当前用户的所有分组
   */
  @ApiOperation({
    summary: '获取所有分组',
    description: '获取当前用户创建的所有分组列表',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req): Promise<TaskGroup[]> {
    const userId = req.user.id;
    return this.taskGroupService.findAllByUserId(userId);
  }

  /**
   * 获取当前用户的单个分组
   */
  @ApiOperation({
    summary: '获取单个分组',
    description: '根据ID获取特定分组的详细信息',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '分组ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '分组不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req): Promise<TaskGroup> {
    const userId = req.user.id;
    return this.taskGroupService.findOne(id, userId);
  }

  /**
   * 创建新分组
   */
  @ApiOperation({
    summary: '创建分组',
    description: '创建一个新的任务分组',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        listId: { type: 'string', description: '所属清单ID' },
        groupName: { type: 'string', description: '分组名称', example: '今日任务' },
      },
      required: ['listId', 'groupName'],
    },
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createDto: { listId: string; groupName: string }, @Req() req): Promise<TaskGroup> {
    const userId = req.user.id;
    return this.taskGroupService.create(createDto.listId, createDto.groupName, userId);
  }

  /**
   * 更新分组信息
   */
  @ApiOperation({
    summary: '更新分组',
    description: '更新指定ID的分组信息',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '分组ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        groupName: { type: 'string', description: '分组名称' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '分组不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: { groupName: string }, @Req() req): Promise<TaskGroup> {
    const userId = req.user.id;
    return this.taskGroupService.update(id, updateDto.groupName, userId);
  }

  /**
   * 删除分组
   */
  @ApiOperation({
    summary: '删除分组',
    description: '删除指定ID的分组',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '分组ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '分组不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.taskGroupService.delete(id, userId);
    return { message: '分组删除成功' };
  }
}