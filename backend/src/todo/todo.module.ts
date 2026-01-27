import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './todo.entity';
import { TaskService } from './todo.service';
import { TodoController, TodoAliasController } from './todo.controller';
import { SearchController } from './search.controller';
import { User } from '../user/user.entity';
import { TodoList } from '../todo-list/todo-list.entity';
import { TaskGroup } from '../task-group/task-group.entity';
import { TaskTag } from '../task-tag/task-tag.entity';
import { TodoTag } from '../todo-tag/todo-tag.entity';
import { EmailService } from './email.service';
import { ReminderService } from './reminder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, TodoList, TaskGroup, TaskTag, TodoTag]),
  ],
  providers: [TaskService, EmailService, ReminderService],
  controllers: [TodoController, TodoAliasController, SearchController],
  exports: [TaskService],
})
export class TodoModule {}