import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "./common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "./common/current-user.decorator";
import { PrismaService } from "./prisma/prisma.service";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private db: PrismaService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.db.user.findMany({
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
  }
}
