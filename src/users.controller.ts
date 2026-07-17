import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "./common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "./common/current-user.decorator";
import { PrismaService } from "./prisma/prisma.service";

const APP_ROLE_BY_DB_ROLE: Record<string, string> = {
  ADMIN: "ADMIN",
  ENTERPRISE_ARCHITECT: "ARCHITECT",
  SOLUTION_ARCHITECT: "ARCHITECT",
  CLOUD_ARCHITECT: "ARCHITECT",
  REVIEWER: "SECURITY",
  STAKEHOLDER: "VIEWER",
};

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private db: PrismaService) {}

  @Get()
  async list(@CurrentUser() u: AuthUser) {
    const users = await this.db.user.findMany({
      where: { organizationId: u.organizationId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { displayName: "asc" },
    });
    return users.map((user) => ({
      ...user,
      name: user.displayName,
      role: APP_ROLE_BY_DB_ROLE[user.role] ?? "VIEWER",
    }));
  }
}
