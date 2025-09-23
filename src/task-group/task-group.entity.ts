import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TodoList } from '../todo-list/todo-list.entity';
import { User } from '../user/user.entity';
import { Task } from '../todo/todo.entity';

@Entity('task_group')
export class TaskGroup {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'list_id' })
  listId: string;

  @Column({ name: 'group_name' })
  groupName: string;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => TodoList)
  @JoinColumn({ name: 'list_id' })
  list: TodoList;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Task, (task) => task.group)
  tasks: Task[];
}