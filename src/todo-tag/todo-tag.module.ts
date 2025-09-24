import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoTag } from './todo-tag.entity';
import { TodoTagService } from './todo-tag.service';
import { TodoTagController } from './todo-tag.controller';
import { Task } from '../todo/todo.entity';
import { TaskTag } from '../task-tag/task-tag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TodoTag, Task, TaskTag]),
  ],
  providers: [TodoTagService],
  controllers: [TodoTagController],
  exports: [TodoTagService, TypeOrmModule],
})
export class TodoTagModule {}