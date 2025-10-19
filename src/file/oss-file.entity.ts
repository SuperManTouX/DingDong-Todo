import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserAvatar } from './user-avatar.entity';

@Entity('oss_files')
export class OssFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_name', length: 255, comment: '文件名' })
  fileName: string;

  @Column({ name: 'object_key', length: 255, comment: 'OSS对象键' })
  objectKey: string;

  @Column({ name: 'file_type', length: 50, nullable: true, comment: '文件类型' })
  fileType: string;

  @Column({ name: 'file_size', nullable: true, comment: '文件大小（字节）' })
  fileSize: number;

  @Column({ name: 'oss_url', length: 255, comment: 'OSS文件URL' })
  ossUrl: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => UserAvatar, (userAvatar) => userAvatar.file)
  userAvatars: UserAvatar[];
}