import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoList } from './todo-list.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TodoList])],
  exports: [TypeOrmModule],
})
export class TodoListModule {}