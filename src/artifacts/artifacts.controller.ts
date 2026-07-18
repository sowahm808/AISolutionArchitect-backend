import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Put,
  Query,
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

const workspaceTypes = [
  "TARGET_ARCHITECTURE",
  "C4_CONTAINER_DIAGRAM",
  "ADR",
  "TERRAFORM",
  "KUBERNETES_MANIFEST",
  "GITHUB_ACTIONS_PIPELINE",
  "SECURITY_REVIEW",
  "RISK_ASSESSMENT",
  "COST_ESTIMATE",
  "EXECUTIVE_PRESENTATION",
] as const;

function toDisplayTitle(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toWorkspaceSummary(content: unknown) {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (typeof content !== "object") return String(content);

  const candidate = content as Record<string, unknown>;
  if (typeof candidate.markdown === "string") return candidate.markdown;
  if (typeof candidate.text === "string") return candidate.text;
  if (typeof candidate.summary === "string") return candidate.summary;
  if (Array.isArray(candidate.sections)) return candidate.sections.join("\n\n");
  if (Array.isArray(candidate.slides)) {
    return candidate.slides
      .map((slide) => {
        if (typeof slide === "string") return slide;
        if (slide && typeof slide === "object") {
          const item = slide as Record<string, unknown>;
          return [item.title, item.subtitle, item.notes]
            .filter(Boolean)
            .join(" - ");
        }
        return String(slide);
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return JSON.stringify(content, null, 2);
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
    @Query("type") type?: string,
  ) {
    await this.projects.findOne(u, id);
    return this.db.artifact.findMany({
      where: { projectId: id, ...(type ? { type: type as any } : {}) },
      orderBy: { updatedAt: "desc" },
    });
  }

  @Get("artifacts/workspace") async workspace(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
  ) {
    const model = await this.current(u, id);
    const artifacts = await this.db.artifact.findMany({
      where: { projectId: id },
      orderBy: [{ type: "asc" }, { version: "desc" }],
    });
    const latestByType = new Map<string, (typeof artifacts)[number]>();
    for (const artifact of artifacts) {
      if (!latestByType.has(artifact.type))
        latestByType.set(artifact.type, artifact);
    }

    return {
      projectId: id,
      architectureModelId: model.id,
      architectureModelVersion: model.version,
      artifacts: workspaceTypes.map((type) => {
        const artifact = latestByType.get(type);
        return {
          id: artifact?.id ?? null,
          type,
          title: artifact?.title ?? toDisplayTitle(type),
          status: artifact?.status ?? "DRAFT",
          version: artifact?.version ?? 0,
          format: artifact?.format ?? "json",
          content: artifact?.content ?? null,
          workspaceContent: artifact
            ? toWorkspaceSummary(artifact.content)
            : `Generate ${toDisplayTitle(type)} to add it to the workspace.`,
          updatedAt: artifact?.updatedAt ?? null,
        };
      }),
    };
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

  @Put("artifacts/:artifactId") async put(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Param("artifactId") artifactId: string,
    @Body() d: PatchArtifactDto,
  ) {
    return this.patch(u, id, artifactId, d);
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
