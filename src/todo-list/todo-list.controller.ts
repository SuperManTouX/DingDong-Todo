import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { TodoListService } from './todo-list.service';
import { TodoList } from './todo-list.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('todo-lists')
export class TodoListController {
  constructor(private readonly todoListService: TodoListService) {}

  /**
   * 获取当前用户的所有清单
   */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req): Promise<TodoList[]> {
    const userId = req.user.id;
    return this.todoListService.findAllByUserId(userId);
  }

  /**
   * 获取当前用户的单个清单
   */
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req): Promise<TodoList> {
    const userId = req.user.id;
    return this.todoListService.findOne(id, userId);
  }

  /**
   * 创建新清单
   */
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createDto: { title: string; emoji?: string; color?: string }, @Req() req): Promise<TodoList> {
    const userId = req.user.id;
    return this.todoListService.create(createDto, userId);
  }

  /**
   * 更新清单信息
   */
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: { title?: string; emoji?: string; color?: string }, @Req() req): Promise<TodoList> {
    const userId = req.user.id;
    return this.todoListService.update(id, updateDto, userId);
  }

  /**
   * 删除清单
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.todoListService.delete(id, userId);
    return { message: '清单删除成功' };
  }
}