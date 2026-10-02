import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  courseCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  courseName: string;

  @IsInt()
  @Min(1)
  @Max(10)
  credits: number;

  @IsUUID('4', { message: 'departmentId must be a valid UUID' })
  departmentId: string;

  @IsOptional()
  @IsString()
  description?: string;
}
