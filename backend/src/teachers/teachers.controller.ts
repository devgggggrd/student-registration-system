import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.teachersService.getProfile(userId);
  }

  @Get('sections')
  async getSections(
    @CurrentUser('id') userId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.teachersService.getSections(userId, semesterId);
  }

  @Get('sections/:id/roster')
  async getSectionRoster(
    @CurrentUser('id') userId: string,
    @Param('id') sectionId: string,
  ) {
    return this.teachersService.getSectionRoster(userId, sectionId);
  }

  @Get('schedule')
  async getSchedule(@CurrentUser('id') userId: string) {
    return this.teachersService.getTeachingSchedule(userId);
  }
}
