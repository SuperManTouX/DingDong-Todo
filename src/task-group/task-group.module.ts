import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskGroup } from './task-group.entity';
import { TaskGroupService } from './task-group.service';
import { TaskGroupController } from './task-group.controller';
import { TodoListModule } from '../todo-list/todo-list.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskGroup]),
    TodoListModule,
  ],
  providers: [TaskGroupService],
  controllers: [TaskGroupController],
  exports: [TaskGroupService, TypeOrmModule],
})
export class TaskGroupModule {}