import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskGroup } from './task-group.entity';
import { TaskGroupService } from './task-group.service';
import { TaskGroupController } from './task-group.controller';
import { TodoListModule } from '../todo-list/todo-list.module';
import { TodoModule } from '../todo/todo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskGroup]),
    TodoListModule,
    forwardRef(() => TodoModule),
  ],
  providers: [TaskGroupService],
  controllers: [TaskGroupController],
  exports: [TaskGroupService, TypeOrmModule],
})
export class TaskGroupModule {}