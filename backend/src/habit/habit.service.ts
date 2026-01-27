import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Habit } from './habit.entity';
import { HabitCheckIn, CheckInStatus } from './habit-check-in.entity';
import { HabitStreak } from './habit-streak.entity';
import { User } from '../user/user.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CreateHabitCheckInDto } from './dto/create-habit-check-in.dto';
import { SseService } from '../sse/sse.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class HabitService {
  constructor(
    @InjectRepository(Habit) private habitRepository: Repository<Habit>,
    @InjectRepository(HabitCheckIn) private checkInRepository: Repository<HabitCheckIn>,
    @InjectRepository(HabitStreak) private streakRepository: Repository<HabitStreak>,
    private sseService: SseService,
    private eventEmitter: EventEmitter2,
  ) {}

  // 创建新习惯
  async createHabit(user: User, createHabitDto: CreateHabitDto): Promise<Habit> {
    // 转换customFrequency为数据库格式
    const customFrequencyDays = createHabitDto.customFrequency && createHabitDto.customFrequency.days
      ? createHabitDto.customFrequency.days.join(',')
      : undefined;

    // 移除不需要的属性
    const { customFrequency, ...habitData } = createHabitDto;

    // 创建习惯对象，包含startDate和targetDays
    const habit = this.habitRepository.create({
      ...habitData,
      customFrequencyDays,
      user,
      // 确保字段映射正确
      startDate: createHabitDto.start_date,
      targetDays: createHabitDto.target_days,
    });

    const savedHabit = await this.habitRepository.save(habit);
    
    // 初始化连续打卡统计
    const streak = this.streakRepository.create({
      habit: savedHabit,
      user,
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
    });
    
    await this.streakRepository.save(streak);
    
    // 通过SSE发送习惯创建事件
    try {
      // 发送习惯更新事件
      await this.sseService.sendHabitUpdate(user.id, {
        entity: 'habit',
        action: 'created',
        habitId: savedHabit.id,
        data: savedHabit,
        stats: {
          currentStreak: 0,
          longestStreak: 0,
          totalDays: 0,
          isCompletedToday: false,
        },
        timestamp: new Date(),
      });
      
      console.log(`已通过SSE发送习惯创建事件: ${savedHabit.id}`);
    } catch (error) {
      console.error('发送SSE消息失败:', error);
      // SSE发送失败不应影响习惯创建，只记录错误
    }
    
    return savedHabit;
  }

  // 获取用户的所有习惯，包含统计信息
  async getUserHabits(user: User, includeArchived: boolean = false): Promise<any[]> {
    // 使用TypeORM的原生查询，但采用更简单的参数绑定方式
    const habitsWithStats = await this.habitRepository.query(
      `SELECT 
         h.*, 
         COALESCE(hs.current_streak, 0) as currentStreak, 
         COALESCE(hs.total_check_ins, 0) as totalDays,
         (SELECT COUNT(*) FROM habit_check_in hci 
          WHERE hci.habit_id = h.id AND hci.user_id = ? 
          AND DATE(hci.check_in_date) = DATE(NOW())) > 0 as isCompletedToday
       FROM habit h
       LEFT JOIN habit_streak hs ON h.id = hs.habit_id AND hs.user_id = ?
       WHERE h.user_id = ?
       AND (h.is_deleted = ? OR ? = TRUE)`,
      [user.id, user.id, user.id, false, includeArchived]
    );
    
    // 转换结果格式
    return habitsWithStats.map(habit => ({
      ...habit,
      currentStreak: Number(habit.currentStreak),
      totalDays: Number(habit.totalDays),
      isCompletedToday: Boolean(habit.isCompletedToday)
    }));
  }

  // 获取单个习惯详情
  async getHabitById(habitId: string, userId: string, date?: string): Promise<any> {
    // 验证习惯存在
    const habit = await this.habitRepository
      .createQueryBuilder('habit')
      .where('habit.id = :habitId AND habit.user_id = :userId', { habitId, userId })
      .getOne();

    if (!habit) {
      throw new NotFoundException('习惯不存在');
    }

    // 如果没有提供日期参数，返回习惯基本信息和统计数据
    if (!date) {
      // 获取连续打卡统计
      const streak = await this.streakRepository.findOne({
        where: { habit: { id: habitId }, user: { id: userId } },
      });
      
      // 获取当前年月
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      // 计算日期范围：当月 + 上月最后7天 + 下月前7天
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0); // 获取当月最后一天
      
      // 上月最后7天
      const startDate = new Date(monthStart);
      startDate.setDate(startDate.getDate() - 7);
      
      // 下月前7天
      const endDate = new Date(year, month, 7);
      endDate.setHours(23, 59, 59, 999);
      
      // 查询当月打卡记录
      const checkIns = await this.checkInRepository
        .createQueryBuilder('checkIn')
        .where('checkIn.habit_id = :habitId', { habitId })
        .andWhere('checkIn.check_in_date >= :startDate', { startDate })
        .andWhere('checkIn.check_in_date <= :endDate', { endDate })
        .getMany();
      
      // 计算当月打卡天数（只统计completed状态且在当月范围内的记录）
      const monthCheckInDays = checkIns.filter(checkIn => {
        const checkInDate = new Date(checkIn.checkInDate);
        return checkIn.status === 'completed' && 
               checkInDate >= monthStart && 
               checkInDate <= monthEnd;
      }).length;
      
      // 计算当月完成率
      const daysInMonth = monthEnd.getDate();
      const completionRate = Math.round((monthCheckInDays / daysInMonth) * 100) / 100;
      
      // 返回习惯基本信息和统计数据，将name属性重命名为title
      const { name, ...habitWithoutName } = habit;
      return {
        ...habitWithoutName,
        title: name,
        monthCheckInDays,
        completionRate,
        totalCheckInDays: streak?.totalDays || 0,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0
      };
    }

    // 从YYYY-MM格式解析出年份和月份
    const match = date.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      throw new BadRequestException('日期格式无效，请使用YYYY-MM格式');
    }
    
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    
    // 验证月份范围
    if (month < 1 || month > 12) {
      throw new BadRequestException('月份无效，必须在1-12之间');
    }

    // 计算日期范围：当月 + 上月最后7天 + 下月前7天
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // 获取当月最后一天
    
    // 上月最后7天
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - 7);
    
    // 下月前7天
    const endDate = new Date(year, month, 7);
    endDate.setHours(23, 59, 59, 999);

    // 查询当月打卡记录
    const checkIns = await this.checkInRepository
      .createQueryBuilder('checkIn')
      .where('checkIn.habit_id = :habitId', { habitId })
      .andWhere('checkIn.check_in_date >= :startDate', { startDate })
      .andWhere('checkIn.check_in_date <= :endDate', { endDate })
      .getMany();

    // 构建dateStatuses数组
    const dateStatuses = checkIns.map(checkIn => {
      const date = new Date(checkIn.checkInDate);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return {
        date: formattedDate,
        status: checkIn.status === 'completed' ? 'completed' : 
                checkIn.status === 'abandoned' ? 'abandoned' : null
      };
    });

    // 计算当月打卡天数（只统计completed状态且在当月范围内的记录）
    const monthCheckInDays = checkIns.filter(checkIn => {
      const checkInDate = new Date(checkIn.checkInDate);
      return checkIn.status === 'completed' && 
             checkInDate >= monthStart && 
             checkInDate <= monthEnd;
    }).length;
    
    // 计算当月完成率
    const daysInMonth = monthEnd.getDate();
    const completionRate = Math.round((monthCheckInDays / daysInMonth) * 100) / 100;

    // 获取连续打卡统计
    const streak = await this.streakRepository.findOne({
      where: { habit: { id: habitId }, user: { id: userId } },
    });

    // 返回完整数据，将name属性重命名为title
    const { name, ...habitWithoutName } = habit;
    return {
      ...habitWithoutName,
      title: name,
      dateStatuses,
      monthCheckInDays,
      completionRate,
      totalCheckInDays: streak?.totalDays || 0,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0
    };
  }

  // 更新习惯
  async updateHabit(habitId: string, userId: string, updateHabitDto: UpdateHabitDto): Promise<Habit> {
    const habit = await this.getHabitById(habitId, userId);
    
    // 转换customFrequency为数据库格式
    const customFrequencyDays = updateHabitDto.customFrequency && updateHabitDto.customFrequency.days
      ? updateHabitDto.customFrequency.days.join(',')
      : undefined;
    
    // 移除不需要的属性并创建更新对象
    const { customFrequency, ...updateData } = updateHabitDto;
    
    Object.assign(habit, updateData);
    
    // 只有当customFrequency存在时才更新customFrequencyDays
    if (updateHabitDto.customFrequency) {
      habit.customFrequencyDays = customFrequencyDays;
    }
    
    return this.habitRepository.save(habit);
  }

  // 删除习惯
  async deleteHabit(habitId: string, userId: string): Promise<void> {
    const habit = await this.getHabitById(habitId, userId);
    
    // 软删除 - 改为已删除
    habit.isArchived = true; // This maps to is_deleted in the database
    await this.habitRepository.save(habit);
  }

  // 创建打卡记录
  async createCheckIn(habitId: string, user: User, createCheckInDto: CreateHabitCheckInDto): Promise<HabitCheckIn> {
    const habit = await this.getHabitById(habitId, user.id);
    
    // 检查是否已经打卡
    const existingCheckIn = await this.checkInRepository
      .createQueryBuilder('checkIn')
      .where('checkIn.habit.id = :habitId', { habitId })
      .andWhere('DATE(checkIn.checkInDate) = DATE(:checkInDate)', { checkInDate: createCheckInDto.checkInDate })
      .getOne();

    if (existingCheckIn) {
      throw new BadRequestException('今天已经打卡过了');
    }

    const checkIn = this.checkInRepository.create({
      habit,
      user,
      ...createCheckInDto,
    });

    const savedCheckIn = await this.checkInRepository.save(checkIn);
    
    // 更新连续打卡统计
    await this.updateStreak(habitId, createCheckInDto.checkInDate, createCheckInDto.status || CheckInStatus.COMPLETED);
    
    // 发送SSE事件
    this.emitHabitUpdateEvent(user.id, habitId, 'created', savedCheckIn);
    
    return savedCheckIn;
  }

  async toggleCheckInStatus(habitId: string, userId: string, checkInDate: Date, status?: CheckInStatus | null) {
    // 检查习惯是否存在
    const habit = await this.habitRepository.findOne({ where: { id: habitId, user: { id: userId } } });
    if (!habit) {
      throw new NotFoundException(`习惯不存在`);
    }

    // 标准化日期（仅保留年月日）
    const normalizedDate = new Date(checkInDate);
    normalizedDate.setHours(0, 0, 0, 0);
    
    // 查找是否已经存在打卡记录
    const existingCheckIn = await this.checkInRepository.findOne({
      where: {
        habit: { id: habitId },
        user: { id: userId },
        checkInDate: normalizedDate,
      },
    });

    let result;
    let action;

    // 处理已存在记录的情况
    if (existingCheckIn) {
      if (existingCheckIn.status === CheckInStatus.COMPLETED && !status) {
        // 如果存在已完成的打卡记录且没有指定新状态，则删除它（切换为未完成）
        await this.checkInRepository.delete(existingCheckIn.id);
        result = null;
        action = 'deleted';
      } else {
        // 更新现有记录的状态
        existingCheckIn.status = status === undefined ? CheckInStatus.COMPLETED : status;
        existingCheckIn.updatedAt = new Date();
        result = await this.checkInRepository.save(existingCheckIn);
        action = 'updated';
      }
    } else {
      // 创建新记录
      const now = new Date();
      const newCheckIn = this.checkInRepository.create({
        habit,
        user: { id: userId } as User,
        checkInDate: normalizedDate,
        status: status === undefined ? CheckInStatus.COMPLETED : status,
        createdAt: now,
        updatedAt: now
      });
      result = await this.checkInRepository.save(newCheckIn);
      action = 'created';
    }

    // 保存原始状态用于统计更新
    const originalStatus = existingCheckIn?.status;
    
    // 更新连续打卡统计，只有当status不为null且不是undefined时才调用
    if (status !== null && status !== undefined) {
      await this.updateStreak(habitId, checkInDate, status);
    }
    
    // 发送SSE事件，包含最新统计数据
    await this.emitHabitUpdateEvent(userId, habitId, action, result);
    
    return { action, data: result };
  }

  private async emitHabitUpdateEvent(userId: string, habitId: string, action: string, data: any) {
    // 获取最新的习惯统计数据
    const stats = await this.getHabitStreak(habitId, userId);
    
    // 使用event-emitter2广播事件
    this.eventEmitter.emit('habit.updated', {
      userId,
      habitId,
      action,
      data,
      stats, // 添加统计数据
      timestamp: new Date(),
    });
    
    console.log(`已发送习惯更新事件: ${action}，习惯ID: ${habitId}，用户ID: ${userId}`);
  }

  // 更新连续打卡统计
  private async updateStreak(habitId: string, checkInDate: Date, status: CheckInStatus): Promise<void> {
    const streak = await this.streakRepository.findOne({
      where: { habit: { id: habitId } },
    });

    if (!streak) return;

    // 只有完成状态才更新统计
    if (status === CheckInStatus.COMPLETED) {
      streak.totalDays += 1;
      
      // 计算连续打卡
      if (streak.lastCheckInDate) {
        const lastDate = new Date(streak.lastCheckInDate);
        const currentDate = new Date(checkInDate);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // 如果是连续的一天
        if (diffDays === 1) {
          streak.currentStreak += 1;
        } else if (diffDays > 1) {
          // 中断了，重置连续打卡
          streak.currentStreak = 1;
        }
      } else {
        // 第一次打卡
        streak.currentStreak = 1;
      }
      
      // 更新最长连续打卡记录
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
      streak.lastCheckInDate = checkInDate;
    }

    await this.streakRepository.save(streak);
  }

  // 获取打卡记录
  async getCheckIns(habitId: string, userId: string, startDate?: Date, endDate?: Date): Promise<HabitCheckIn[]> {
    await this.getHabitById(habitId, userId); // 验证习惯归属
    
    const query = this.checkInRepository
      .createQueryBuilder('checkIn')
      .where('checkIn.habit.id = :habitId', { habitId });

    if (startDate) {
      query.andWhere('checkIn.checkInDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('checkIn.checkInDate <= :endDate', { endDate });
    }

    return query.orderBy('checkIn.checkInDate', 'DESC').getMany();
  }

  // 获取连续打卡统计
  async getHabitStreak(habitId: string, userId: string): Promise<any> {
    await this.getHabitById(habitId, userId); // 验证习惯归属
    
    const streak = await this.streakRepository.findOne({
      where: { habit: { id: habitId } },
    });

    if (!streak) {
      throw new NotFoundException('打卡统计不存在');
    }
    
    // 计算当月打卡天数和完成率
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    
    // 查询当月完成的打卡记录
    const monthCheckIns = await this.checkInRepository.count({
      where: {
        habit: { id: habitId },
        user: { id: userId },
        status: CheckInStatus.COMPLETED,
        checkInDate: Between(monthStart, monthEnd),
      },
    });
    
    // 计算当月完成率
    const daysInMonth = monthEnd.getDate();
    const completionRate = daysInMonth > 0 
      ? Math.round((monthCheckIns / daysInMonth) * 100) / 100 
      : 0;
    
    // 检查今天是否已完成
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayCheckIn = await this.checkInRepository.findOne({
      where: {
        habit: { id: habitId },
        user: { id: userId },
        status: CheckInStatus.COMPLETED,
        checkInDate: Between(todayStart, todayEnd),
      },
    });
    
    // 查询所有已完成的打卡记录总数
    const totalCompletedCheckIns = await this.checkInRepository.count({
      where: {
        habit: { id: habitId },
        user: { id: userId },
        status: CheckInStatus.COMPLETED,
      },
    });

    // 计算连续打卡天数：从当前系统时间一直朝前检查status是否为completed
    let currentStreak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    // 循环向前检查，直到找到未完成的日期
    while (true) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const hasCheckIn = await this.checkInRepository.findOne({
        where: {
          habit: { id: habitId },
          user: { id: userId },
          status: CheckInStatus.COMPLETED,
          checkInDate: Between(dayStart, dayEnd),
        },
      });
      
      if (!hasCheckIn) {
        // 如果当天没有完成打卡记录，则终止连续天数计算
        break;
      }
      
      // 如果当天完成打卡，增加连续天数
      currentStreak++;
      
      // 向前移动一天
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // 如果当前连续天数超过最高连续天数，更新数据库中的最高连续天数
    if (currentStreak > streak.longestStreak) {
      streak.longestStreak = currentStreak;
      await this.streakRepository.save(streak);
    }
    
    // 获取最后一次打卡日期
    const lastCheckIn = await this.checkInRepository.findOne({
      where: {
        habit: { id: habitId },
        user: { id: userId },
        status: CheckInStatus.COMPLETED,
      },
      order: { checkInDate: 'DESC' },
    });

    // 返回不包含id字段的对象
    return {
      currentStreak, // 从当前时间向前计算的连续天数
      longestStreak: streak.longestStreak, // 保持使用数据库中的最长连续天数
      totalCheckInDays: totalCompletedCheckIns, // 所有status为completed的天数
      lastCheckInDate: lastCheckIn?.checkInDate || null,
      updatedAt: streak.updatedAt,
      isCompletedToday: !!todayCheckIn,
      monthCheckInDays: monthCheckIns, // 添加当月打卡天数
      completionRate, // 添加完成率
    };
  }
}