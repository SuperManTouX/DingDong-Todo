import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Habit } from './habit.entity';
import { User } from '../user/user.entity';

export enum CheckInStatus {
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  ABANDONED = 'abandoned',
}

@Entity()
export class HabitCheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Habit, (habit) => habit.checkIns, { nullable: false })
  @JoinColumn({ name: 'habit_id' })
  habit: Habit;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'check_in_date' })
  checkInDate: Date;

  @Column({ type: 'enum', enum: CheckInStatus, default: CheckInStatus.COMPLETED, nullable: true })
  status: CheckInStatus | null;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}