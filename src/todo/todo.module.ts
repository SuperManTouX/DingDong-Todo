import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './todo.entity';
import { TaskService } from './todo.service';
import { TaskController } from './todo.controller';
import { User } from '../user/user.entity';
import { TodoList } from '../todo-list/todo-list.entity';
import { TaskGroup } from '../task-group/task-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, TodoList, TaskGroup])],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TodoModule {}