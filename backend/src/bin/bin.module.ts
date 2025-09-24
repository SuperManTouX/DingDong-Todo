import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bin } from './bin.entity';
import { BinService } from './bin.service';
import { BinController } from './bin.controller';
import { TodoModule } from '../todo/todo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bin]),
    forwardRef(() => TodoModule) // 使用forwardRef解决循环依赖
  ],
  controllers: [BinController],
  providers: [BinService],
  exports: [BinService]
})
export class BinModule {}