import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './todo.entity';
import { TaskService } from './todo.service';
import { TaskController } from './todo.controller';
import { User } from '../user/user.entity';
import { TodoList } from '../todo-list/todo-list.entity';
import { TaskGroup } from '../task-group/task-group.entity';
import { TaskTag } from '../task-tag/task-tag.entity';
import { BinModule } from '../bin/bin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, TodoList, TaskGroup, TaskTag]),
    forwardRef(() => BinModule) // 添加forwardRef导入以解决循环依赖
  ],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TodoModule {}