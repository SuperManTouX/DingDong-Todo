import { ApiProperty } from '@nestjs/swagger';

export class UpdateParentIdDto {
  @ApiProperty({
    description: '新的父任务ID，如果为null则表示移到根级',
    required: true,
    nullable: true,
    type: String,
  })
  parentId: string | null;
}