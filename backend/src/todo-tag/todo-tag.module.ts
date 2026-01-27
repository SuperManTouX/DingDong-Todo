import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoTag } from './todo-tag.entity';
import { TodoTagService } from './todo-tag.service';
import { TodoTagController } from './todo-tag.controller';
import { Task } from '../todo/todo.entity';
import { TaskTag } from '../task-tag/task-tag.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module'; // 直接导入UserModule

@Module({
  imports: [
    TypeOrmModule.forFeature([TodoTag, Task, TaskTag]),
    EventEmitterModule.forRoot(),
    AuthModule, // 提供JwtService
    UserModule  // 提供UserService
  ],
  providers: [TodoTagService],
  controllers: [TodoTagController],
  exports: [TodoTagService, TypeOrmModule],
})
export class TodoTagModule {}