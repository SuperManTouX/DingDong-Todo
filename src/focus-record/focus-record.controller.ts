import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FocusRecordService } from './focus-record.service';
import { CreateFocusRecordDto, UpdateFocusRecordDto } from './focus-record.dto';

@Controller('focus-records')
export class FocusRecordController {
  constructor(private readonly focusRecordService: FocusRecordService) {}

  // 创建专注记录
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createFocusRecordDto: CreateFocusRecordDto,
    @Request() req,
  ) {
    return await this.focusRecordService.create(createFocusRecordDto, req.user.id);
  }

  // 获取当前用户的所有专注记录
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req) {
    return await this.focusRecordService.findAllByUserId(req.user.id);
  }

  // 获取指定ID的专注记录
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.focusRecordService.findOne(id, req.user.id);
  }

  // 更新专注记录
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFocusRecordDto: UpdateFocusRecordDto,
    @Request() req,
  ) {
    return await this.focusRecordService.update(id, updateFocusRecordDto, req.user.id);
  }

  // 删除专注记录
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return await this.focusRecordService.delete(id, req.user.id);
  }

  // 获取指定任务的专注记录
  @UseGuards(AuthGuard('jwt'))
  @Get('task/:taskId')
  async findByTaskId(@Param('taskId') taskId: string, @Request() req) {
    return await this.focusRecordService.findByTaskId(taskId, req.user.id);
  }

  // 获取专注统计信息
  @UseGuards(AuthGuard('jwt'))
  @Get('stats/summary')
  async getStatistics(@Request() req) {
    return await this.focusRecordService.getStatistics(req.user.id);
  }
}