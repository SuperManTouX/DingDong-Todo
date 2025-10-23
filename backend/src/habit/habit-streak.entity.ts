import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Habit } from './habit.entity';
import { User } from '../user/user.entity';

@Entity()
export class HabitStreak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Habit, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habit_id' })
  habit: Habit;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'current_streak', default: 0 })
  currentStreak: number;

  @Column({ name: 'longest_streak', default: 0 })
  longestStreak: number;

  @Column({ name: 'total_check_ins', default: 0 })
  totalDays: number;

  @Column({ name: 'last_check_in_date', nullable: true })
  lastCheckInDate?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}