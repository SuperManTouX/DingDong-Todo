import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FocusRecordService } from './focus-record.service';
import { CreateFocusRecordDto, UpdateFocusRecordDto } from './focus-record.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('专注记录')
@Controller('focus-records')
export class FocusRecordController {
  constructor(private readonly focusRecordService: FocusRecordService) {}

  /**
   * 创建专注记录
   */
  @ApiOperation({
    summary: '创建专注记录',
    description: '创建一条新的专注记录',
  })
  @ApiBearerAuth()
  @ApiBody({
    description: '专注记录创建数据',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createFocusRecordDto: CreateFocusRecordDto,
    @Request() req,
  ) {
    return await this.focusRecordService.create(createFocusRecordDto, req.user.id);
  }

  /**
   * 获取当前用户的所有专注记录
   */
  @ApiOperation({
    summary: '获取所有专注记录',
    description: '获取当前用户的所有专注记录列表',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req) {
    return await this.focusRecordService.findAllByUserId(req.user.id);
  }

  /**
   * 获取指定ID的专注记录
   */
  @ApiOperation({
    summary: '获取单个专注记录',
    description: '根据ID获取特定的专注记录详情',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '专注记录ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.focusRecordService.findOne(id, req.user.id);
  }

  /**
   * 更新专注记录
   */
  @ApiOperation({
    summary: '更新专注记录',
    description: '更新指定ID的专注记录信息',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '专注记录ID' })
  @ApiBody({
    description: '专注记录更新数据',
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFocusRecordDto: UpdateFocusRecordDto,
    @Request() req,
  ) {
    return await this.focusRecordService.update(id, updateFocusRecordDto, req.user.id);
  }

  /**
   * 删除专注记录
   */
  @ApiOperation({
    summary: '删除专注记录',
    description: '删除指定ID的专注记录',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '专注记录ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return await this.focusRecordService.delete(id, req.user.id);
  }

  /**
   * 获取指定任务的专注记录
   */
  @ApiOperation({
    summary: '获取任务专注记录',
    description: '获取指定任务的所有专注记录',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get('task/:taskId')
  async findByTaskId(@Param('taskId') taskId: string, @Request() req) {
    return await this.focusRecordService.findByTaskId(taskId, req.user.id);
  }

  /**
   * 获取专注统计信息
   */
  @ApiOperation({
    summary: '获取专注统计',
    description: '获取当前用户的专注统计信息',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseGuards(AuthGuard('jwt'))
  @Get('stats/summary')
  async getStatistics(@Request() req) {
    return await this.focusRecordService.getStatistics(req.user.id);
  }
}