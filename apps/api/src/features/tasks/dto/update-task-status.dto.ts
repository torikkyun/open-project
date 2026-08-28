import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { TaskStatus } from "@/generated/prisma/enums";

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.in_progress })
  status!: TaskStatus;
}
