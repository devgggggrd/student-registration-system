import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Role, StudentStatus } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsEnum(Role, { message: 'Role must be STUDENT, TEACHER, or ADMIN' })
  role: Role;

  @IsOptional()
  @IsString()
  phone?: string;

  // Fields for Student
  @IsOptional()
  @IsString()
  studentCode?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

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

  // Fields for Teacher
  @IsOptional()
  @IsString()
  teacherCode?: string;
}
