import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoTag } from './todo-tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TodoTag])],
  exports: [TypeOrmModule],
})
export class TodoTagModule {}