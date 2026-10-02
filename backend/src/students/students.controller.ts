import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CourseSearchQueryDto } from './dto/course-search-query.dto';
import { EnrollCourseDto } from './dto/enroll-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.studentsService.getProfile(userId);
  }

  @Get('courses')
  async searchCourses(
    @CurrentUser('id') userId: string,
    @Query() query: CourseSearchQueryDto,
  ) {
    return this.studentsService.searchCourses(userId, query);
  }

  @Get('enrollments')
  async getEnrollments(@CurrentUser('id') userId: string) {
    return this.studentsService.getEnrollments(userId);
  }

  @Post('enrollments')
  @HttpCode(HttpStatus.CREATED)
  async enrollCourse(
    @CurrentUser('id') userId: string,
    @Body() dto: EnrollCourseDto,
    @Ip() ip: string,
  ) {
    return this.studentsService.enrollCourse(userId, dto, ip);
  }

  @Delete('enrollments/:id')
  async dropCourse(
    @CurrentUser('id') userId: string,
    @Param('id') enrollmentId: string,
    @Ip() ip: string,
  ) {
    return this.studentsService.dropCourse(userId, enrollmentId, ip);
  }

  @Get('schedule')
  async getSchedule(@CurrentUser('id') userId: string) {
    return this.studentsService.getTimetable(userId);
  }
}
