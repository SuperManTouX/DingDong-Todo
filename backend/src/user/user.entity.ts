import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TodoList } from '../todo-list/todo-list.entity';
import { TodoTag } from '../todo-tag/todo-tag.entity';
import { Task } from '../todo/todo.entity';
import { Habit } from '../habit/habit.entity';

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @OneToMany(() => Habit, (habit) => habit.user)
  habits: Habit[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TodoList, (list) => list.user)
  todoLists: TodoList[];

  @OneToMany(() => TodoTag, (tag) => tag.user)
  tags: TodoTag[];

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];
}