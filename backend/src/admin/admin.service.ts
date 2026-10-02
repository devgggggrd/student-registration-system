import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import {
  Role,
  SemesterStatus,
  EnrollmentStatus,
  StudentStatus,
} from '@prisma/client';
import { AuditStreamService } from './audit-stream.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly auditStreamService: AuditStreamService,
  ) {}

  getAuditStream() {
    return this.auditStreamService.getStream();
  }

  private async createAuditLog(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    details: any,
    ip?: string,
  ) {
    try {
      const newLog = await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          details,
          ipAddress: ip,
        },
        include: {
          user: {
            select: {
              email: true,
              role: true,
              student: { select: { firstName: true, lastName: true } },
              teacher: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });


      this.auditStreamService.emit({
        id: newLog.id,
        userId: newLog.userId,
        action: newLog.action,
        entity: newLog.entity,
        entityId: newLog.entityId,
        details: newLog.details,
        ipAddress: newLog.ipAddress || undefined,
        createdAt: newLog.createdAt.toISOString(),
        user: newLog.user,
      });
    } catch (e) {
      console.error('AuditLog error:', e);
    }
  }


  // --- 1. Dashboard & Stats ---
  async getDashboardStats() {
    const cacheKey = 'admin:dashboard_stats';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const activeSemester = await this.prisma.semester.findFirst({
      where: { status: SemesterStatus.OPEN },
      orderBy: { academicYear: 'desc' },
    });

    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalCourses,
      totalDepartments,
      activeSections,
      activeEnrollments,
      recentLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.TEACHER } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.course.count(),
      this.prisma.department.count(),
      activeSemester
        ? this.prisma.courseSection.count({ where: { semesterId: activeSemester.id } })
        : 0,
      activeSemester
        ? this.prisma.enrollment.count({
            where: {
              semesterId: activeSemester.id,
              status: EnrollmentStatus.REGISTERED,
            },
          })
        : 0,
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const result = {
      overview: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalCourses,
        totalDepartments,
        activeSections,
        activeEnrollments,
      },
      currentSemester: activeSemester
        ? {
            id: activeSemester.id,
            academicYear: activeSemester.academicYear,
            semesterNumber: activeSemester.semesterNumber,
            status: activeSemester.status,
            registrationStart: activeSemester.registrationStart,
            registrationEnd: activeSemester.registrationEnd,
          }
        : null,
      recentLogs,
    };

    await this.cacheManager.set(cacheKey, result, 3000);
    return result;
  }

  // --- 2. User Management ---
  async getUsers(search?: string, role?: Role) {
    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { student: { studentCode: { contains: search, mode: 'insensitive' } } },
        { student: { firstName: { contains: search, mode: 'insensitive' } } },
        { student: { lastName: { contains: search, mode: 'insensitive' } } },
        { teacher: { teacherCode: { contains: search, mode: 'insensitive' } } },
        { teacher: { firstName: { contains: search, mode: 'insensitive' } } },
        { teacher: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      include: {
        student: {
          include: { department: true },
        },
        teacher: {
          include: { department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(dto: CreateUserDto, adminUserId: string, ip?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: hashedPassword,
        role: dto.role,
        phone: dto.phone || null,
      },
    });

    if (dto.role === Role.STUDENT) {
      if (!dto.studentCode || !dto.firstName || !dto.lastName || !dto.departmentId) {
        await this.prisma.user.delete({ where: { id: newUser.id } });
        throw new BadRequestException('Student requires studentCode, firstName, lastName, and departmentId');
      }

      await this.prisma.student.create({
        data: {
          userId: newUser.id,
          studentCode: dto.studentCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          departmentId: dto.departmentId,
          yearLevel: dto.yearLevel || 1,
          status: dto.studentStatus || StudentStatus.ACTIVE,
        },
      });
    } else if (dto.role === Role.TEACHER) {
      if (!dto.teacherCode || !dto.firstName || !dto.lastName || !dto.departmentId) {
        await this.prisma.user.delete({ where: { id: newUser.id } });
        throw new BadRequestException('Teacher requires teacherCode, firstName, lastName, and departmentId');
      }

      await this.prisma.teacher.create({
        data: {
          userId: newUser.id,
          teacherCode: dto.teacherCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          departmentId: dto.departmentId,
        },
      });
    }

    await this.createAuditLog(
      adminUserId,
      'CREATE_USER',
      'User',
      newUser.id,
      { email: newUser.email, role: newUser.role, phone: newUser.phone },
      ip,
    );

    return this.prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        student: { include: { department: true } },
        teacher: { include: { department: true } },
      },
    });
  }

  async updateUser(userId: string, dto: UpdateUserDto, adminUserId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        teacher: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userDataToUpdate: any = {};

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailExists) {
        throw new ConflictException('Email already in use by another account');
      }
      userDataToUpdate.email = dto.email.toLowerCase();
    }

    if (dto.password) {
      userDataToUpdate.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.phone !== undefined) {
      userDataToUpdate.phone = dto.phone;
    }

    if (Object.keys(userDataToUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userDataToUpdate,
      });
    }

    // If Student
    if (user.role === Role.STUDENT && user.student) {
      const studentDataToUpdate: any = {};
      if (dto.firstName) studentDataToUpdate.firstName = dto.firstName;
      if (dto.lastName) studentDataToUpdate.lastName = dto.lastName;
      if (dto.studentCode) studentDataToUpdate.studentCode = dto.studentCode;
      if (dto.departmentId) studentDataToUpdate.departmentId = dto.departmentId;
      if (dto.yearLevel) studentDataToUpdate.yearLevel = dto.yearLevel;
      if (dto.studentStatus) studentDataToUpdate.status = dto.studentStatus;

      if (Object.keys(studentDataToUpdate).length > 0) {
        await this.prisma.student.update({
          where: { id: user.student.id },
          data: studentDataToUpdate,
        });
      }
    }

    // If Teacher
    if (user.role === Role.TEACHER && user.teacher) {
      const teacherDataToUpdate: any = {};
      if (dto.firstName) teacherDataToUpdate.firstName = dto.firstName;
      if (dto.lastName) teacherDataToUpdate.lastName = dto.lastName;
      if (dto.teacherCode) teacherDataToUpdate.teacherCode = dto.teacherCode;
      if (dto.departmentId) teacherDataToUpdate.departmentId = dto.departmentId;

      if (Object.keys(teacherDataToUpdate).length > 0) {
        await this.prisma.teacher.update({
          where: { id: user.teacher.id },
          data: teacherDataToUpdate,
        });
      }
    }

    await this.createAuditLog(
      adminUserId,
      'UPDATE_USER',
      'User',
      userId,
      { updatedFields: Object.keys(dto) },
      ip,
    );

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: { include: { department: true } },
        teacher: { include: { department: true } },
      },
    });
  }

  async deleteUser(userId: string, adminUserId: string, ip?: string) {
    if (userId === adminUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    await this.createAuditLog(
      adminUserId,
      'DELETE_USER',
      'User',
      userId,
      { email: user.email, role: user.role },
      ip,
    );

    return { message: 'User deleted successfully' };
  }

  // --- 3. Department Management ---
  async getDepartments() {
    const cacheKey = 'admin:departments';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const departments = await this.prisma.department.findMany({
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            courses: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    await this.cacheManager.set(cacheKey, departments, 10000);
    return departments;
  }

  async createDepartment(dto: CreateDepartmentDto, adminUserId: string, ip?: string) {
    const existing = await this.prisma.department.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Department code "${dto.code}" already exists`);
    }

    const dept = await this.prisma.department.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
      },
    });

    // Invalidate department & dashboard caches
    await this.cacheManager.del('admin:departments');
    await this.cacheManager.del('admin:dashboard_stats');

    await this.createAuditLog(
      adminUserId,
      'CREATE_DEPARTMENT',
      'Department',
      dept.id,
      { code: dept.code, name: dept.name },
      ip,
    );

    return dept;
  }

  // --- 4. Course Management ---
  async getCourses(search?: string, departmentId?: string) {
    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (search) {
      where.OR = [
        { courseCode: { contains: search, mode: 'insensitive' } },
        { courseName: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.course.findMany({
      where,
      include: {
        department: true,
        _count: {
          select: { sections: true },
        },
      },
      orderBy: { courseCode: 'asc' },
    });
  }

  async createCourse(dto: CreateCourseDto, adminUserId: string, ip?: string) {
    const existing = await this.prisma.course.findUnique({
      where: { courseCode: dto.courseCode.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Course with code "${dto.courseCode}" already exists`);
    }

    const course = await this.prisma.course.create({
      data: {
        courseCode: dto.courseCode.toUpperCase(),
        courseName: dto.courseName,
        credits: dto.credits,
        departmentId: dto.departmentId,
        description: dto.description,
      },
      include: { department: true },
    });

    await this.createAuditLog(
      adminUserId,
      'CREATE_COURSE',
      'Course',
      course.id,
      { courseCode: course.courseCode, courseName: course.courseName },
      ip,
    );

    return course;
  }

  async deleteCourse(courseId: string, adminUserId: string, ip?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { sections: true } } },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course._count.sections > 0) {
      throw new BadRequestException('Cannot delete course that has active sections assigned');
    }

    await this.prisma.course.delete({ where: { id: courseId } });

    await this.createAuditLog(
      adminUserId,
      'DELETE_COURSE',
      'Course',
      courseId,
      { courseCode: course.courseCode },
      ip,
    );

    return { message: 'Course deleted successfully' };
  }

  // --- 5. Semester Management ---
  async getSemesters() {
    return this.prisma.semester.findMany({
      include: {
        _count: {
          select: {
            sections: true,
            enrollments: true,
          },
        },
      },
      orderBy: [{ academicYear: 'desc' }, { semesterNumber: 'desc' }],
    });
  }

  async createSemester(dto: CreateSemesterDto, adminUserId: string, ip?: string) {
    const existing = await this.prisma.semester.findUnique({
      where: {
        academicYear_semesterNumber: {
          academicYear: dto.academicYear,
          semesterNumber: dto.semesterNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Semester ${dto.semesterNumber}/${dto.academicYear} already exists`,
      );
    }

    // If setting to OPEN, close others
    if (dto.status === SemesterStatus.OPEN) {
      await this.prisma.semester.updateMany({
        where: { status: SemesterStatus.OPEN },
        data: { status: SemesterStatus.CLOSED },
      });
    }

    const semester = await this.prisma.semester.create({
      data: {
        academicYear: dto.academicYear,
        semesterNumber: dto.semesterNumber,
        registrationStart: new Date(dto.registrationStart),
        registrationEnd: new Date(dto.registrationEnd),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: dto.status,
      },
    });

    await this.createAuditLog(
      adminUserId,
      'CREATE_SEMESTER',
      'Semester',
      semester.id,
      { academicYear: semester.academicYear, semesterNumber: semester.semesterNumber },
      ip,
    );

    return semester;
  }

  async updateSemesterStatus(
    semesterId: string,
    status: SemesterStatus,
    adminUserId: string,
    ip?: string,
  ) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    if (status === SemesterStatus.OPEN) {
      await this.prisma.semester.updateMany({
        where: { status: SemesterStatus.OPEN, id: { not: semesterId } },
        data: { status: SemesterStatus.CLOSED },
      });
    }

    const updated = await this.prisma.semester.update({
      where: { id: semesterId },
      data: { status },
    });

    await this.createAuditLog(
      adminUserId,
      'UPDATE_SEMESTER_STATUS',
      'Semester',
      semesterId,
      { oldStatus: semester.status, newStatus: status },
      ip,
    );

    return updated;
  }

  // --- 6. Section & Schedule Management ---
  async getSections(semesterId?: string) {
    const where: any = {};
    if (semesterId) {
      where.semesterId = semesterId;
    } else {
      const active = await this.prisma.semester.findFirst({
        where: { status: SemesterStatus.OPEN },
      });
      if (active) where.semesterId = active.id;
    }

    const sections = await this.prisma.courseSection.findMany({
      where,
      include: {
        course: { include: { department: true } },
        semester: true,
        teacher: { include: { department: true } },
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        enrollments: {
          where: { status: EnrollmentStatus.REGISTERED },
          select: { id: true },
        },
      },
      orderBy: [
        { course: { courseCode: 'asc' } },
        { sectionNumber: 'asc' },
      ],
    });

    return sections.map((sec) => ({
      id: sec.id,
      sectionNumber: sec.sectionNumber,
      capacity: sec.capacity,
      enrolledCount: sec.enrollments.length,
      remainingSeats: Math.max(0, sec.capacity - sec.enrollments.length),
      room: sec.room,
      course: sec.course,
      semester: sec.semester,
      teacher: sec.teacher,
      schedules: sec.schedules,
    }));
  }

  async createSection(dto: CreateSectionDto, adminUserId: string, ip?: string) {
    // 1. Check duplicate section number
    const existing = await this.prisma.courseSection.findUnique({
      where: {
        courseId_semesterId_sectionNumber: {
          courseId: dto.courseId,
          semesterId: dto.semesterId,
          sectionNumber: dto.sectionNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Section ${dto.sectionNumber} already exists for this course and semester`,
      );
    }

    // 2. Schedule clash check for teacher & room if schedules provided
    if (dto.schedules && dto.schedules.length > 0) {
      for (const sch of dto.schedules) {
        const schRoom = sch.room || dto.room;

        // Check if teacher has another class at this day and overlapping time
        const teacherClash = await this.prisma.schedule.findFirst({
          where: {
            dayOfWeek: sch.dayOfWeek,
            courseSection: {
              semesterId: dto.semesterId,
              teacherId: dto.teacherId,
            },
            AND: [
              { startTime: { lt: sch.endTime } },
              { endTime: { gt: sch.startTime } },
            ],
          },
          include: {
            courseSection: {
              include: { course: true },
            },
          },
        });

        if (teacherClash) {
          throw new ConflictException(
            `Teacher has a scheduling clash with ${teacherClash.courseSection.course.courseCode} on ${sch.dayOfWeek} ${teacherClash.startTime}-${teacherClash.endTime}`,
          );
        }

        // Check if room is booked at this day and overlapping time
        const roomClash = await this.prisma.schedule.findFirst({
          where: {
            dayOfWeek: sch.dayOfWeek,
            room: schRoom,
            courseSection: {
              semesterId: dto.semesterId,
            },
            AND: [
              { startTime: { lt: sch.endTime } },
              { endTime: { gt: sch.startTime } },
            ],
          },
          include: {
            courseSection: {
              include: { course: true },
            },
          },
        });

        if (roomClash) {
          throw new ConflictException(
            `Room ${schRoom} is already booked for ${roomClash.courseSection.course.courseCode} on ${sch.dayOfWeek} ${roomClash.startTime}-${roomClash.endTime}`,
          );
        }
      }
    }

    // 3. Create Section & Schedules
    const section = await this.prisma.courseSection.create({
      data: {
        courseId: dto.courseId,
        semesterId: dto.semesterId,
        sectionNumber: dto.sectionNumber,
        teacherId: dto.teacherId,
        capacity: dto.capacity,
        room: dto.room,
        schedules: dto.schedules
          ? {
              create: dto.schedules.map((s) => ({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                room: s.room || dto.room,
              })),
            }
          : undefined,
      },
      include: {
        course: true,
        teacher: true,
        schedules: true,
      },
    });

    await this.createAuditLog(
      adminUserId,
      'CREATE_SECTION',
      'CourseSection',
      section.id,
      {
        courseCode: section.course.courseCode,
        sectionNumber: section.sectionNumber,
        capacity: section.capacity,
      },
      ip,
    );

    return section;
  }

  async deleteSection(sectionId: string, adminUserId: string, ip?: string) {
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        _count: {
          select: {
            enrollments: {
              where: { status: EnrollmentStatus.REGISTERED },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (section._count.enrollments > 0) {
      throw new BadRequestException(
        `Cannot delete section with ${section._count.enrollments} active registered students`,
      );
    }

    await this.prisma.courseSection.delete({
      where: { id: sectionId },
    });

    await this.createAuditLog(
      adminUserId,
      'DELETE_SECTION',
      'CourseSection',
      sectionId,
      {
        courseCode: section.course.courseCode,
        sectionNumber: section.sectionNumber,
      },
      ip,
    );

    return { message: 'Section deleted successfully' };
  }

  // --- 7. Audit Logs ---
  async getAuditLogs(limit = 100) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
