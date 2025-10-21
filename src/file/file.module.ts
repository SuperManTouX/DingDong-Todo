import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OssFile } from './oss-file.entity';
import { UserAvatar } from './user-avatar.entity';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { OssConfig } from '../config/oss.config';

@Module({
  imports: [TypeOrmModule.forFeature([OssFile, UserAvatar])],
  controllers: [FileController],
  providers: [FileService, OssConfig],
  exports: [FileService],
})
export class FileModule {}