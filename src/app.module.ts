import { Module, NestModule, MiddlewareConsumer, RequestMethod, Logger } from '@nestjs/common';
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
import { SseModule } from './sse/sse.module';
import { S3Config } from './config/s3.config';

// 自定义请求日志中间件
function RequestLoggingMiddleware(req: any, res: any, next: () => void) {
  const logger = new Logger('HTTP');
  const { method, url, body } = req;
  
  logger.log(`[${method}] ${url} - Request received`);
  
  // 不记录敏感信息
  const safeBody = { ...body };
  if (safeBody.password) delete safeBody.password;
  if (safeBody.passwordConfirm) delete safeBody.passwordConfirm;
  
  if (Object.keys(safeBody).length > 0) {
    logger.log(`Request body: ${JSON.stringify(safeBody)}`);
  }
  
  // 记录响应状态
  const originalSend = res.send;
  res.send = function(data: any) {
    logger.log(`[${method}] ${url} - Response: ${res.statusCode}`);
    return originalSend.call(this, data);
  };
  
  next();
}

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
      logging: false // 关闭SQL日志
    }),
    UserModule,
    AuthModule,
    TodoModule,
    TodoListModule,
    TodoTagModule,
    TaskGroupModule,
    BinModule,
    FocusRecordModule,
    SseModule,
  ],
  providers: [S3Config],
  exports: [S3Config]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 对所有请求应用日志中间件
    consumer
      .apply(RequestLoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}