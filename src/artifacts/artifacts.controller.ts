import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectsService } from "../projects/projects.service";
import { AiOrchestrationService } from "../ai-orchestration/ai-orchestration.service";
class GenDto {
  @IsOptional() @IsString() type?: string;
}
class PatchArtifactDto {
  @IsOptional() title?: string;
  @IsOptional() content?: any;
  @IsOptional() status?: string;
}
const map: any = {
  diagrams: "C4_CONTAINER_DIAGRAM",
  adrs: "ADR",
  terraform: "TERRAFORM",
  kubernetes: "KUBERNETES_MANIFEST",
  cicd: "GITHUB_ACTIONS_PIPELINE",
  "security-review": "SECURITY_REVIEW",
  "risk-assessment": "RISK_ASSESSMENT",
  "cost-estimate": "COST_ESTIMATE",
  "executive-presentation": "EXECUTIVE_PRESENTATION",
};
@ApiTags("Artifacts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("projects/:id")
export class ArtifactsController {
  constructor(
    private db: PrismaService,
    private projects: ProjectsService,
    private ai: AiOrchestrationService,
  ) {}
  private async current(u: AuthUser, id: string) {
    await this.projects.findOne(u, id);
    const m = await this.db.architectureModel.findFirst({
      where: { projectId: id },
      orderBy: { version: "desc" },
    });
    if (!m) throw new NotFoundException("Generate an ArchitectureModel first");
    return m;
  }
  private async make(u: AuthUser, id: string, type: string) {
    const m = await this.current(u, id);
    const content = await this.ai.artifact(type, m);
    const last = await this.db.artifact.findFirst({
      where: { projectId: id, type: type as any },
      orderBy: { version: "desc" },
    });
    return this.db.artifact.create({
      data: {
        id: randomUUID(),
        projectId: id,
        architectureModelId: m.id,
        type: type as any,
        title: type.replaceAll("_", " "),
        format: "json",
        content,
        status: "READY",
        version: (last?.version || 0) + 1,
      },
    });
  }
  @Post("artifacts/generate") generate(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Body() d: GenDto,
  ) {
    return this.make(u, id, d.type || "TARGET_ARCHITECTURE");
  }
  @Get("artifacts") async list(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
  ) {
    await this.projects.findOne(u, id);
    return this.db.artifact.findMany({
      where: { projectId: id },
      orderBy: { updatedAt: "desc" },
    });
  }
  @Get("artifacts/:artifactId") async one(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Param("artifactId") artifactId: string,
  ) {
    await this.projects.findOne(u, id);
    return this.db.artifact.findFirstOrThrow({
      where: { id: artifactId, projectId: id },
    });
  }
  @Patch("artifacts/:artifactId") async patch(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Param("artifactId") artifactId: string,
    @Body() d: PatchArtifactDto,
  ) {
    await this.one(u, id, artifactId);
    return this.db.artifact.update({
      where: { id: artifactId },
      data: d as any,
    });
  }
  @Post("artifacts/:artifactId/regenerate") async regen(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Param("artifactId") artifactId: string,
  ) {
    const a = await this.one(u, id, artifactId);
    return this.make(u, id, a.type);
  }
  @Post("generate/:kind") kind(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Param("kind") kind: string,
  ) {
    return this.make(u, id, map[kind] || "TARGET_ARCHITECTURE");
  }
}
