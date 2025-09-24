import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TodoList } from '../todo-list/todo-list.entity';
import { TaskGroup } from '../task-group/task-group.entity';
import { User } from '../user/user.entity';
import { TaskTag } from '../task-tag/task-tag.entity';

@Entity('task')
export class Task {
  @PrimaryColumn()
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  text: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: 0 })
  priority: number;

  @Column({ type: 'datetime', nullable: true, name: 'datetime_local' })
  datetimeLocal: Date;

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Column({ nullable: true, name: 'parent_id' })
  parentId: string;

  @Column({ default: 0 })
  depth: number;

  @Column({ name: 'list_id' })
  listId: string;

  @Column({ nullable: true, name: 'group_id' })
  groupId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => TodoList)
  @JoinColumn({ name: 'list_id' })
  list: TodoList;

  @ManyToOne(() => TaskGroup, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: TaskGroup;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 一对多关系：一个任务可以有多个任务标签关联
  @OneToMany(() => TaskTag, taskTag => taskTag.task)
  taskTags: TaskTag[];
}