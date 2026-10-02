import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EnrollmentStatus, SemesterStatus } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  private async getTeacherByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        department: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found for this account');
    }
    return teacher;
  }

  private async getActiveSemester() {
    const semester = await this.prisma.semester.findFirst({
      where: { status: SemesterStatus.OPEN },
      orderBy: { academicYear: 'desc' },
    });
    if (!semester) {
      // Fallback to latest semester
      const latest = await this.prisma.semester.findFirst({
        orderBy: [{ academicYear: 'desc' }, { semesterNumber: 'desc' }],
      });
      return latest;
    }
    return semester;
  }

  async getProfile(userId: string) {
    const teacher = await this.getTeacherByUserId(userId);
    const activeSemester = await this.getActiveSemester();

    let sectionsCount = 0;
    let studentsCount = 0;
    let totalCredits = 0;

    if (activeSemester) {
      const sections = await this.prisma.courseSection.findMany({
        where: {
          teacherId: teacher.id,
          semesterId: activeSemester.id,
        },
        include: {
          course: {
            select: { credits: true },
          },
          enrollments: {
            where: { status: EnrollmentStatus.REGISTERED },
            select: { studentId: true },
          },
        },
      });

      sectionsCount = sections.length;
      totalCredits = sections.reduce((sum, s) => sum + s.course.credits, 0);

      // Count distinct active enrolled students
      const studentIdSet = new Set<string>();
      sections.forEach((s) => {
        s.enrollments.forEach((e) => studentIdSet.add(e.studentId));
      });
      studentsCount = studentIdSet.size;
    }

    return {
      teacher: {
        id: teacher.id,
        teacherCode: teacher.teacherCode,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        department: teacher.department,
        email: teacher.user.email,
      },
      currentSemester: activeSemester
        ? {
            id: activeSemester.id,
            academicYear: activeSemester.academicYear,
            semesterNumber: activeSemester.semesterNumber,
            status: activeSemester.status,
          }
        : null,
      stats: {
        sectionsCount,
        studentsCount,
        totalCredits,
      },
    };
  }

  async getSections(userId: string, semesterId?: string) {
    const teacher = await this.getTeacherByUserId(userId);
    let targetSemesterId = semesterId;

    if (!targetSemesterId) {
      const active = await this.getActiveSemester();
      targetSemesterId = active?.id;
    }

    const whereClause: any = {
      teacherId: teacher.id,
    };
    if (targetSemesterId) {
      whereClause.semesterId = targetSemesterId;
    }

    const sections = await this.prisma.courseSection.findMany({
      where: whereClause,
      include: {
        course: {
          include: {
            department: true,
          },
        },
        semester: true,
        schedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
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

    return sections.map((sec) => {
      const enrolledCount = sec.enrollments.length;
      return {
        id: sec.id,
        sectionNumber: sec.sectionNumber,
        capacity: sec.capacity,
        enrolledCount,
        remainingSeats: Math.max(0, sec.capacity - enrolledCount),
        room: sec.room,
        course: {
          id: sec.course.id,
          courseCode: sec.course.courseCode,
          courseName: sec.course.courseName,
          credits: sec.course.credits,
          description: sec.course.description,
          department: sec.course.department.name,
        },
        semester: {
          id: sec.semester.id,
          academicYear: sec.semester.academicYear,
          semesterNumber: sec.semester.semesterNumber,
          status: sec.semester.status,
        },
        schedules: sec.schedules.map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
        })),
      };
    });
  }

  async getSectionRoster(userId: string, sectionId: string) {
    const teacher = await this.getTeacherByUserId(userId);

    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          include: { department: true },
        },
        semester: true,
        schedules: true,
        enrollments: {
          include: {
            student: {
              include: {
                department: true,
                user: {
                  select: { email: true },
                },
              },
            },
          },
          orderBy: [
            { student: { studentCode: 'asc' } },
          ],
        },
      },
    });

    if (!section) {
      throw new NotFoundException('Course section not found');
    }

    if (section.teacherId !== teacher.id) {
      throw new ForbiddenException('You are not authorized to view the roster for this section');
    }

    const activeEnrollments = section.enrollments.filter(
      (e) => e.status === EnrollmentStatus.REGISTERED,
    );
    const droppedEnrollments = section.enrollments.filter(
      (e) => e.status === EnrollmentStatus.DROPPED,
    );

    return {
      section: {
        id: section.id,
        sectionNumber: section.sectionNumber,
        capacity: section.capacity,
        enrolledCount: activeEnrollments.length,
        remainingSeats: Math.max(0, section.capacity - activeEnrollments.length),
        room: section.room,
        course: {
          id: section.course.id,
          courseCode: section.course.courseCode,
          courseName: section.course.courseName,
          credits: section.course.credits,
          department: section.course.department.name,
        },
        semester: {
          id: section.semester.id,
          academicYear: section.semester.academicYear,
          semesterNumber: section.semester.semesterNumber,
        },
        schedules: section.schedules,
      },
      students: section.enrollments.map((enr) => ({
        enrollmentId: enr.id,
        status: enr.status,
        registeredAt: enr.registeredAt,
        student: {
          id: enr.student.id,
          studentCode: enr.student.studentCode,
          firstName: enr.student.firstName,
          lastName: enr.student.lastName,
          email: enr.student.user.email,
          yearLevel: enr.student.yearLevel,
          department: enr.student.department.name,
        },
      })),
      stats: {
        totalActive: activeEnrollments.length,
        totalDropped: droppedEnrollments.length,
        capacity: section.capacity,
      },
    };
  }

  async getTeachingSchedule(userId: string) {
    const teacher = await this.getTeacherByUserId(userId);
    const activeSemester = await this.getActiveSemester();

    if (!activeSemester) {
      return {
        semester: null,
        slots: [],
      };
    }

    const sections = await this.prisma.courseSection.findMany({
      where: {
        teacherId: teacher.id,
        semesterId: activeSemester.id,
      },
      include: {
        course: true,
        schedules: true,
        enrollments: {
          where: { status: EnrollmentStatus.REGISTERED },
          select: { id: true },
        },
      },
    });

    const slots: any[] = [];
    sections.forEach((sec) => {
      sec.schedules.forEach((sch) => {
        slots.push({
          sectionId: sec.id,
          courseCode: sec.course.courseCode,
          courseName: sec.course.courseName,
          credits: sec.course.credits,
          sectionNumber: sec.sectionNumber,
          dayOfWeek: sch.dayOfWeek,
          startTime: sch.startTime,
          endTime: sch.endTime,
          room: sch.room || sec.room,
          enrolledCount: sec.enrollments.length,
          capacity: sec.capacity,
        });
      });
    });

    // Sort by day and start time
    const dayOrder: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7,
    };

    slots.sort((a, b) => {
      const dayDiff = (dayOrder[a.dayOfWeek] || 99) - (dayOrder[b.dayOfWeek] || 99);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    return {
      semester: {
        id: activeSemester.id,
        academicYear: activeSemester.academicYear,
        semesterNumber: activeSemester.semesterNumber,
      },
      slots,
    };
  }
}
