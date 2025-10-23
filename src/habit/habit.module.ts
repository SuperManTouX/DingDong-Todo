import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habit } from './habit.entity';
import { HabitCheckIn } from './habit-check-in.entity';
import { HabitStreak } from './habit-streak.entity';
import { HabitService } from './habit.service';
import { HabitController } from './habit.controller';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Habit, HabitCheckIn, HabitStreak]), SseModule],
  providers: [HabitService],
  controllers: [HabitController],
  exports: [HabitService],
})
export class HabitModule {}