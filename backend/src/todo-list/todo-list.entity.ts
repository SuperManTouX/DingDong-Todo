import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { TaskGroup } from '../task-group/task-group.entity';
import { Task } from '../todo/todo.entity';

@Entity('todo_list')
export class TodoList {
  @PrimaryColumn()
  id: string;

  @Column()
  title: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => TaskGroup, (group) => group.list)
  taskGroups: TaskGroup[];

  @OneToMany(() => Task, (task) => task.list)
  tasks: Task[];
}