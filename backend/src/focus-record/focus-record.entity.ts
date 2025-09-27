import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Task } from '../todo/todo.entity';

@Entity('focus_record')
export class FocusRecord {
  @PrimaryColumn()
  id: string;

  @Column()
  user_id: string;

  @Column()
  task_id: string;

  @Column()
  start_time: Date;

  @Column({ type: 'datetime' })
  end_time: Date;

  @Column({ type: 'int', nullable: true })
  duration_minutes: number | null; // 持续时间，单位：分钟

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'enum', enum: ['pomodoro', 'normal'], default: 'pomodoro' })
  mode: 'pomodoro' | 'normal';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;
}