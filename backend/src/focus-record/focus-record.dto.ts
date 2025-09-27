import { IsString, IsOptional, IsBoolean, IsDateString, IsEnum, IsInt } from 'class-validator';

export class CreateFocusRecordDto {
  @IsString()
  task_id: string;

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;

  @IsOptional()
  @IsInt()
  duration_minutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsEnum(['pomodoro', 'normal'])
  mode: 'pomodoro' | 'normal';
}

export class UpdateFocusRecordDto {
  @IsOptional()
  @IsString()
  task_id?: string;

  @IsOptional()
  @IsDateString()
  start_time?: string;

  @IsDateString()
  end_time: string;

  @IsOptional()
  @IsInt()
  duration_minutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsEnum(['pomodoro', 'normal'])
  mode?: 'pomodoro' | 'normal';
}

export class FocusRecordResponseDto {
  id: string;
  user_id: string;
  task_id: string;
  start_time: Date;
  end_time: Date;
  duration_minutes: number | null;
  notes: string | null;
  completed: boolean;
  mode: 'pomodoro' | 'normal';
  created_at: Date;
  updated_at: Date;
}