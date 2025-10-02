import { Controller, Get, Post, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { BinService } from './bin.service';
import { Bin } from './bin.entity';
import { Task } from '../todo/todo.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('回收站管理')
@Controller('bin')
export class BinController {
  constructor(private readonly binService: BinService) {}

  /**
   * 获取当前用户的所有回收站内容
   */
  @ApiOperation({
    summary: '获取回收站内容',
    description: '获取当前用户的所有已删除任务列表',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req): Promise<Bin[]> {
    const userId = req.user.id; // 假设用户信息存储在请求对象中
    return this.binService.findAllByUserId(userId);
  }

  /**
   * 从回收站恢复指定任务
   */
  @ApiOperation({
    summary: '恢复任务',
    description: '从回收站恢复指定ID的已删除任务',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '回收站记录ID' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Post('restore/:id')
  async restore(@Param('id') id: string, @Request() req): Promise<Task> {
    const userId = req.user.id;
    return this.binService.restoreFromBin(id, userId);
  }

  /**
   * 从回收站永久删除指定任务
   */
  @ApiOperation({
    summary: '永久删除任务',
    description: '从回收站永久删除指定ID的任务',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '回收站记录ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
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
  @ApiOperation({
    summary: '清空回收站',
    description: '清空当前用户的所有回收站内容',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '清空成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Delete()
  async emptyBin(@Request() req): Promise<{ success: boolean }> {
    const userId = req.user.id;
    await this.binService.emptyBin(userId);
    return { success: true };
  }
}