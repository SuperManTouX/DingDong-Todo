import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('todo_tag')
export class TodoTag {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, name: 'parent_id' })
  parentId: string | null;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => TodoTag, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: TodoTag;

  @OneToMany(() => TodoTag, (tag) => tag.parent)
  children: TodoTag[];
}