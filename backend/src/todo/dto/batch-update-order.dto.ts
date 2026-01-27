import { IsArray, IsString, IsNumber, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class TaskOrderUpdate {
  @IsString()
  id: string;

  @IsOptional()
  @IsNumber()
  timeOrderIndex?: number;

  @IsOptional()
  @IsNumber()
  groupOrderIndex?: number;

  @IsString()
  listId: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}

export class BatchUpdateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskOrderUpdate)
  tasks: TaskOrderUpdate[];
}