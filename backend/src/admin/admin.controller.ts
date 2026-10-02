import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ClientIp } from '../auth/decorators/client-ip.decorator';
import { Role, SemesterStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 1. Dashboard
  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // 2. Users
  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: Role,
  ) {
    return this.adminService.getUsers(search, role);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser('id') adminUserId: string,
    @ClientIp() ip: string,
  ) {
    return this.adminService.createUser(dto, adminUserId, ip);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') adminUserId: string,
    @ClientIp() ip: string,
  ) {
    return this.adminService.updateUser(userId, dto, adminUserId, ip);
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser('id') adminUserId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.deleteUser(userId, adminUserId, ip);
  }

  // 3. Departments
  @Get('departments')
  async getDepartments() {
    return this.adminService.getDepartments();
  }

  @Post('departments')
  @HttpCode(HttpStatus.CREATED)
  async createDepartment(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser('id') adminUserId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.createDepartment(dto, adminUserId, ip);
  }

  // 4. Courses
  @Get('courses')
  async getCourses(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.adminService.getCourses(search, departmentId);
  }

  @Post('courses')
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @Body() dto: CreateCourseDto,
    @CurrentUser('id') adminUserId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.createCourse(dto, adminUserId, ip);
  }

  @Delete('courses/:id')
  async deleteCourse(
    @Param('id') courseId: string,
    @CurrentUser('id') adminUserId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.deleteCourse(courseId, adminUserId, ip);
  }

  // 5. Semesters
  @Get('semesters')
  async getSemesters() {
    return this.adminService.getSemesters();
  }

  @Post('semesters')
  @HttpCode(HttpStatus.CREATED)
  async createSemester(
    @Body() dto: CreateSemesterDto,
    @CurrentUser('id') adminUserId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.createSemester(dto, adminUserId, ip);
  }

  @Patch('semesters/:id/status')
  async updateSemesterStatus(
    @Param('id') semesterId: string,
    @Body('status') status: SemesterStatus,
    @CurrentUser('id') adminUserId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.updateSemesterStatus(semesterId, status, adminUserId, ip);
  }

  // 6. Course Sections
  @Get('sections')
  async getSections(@Query('semesterId') semesterId?: string) {
    return this.adminService.getSections(semesterId);
  }

  @Post('sections')
  @HttpCode(HttpStatus.CREATED)
  async createSection(
    @Body() dto: CreateSectionDto,
    @CurrentUser('id') adminUserId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.createSection(dto, adminUserId, ip);
  }

  @Delete('sections/:id')
  async deleteSection(
    @Param('id') sectionId: string,
    @CurrentUser('id') adminUserId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.deleteSection(sectionId, adminUserId, ip);
  }

  // 7. Audit Logs
  @Get('audit-logs')
  async getAuditLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    return this.adminService.getAuditLogs(parsedLimit);
  }
}
