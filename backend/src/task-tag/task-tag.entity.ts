import { Entity, PrimaryGeneratedColumn, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Task } from '../todo/todo.entity';
import { TodoTag } from '../todo-tag/todo-tag.entity';

@Entity('task_tag')
export class TaskTag {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn({ name: 'task_id' })
  taskId: string;

  @PrimaryColumn({ name: 'tag_id' })
  tagId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => TodoTag)
  @JoinColumn({ name: 'tag_id' })
  tag: TodoTag;
}