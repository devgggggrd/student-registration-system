import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';

export class CreateScheduleDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @IsOptional()
  @IsString()
  room?: string;
}

export class CreateSectionDto {
  @IsUUID('4', { message: 'courseId must be a valid UUID' })
  courseId: string;

  @IsUUID('4', { message: 'semesterId must be a valid UUID' })
  semesterId: string;

  @IsInt()
  @Min(1)
  sectionNumber: number;

  @IsUUID('4', { message: 'teacherId must be a valid UUID' })
  teacherId: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @IsNotEmpty()
  room: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleDto)
  schedules?: CreateScheduleDto[];
}
