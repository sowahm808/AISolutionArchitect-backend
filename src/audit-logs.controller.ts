import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "./common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "./common/current-user.decorator";
import { PrismaService } from "./prisma/prisma.service";

@ApiTags("Audit logs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("audit-logs")
export class AuditLogsController {
  constructor(private db: PrismaService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.db.auditLog.findMany({
      where: { organizationId: u.organizationId },
      orderBy: { createdAt: "desc" },
    });
  }
}
