import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from '../todo/todo.service';

@ApiTags('任务管理')
@Controller()
export class SearchController {
  constructor(private readonly taskService: TaskService) {}

  // 按关键词搜索任务
  @ApiOperation({
    summary: '按关键词搜索任务',
    description: '搜索当前用户的任务中包含关键词的任务',
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'keyword', description: '搜索关键词', required: true })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get('search')
  async searchTasks(@Query('keyword') keyword: string, @Req() req) {
    return this.taskService.searchTasks(req.user.id, keyword);
  }
}