import { IsOptional, IsString } from 'class-validator';

export class CourseSearchQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
