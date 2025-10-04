import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessThanOrEqual } from 'typeorm';
import { Task } from './todo.entity';
import { EmailService } from './email.service';

@Injectable()
export class ReminderService implements OnModuleInit {
  constructor(
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    private emailService: EmailService,
  ) {}

  // 在模块初始化时启动定时任务
  onModuleInit() {
    this.startReminderCheckInterval();
  }

  /**
   * 启动定时检查任务
   */
  private startReminderCheckInterval() {
    // 每分钟检查一次任务提醒
    setInterval(async () => {
      await this.checkAndSendReminders();
    }, 60 * 1000); // 60秒 = 1分钟
    
    console.log('任务提醒检查服务已启动，每分钟检查一次');
  }

  /**
   * 检查并发送到期提醒
   */
  private async checkAndSendReminders() {
    const now = new Date();
    
    try {
      // 查找所有需要提醒的任务
      // 条件：
      // 1. reminder_at 不为 null
      // 2. is_reminded 为 false
      // 3. reminder_at 时间小于等于当前时间
      const tasksToRemind = await this.taskRepository.find({
        where: {
          reminder_at: LessThanOrEqual(now),
          is_reminded: false,
        },
        relations: ['user'], // 加载用户信息以获取邮箱
      });

      console.log(`发现 ${tasksToRemind.length} 个需要提醒的任务`);

      // 处理每个需要提醒的任务
      for (const task of tasksToRemind) {
        if (task.user && task.user.email) {
          // 发送提醒邮件
          const emailSent = await this.emailService.sendReminderEmail(
            task.user.email,
            task.title,
            task.text || undefined,
          );

          // 如果邮件发送成功，更新任务的is_reminded状态
          if (emailSent) {
            await this.taskRepository.update(
              { id: task.id },
              { is_reminded: true },
            );
            console.log(`任务 ${task.id} 的提醒状态已更新为已提醒`);
          }
        } else {
          console.warn(`任务 ${task.id} 的用户没有邮箱信息，无法发送提醒`);
        }
      }
    } catch (error) {
      console.error('检查任务提醒时发生错误:', error);
    }
  }
}