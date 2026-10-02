import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase().trim() },
      include: {
        student: {
          include: {
            department: true,
          },
        },
        teacher: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Record Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'USER',
          entityId: user.id,
          ipAddress: ipAddress || '127.0.0.1',
          details: { email: user.email, role: user.role },
        },
      });
    } catch {
      // Non-blocking audit log
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        student: user.student,
        teacher: user.teacher,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'super-secret-student-reg-refresh-key-2026',
      );

      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: refreshSecret,
      });

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        student: {
          include: {
            department: true,
          },
        },
        teacher: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const accessSecret = this.configService.get<string>(
      'JWT_SECRET',
      'super-secret-student-reg-jwt-key-2026',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'super-secret-student-reg-refresh-key-2026',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: accessSecret,
          expiresIn: '1d',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          tokenType: 'refresh',
        },
        {
          secret: refreshSecret,
          expiresIn: '7d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
