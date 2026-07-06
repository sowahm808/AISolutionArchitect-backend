import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "./common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "./common/current-user.decorator";
import { PrismaService } from "./prisma/prisma.service";

@ApiTags("Organizations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("organization")
export class OrganizationAliasController {
  constructor(private db: PrismaService) {}

  @Get()
  get(@CurrentUser() u: AuthUser) {
    return this.db.organization.findUnique({ where: { id: u.organizationId } });
  }
}
