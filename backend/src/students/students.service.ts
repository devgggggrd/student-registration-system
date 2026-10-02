import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CourseSearchQueryDto } from './dto/course-search-query.dto';
import { EnrollCourseDto } from './dto/enroll-course.dto';
import { EnrollmentStatus, SemesterStatus, StudentStatus } from '@prisma/client';
import { AuditStreamService } from '../admin/audit-stream.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditStreamService: AuditStreamService,
  ) {}

  private async getStudentByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { department: true },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found for this account');
    }
    return student;
  }

  private async getActiveSemester() {
    const semester = await this.prisma.semester.findFirst({
      where: { status: SemesterStatus.OPEN },
      orderBy: { academicYear: 'desc' },
    });
    if (!semester) {
      throw new BadRequestException('No active semester currently open for registration');
    }
    return semester;
  }

  async getProfile(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const activeSemester = await this.prisma.semester.findFirst({
      where: { status: SemesterStatus.OPEN },
    });

    let currentSemesterEnrollments: any[] = [];
    if (activeSemester) {
      currentSemesterEnrollments = await this.prisma.enrollment.findMany({
        where: {
          studentId: student.id,
          semesterId: activeSemester.id,
          status: EnrollmentStatus.REGISTERED,
        },
        include: {
          courseSection: {
            include: {
              course: true,
            },
          },
        },
      });
    }

    const totalCredits = currentSemesterEnrollments.reduce(
      (sum, e) => sum + e.courseSection.course.credits,
      0,
    );

    return {
      student,
      currentSemester: activeSemester
        ? {
            id: activeSemester.id,
            academicYear: activeSemester.academicYear,
            semesterNumber: activeSemester.semesterNumber,
            registrationStart: activeSemester.registrationStart,
            registrationEnd: activeSemester.registrationEnd,
            status: activeSemester.status,
          }
        : null,
      stats: {
        enrolledCoursesCount: currentSemesterEnrollments.length,
        totalRegisteredCredits: totalCredits,
      },
    };
  }

  async searchCourses(userId: string, query: CourseSearchQueryDto) {
    const student = await this.getStudentByUserId(userId);
    const activeSemester = await this.getActiveSemester();

    const whereClause: any = {};
    if (query.departmentId) {
      whereClause.departmentId = query.departmentId;
    }
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      whereClause.OR = [
        { courseCode: { contains: term, mode: 'insensitive' } },
        { courseName: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Get courses that have sections in this active semester
    const courses = await this.prisma.course.findMany({
      where: {
        ...whereClause,
        sections: {
          some: { semesterId: activeSemester.id },
        },
      },
      include: {
        department: true,
        prerequisites: {
          include: {
            prerequisiteCourse: true,
          },
        },
        sections: {
          where: { semesterId: activeSemester.id },
          include: {
            teacher: true,
            schedules: {
              orderBy: { startTime: 'asc' },
            },
            enrollments: {
              where: { status: EnrollmentStatus.REGISTERED },
            },
          },
          orderBy: { sectionNumber: 'asc' },
        },
      },
      orderBy: { courseCode: 'asc' },
    });

    // Check student's current enrollments
    const studentEnrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        semesterId: activeSemester.id,
        status: EnrollmentStatus.REGISTERED,
      },
      include: {
        courseSection: true,
      },
    });

    const enrolledSectionIds = new Set(studentEnrollments.map((e) => e.courseSectionId));
    const enrolledCourseIds = new Set(studentEnrollments.map((e) => e.courseSection.courseId));

    return {
      semester: {
        id: activeSemester.id,
        academicYear: activeSemester.academicYear,
        semesterNumber: activeSemester.semesterNumber,
        registrationStart: activeSemester.registrationStart,
        registrationEnd: activeSemester.registrationEnd,
      },
      courses: courses.map((course) => {
        const isCourseEnrolled = enrolledCourseIds.has(course.id);

        return {
          id: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          credits: course.credits,
          description: course.description,
          department: course.department,
          prerequisites: course.prerequisites?.map((p) => ({
            id: p.prerequisiteCourse.id,
            courseCode: p.prerequisiteCourse.courseCode,
            courseName: p.prerequisiteCourse.courseName,
          })) || [],
          isAlreadyEnrolled: isCourseEnrolled,
          sections: course.sections.map((section) => {
            const enrolledCount = section.enrollments.length;
            const remainingSeats = Math.max(0, section.capacity - enrolledCount);
            const isFull = remainingSeats <= 0;
            const isThisSectionEnrolled = enrolledSectionIds.has(section.id);

            return {
              id: section.id,
              sectionNumber: section.sectionNumber,
              capacity: section.capacity,
              enrolledCount,
              remainingSeats,
              isFull,
              room: section.room,
              teacher: {
                id: section.teacher.id,
                teacherCode: section.teacher.teacherCode,
                firstName: section.teacher.firstName,
                lastName: section.teacher.lastName,
              },
              schedules: section.schedules,
              isEnrolled: isThisSectionEnrolled,
              canRegister: !isCourseEnrolled && !isFull,
            };
          }),
        };
      }),
    };
  }

  async getEnrollments(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const activeSemester = await this.getActiveSemester();

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        semesterId: activeSemester.id,
      },
      include: {
        courseSection: {
          include: {
            course: {
              include: { department: true },
            },
            teacher: true,
            schedules: true,
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return enrollments;
  }

  async enrollCourse(userId: string, dto: EnrollCourseDto, ipAddress?: string) {
    const student = await this.getStudentByUserId(userId);

    // 0. Student Status Check - Only ACTIVE students can register
    if (student.status !== StudentStatus.ACTIVE) {
      throw new BadRequestException(
        `Only active students are permitted to register for courses (Current status: ${student.status})`,
      );
    }

    // Run within atomic transaction
    const enrollment = await this.prisma.$transaction(async (tx) => {
      // 1. Fetch section with course and prerequisites
      const section = await tx.courseSection.findUnique({
        where: { id: dto.courseSectionId },
        include: {
          semester: true,
          course: {
            include: {
              prerequisites: {
                include: {
                  prerequisiteCourse: true,
                },
              },
            },
          },
          schedules: true,
        },
      });

      if (!section) {
        throw new NotFoundException('Course section not found');
      }

      // 2. Validate Semester Status and Registration Window
      const now = new Date();
      if (section.semester.status !== SemesterStatus.OPEN) {
        throw new BadRequestException('Registration is closed for this semester');
      }

      if (now < section.semester.registrationStart || now > section.semester.registrationEnd) {
        throw new BadRequestException('Current date is outside the designated registration period');
      }

      // 3. Prerequisite Course Validation
      if (section.course.prerequisites && section.course.prerequisites.length > 0) {
        for (const prereq of section.course.prerequisites) {
          const hasPrereq = await tx.enrollment.findFirst({
            where: {
              studentId: student.id,
              status: EnrollmentStatus.REGISTERED,
              courseSection: {
                courseId: prereq.prerequisiteCourseId,
              },
            },
          });

          if (!hasPrereq) {
            throw new BadRequestException(
              `Prerequisite not met: You must complete ${prereq.prerequisiteCourse.courseCode} (${prereq.prerequisiteCourse.courseName}) before enrolling in ${section.course.courseCode}`,
            );
          }
        }
      }

      // 4. Check for Duplicate Enrollment (same course in same semester)
      const existingCourseEnrollment = await tx.enrollment.findFirst({
        where: {
          studentId: student.id,
          semesterId: section.semesterId,
          status: EnrollmentStatus.REGISTERED,
          courseSection: {
            courseId: section.courseId,
          },
        },
        include: {
          courseSection: true,
        },
      });

      if (existingCourseEnrollment) {
        throw new ConflictException(
          `You are already registered in ${section.course.courseCode} (Section ${existingCourseEnrollment.courseSection.sectionNumber})`,
        );
      }

      // 5. Concurrency Race Condition Prevention: Row-level lock on CourseSection
      await tx.$queryRaw`SELECT id FROM course_sections WHERE id = ${section.id}::uuid FOR UPDATE`;

      // 6. Check Section Capacity after row lock
      const activeEnrollmentsCount = await tx.enrollment.count({
        where: {
          courseSectionId: section.id,
          status: EnrollmentStatus.REGISTERED,
        },
      });

      if (activeEnrollmentsCount >= section.capacity) {
        throw new BadRequestException(
          `Section ${section.sectionNumber} for ${section.course.courseCode} is already full (${section.capacity}/${section.capacity} seats)`,
        );
      }

      // 7. Credit Limit Enforcement (Maximum 22 credits per semester)
      const studentCurrentEnrollments = await tx.enrollment.findMany({
        where: {
          studentId: student.id,
          semesterId: section.semesterId,
          status: EnrollmentStatus.REGISTERED,
        },
        include: {
          courseSection: {
            include: {
              course: true,
              schedules: true,
            },
          },
        },
      });

      const currentTotalCredits = studentCurrentEnrollments.reduce(
        (sum, e) => sum + e.courseSection.course.credits,
        0,
      );

      if (currentTotalCredits + section.course.credits > 22) {
        throw new BadRequestException(
          `Credit limit exceeded: Maximum allowed is 22 credits per semester (Current registered: ${currentTotalCredits} credits, attempting to add: ${section.course.credits} credits, Total: ${currentTotalCredits + section.course.credits})`,
        );
      }

      // 8. Schedule Conflict Detection
      const newSchedules = section.schedules;
      for (const currentEnrollment of studentCurrentEnrollments) {
        for (const existingSchedule of currentEnrollment.courseSection.schedules) {
          for (const newSchedule of newSchedules) {
            if (newSchedule.dayOfWeek === existingSchedule.dayOfWeek) {
              // Time overlap condition: (startA < endB) and (endA > startB)
              const clash =
                newSchedule.startTime < existingSchedule.endTime &&
                newSchedule.endTime > existingSchedule.startTime;

              if (clash) {
                throw new BadRequestException(
                  `Schedule conflict: ${section.course.courseCode} (${newSchedule.dayOfWeek} ${newSchedule.startTime}-${newSchedule.endTime}) clashes with registered ${currentEnrollment.courseSection.course.courseCode} (${existingSchedule.dayOfWeek} ${existingSchedule.startTime}-${existingSchedule.endTime})`,
                );
              }
            }
          }
        }
      }

      // 6. Create or Re-activate Enrollment
      const existingRecord = await tx.enrollment.findUnique({
        where: {
          studentId_courseSectionId: {
            studentId: student.id,
            courseSectionId: section.id,
          },
        },
      });

      if (existingRecord) {
        return tx.enrollment.update({
          where: { id: existingRecord.id },
          data: {
            status: EnrollmentStatus.REGISTERED,
            registeredAt: new Date(),
          },
          include: {
            courseSection: {
              include: {
                course: true,
                teacher: true,
                schedules: true,
              },
            },
          },
        });
      }

      return tx.enrollment.create({
        data: {
          studentId: student.id,
          courseSectionId: section.id,
          semesterId: section.semesterId,
          status: EnrollmentStatus.REGISTERED,
        },
        include: {
          courseSection: {
            include: {
              course: true,
              teacher: true,
              schedules: true,
            },
          },
        },
      });
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    // 7. Record Audit Log outside transaction
    try {
      const newLog = await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'REGISTER_COURSE',
          entity: 'ENROLLMENT',
          entityId: enrollment.id,
          ipAddress: ipAddress || '127.0.0.1',
          details: {
            studentCode: student.studentCode,
            courseCode: enrollment.courseSection.course.courseCode,
            sectionNumber: enrollment.courseSection.sectionNumber,
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
        user: {
          role: 'STUDENT',
          student: {
            firstName: student.firstName,
            lastName: student.lastName,
          },
        },
      });

    } catch {
      // Non-blocking
    }

    return {
      message: `Successfully registered for ${enrollment.courseSection.course.courseCode} Section ${enrollment.courseSection.sectionNumber}`,
      enrollment,
    };
  }

  async dropCourse(userId: string, enrollmentId: string, ipAddress?: string) {
    const student = await this.getStudentByUserId(userId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        semester: true,
        courseSection: {
          include: { course: true },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment record not found');
    }

    if (enrollment.studentId !== student.id) {
      throw new BadRequestException('You can only drop your own enrolled courses');
    }

    if (enrollment.status !== EnrollmentStatus.REGISTERED) {
      throw new BadRequestException('This course is not in an active registered state');
    }

    if (enrollment.semester.status !== SemesterStatus.OPEN) {
      throw new BadRequestException('Cannot drop course when semester registration is closed');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.DROPPED },
    });

    // Record Audit Log
    try {
      const newLog = await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'DROP_COURSE',
          entity: 'ENROLLMENT',
          entityId: enrollmentId,
          ipAddress: ipAddress || '127.0.0.1',
          details: {
            studentCode: student.studentCode,
            courseCode: enrollment.courseSection.course.courseCode,
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
        user: {
          role: 'STUDENT',
          student: {
            firstName: student.firstName,
            lastName: student.lastName,
          },
        },
      });

    } catch {
      // Non-blocking
    }

    return {
      message: `Successfully dropped ${enrollment.courseSection.course.courseCode}`,
      enrollment: updated,
    };
  }

  async getTimetable(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const activeSemester = await this.getActiveSemester();

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        semesterId: activeSemester.id,
        status: EnrollmentStatus.REGISTERED,
      },
      include: {
        courseSection: {
          include: {
            course: true,
            teacher: true,
            schedules: true,
          },
        },
      },
    });

    const timetableSlots: any[] = [];
    for (const enrollment of enrollments) {
      const section = enrollment.courseSection;
      for (const schedule of section.schedules) {
        timetableSlots.push({
          enrollmentId: enrollment.id,
          courseCode: section.course.courseCode,
          courseName: section.course.courseName,
          credits: section.course.credits,
          sectionNumber: section.sectionNumber,
          teacherName: `${section.teacher.firstName} ${section.teacher.lastName}`,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room,
        });
      }
    }

    // Sort by day of week then start time
    const dayOrder: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7,
    };

    timetableSlots.sort((a, b) => {
      const dayDiff = (dayOrder[a.dayOfWeek] || 99) - (dayOrder[b.dayOfWeek] || 99);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    return {
      semester: {
        academicYear: activeSemester.academicYear,
        semesterNumber: activeSemester.semesterNumber,
      },
      slots: timetableSlots,
    };
  }
}
