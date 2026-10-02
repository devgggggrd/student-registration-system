import { IsNotEmpty, IsUUID } from 'class-validator';

export class EnrollCourseDto {
  @IsUUID('4', { message: 'courseSectionId must be a valid UUID' })
  @IsNotEmpty({ message: 'courseSectionId is required' })
  courseSectionId: string;
}
