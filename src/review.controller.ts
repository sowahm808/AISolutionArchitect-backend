import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "./common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "./common/current-user.decorator";
import { PrismaService } from "./prisma/prisma.service";
import { ProjectsService } from "./projects/projects.service";

@ApiTags("Review")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("projects/:id")
export class ReviewController {
  constructor(
    private db: PrismaService,
    private projects: ProjectsService,
  ) {}

  private async currentModel(u: AuthUser, id: string) {
    await this.projects.findOne(u, id);
    return this.db.architectureModel.findFirst({
      where: { projectId: id },
      orderBy: { version: "desc" },
    });
  }

  @Get("security/findings")
  async securityFindings(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    const model = await this.currentModel(u, id);
    const security = (model?.security ?? {}) as Record<string, unknown>;
    const risks = Array.isArray(model?.risks) ? (model?.risks as unknown[]) : [];
    const findings = Object.entries(security).map(([area, value], index) => ({
      id: `${id}-security-${index + 1}`,
      severity: "INFO",
      area,
      title: `${area} security control`,
      description: typeof value === "string" ? value : JSON.stringify(value),
      status: "OPEN",
    }));
    return findings.length
      ? findings
      : risks.map((risk, index) => ({
          id: `${id}-risk-${index + 1}`,
          severity: "MEDIUM",
          area: "Architecture",
          title: "Architecture risk",
          description: typeof risk === "string" ? risk : JSON.stringify(risk),
          status: "OPEN",
        }));
  }

  @Get("risks")
  async risks(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    const model = await this.currentModel(u, id);
    return model?.risks ?? [];
  }

  @Get("cost")
  async cost(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    await this.projects.findOne(u, id);
    const artifact = await this.db.artifact.findFirst({
      where: { projectId: id, type: "COST_ESTIMATE" },
      orderBy: { version: "desc" },
    });
    return artifact?.content ?? { currency: "USD", monthlyTotal: 0, lineItems: [] };
  }

  @Get("presentation")
  async presentation(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    await this.projects.findOne(u, id);
    const artifact = await this.db.artifact.findFirst({
      where: { projectId: id, type: "EXECUTIVE_PRESENTATION" },
      orderBy: { version: "desc" },
    });
    const content = artifact?.content;
    if (Array.isArray(content)) return content;
    if (content && typeof content === "object" && "slides" in content) {
      const slides = (content as { slides?: unknown }).slides;
      if (Array.isArray(slides)) return slides;
    }
    return [];
  }
}
