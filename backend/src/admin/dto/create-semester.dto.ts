import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  Max,
  Min,
} from 'class-validator';
import { SemesterStatus } from '@prisma/client';

export class CreateSemesterDto {
  @IsInt()
  @Min(2020)
  @Max(2100)
  academicYear: number;

  @IsInt()
  @Min(1)
  @Max(3)
  semesterNumber: number;

  @IsDateString()
  @IsNotEmpty()
  registrationStart: string;

  @IsDateString()
  @IsNotEmpty()
  registrationEnd: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(SemesterStatus)
  status: SemesterStatus;
}
