import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FocusRecord } from './focus-record.entity';
import { FocusRecordService } from './focus-record.service';
import { FocusRecordController } from './focus-record.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FocusRecord])],
  providers: [FocusRecordService],
  controllers: [FocusRecordController],
  exports: [FocusRecordService],
})
export class FocusRecordModule {}