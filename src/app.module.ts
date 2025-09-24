import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoModule } from './todo/todo.module';
import { AuthModule } from './auth/auth.module';
import { TodoListModule } from './todo-list/todo-list.module';
import { TodoTagModule } from './todo-tag/todo-tag.module';
import { TaskGroupModule } from './task-group/task-group.module';
import { BinModule } from './bin/bin.module';
import { User } from './user/user.entity';
import { TodoList } from './todo-list/todo-list.entity';
import { TaskGroup } from './task-group/task-group.entity';
import { Task } from './todo/todo.entity';
import { TodoTag } from './todo-tag/todo-tag.entity';
import { TaskTag } from './task-tag/task-tag.entity';
import { Bin } from './bin/bin.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'todo_db',
      entities: [User, TodoList, TaskGroup, Task, TodoTag, TaskTag, Bin],
      synchronize: false,
      autoLoadEntities: true,
      logging: true
    }),
    TodoModule,
    AuthModule,
    TodoListModule,
    TodoTagModule,
    TaskGroupModule,
    BinModule,
  ],
})export class AppModule {}