import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TodoModule } from './todo/todo.module';
import { TodoListModule } from './todo-list/todo-list.module';
import { TodoTagModule } from './todo-tag/todo-tag.module';
import { TaskGroupModule } from './task-group/task-group.module';
import { BinModule } from './bin/bin.module';
import { FocusRecordModule } from './focus-record/focus-record.module';
import { WebSocketModule } from './websocket/websocket.module';
import { S3Config } from './config/s3.config';

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
      autoLoadEntities: true,
      synchronize: false,
      logging: true
    }),
    UserModule,
    AuthModule,
    TodoModule,
    TodoListModule,
    TodoTagModule,
    TaskGroupModule,
    BinModule,
    FocusRecordModule,
    WebSocketModule,
  ],
  providers: [S3Config],
  exports: [S3Config]
})export class AppModule {}