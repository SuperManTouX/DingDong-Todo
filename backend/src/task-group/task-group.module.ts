import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskGroup } from './task-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskGroup])],
  exports: [TypeOrmModule],
})
export class TaskGroupModule {}