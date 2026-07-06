import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
class UpdateOrgDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() plan?: string;
}
@ApiTags("Organizations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("organizations")
export class OrganizationsController {
  constructor(private db: PrismaService) {}
  @Get("current") current(@CurrentUser() u: AuthUser) {
    return this.db.organization.findUnique({ where: { id: u.organizationId } });
  }
  @Patch("current") patch(@CurrentUser() u: AuthUser, @Body() d: UpdateOrgDto) {
    return this.db.organization.update({
      where: { id: u.organizationId },
      data: d,
    });
  }
}
