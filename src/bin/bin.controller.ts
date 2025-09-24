import { Controller, Get, Post, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { BinService } from './bin.service';
import { Bin } from './bin.entity';
import { Task } from '../todo/todo.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('bin')
export class BinController {
  constructor(private readonly binService: BinService) {}

  /**
   * 获取当前用户的所有回收站内容
   */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req): Promise<Bin[]> {
    const userId = req.user.id; // 假设用户信息存储在请求对象中
    return this.binService.findAllByUserId(userId);
  }

  /**
   * 从回收站恢复指定任务
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('restore/:id')
  async restore(@Param('id') id: string, @Request() req): Promise<Task> {
    const userId = req.user.id;
    return this.binService.restoreFromBin(id, userId);
  }

  /**
   * 从回收站永久删除指定任务
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async permanentlyDelete(@Param('id') id: string, @Request() req): Promise<{ success: boolean }> {
    const userId = req.user.id;
    const result = await this.binService.permanentlyDelete(id, userId);
    return { success: result };
  }

  /**
   * 清空回收站
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete()
  async emptyBin(@Request() req): Promise<{ success: boolean }> {
    const userId = req.user.id;
    await this.binService.emptyBin(userId);
    return { success: true };
  }
}