import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuditStreamService } from '../admin/audit-stream.service';

@Global()
@Module({
  providers: [PrismaService, AuditStreamService],
  exports: [PrismaService, AuditStreamService],
})
export class PrismaModule {}

