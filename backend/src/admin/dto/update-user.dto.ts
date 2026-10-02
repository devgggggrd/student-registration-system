import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  studentCode?: string;

  @IsOptional()
  @IsString()
  teacherCode?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Department ID must be a valid UUID' })
  departmentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  yearLevel?: number;

  @IsOptional()
  @IsEnum(StudentStatus)
  studentStatus?: StudentStatus;
}
