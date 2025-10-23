import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CheckInStatus } from '../habit-check-in.entity';

export class CreateHabitCheckInDto {
  @IsNotEmpty({ message: '打卡日期不能为空' })
  checkInDate: Date;

  @IsOptional()
  status?: CheckInStatus;

  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  notes?: string;
}