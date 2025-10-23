import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { HabitCheckIn } from './habit-check-in.entity';
import { HabitStreak } from './habit-streak.entity';

@Entity()
export class Habit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.habits, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'title' })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  frequency: string; // daily, weekly, custom

  @Column({ name: 'custom_frequency_days', nullable: true })
  customFrequencyDays?: string;

  @Column({ name: 'is_deleted', default: false })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => HabitCheckIn, (checkIn) => checkIn.habit)
  checkIns: HabitCheckIn[];

  @OneToOne(() => HabitStreak, (streak) => streak.habit)
  streak: HabitStreak;
}