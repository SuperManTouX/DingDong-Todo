import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HabitService } from './habit.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CreateHabitCheckInDto } from './dto/create-habit-check-in.dto';
import { Habit } from './habit.entity';
import { HabitCheckIn, CheckInStatus } from './habit-check-in.entity';
import { HabitStreak } from './habit-streak.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@Controller('habits')
@ApiTags('习惯打卡')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class HabitController {
  constructor(private habitService: HabitService) {}

  @Post()
  @ApiOperation({ summary: '创建新习惯' })
  @ApiResponse({ status: 201, description: '习惯创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiBody({ type: CreateHabitDto })
  async createHabit(
    @Req() req,
    @Body() createHabitDto: CreateHabitDto,
  ): Promise<Habit> {
    return this.habitService.createHabit(req.user, createHabitDto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户的所有习惯' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({
    name: 'includeArchived',
    required: false,
    description: '是否包含已归档的习惯',
    type: Boolean,
  })
  async getUserHabits(
    @Req() req,
    @Query('includeArchived') includeArchived: boolean = false,
  ): Promise<any[]> {
    return this.habitService.getUserHabits(req.user, includeArchived);
  }

  @Get(':habitId')
  @ApiOperation({ summary: '获取单个习惯详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '习惯不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiParam({ name: 'habitId', description: '习惯ID' })
  @ApiQuery({ name: 'date', required: false, description: '年月，格式为YYYY-MM', type: String })
  async getHabitById(
    @Param('habitId') habitId: string,
    @Req() req,
    @Query('date') date?: string,
  ): Promise<any> {
    return this.habitService.getHabitById(habitId, req.user.id, date);
  }

  @Put(':habitId')
  @ApiOperation({ summary: '更新习惯' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '习惯不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiParam({ name: 'habitId', description: '习惯ID' })
  @ApiBody({ type: UpdateHabitDto })
  async updateHabit(
    @Param('habitId') habitId: string,
    @Req() req,
    @Body() updateHabitDto: UpdateHabitDto,
  ): Promise<Habit> {
    return this.habitService.updateHabit(habitId, req.user.id, updateHabitDto);
  }

  @Delete(':habitId')
  @ApiOperation({ summary: '删除习惯（软删除）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '习惯不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiParam({ name: 'habitId', description: '习惯ID' })
  async deleteHabit(
    @Param('habitId') habitId: string,
    @Req() req,
  ): Promise<void> {
    return this.habitService.deleteHabit(habitId, req.user.id);
  }

  @Post(':habitId/check-ins')
  @ApiOperation({ summary: '创建打卡记录' })
  @ApiResponse({ status: 201, description: '打卡成功' })
  @ApiResponse({ status: 400, description: '已打卡或参数错误' })
  @ApiResponse({ status: 404, description: '习惯不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiParam({ name: 'habitId', description: '习惯ID' })
  @ApiBody({ type: CreateHabitCheckInDto })
  async createCheckIn(
    @Param('habitId') habitId: string,
    @Req() req,
    @Body() createCheckInDto: CreateHabitCheckInDto,
  ): Promise<HabitCheckIn> {
    return this.habitService.createCheckIn(habitId, req.user, createCheckInDto);
  }

  @Post(':habitId/toggle-check-in')
  @ApiOperation({ summary: '切换打卡状态' })
  @ApiResponse({ status: 200, description: '状态切换成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '习惯不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiParam({ name: 'habitId', description: '习惯ID' })
  async toggleCheckInStatus(
    @Param('habitId') habitId: string,
    @Body() body: { checkInDate: Date; status?: CheckInStatus | null },
    @Req() req,
  ): Promise<any> {
    return this.habitService.toggleCheckInStatus(habitId, req.user.id, body.checkInDate, body.status);
  }

  @Get(':habitId/check-ins')
  @ApiOperation({ summary: '获取习惯的打卡记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '习惯不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiParam({ name: 'habitId', description: '习惯ID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: '开始日期',
    type: Date,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: '结束日期',
    type: Date,
  })
  async getCheckIns(
    @Param('habitId') habitId: string,
    @Req() req,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ): Promise<HabitCheckIn[]> {
    return this.habitService.getCheckIns(habitId, req.user.id, startDate, endDate);
  }

  @Get(':habitId/streak')
  @ApiOperation({ summary: '获取习惯的连续打卡统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '习惯不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiParam({ name: 'habitId', description: '习惯ID' })
  async getHabitStreak(
    @Param('habitId') habitId: string,
    @Req() req,
  ): Promise<HabitStreak> {
    return this.habitService.getHabitStreak(habitId, req.user.id);
  }
}