import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { ProjectsService } from "../projects/projects.service";
import { PrismaService } from "../prisma/prisma.service";
@ApiTags("Export")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("projects/:id")
export class ExportController {
  constructor(
    private projects: ProjectsService,
    private db: PrismaService,
  ) {}

  @Post("exports") async exportFromBody(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Body() body: { format?: string },
  ) {
    const result = await this.export(u, id, body.format || "zip");
    return {
      ...result,
      url: `/projects/${id}/export/${body.format || "zip"}`,
    };
  }
  @Post("export/:format") async export(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Param("format") format: string,
  ) {
    await this.projects.findOne(u, id);
    const artifacts = await this.db.artifact.findMany({
      where: { projectId: id, status: "READY" },
    });
    return {
      format,
      status: "READY_FOR_EXPORT",
      artifactCount: artifacts.length,
      manifest: artifacts.map((a: (typeof artifacts)[number]) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        version: a.version,
      })),
    };
  }
}
