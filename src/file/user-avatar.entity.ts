import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OssFile } from './oss-file.entity';

@Entity('user_avatars')
export class UserAvatar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_id', nullable: false, comment: '关联oss_files表的ID' })
  fileId: number;

  @ManyToOne(() => OssFile, (file) => file.userAvatars)
  @JoinColumn({ name: 'file_id' })
  file: OssFile;

  @Column({ name: 'user_id', length: 36, nullable: false, comment: '关联用户表的ID' })
  userId: string;

  @Column({ name: 'is_default', default: false, comment: '是否为默认头像' })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;
}