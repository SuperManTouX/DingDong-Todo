import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bin')
export class Bin {
  @PrimaryColumn()
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  text?: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: 0 })
  priority: number;

  @Column({ type: 'datetime', nullable: true, name: 'datetime_local' })
  datetimeLocal?: Date;

  @Column({ type: 'date', nullable: true })
  deadline?: Date;

  @Column({ nullable: true, name: 'parent_id', type: 'varchar', length: 255 })
  parentId: string | null;

  @Column({ default: 0 })
  depth: number;

  @Column({ name: 'list_id' })
  listId: string;

  @Column({ nullable: true, name: 'group_id', type: 'varchar', length: 255 })
  groupId?: string | null | undefined;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at' })
  deletedAt: Date;
}