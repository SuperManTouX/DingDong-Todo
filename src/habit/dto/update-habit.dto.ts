import { IsOptional, IsString, IsBoolean, ValidateIf } from 'class-validator';

class CustomFrequency {
  @IsOptional()
  days?: number[]; // 0-6，代表周日到周六

  @IsOptional()
  timesPerDay?: number;
}

export class UpdateHabitDto {
  @IsOptional()
  @IsString({ message: '习惯名称必须是字符串' })
  name?: string;

  @IsOptional()
  @IsString({ message: '习惯描述必须是字符串' })
  description?: string;

  @IsOptional()
  @IsString({ message: '频率类型必须是字符串' })
  frequency?: 'daily' | 'weekly' | 'custom';

  @ValidateIf((o) => o.frequency === 'custom')
  @IsOptional()
  customFrequency?: CustomFrequency;

  @IsOptional()
  customFrequencyDays?: string;

  @IsOptional()
  @IsBoolean({ message: '是否归档必须是布尔值' })
  isArchived?: boolean;
}