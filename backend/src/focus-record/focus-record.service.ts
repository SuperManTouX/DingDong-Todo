import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FocusRecord } from './focus-record.entity';
import { CreateFocusRecordDto, UpdateFocusRecordDto } from './focus-record.dto';

@Injectable()
export class FocusRecordService {
  constructor(
    @InjectRepository(FocusRecord)
    private focusRecordRepository: Repository<FocusRecord>,
  ) {}

  // 创建专注记录
  async create(dto: CreateFocusRecordDto, userId: string): Promise<FocusRecord> {
    const now = new Date();
    const focusRecord = this.focusRecordRepository.create({
      id: `focus-${uuidv4().split('-')[0].substring(0, 3).padStart(3, '0')}`,
      ...dto,
      user_id: userId,
      created_at: now,
      updated_at: now
    });
    return await this.focusRecordRepository.save(focusRecord);
  }

  // 获取用户的所有专注记录
  async findAllByUserId(userId: string): Promise<FocusRecord[]> {
    return await this.focusRecordRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // 根据ID获取专注记录
  async findOne(id: string, userId: string): Promise<FocusRecord> {
    const focusRecord = await this.focusRecordRepository.findOne({
      where: { id, user_id: userId },
    });
    if (!focusRecord) {
      throw new NotFoundException('专注记录不存在');
    }
    return focusRecord;
  }

  // 更新专注记录
  async update(
    id: string,
    dto: UpdateFocusRecordDto,
    userId: string,
  ): Promise<FocusRecord> {
    const focusRecord = await this.findOne(id, userId);
    
    // 因为end_time现在是必填的，所以我们总是可以设置completed为true
    dto.completed = true;
    
    // 数据库触发器会自动处理持续时间计算
    await this.focusRecordRepository.update(id, dto);
    return await this.findOne(id, userId);
  }

  // 删除专注记录
  async delete(id: string, userId: string): Promise<{id: string, userId: string}> {
    const focusRecord = await this.findOne(id, userId);
    await this.focusRecordRepository.delete(id);
    return { id, userId };
  }

  // 获取用户指定任务的专注记录
  async findByTaskId(taskId: string, userId: string): Promise<FocusRecord[]> {
    return await this.focusRecordRepository.find({
      where: { task_id: taskId, user_id: userId },
      order: { start_time: 'DESC' },
    });
  }

  // 获取用户的专注统计
  async getStatistics(userId: string): Promise<any> {
    const records = await this.focusRecordRepository.find({
      where: { user_id: userId, completed: true },
    });

    const totalPomodoros = records.filter(r => r.mode === 'pomodoro').length;
    const totalNormalSessions = records.filter(r => r.mode === 'normal').length;
    
    // 计算总专注时间（分钟），优先使用duration_minutes字段
    const totalMinutes = records.reduce((sum, record) => {
      if (record.duration_minutes) {
        return sum + record.duration_minutes;
      } else {
        // 由于end_time现在是必填的，不需要检查null
        const duration = (record.end_time.getTime() - record.start_time.getTime()) / (1000 * 60);
        return sum + duration;
      }
    }, 0);

    return {
      total_records: records.length,
      total_pomodoros: totalPomodoros,
      total_normal_sessions: totalNormalSessions,
      total_minutes: Math.round(totalMinutes),
      total_hours: Math.round(totalMinutes / 60 * 100) / 100,
    };
  }
}