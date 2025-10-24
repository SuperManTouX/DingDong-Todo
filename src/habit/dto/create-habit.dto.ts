import { IsNotEmpty, IsString, IsOptional, IsBoolean, ValidateIf, IsDateString, IsNumber } from 'class-validator';

class CustomFrequency {
  @IsNotEmpty({ message: '自定义频率必须指定天数' })
  days: number[]; // 0-6，代表周日到周六

  @IsOptional()
  timesPerDay?: number;
}

export class CreateHabitDto {
  @IsNotEmpty({ message: '习惯名称不能为空' })
  @IsString({ message: '习惯名称必须是字符串' })
  name: string;

  @IsOptional()
  @IsString({ message: '习惯描述必须是字符串' })
  description?: string;

  @IsNotEmpty({ message: '频率类型不能为空' })
  @IsString({ message: '频率类型必须是字符串' })
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';

  @ValidateIf((o) => o.frequency === 'custom')
  @IsNotEmpty({ message: '自定义频率不能为空' })
  customFrequency?: CustomFrequency;

  @IsOptional()
  customFrequencyDays?: string;

  @IsOptional()
  @IsBoolean({ message: '是否归档必须是布尔值' })
  isArchived?: boolean;

  @IsNotEmpty({ message: '开始日期不能为空' })
  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsNumber({}, { message: '目标天数必须是数字' })
  target_days?: number | null;
}