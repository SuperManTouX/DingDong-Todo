import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { TodoListService } from './todo-list.service';
import { TodoList } from './todo-list.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('清单管理')
@Controller('todo-lists')
export class TodoListController {
  constructor(private readonly todoListService: TodoListService) {}

  /**
   * 获取当前用户的所有清单
   */
  @ApiOperation({
    summary: '获取所有清单',
    description: '获取当前用户创建的所有清单列表',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req): Promise<TodoList[]> {
    const userId = req.user.id;
    return this.todoListService.findAllByUserId(userId);
  }

  /**
   * 获取当前用户的单个清单
   */
  @ApiOperation({
    summary: '获取单个清单',
    description: '根据ID获取特定清单的详细信息',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '清单ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '清单不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req): Promise<TodoList> {
    const userId = req.user.id;
    return this.todoListService.findOne(id, userId);
  }

  /**
   * 创建新清单
   */
  @ApiOperation({
    summary: '创建清单',
    description: '创建一个新的清单',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '清单名称', example: '工作计划' },
        emoji: { type: 'string', description: '清单表情（可选）' },
        color: { type: 'string', description: '清单颜色（可选）' },
      },
      required: ['title'],
    },
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createDto: { title: string; emoji?: string; color?: string }, @Req() req): Promise<TodoList> {
    const userId = req.user.id;
    return this.todoListService.create(createDto, userId);
  }

  /**
   * 更新清单信息
   */
  @ApiOperation({
    summary: '更新清单',
    description: '更新指定ID的清单信息',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '清单ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '清单名称' },
        emoji: { type: 'string', description: '清单表情' },
        color: { type: 'string', description: '清单颜色' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '清单不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: { title?: string; emoji?: string; color?: string }, @Req() req): Promise<TodoList> {
    const userId = req.user.id;
    return this.todoListService.update(id, updateDto, userId);
  }

  /**
   * 删除清单
   */
  @ApiOperation({
    summary: '删除清单',
    description: '删除指定ID的清单',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '清单ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '清单不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.todoListService.delete(id, userId);
    return { message: '清单删除成功' };
  }
}